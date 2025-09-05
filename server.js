/**
 * Serveur Express pour servir l'application React avec les bonnes métadonnées
 * Ce serveur intercepte les requêtes et sert les métadonnées appropriées
 */

import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const PORT = process.env.PORT || 3000;
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const app = express();

// Servir les fichiers statiques
app.use(express.static(join(__dirname, 'dist')));

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
 * Génère le HTML avec les métadonnées pour un produit
 */
function generateProductHTML(product, category = null) {
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://kapital-stores.shop' 
    : `http://localhost:${PORT}`;
  
  const productUrl = `${baseUrl}/product/${product.id}`;
  const imageUrl = getSupabasePublicUrl(product.image_url);
  
  const description = product.description 
    ? product.description.substring(0, 160) + (product.description.length > 160 ? '...' : '')
    : `Découvrez ${product.name} sur Kapital Stores`;

  // Lire le fichier index.html de base
  const indexPath = join(__dirname, 'dist', 'index.html');
  let html = '';
  
  if (existsSync(indexPath)) {
    html = readFileSync(indexPath, 'utf8');
  } else {
    // HTML de base si le fichier n'existe pas
    html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kapital Stores</title>
</head>
<body>
  <div id="root"></div>
</body>
</html>`;
  }

  // Remplacer les métadonnées
  html = html.replace(
    /<title>.*?<\/title>/,
    `<title>${product.name} - Kapital Stores</title>`
  );

  // Ajouter les métadonnées Open Graph
  const metaTags = `
    <!-- Base Meta Tags -->
    <meta name="description" content="${description}" />
    <meta name="keywords" content="${product.name}, ${category?.name || 'produit'}, boutique en ligne, Kapital Stores" />
    
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
    </script>`;

  // Insérer les métadonnées dans le head
  html = html.replace('</head>', `${metaTags}\n  </head>`);

  return html;
}

/**
 * Route pour les pages produits
 */
app.get('/product/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Récupérer le produit depuis Supabase
    const { data: product, error } = await supabase
      .from('products')
      .select(`
        *,
        categories(*)
      `)
      .eq('id', id)
      .eq('isActive', true)
      .single();

    if (error || !product) {
      // Si le produit n'existe pas, servir la page normale
      const indexPath = join(__dirname, 'dist', 'index.html');
      if (existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Produit non trouvé');
      }
      return;
    }

    // Générer le HTML avec les métadonnées
    const html = generateProductHTML(product, product.categories);
    res.send(html);

  } catch (error) {
    console.error('Erreur lors de la récupération du produit:', error);
    const indexPath = join(__dirname, 'dist', 'index.html');
    if (existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(500).send('Erreur serveur');
    }
  }
});

/**
 * Route pour la page des produits
 */
app.get('/products', async (req, res) => {
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://kapital-stores.shop' 
    : `http://localhost:${PORT}`;
  
  const productsUrl = `${baseUrl}/products`;
  
  const indexPath = join(__dirname, 'dist', 'index.html');
  let html = '';
  
  if (existsSync(indexPath)) {
    html = readFileSync(indexPath, 'utf8');
  } else {
    res.status(404).send('Fichier non trouvé');
    return;
  }

  // Métadonnées pour la page produits
  const metaTags = `
    <!-- Base Meta Tags -->
    <meta name="description" content="Découvrez notre catalogue complet de produits technologiques. Smartphones, ordinateurs, accessoires et plus." />
    <meta name="keywords" content="produits, catalogue, boutique en ligne, tech, électronique, Kapital Stores" />
    
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
    <meta name="twitter:creator" content="@kapital_stores" />`;

  html = html.replace('</head>', `${metaTags}\n  </head>`);
  res.send(html);
});

/**
 * Route pour toutes les autres pages (SPA)
 */
app.get('*', (req, res) => {
  const indexPath = join(__dirname, 'dist', 'index.html');
  if (existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Page non trouvée');
  }
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📱 Mode: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 URL: http://localhost:${PORT}`);
});

