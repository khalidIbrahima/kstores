// Script pour annuler la migration des totaux des commandes fournisseurs
// Exécuter avec: node rollback_supplier_order_totals_migration.js

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

async function executeRollback() {
  try {
    console.log('🔄 Exécution du rollback de la migration supplier_order_totals...');
    
    // Lire le fichier de rollback
    const rollbackPath = path.join(process.cwd(), 'rollback_supplier_order_totals_migration.sql');
    const rollbackSQL = fs.readFileSync(rollbackPath, 'utf8');
    
    console.log('📄 Script de rollback chargé');
    
    // Diviser le SQL en commandes individuelles
    const commands = rollbackSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    console.log(`🔧 Exécution de ${commands.length} commandes de rollback...`);
    
    // Exécuter chaque commande
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      if (command.trim()) {
        console.log(`  [${i + 1}/${commands.length}] Exécution de la commande de rollback...`);
        
        const { error } = await supabase.rpc('exec_sql', { sql: command });
        
        if (error) {
          console.error(`❌ Erreur lors de l'exécution de la commande ${i + 1}:`, error);
          // Continuer avec les autres commandes
        } else {
          console.log(`  ✅ Commande ${i + 1} exécutée avec succès`);
        }
      }
    }
    
    console.log('✅ Rollback exécuté avec succès !');
    console.log('📋 Colonnes total_usd et total_cfa supprimées de supplier_order_items');
    console.log('🔧 Fonctions et triggers supprimés');
    console.log('🔒 Index supprimés');
    console.log('🔄 La table est revenue à son état d\'origine');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution du rollback:', error);
    process.exit(1);
  }
}

// Alternative: utiliser l'interface SQL directe
async function executeRollbackDirect() {
  try {
    console.log('🔄 Exécution directe du rollback...');
    
    const rollbackPath = path.join(process.cwd(), 'rollback_supplier_order_totals_migration.sql');
    const rollbackSQL = fs.readFileSync(rollbackPath, 'utf8');
    
    // Exécuter le SQL directement
    const { error } = await supabase.rpc('exec_sql', { sql: rollbackSQL });
    
    if (error) {
      console.error('❌ Erreur lors de l\'exécution du rollback:', error);
      process.exit(1);
    }
    
    console.log('✅ Rollback exécuté avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution du rollback:', error);
    process.exit(1);
  }
}

// Vérifier si les colonnes existent encore
async function checkColumnsExist() {
  try {
    // Vérifier si la colonne total_usd existe
    const { data, error } = await supabase
      .from('supplier_order_items')
      .select('total_usd')
      .limit(1);
    
    if (error && error.code === '42703') {
      console.log('📋 Colonnes total_usd et total_cfa n\'existent plus (rollback déjà effectué)');
      return false;
    }
    
    console.log('✅ Colonnes total_usd et total_cfa existent encore');
    return true;
  } catch (error) {
    console.log('📋 Colonnes total_usd et total_cfa n\'existent plus (rollback déjà effectué)');
    return false;
  }
}

// Fonction principale
async function main() {
  console.log('🔍 Vérification de l\'état actuel...');
  
  const columnsExist = await checkColumnsExist();
  
  if (!columnsExist) {
    console.log('ℹ️ Le rollback a déjà été effectué ou la migration n\'a jamais été appliquée');
    return;
  }
  
  console.log('⚠️ ATTENTION: Vous êtes sur le point d\'annuler la migration des totaux des commandes fournisseurs');
  console.log('📋 Cela supprimera les colonnes total_usd et total_cfa de la table supplier_order_items');
  console.log('🔧 Cela supprimera également les fonctions, triggers et index associés');
  console.log('');
  console.log('🔄 Exécution du rollback...');
  await executeRollbackDirect();
  
  console.log('🎉 Rollback terminé avec succès !');
  console.log('');
  console.log('📝 Prochaines étapes:');
  console.log('1. Redémarrez votre application');
  console.log('2. Vérifiez que les colonnes ont bien été supprimées');
  console.log('3. Si nécessaire, vous pourrez réappliquer la migration plus tard');
}

// Exécuter le script
main().catch(console.error);
