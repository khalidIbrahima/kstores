#!/usr/bin/env node

/**
 * Script to add products to Supabase database
 * 
 * Usage:
 * - node add_products.js (loads from products-example.json by default)
 * - node add_products.js products.json (loads from specific JSON file)
 * - node add_products.js --sample (uses built-in sample products)
 * - node add_products.js --custom (prompts for custom product data)
 */

import { createClient } from '@supabase/supabase-js';
import readline from 'readline';
import fs from 'fs';
import path from 'path';

// Load environment variables from .env file if it exists
import dotenv from 'dotenv';
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error('❌ Missing VITE_SUPABASE_URL environment variable.');
  process.exit(1);
}

// Prefer service role key for admin operations
const apiKey = supabaseServiceKey || supabaseAnonKey;
if (!apiKey) {
  console.error('❌ Missing Supabase API key.');
  console.error('Please set SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

if (supabaseServiceKey) {
  console.log('🔑 Using service role key (admin permissions)');
} else {
  console.log('🔑 Using anon key (limited permissions)');
  console.log('💡 For admin operations, set SUPABASE_SERVICE_ROLE_KEY in your .env file');
}

const supabase = createClient(supabaseUrl, apiKey);

// Sample products data
const sampleProducts = [
  {
    name: "iPhone 15 Pro",
    description: "Latest Apple iPhone with titanium design, A17 Pro chip, and advanced camera system.",
    price: 999.99,
    image_url: "https://example.com/images/iphone15pro.jpg",
    stock: 50,
    category_id: null // Will be set if category exists
  },
  {
    name: "Samsung Galaxy S24 Ultra",
    description: "Premium Android smartphone with S Pen, 200MP camera, and AI features.",
    price: 1199.99,
    image_url: "https://example.com/images/galaxys24ultra.jpg",
    stock: 30,
    category_id: null
  },
  {
    name: "MacBook Pro 14-inch",
    description: "Professional laptop with M3 Pro chip, Liquid Retina XDR display, and exceptional performance.",
    price: 1999.99,
    image_url: "https://example.com/images/macbookpro14.jpg",
    stock: 25,
    category_id: null
  },
  {
    name: "AirPods Pro (3rd generation)",
    description: "Wireless earbuds with active noise cancellation, spatial audio, and adaptive transparency.",
    price: 249.99,
    image_url: "https://example.com/images/airpodspro3.jpg",
    stock: 100,
    category_id: null
  },
  {
    name: "Dell XPS 13",
    description: "Ultra-portable laptop with Intel Core i7, 16GB RAM, and stunning InfinityEdge display.",
    price: 1299.99,
    image_url: "https://example.com/images/dellxps13.jpg",
    stock: 40,
    category_id: null
  }
];

// Utility functions
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (prompt) => new Promise((resolve) => rl.question(prompt, resolve));

async function getCategories() {
  try {
    const { data: categories, error } = await supabase
      .from('categories')
      .select('id, name, slug');
    
    if (error) throw error;
    return categories || [];
  } catch (error) {
    console.warn('⚠️  Could not fetch categories:', error.message);
    return [];
  }
}

async function validateProduct(product) {
  const errors = [];
  
  if (!product.name || product.name.trim().length === 0) {
    errors.push('Product name is required');
  }
  
  if (!product.price || product.price <= 0) {
    errors.push('Product price must be greater than 0');
  }
  
  if (!product.image_url || product.image_url.trim().length === 0) {
    errors.push('Product image URL is required');
  }
  
  if (product.stock === undefined || product.stock < 0) {
    errors.push('Product stock must be 0 or greater');
  }
  
  return errors;
}

async function addProduct(product) {
  const errors = await validateProduct(product);
  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join(', ')}`);
  }
  
  const { data, error } = await supabase
    .from('products')
    .insert([product])
    .select();
  
  if (error) throw error;
  return data[0];
}

async function addMultipleProducts(products) {
  const results = [];
  const errors = [];
  
  console.log(`\n📦 Adding ${products.length} products...`);
  
  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    try {
      console.log(`\n${i + 1}/${products.length} Adding: ${product.name}`);
      const result = await addProduct(product);
      results.push(result);
      console.log(`✅ Successfully added: ${result.name} (ID: ${result.id})`);
    } catch (error) {
      console.error(`❌ Failed to add ${product.name}:`, error.message);
      errors.push({ product: product.name, error: error.message });
    }
  }
  
  return { results, errors };
}

async function promptForCustomProduct(categories) {
  console.log('\n📝 Enter product details:');
  
  const name = await question('Product name: ');
  const description = await question('Description (optional): ');
  const price = parseFloat(await question('Price: '));
  const image_url = await question('Image URL: ');
  const stock = parseInt(await question('Stock quantity: '));
  
  let category_id = null;
  if (categories.length > 0) {
    console.log('\nAvailable categories:');
    categories.forEach((cat, index) => {
      console.log(`${index + 1}. ${cat.name} (${cat.slug})`);
    });
    console.log(`${categories.length + 1}. No category`);
    
    const categoryChoice = await question(`Select category (1-${categories.length + 1}): `);
    const categoryIndex = parseInt(categoryChoice) - 1;
    
    if (categoryIndex >= 0 && categoryIndex < categories.length) {
      category_id = categories[categoryIndex].id;
    }
  }
  
  return {
    name,
    description: description || null,
    price,
    image_url,
    stock,
    category_id
  };
}

async function loadProductsFromFile(filePath) {
  try {
    const fullPath = path.resolve(filePath);
    const fileContent = fs.readFileSync(fullPath, 'utf8');
    const products = JSON.parse(fileContent);
    
    if (!Array.isArray(products)) {
      throw new Error('JSON file must contain an array of products');
    }
    
    return products;
  } catch (error) {
    throw new Error(`Failed to load products from file: ${error.message}`);
  }
}

async function assignCategoriesToProducts(products, categories) {
  if (categories.length === 0) return products;
  
  // Simple category assignment based on product name keywords
  const categoryKeywords = {
    'phone': ['phone', 'iphone', 'galaxy', 'smartphone'],
    'laptop': ['laptop', 'macbook', 'dell', 'hp', 'lenovo'],
    'audio': ['airpods', 'headphones', 'speakers', 'earbuds'],
    'tablet': ['ipad', 'tablet'],
    'accessories': ['case', 'charger', 'cable', 'stand']
  };
  
  return products.map(product => {
    const productNameLower = product.name.toLowerCase();
    
    for (const category of categories) {
      const categorySlug = category.slug.toLowerCase();
      const keywords = categoryKeywords[categorySlug] || [categorySlug];
      
      if (keywords.some(keyword => productNameLower.includes(keyword))) {
        return { ...product, category_id: category.id };
      }
    }
    
    return product;
  });
}

async function main() {
  console.log('🚀 Product Addition Script for Supabase\n');
  
  const args = process.argv.slice(2);
  const mode = args[0];
  
  try {
    // Test connection
    const { data, error } = await supabase.from('products').select('count').limit(1);
    if (error) throw error;
    console.log('✅ Connected to Supabase successfully\n');
    
    // Get available categories
    const categories = await getCategories();
    if (categories.length > 0) {
      console.log(`📂 Found ${categories.length} categories:`, categories.map(c => c.name).join(', '));
    } else {
      console.log('📂 No categories found in database');
    }
    
    let products = [];
    
    if (mode === '--custom') {
      // Interactive mode for custom product
      const product = await promptForCustomProduct(categories);
      products = [product];
    } else if (mode === '--sample') {
      // Use sample products
      console.log('📦 Using sample products...');
      products = await assignCategoriesToProducts(sampleProducts, categories);
    } else {
      // Default: Load from JSON file
      const filePath = args[0] || 'products-example.json';
      console.log(`📄 Loading products from: ${filePath}`);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        console.error(`❌ File not found: ${filePath}`);
        console.log('\nAvailable options:');
        console.log('  node add_products.js products.json     # Load from specific JSON file');
        console.log('  node add_products.js --sample          # Use built-in sample products');
        console.log('  node add_products.js --custom          # Interactive mode');
        process.exit(1);
      }
      
      products = await loadProductsFromFile(filePath);
      products = await assignCategoriesToProducts(products, categories);
    }
    
    // Add products
    const { results, errors } = await addMultipleProducts(products);
    
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
  } finally {
    rl.close();
  }
}

// Run the script
main().catch(console.error);
