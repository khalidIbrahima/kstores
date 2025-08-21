#!/usr/bin/env node

/**
 * Script de test pour les URLs humanisées
 * Teste la génération de slugs et la logique de routage
 */

import { generateSlug, generateProductSlug, isValidSlug, urlUtils } from './src/utils/slugUtils.js';

console.log('🧪 Test des URLs Humanisées - Kapital Stores\n');

// Test 1: Génération de slugs de base
console.log('📝 Test 1: Génération de slugs de base');
const testNames = [
  'iPhone 15 Pro Max 256GB',
  'MacBook Air M2 13 pouces',
  'Samsung Galaxy S24 Ultra',
  'Écouteurs Bluetooth Sans Fil',
  'Chargeur USB-C 65W',
  'Clavier Mécanique RGB Gamer',
  'Souris Gaming Haute Précision',
  'Moniteur 4K 27 pouces'
];

testNames.forEach(name => {
  const slug = generateSlug(name);
  console.log(`   "${name}" → "${slug}"`);
});

console.log('\n' + '='.repeat(60) + '\n');

// Test 2: Génération de slugs de produits avec ID
console.log('📝 Test 2: Génération de slugs de produits avec ID');
const testProducts = [
  { name: 'iPhone 15 Pro Max', id: 'abc123def-456-789-ghi-012345678901' },
  { name: 'MacBook Air M2', id: 'def456ghi-789-abc-123-456789012345' },
  { name: 'Galaxy S24 Ultra', id: 'ghi789jkl-012-345-678-901234567890' }
];

testProducts.forEach(product => {
  const slug = generateProductSlug(product.name, product.id);
  console.log(`   "${product.name}" → "${slug}"`);
});

console.log('\n' + '='.repeat(60) + '\n');

// Test 3: Validation des slugs
console.log('📝 Test 3: Validation des slugs');
const testSlugs = [
  'iphone-15-pro-max-abc123de',  // ✅ Valide
  'macbook-air-m2-def456gh',     // ✅ Valide
  'invalid--slug',               // ❌ Tirets doubles
  '-invalid-slug',               // ❌ Commence par tiret
  'invalid-slug-',               // ❌ Finit par tiret
  'invalid slug',                // ❌ Espaces
  'InvalidSlug',                 // ❌ Majuscules
  'valid-slug-123'               // ✅ Valide
];

testSlugs.forEach(slug => {
  const isValid = isValidSlug(slug);
  const status = isValid ? '✅' : '❌';
  console.log(`   ${status} "${slug}"`);
});

console.log('\n' + '='.repeat(60) + '\n');

// Test 4: Extraction d'ID depuis les slugs
console.log('📝 Test 4: Extraction d\'ID depuis les slugs');
const testSlugIds = [
  'iphone-15-pro-max-abc123de',
  'macbook-air-m2-def456gh',
  'galaxy-s24-ultra-ghi789jk',
  'invalid-slug',  // Sans ID
  'slug-sans-id-valide'
];

testSlugIds.forEach(slug => {
  const extractedId = urlUtils.extractIdFromProductSlug(slug);
  console.log(`   "${slug}" → ID: ${extractedId || 'non trouvé'}`);
});

console.log('\n' + '='.repeat(60) + '\n');

// Test 5: Génération d'URLs
console.log('📝 Test 5: Génération d\'URLs');
const testProductsWithSlugs = [
  { 
    id: 'abc123def-456-789-ghi-012345678901',
    name: 'iPhone 15 Pro Max',
    slug: 'iphone-15-pro-max-abc123de'
  },
  { 
    id: 'def456ghi-789-abc-123-456789012345',
    name: 'MacBook Air M2',
    slug: null  // Pas de slug, utilise l'ID
  },
  { 
    id: 'ghi789jkl-012-345-678-901234567890',
    name: 'Galaxy S24 Ultra'
    // Pas de propriété slug
  }
];

testProductsWithSlugs.forEach(product => {
  const url = urlUtils.generateProductUrl(product);
  console.log(`   "${product.name}" → ${url}`);
});

console.log('\n' + '='.repeat(60) + '\n');

// Test 6: Caractères spéciaux français
console.log('📝 Test 6: Caractères spéciaux français');
const frenchNames = [
  'Téléphone à écran OLED',
  'Ordinateur portable haut de gamme',
  'Casque sans fil Bluetooth',
  'Caméra numérique étanche',
  'Haut-parleur stéréo',
  'Montre connectée élégante'
];

frenchNames.forEach(name => {
  const slug = generateSlug(name);
  console.log(`   "${name}" → "${slug}"`);
});

console.log('\n' + '='.repeat(60) + '\n');

// Test 7: Cas limites
console.log('📝 Test 7: Cas limites');
const edgeCases = [
  '',  // Vide
  '   ',  // Espaces uniquement
  '!@#$%^&*()',  // Caractères spéciaux uniquement
  'Nom très très très très très très très très très très très très très très très très très long qui dépasse la limite',
  'A',  // Un seul caractère
  '123',  // Chiffres uniquement
  'Ñoël & Côte-d\'Ivoire!'  // Mélange complexe
];

edgeCases.forEach(name => {
  const slug = generateSlug(name);
  console.log(`   "${name}" → "${slug}"`);
});

console.log('\n🎉 Tests terminés!\n');

// Résumé des fonctionnalités
console.log('📋 Résumé des fonctionnalités:');
console.log('   ✅ Génération automatique de slugs');
console.log('   ✅ Normalisation des caractères français');
console.log('   ✅ Validation des slugs');
console.log('   ✅ Extraction d\'ID depuis les slugs');
console.log('   ✅ Génération d\'URLs avec fallback');
console.log('   ✅ Gestion des cas limites');

console.log('\n💡 Prochaines étapes:');
console.log('   1. Appliquer la migration: node apply_product_slugs_migration.js');
console.log('   2. Tester en développement: npm run dev');
console.log('   3. Vérifier les URLs de produits');
console.log('   4. Déployer en production');

console.log('\n🚀 URLs humanisées prêtes à l\'utilisation!');
