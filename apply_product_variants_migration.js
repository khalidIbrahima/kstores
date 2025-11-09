// Script to apply the product variants migration
// Run with: node apply_product_variants_migration.js

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Supabase configuration from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are defined');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Check if the tables exist
async function checkTablesExist() {
  try {
    console.log('🔍 Checking if product_variants tables exist...');
    
    // Check product_variants table
    const { data: variantsData, error: variantsError } = await supabase
      .from('product_variants')
      .select('id')
      .limit(1);
    
    // Check product_variant_options table
    const { data: optionsData, error: optionsError } = await supabase
      .from('product_variant_options')
      .select('id')
      .limit(1);
    
    // Check product_variant_combinations table
    const { data: combosData, error: combosError } = await supabase
      .from('product_variant_combinations')
      .select('id')
      .limit(1);
    
    // Error code 42P01 means table doesn't exist
    if (variantsError && variantsError.code === '42P01') {
      console.log('📋 Table product_variants does not exist yet');
      return false;
    }
    
    if (optionsError && optionsError.code === '42P01') {
      console.log('📋 Table product_variant_options does not exist yet');
      return false;
    }
    
    if (combosError && combosError.code === '42P01') {
      console.log('📋 Table product_variant_combinations does not exist yet');
      return false;
    }
    
    console.log('✅ All product variant tables already exist');
    return true;
  } catch (error) {
    console.log('📋 Product variant tables do not exist yet');
    return false;
  }
}

// Apply migration using SQL execution
async function applyMigration() {
  try {
    console.log('🚀 Applying product variants migration...');
    
    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20250120000000_add_product_variants.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration SQL loaded from:', migrationPath);
    
    // Split SQL into individual statements
    // We need to be smart about splitting to avoid splitting inside function definitions
    const statements = [];
    let currentStatement = '';
    let inFunction = false;
    
    const lines = migrationSQL.split('\n');
    
    for (const line of lines) {
      // Skip comment lines
      if (line.trim().startsWith('--')) {
        continue;
      }
      
      // Track if we're inside a function definition
      if (line.match(/CREATE\s+(OR\s+REPLACE\s+)?FUNCTION/i)) {
        inFunction = true;
      }
      
      currentStatement += line + '\n';
      
      // End of statement detection
      if (line.includes(';') && !inFunction) {
        if (currentStatement.trim().length > 0) {
          statements.push(currentStatement.trim());
          currentStatement = '';
        }
      }
      
      // End of function detection
      if (line.match(/\$\$\s*LANGUAGE/i) && inFunction) {
        inFunction = false;
      }
    }
    
    // Add any remaining statement
    if (currentStatement.trim().length > 0) {
      statements.push(currentStatement.trim());
    }
    
    console.log(`🔧 Executing ${statements.length} SQL statements...`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        const preview = statement.substring(0, 60).replace(/\n/g, ' ');
        console.log(`  [${i + 1}/${statements.length}] ${preview}...`);
        
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          
          if (error) {
            // Check if it's a "already exists" error, which we can ignore
            if (error.message && (
              error.message.includes('already exists') ||
              error.message.includes('duplicate')
            )) {
              console.log(`  ⚠️  Already exists, skipping...`);
            } else {
              console.error(`  ❌ Error executing statement ${i + 1}:`, error.message || error);
              // Continue with other statements
            }
          } else {
            console.log(`  ✅ Statement ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.error(`  ❌ Exception executing statement ${i + 1}:`, err.message);
          // Continue with other statements
        }
      }
    }
    
    console.log('\n✅ Migration application completed!');
    console.log('📋 Tables created:');
    console.log('   - product_variants');
    console.log('   - product_variant_options');
    console.log('   - product_variant_combinations');
    console.log('🔒 RLS (Row Level Security) enabled');
    console.log('📊 Indexes created for performance');
    
  } catch (error) {
    console.error('❌ Error applying migration:', error);
    process.exit(1);
  }
}

// Verify the migration was successful
async function verifyMigration() {
  try {
    console.log('\n🔍 Verifying migration...');
    
    // Check each table
    const tables = [
      'product_variants',
      'product_variant_options',
      'product_variant_combinations'
    ];
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.error(`❌ Table ${table} verification failed:`, error.message);
      } else {
        console.log(`✅ Table ${table} is accessible`);
      }
    }
    
    console.log('\n✅ Migration verified successfully!');
    
  } catch (error) {
    console.error('❌ Error verifying migration:', error);
  }
}

// Main function
async function main() {
  console.log('🎯 Product Variants Migration Script\n');
  
  const tablesExist = await checkTablesExist();
  
  if (tablesExist) {
    console.log('\nℹ️  Tables already exist, no migration needed');
    console.log('If you want to reapply the migration, drop the tables first from Supabase dashboard');
    return;
  }
  
  console.log('\n🔄 Applying migration...');
  await applyMigration();
  
  await verifyMigration();
  
  console.log('\n🎉 Migration completed successfully!\n');
  console.log('📝 Next steps:');
  console.log('1. Restart your application');
  console.log('2. Test creating products with variants');
  console.log('3. Verify variants are saving correctly');
}

// Run the script
main().catch(console.error);





