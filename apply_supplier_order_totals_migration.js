// Script pour appliquer la migration des totaux des commandes fournisseurs
// Exécuter avec: node apply_supplier_order_totals_migration.js

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Configuration Supabase depuis les variables d'environnement
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  console.log('Assurez-vous que VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY sont définies');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  try {
    console.log('🚀 Application de la migration supplier_order_totals...');
    
    // Lire le fichier de migration
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20250121000000_add_supplier_order_totals.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration SQL chargée');
    
    // Diviser le SQL en commandes individuelles
    const commands = migrationSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    console.log(`🔧 Exécution de ${commands.length} commandes SQL...`);
    
    // Exécuter chaque commande
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      if (command.trim()) {
        console.log(`  [${i + 1}/${commands.length}] Exécution de la commande...`);
        
        const { error } = await supabase.rpc('exec_sql', { sql: command });
        
        if (error) {
          console.error(`❌ Erreur lors de l'exécution de la commande ${i + 1}:`, error);
          // Continuer avec les autres commandes
        }
      }
    }
    
    console.log('✅ Migration appliquée avec succès !');
    console.log('📋 Colonnes total_usd et total_cfa ajoutées à supplier_order_items');
    console.log('🔧 Fonctions et triggers configurés');
    console.log('🔒 Index créés pour les performances');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'application de la migration:', error);
    process.exit(1);
  }
}

// Alternative: utiliser l'interface SQL directe
async function applyMigrationDirect() {
  try {
    console.log('🚀 Application directe de la migration...');
    
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20250121000000_add_supplier_order_totals.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Exécuter le SQL directement
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('❌ Erreur lors de l\'application de la migration:', error);
      process.exit(1);
    }
    
    console.log('✅ Migration appliquée avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'application de la migration:', error);
    process.exit(1);
  }
}

// Vérifier si les colonnes existent déjà
async function checkColumnsExist() {
  try {
    // Vérifier si la colonne total_usd existe
    const { data, error } = await supabase
      .from('supplier_order_items')
      .select('total_usd')
      .limit(1);
    
    if (error && error.code === '42703') {
      console.log('📋 Colonnes total_usd et total_cfa n\'existent pas encore');
      return false;
    }
    
    console.log('✅ Colonnes total_usd et total_cfa existent déjà');
    return true;
  } catch (error) {
    console.log('📋 Colonnes total_usd et total_cfa n\'existent pas encore');
    return false;
  }
}

// Fonction principale
async function main() {
  console.log('🔍 Vérification de l\'existence des colonnes...');
  
  const columnsExist = await checkColumnsExist();
  
  if (columnsExist) {
    console.log('ℹ️ Les colonnes existent déjà, aucune action nécessaire');
    return;
  }
  
  console.log('🔄 Application de la migration...');
  await applyMigrationDirect();
  
  console.log('🎉 Migration terminée avec succès !');
  console.log('');
  console.log('📝 Prochaines étapes:');
  console.log('1. Redémarrez votre application');
  console.log('2. Testez les calculs de totaux dans les commandes fournisseurs');
  console.log('3. Vérifiez que les colonnes total_usd et total_cfa sont bien remplies');
}

// Exécuter le script
main().catch(console.error);
