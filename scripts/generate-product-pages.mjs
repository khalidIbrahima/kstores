#!/usr/bin/env node

/**
 * Script pour générer des pages HTML statiques pour chaque produit
 * Ces pages contiennent les bonnes métadonnées Open Graph
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
  
  if (filePath.startsWith('http')) {
    return filePath;
  }
  
  const projectId = supabaseUrl.split('//')[1].split('.')[0];
  return `https://${projectId}.supabase.co/storage/v1/object/public/${bucketName}/${filePath}`;
}

/**
 * Génère le HTML pour une page produit
 */
function generateProductPageHTML(product, category = null) {
  const baseUrl = 'https://kapital-stores.shop';
  const productUrl = `${baseUrl}/product/${product.id}`;
  const imageUrl = getSupabasePublicUrl(product.image_url);
  
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
  
  <!-- Preload critical resources -->
  <link rel="preload" href="/src/main.jsx" as="script" />
  <link rel="preload" href="${imageUrl}" as="image" />
  
  <!-- Styles -->
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .loading-container {
      text-align: center;
      color: white;
      max-width: 600px;
      padding: 2rem;
    }
    
    .loading-spinner {
      width: 50px;
      height: 50px;
      border: 3px solid rgba(255, 255, 255, 0.3);
      border-top: 3px solid white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 2rem;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .product-preview {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      padding: 2rem;
      margin: 2rem 0;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .product-image {
      width: 200px;
      height: 200px;
      object-fit: cover;
      border-radius: 15px;
      margin: 0 auto 1rem;
      display: block;
    }
    
    .product-title {
      font-size: 1.5rem;
      font-weight: bold;
      margin-bottom: 0.5rem;
    }
    
    .product-description {
      opacity: 0.9;
      line-height: 1.6;
    }
    
    .loading-text {
      font-size: 1.1rem;
      margin-bottom: 1rem;
    }
  </style>
</head>
<body>
  <div class="loading-container">
    <div class="loading-spinner"></div>
    <div class="loading-text">Chargement de ${product.name}...</div>
    
    <div class="product-preview">
      <img src="${imageUrl}" alt="${product.name}" class="product-image" />
      <div class="product-title">${product.name}</div>
      <div class="product-description">${description}</div>
    </div>
    
    <p>Redirection vers Kapital Stores...</p>
  </div>
  
  <!-- Script de redirection -->
  <script>
    // Rediriger vers l'application React après un court délai
    setTimeout(() => {
      window.location.href = '${productUrl}';
    }, 2000);
  </script>
  
  <!-- Script de l'application React -->
  <script type="module" src="/src/main.jsx"></script>
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
 * Génère les pages HTML pour tous les produits
 */
async function generateProductPages() {
  log.header('🚀 Génération des pages produits');
  
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
      const html = generateProductPageHTML(product, product.categories);
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
  log.success(`${successCount} pages générées avec succès`);
  if (errorCount > 0) {
    log.error(`${errorCount} erreurs`);
  }
  
  // Générer un fichier .htaccess pour la redirection
  generateHtaccess(outputDir);
}

/**
 * Génère un fichier .htaccess pour la redirection
 */
function generateHtaccess(outputDir) {
  log.info('Génération du fichier .htaccess...');
  
  const htaccessContent = `# Redirection pour les pages produits
RewriteEngine On

# Rediriger /product/{id} vers /product/{id}.html
RewriteRule ^product/([a-f0-9-]+)$ /product/$1.html [L]

# Rediriger vers l'application React si le fichier n'existe pas
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^.*$ /index.html [L]`;
  
  const htaccessPath = join(__dirname, '..', 'dist', '.htaccess');
  writeFileSync(htaccessPath, htaccessContent, 'utf8');
  log.success('Fichier .htaccess généré');
}

/**
 * Fonction principale
 */
async function main() {
  log.header('🔧 Générateur de Pages Produits');
  
  try {
    await generateProductPages();
    log.success('✅ Génération terminée avec succès');
    log.info('Les pages sont maintenant disponibles dans le dossier dist/product/');
  } catch (error) {
    log.error(`❌ Erreur fatale: ${error.message}`);
    process.exit(1);
  }
}

// Exécuter le script
main();
