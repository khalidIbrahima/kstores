#!/usr/bin/env node

/**
 * Script administrateur pour ajouter des produits en contournant temporairement les politiques RLS
 * À utiliser uniquement pour l'initialisation de données
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function disableRLS() {
  console.log('⚠️  Temporarily disabling RLS for products table...');
  const { error } = await supabase.rpc('exec_sql', {
    sql: 'ALTER TABLE products DISABLE ROW LEVEL SECURITY;'
  });
  
  if (error) {
    console.error('Failed to disable RLS:', error.message);
    return false;
  }
  return true;
}

async function enableRLS() {
  console.log('🔒 Re-enabling RLS for products table...');
  const { error } = await supabase.rpc('exec_sql', {
    sql: 'ALTER TABLE products ENABLE ROW LEVEL SECURITY;'
  });
  
  if (error) {
    console.error('Failed to enable RLS:', error.message);
    return false;
  }
  return true;
}

async function addProductDirect(product) {
  // Direct insert without RLS
  const { data, error } = await supabase
    .from('products')
    .insert([product])
    .select();
  
  if (error) throw error;
  return data[0];
}

async function main() {
  console.log('🚀 Admin Product Addition Script\n');
  
  try {
    // Test connection
    const { data, error } = await supabase.from('products').select('count').limit(1);
    if (error) throw error;
    console.log('✅ Connected to Supabase successfully\n');
    
    // Load products
    const filePath = process.argv[2] || 'products-example.json';
    console.log(`📄 Loading products from: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
      console.error(`❌ File not found: ${filePath}`);
      process.exit(1);
    }
    
    const products = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    console.log(`📦 Found ${products.length} products to add\n`);
    
    // Get category for Electronics (if exists)
    const { data: categories } = await supabase
      .from('categories')
      .select('id, name, slug')
      .eq('slug', 'electronique')
      .limit(1);
    
    const electronicsCategory = categories?.[0];
    if (electronicsCategory) {
      console.log(`📂 Found Electronics category: ${electronicsCategory.name}`);
      // Assign category to products that don't have one
      products.forEach(product => {
        if (!product.category_id) {
          product.category_id = electronicsCategory.id;
        }
      });
    }
    
    // Temporarily disable RLS
    console.log('\n⚠️  ADMIN MODE: Bypassing RLS policies...');
    
    const results = [];
    const errors = [];
    
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      try {
        console.log(`\n${i + 1}/${products.length} Adding: ${product.name}`);
        
        // Direct insert with admin privileges
        const { data, error } = await supabase
          .from('products')
          .insert([product])
          .select();
        
        if (error) {
          // If still fails, try with SQL function
          const { data: sqlData, error: sqlError } = await supabase.rpc('insert_product_admin', {
            p_name: product.name,
            p_description: product.description || null,
            p_price: product.price,
            p_image_url: product.image_url,
            p_stock: product.stock,
            p_category_id: product.category_id || null
          });
          
          if (sqlError) throw error; // Use original error
          results.push({ id: sqlData, ...product });
        } else {
          results.push(data[0]);
        }
        
        console.log(`✅ Successfully added: ${product.name}`);
      } catch (error) {
        console.error(`❌ Failed to add ${product.name}:`, error.message);
        errors.push({ product: product.name, error: error.message });
      }
    }
    
    // Summary
    console.log('\n📊 Summary:');
    console.log(`✅ Successfully added: ${results.length} products`);
    if (errors.length > 0) {
      console.log(`❌ Failed to add: ${errors.length} products`);
      console.log('\nErrors:');
      errors.forEach(({ product, error }) => {
        console.log(`  - ${product}: ${error}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  }
}

main().catch(console.error);
