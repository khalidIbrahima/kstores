#!/usr/bin/env node

/**
 * Script pour vérifier si les slugs existent et les générer côté client si nécessaire
 */

import { createClient } from '@supabase/supabase-js';
import { generateProductSlug } from './src/utils/slugUtils.js';

// Configuration Supabase (utilise les variables d'environnement du client)
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Variables d\'environnement Supabase non configurées');
  console.log('📝 Vérifiez votre fichier .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkSlugs() {
  try {
    console.log('🔍 Vérification des slugs existants...\n');
    
    // Vérifier quelques produits
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, slug')
      .limit(10);
    
    if (error) {
      throw error;
    }
    
    if (!products || products.length === 0) {
      console.log('⚠️  Aucun produit trouvé dans la base de données');
      return;
    }
    
    console.log('📊 État actuel des slugs:');
    console.log('=' .repeat(80));
    
    let hasSlug = 0;
    let noSlug = 0;
    
    products.forEach((product, index) => {
      const status = product.slug ? '✅' : '❌';
      const slug = product.slug || 'PAS DE SLUG';
      const generatedSlug = generateProductSlug(product.name, product.id);
      
      console.log(`${index + 1}. ${status} ${product.name}`);
      console.log(`   Slug actuel: ${slug}`);
      console.log(`   Slug généré: ${generatedSlug}`);
      console.log(`   URL actuelle: /product/${product.slug || product.id}`);
      console.log(`   URL future: /product/${generatedSlug}`);
      console.log('');
      
      if (product.slug) {
        hasSlug++;
      } else {
        noSlug++;
      }
    });
    
    console.log('=' .repeat(80));
    console.log(`📈 Résumé: ${hasSlug} avec slugs, ${noSlug} sans slugs`);
    
    if (noSlug > 0) {
      console.log('\n🚨 Action requise:');
      console.log('1. Allez dans votre dashboard Supabase');
      console.log('2. Ouvrez l\'onglet "SQL Editor"');
      console.log('3. Créez une nouvelle requête');
      console.log('4. Copiez-collez le contenu du fichier "add_slugs_manual.sql"');
      console.log('5. Exécutez la requête');
      console.log('6. Relancez ce script pour vérifier');
      
      console.log('\n📂 Fichier à utiliser: add_slugs_manual.sql');
    } else {
      console.log('\n🎉 Tous les produits ont des slugs!');
      console.log('Les URLs humanisées devraient maintenant fonctionner.');
    }
    
    // Test d'une URL
    if (products.length > 0) {
      const firstProduct = products[0];
      const expectedUrl = `/product/${firstProduct.slug || generateProductSlug(firstProduct.name, firstProduct.id)}`;
      
      console.log('\n🧪 Test d\'URL:');
      console.log(`Testez cette URL: http://localhost:5173${expectedUrl}`);
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

// Vérifier si on a la structure de colonnes nécessaire
async function checkTableStructure() {
  try {
    console.log('🔍 Vérification de la structure de la table...\n');
    
    // Tenter de sélectionner la colonne slug
    const { data, error } = await supabase
      .from('products')
      .select('slug')
      .limit(1);
    
    if (error && error.message.includes('column "slug" does not exist')) {
      console.log('❌ La colonne "slug" n\'existe pas encore');
      console.log('📝 Vous devez d\'abord exécuter la migration SQL');
      console.log('👉 Utilisez le fichier: add_slugs_manual.sql');
      return false;
    }
    
    console.log('✅ La colonne "slug" existe');
    return true;
    
  } catch (error) {
    console.log('⚠️  Impossible de vérifier la structure:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Vérification des URLs Humanisées - Kapital Stores\n');
  
  const hasSlugColumn = await checkTableStructure();
  
  if (hasSlugColumn) {
    await checkSlugs();
  }
  
  console.log('\n📋 Instructions:');
  console.log('1. Si la colonne slug n\'existe pas → Exécutez add_slugs_manual.sql');
  console.log('2. Si les produits n\'ont pas de slugs → Exécutez la requête UPDATE');
  console.log('3. Redémarrez votre serveur de développement');
  console.log('4. Les URLs devraient maintenant être humanisées!');
}

main();
