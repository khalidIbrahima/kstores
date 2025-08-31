// Quick debug script to check if the slug logic is working
import { urlUtils, generateProductSlug } from './src/utils/slugUtils.js';

console.log('🔍 Debug: URL Generation Logic\n');

// Test the urlUtils.generateProductUrl function
console.log('📋 Testing urlUtils.generateProductUrl():');
console.log('='.repeat(50));

// Test with product that has slug
const productWithSlug = {
    id: 'abc123def-456-789-ghi-012345678901',
    name: 'iPhone 15 Pro Max',
    slug: 'iphone-15-pro-max-abc123de'
};

// Test with product that has no slug
const productWithoutSlug = {
    id: 'def456ghi-789-abc-123-456789012345',
    name: 'MacBook Air M2',
    slug: null
};

// Test with product that has undefined slug
const productUndefinedSlug = {
    id: 'ghi789jkl-012-345-678-901234567890',
    name: 'Samsung Galaxy S24'
    // no slug property
};

const testProducts = [productWithSlug, productWithoutSlug, productUndefinedSlug];

testProducts.forEach((product, index) => {
    const url = urlUtils.generateProductUrl(product);
    console.log(`${index + 1}. ${product.name}`);
    console.log(`   Has slug: ${product.slug ? 'YES' : 'NO'}`);
    console.log(`   Slug value: ${product.slug || 'null/undefined'}`);
    console.log(`   Generated URL: ${url}`);
    console.log('');
});

console.log('🔧 Expected behavior:');
console.log('- Product with slug → /product/slug-name');
console.log('- Product without slug → /product/generated-slug-from-name');
console.log('');

console.log('🚨 If you\'re seeing UUID in URLs, the issue is:');
console.log('1. Products in DB don\'t have slugs yet, OR');
console.log('2. Frontend is not fetching the slug column, OR');
console.log('3. ProductCard component is using product.id instead of slug');
