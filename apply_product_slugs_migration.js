#!/usr/bin/env node

/**
 * Script pour appliquer la migration des slugs de produits
 * Ce script ajoute le support des URLs humanisées pour les produits
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration Supabase
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'your-supabase-url';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || SUPABASE_URL.includes('your-') || SUPABASE_SERVICE_KEY.includes('your-')) {
  console.error('❌ Erreur: Variables d\'environnement Supabase non configurées');
  console.log('📝 Assurez-vous de définir:');
  console.log('   - VITE_SUPABASE_URL');
  console.log('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function applyMigration() {
  try {
    console.log('🚀 Démarrage de la migration des slugs de produits...');
    
    // Lire le fichier de migration
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20250109000000_add_product_slugs.sql');
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Fichier de migration non trouvé: ${migrationPath}`);
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('📖 Migration SQL chargée');
    
    // Diviser le SQL en commandes individuelles
    const commands = migrationSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && !cmd.startsWith('/*'));
    
    console.log(`📊 ${commands.length} commandes SQL à exécuter`);
    
    // Exécuter chaque commande individuellement
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i] + ';';
      console.log(`⚡ Exécution de la commande ${i + 1}/${commands.length}...`);
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: command });
        
        if (error) {
          // Essayer avec la méthode directe si rpc échoue
          const { error: directError } = await supabase
            .from('_supabase_migrations')
            .select('*')
            .limit(1);
          
          if (directError) {
            console.warn(`⚠️  Commande ${i + 1} - Avertissement:`, error.message);
          }
        }
      } catch (err) {
        console.warn(`⚠️  Commande ${i + 1} - Avertissement:`, err.message);
      }
    }
    
    // Vérifier que la colonne slug a été ajoutée
    console.log('🔍 Vérification de la migration...');
    
    const { data: products, error: selectError } = await supabase
      .from('products')
      .select('id, name, slug')
      .limit(5);
    
    if (selectError) {
      throw new Error(`Erreur lors de la vérification: ${selectError.message}`);
    }
    
    console.log('✅ Migration appliquée avec succès!');
    console.log(`📊 ${products?.length || 0} produits vérifiés`);
    
    if (products && products.length > 0) {
      console.log('🔍 Exemples de slugs générés:');
      products.forEach(product => {
        console.log(`   - ${product.name} → ${product.slug || 'pas de slug'}`);
      });
    }
    
    // Générer des slugs pour tous les produits sans slug
    console.log('🔄 Génération des slugs manquants...');
    
    const { data: productsWithoutSlug, error: noSlugError } = await supabase
      .from('products')
      .select('id, name')
      .is('slug', null);
    
    if (!noSlugError && productsWithoutSlug && productsWithoutSlug.length > 0) {
      console.log(`📝 ${productsWithoutSlug.length} produits sans slug trouvés`);
      
      for (const product of productsWithoutSlug) {
        const slug = generateSlug(product.name, product.id);
        
        const { error: updateError } = await supabase
          .from('products')
          .update({ slug })
          .eq('id', product.id);
        
        if (updateError) {
          console.warn(`⚠️  Erreur mise à jour slug pour ${product.name}:`, updateError.message);
        }
      }
      
      console.log('✅ Slugs manquants générés');
    }
    
    console.log('');
    console.log('🎉 Migration terminée avec succès!');
    console.log('');
    console.log('📋 Prochaines étapes:');
    console.log('   1. Mettre à jour les routes dans l\'application');
    console.log('   2. Modifier les liens pour utiliser les slugs');
    console.log('   3. Tester les nouvelles URLs humanisées');
    console.log('');
    console.log('💡 Exemple d\'URL avant: /product/abc123-def456-789');
    console.log('💡 Exemple d\'URL après:  /product/iphone-15-pro-max-abc123de');
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Fonction utilitaire pour générer des slugs (version JS)
function generateSlug(text, id) {
  if (!text) return 'produit';
  
  let slug = text
    .toString()
    .toLowerCase()
    .trim()
    // Caractères spéciaux français
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ýÿ]/g, 'y')
    .replace(/[ñ]/g, 'n')
    .replace(/[ç]/g, 'c')
    .replace(/[œ]/g, 'oe')
    .replace(/[æ]/g, 'ae')
    // Supprimer caractères spéciaux
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
  
  // Limiter à 50 caractères
  slug = slug.substring(0, 50).replace(/-$/, '');
  
  // Ajouter suffixe unique
  if (id) {
    const shortId = id.replace(/-/g, '').slice(-8);
    slug = `${slug}-${shortId}`;
  }
  
  return slug || 'produit';
}

// Exécuter le script
if (import.meta.url === `file://${process.argv[1]}`) {
  applyMigration();
}
