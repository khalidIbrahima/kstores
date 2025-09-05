#!/usr/bin/env node

/**
 * Script pour générer les métadonnées statiques pour les pages produits
 * Ce script crée des fichiers HTML statiques avec les bonnes métadonnées
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}`)
};

/**
 * Génère une URL publique Supabase Storage
 */
function getSupabasePublicUrl(filePath, bucketName = 'product-media') {
  if (!filePath) return 'https://kapital-stores.shop/src/assets/logo-transparent.png';
  
  // Si c'est déjà une URL complète, la retourner
  if (filePath.startsWith('http')) {
    return filePath;
  }
  
  // Construire l'URL publique Supabase
  const projectId = supabaseUrl.split('//')[1].split('.')[0];
  return `https://${projectId}.supabase.co/storage/v1/object/public/${bucketName}/${filePath}`;
}

/**
 * Génère le HTML avec les métadonnées pour un produit
 */
function generateProductHTML(product, category = null) {
  const baseUrl = 'https://kapital-stores.shop';
  const productUrl = `${baseUrl}/product/${product.id}`;
  const imageUrl = getSupabasePublicUrl(product.image_url);
  
  // Description tronquée pour les métadonnées
  const description = product.description 
    ? product.description.substring(0, 160) + (product.description.length > 160 ? '...' : '')
    : `Découvrez ${product.name} sur Kapital Stores`;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${product.name} - Kapital Stores</title>
  
  <!-- Base Meta Tags -->
  <meta name="description" content="${description}" />
  <meta name="keywords" content="${product.name}, ${category?.name || 'produit'}, boutique en ligne, Kapital Stores" />
  <meta name="author" content="Kapital Stores" />
  <meta name="robots" content="index, follow" />
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="product" />
  <meta property="og:title" content="${product.name} - Kapital Stores" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${imageUrl}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="${product.name} - ${category?.name || 'Produit'} | Kapital Stores" />
  <meta property="og:url" content="${productUrl}" />
  <meta property="og:site_name" content="Kapital Stores" />
  <meta property="og:locale" content="fr_FR" />
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${product.name} - Kapital Stores" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${imageUrl}" />
  <meta name="twitter:image:alt" content="${product.name} - ${category?.name || 'Produit'} | Kapital Stores" />
  <meta name="twitter:site" content="@kapital_stores" />
  <meta name="twitter:creator" content="@kapital_stores" />
  
  <!-- Additional Meta -->
  <meta name="theme-color" content="#1e40af" />
  <link rel="canonical" href="${productUrl}" />
  
  <!-- Structured Data -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "${product.name}",
    "description": "${product.description || product.name}",
    "image": "${imageUrl}",
    "url": "${productUrl}",
    "sku": "${product.id}",
    "brand": {
      "@type": "Brand",
      "name": "Kapital Stores"
    },
    "offers": {
      "@type": "Offer",
      "price": "${product.price}",
      "priceCurrency": "XOF",
      "availability": "${product.inventory > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'}",
      "seller": {
        "@type": "Organization",
        "name": "Kapital Stores"
      }
    },
    "category": "${category?.name || 'Produit'}"
  }
  </script>
  
  <!-- Redirect to React app -->
  <script>
    // Rediriger vers l'application React après un court délai
    setTimeout(() => {
      window.location.href = '${productUrl}';
    }, 100);
  </script>
</head>
<body>
  <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
    <h1>${product.name}</h1>
    <p>Redirection vers Kapital Stores...</p>
    <p><a href="${productUrl}">Cliquez ici si la redirection ne fonctionne pas</a></p>
  </div>
</body>
</html>`;
}

/**
 * Récupère tous les produits depuis Supabase
 */
async function fetchProducts() {
  log.header('📦 Récupération des produits depuis Supabase');
  
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        *,
        categories(*)
      `)
      .eq('isActive', true);
    
    if (error) throw error;
    
    log.success(`${products.length} produits récupérés`);
    return products;
  } catch (error) {
    log.error(`Erreur lors de la récupération des produits: ${error.message}`);
    return [];
  }
}

/**
 * Génère les fichiers HTML statiques pour tous les produits
 */
async function generateStaticFiles() {
  log.header('🚀 Génération des fichiers statiques');
  
  const products = await fetchProducts();
  
  if (products.length === 0) {
    log.warning('Aucun produit trouvé');
    return;
  }
  
  // Créer le dossier de sortie
  const outputDir = join(__dirname, '..', 'dist', 'product');
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const product of products) {
    try {
      const html = generateProductHTML(product, product.categories);
      const fileName = `${product.id}.html`;
      const filePath = join(outputDir, fileName);
      
      writeFileSync(filePath, html, 'utf8');
      log.success(`Généré: ${fileName}`);
      successCount++;
    } catch (error) {
      log.error(`Erreur pour le produit ${product.id}: ${error.message}`);
      errorCount++;
    }
  }
  
  log.header('📊 Résumé');
  log.success(`${successCount} fichiers générés avec succès`);
  if (errorCount > 0) {
    log.error(`${errorCount} erreurs`);
  }
  
  // Générer un fichier index pour tous les produits
  generateProductsIndex(products, outputDir);
}

/**
 * Génère un fichier index pour tous les produits
 */
function generateProductsIndex(products, outputDir) {
  log.info('Génération de l\'index des produits...');
  
  const baseUrl = 'https://kapital-stores.shop';
  const productsUrl = `${baseUrl}/products`;
  
  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tous nos produits - Kapital Stores</title>
  
  <!-- Base Meta Tags -->
  <meta name="description" content="Découvrez notre catalogue complet de produits technologiques. Smartphones, ordinateurs, accessoires et plus." />
  <meta name="keywords" content="produits, catalogue, boutique en ligne, tech, électronique, Kapital Stores" />
  <meta name="author" content="Kapital Stores" />
  <meta name="robots" content="index, follow" />
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website" />
  <meta property="og:title" content="Tous nos produits - Kapital Stores" />
  <meta property="og:description" content="Découvrez notre catalogue complet de produits technologiques. Smartphones, ordinateurs, accessoires et plus." />
  <meta property="og:image" content="https://kapital-stores.shop/src/assets/logo-transparent.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:url" content="${productsUrl}" />
  <meta property="og:site_name" content="Kapital Stores" />
  <meta property="og:locale" content="fr_FR" />
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="Tous nos produits - Kapital Stores" />
  <meta name="twitter:description" content="Découvrez notre catalogue complet de produits technologiques." />
  <meta name="twitter:image" content="https://kapital-stores.shop/src/assets/logo-transparent.png" />
  <meta name="twitter:site" content="@kapital_stores" />
  <meta name="twitter:creator" content="@kapital_stores" />
  
  <!-- Redirect to React app -->
  <script>
    setTimeout(() => {
      window.location.href = '${productsUrl}';
    }, 100);
  </script>
</head>
<body>
  <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
    <h1>Tous nos produits</h1>
    <p>Redirection vers Kapital Stores...</p>
    <p><a href="${productsUrl}">Cliquez ici si la redirection ne fonctionne pas</a></p>
  </div>
</body>
</html>`;
  
  const indexPath = join(outputDir, '..', 'products.html');
  writeFileSync(indexPath, html, 'utf8');
  log.success('Index des produits généré');
}

/**
 * Fonction principale
 */
async function main() {
  log.header('🔧 Générateur de Métadonnées Statiques');
  
  try {
    await generateStaticFiles();
    log.success('✅ Génération terminée avec succès');
  } catch (error) {
    log.error(`❌ Erreur fatale: ${error.message}`);
    process.exit(1);
  }
}

// Exécuter le script
main();

