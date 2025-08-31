// Test rapide des utilitaires de slugs
import { generateSlug, generateProductSlug, urlUtils } from './src/utils/slugUtils.js';

console.log('🧪 Test Rapide des URLs Humanisées\n');

// Simuler quelques produits
const testProducts = [
    {
        id: 'abc123def-456-789-ghi-012345678901',
        name: 'iPhone 15 Pro Max 256GB',
        slug: null // Pas encore de slug
    },
    {
        id: 'def456ghi-789-abc-123-456789012345',
        name: 'MacBook Air M2 13 pouces',
        slug: 'macbook-air-m2-13-pouces-def456gh' // Avec slug
    }
];

console.log('📱 Test de génération d\'URLs:');
console.log('=' .repeat(50));

testProducts.forEach((product, index) => {
    const url = urlUtils.generateProductUrl(product);
    const generatedSlug = generateProductSlug(product.name, product.id);
    
    console.log(`${index + 1}. ${product.name}`);
    console.log(`   Slug actuel: ${product.slug || 'null'}`);
    console.log(`   Slug généré: ${generatedSlug}`);
    console.log(`   URL générée: ${url}`);
    console.log('');
});

console.log('🔍 État probable de votre application:');
console.log('Si la migration SQL a été exécutée correctement,');
console.log('vos produits devraient maintenant avoir des slugs.');
console.log('');
console.log('🚀 Pour tester:');
console.log('1. Redémarrez votre serveur: npm run dev');
console.log('2. Ouvrez: test_frontend_slugs.html');
console.log('3. Ou naviguez vers: http://localhost:5173/products');
console.log('4. Cliquez sur un produit et vérifiez l\'URL');
console.log('');
console.log('✅ URLs attendues: /product/nom-du-produit-abc123de');
console.log('❌ URLs anciennes: /product/abc123def-456-789-ghi-012345678901');
