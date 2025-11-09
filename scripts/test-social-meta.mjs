#!/usr/bin/env node

/**
 * Script de test pour valider les métadonnées sociales
 * Usage: node scripts/test-social-meta.mjs [URL]
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
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
 * Teste les métadonnées Open Graph d'une URL
 */
async function testOpenGraphMeta(url) {
  log.header('🔍 Test des Métadonnées Open Graph');
  
  try {
    const response = await fetch(url);
    const html = await response.text();
    
    // Extraire les métadonnées Open Graph
    const ogTags = extractMetaTags(html, 'og:');
    const twitterTags = extractMetaTags(html, 'twitter:');
    
    log.info(`URL testée: ${url}`);
    log.info(`Status HTTP: ${response.status}`);
    
    // Vérifier les tags Open Graph essentiels
    const requiredOgTags = [
      'og:title',
      'og:description', 
      'og:image',
      'og:url',
      'og:type'
    ];
    
    log.header('📊 Métadonnées Open Graph');
    requiredOgTags.forEach(tag => {
      const value = ogTags[tag];
      if (value) {
        log.success(`${tag}: ${value}`);
      } else {
        log.error(`${tag}: Manquant`);
      }
    });
    
    // Vérifier les dimensions d'image
    if (ogTags['og:image']) {
      log.header('🖼️ Informations sur l\'Image');
      log.info(`Image URL: ${ogTags['og:image']}`);
      
      if (ogTags['og:image:width']) {
        log.info(`Largeur: ${ogTags['og:image:width']}px`);
      }
      
      if (ogTags['og:image:height']) {
        log.info(`Hauteur: ${ogTags['og:image:height']}px`);
      }
      
      if (ogTags['og:image:alt']) {
        log.info(`Alt text: ${ogTags['og:image:alt']}`);
      }
      
      // Tester l'accessibilité de l'image
      try {
        const imageResponse = await fetch(ogTags['og:image'], { method: 'HEAD' });
        if (imageResponse.ok) {
          log.success(`Image accessible: ${imageResponse.status}`);
          log.info(`Content-Type: ${imageResponse.headers.get('content-type')}`);
        } else {
          log.error(`Image non accessible: ${imageResponse.status}`);
        }
      } catch (error) {
        log.error(`Erreur de test d'image: ${error.message}`);
      }
    }
    
    // Vérifier les Twitter Cards
    log.header('🐦 Métadonnées Twitter');
    const twitterCard = twitterTags['twitter:card'];
    if (twitterCard) {
      log.success(`Twitter Card: ${twitterCard}`);
    } else {
      log.warning('Twitter Card: Non définie');
    }
    
    // Afficher les liens de validation
    log.header('🔧 Outils de Validation');
    const validators = [
      {
        name: 'Facebook Sharing Debugger',
        url: `https://developers.facebook.com/tools/debug/?q=${encodeURIComponent(url)}`
      },
      {
        name: 'Twitter Card Validator',
        url: `https://cards-dev.twitter.com/validator`
      },
      {
        name: 'LinkedIn Post Inspector',
        url: `https://www.linkedin.com/post-inspector/inspect/${encodeURIComponent(url)}`
      },
      {
        name: 'Open Graph Preview',
        url: `https://www.opengraph.xyz/?url=${encodeURIComponent(url)}`
      }
    ];
    
    validators.forEach(validator => {
      log.info(`${validator.name}: ${validator.url}`);
    });
    
  } catch (error) {
    log.error(`Erreur lors du test: ${error.message}`);
  }
}

/**
 * Extrait les métadonnées d'une page HTML
 */
function extractMetaTags(html, prefix) {
  const tags = {};
  const regex = new RegExp(`<meta[^>]*(?:property|name)=["']${prefix}([^"']*)["'][^>]*content=["']([^"']*)["'][^>]*>`, 'gi');
  
  let match;
  while ((match = regex.exec(html)) !== null) {
    const [, name, content] = match;
    tags[`${prefix}${name}`] = content;
  }
  
  return tags;
}

/**
 * Affiche l'aide
 */
function showHelp() {
  console.log(`
${colors.bright}${colors.cyan}Test des Métadonnées Sociales${colors.reset}

Usage: node scripts/test-social-meta.mjs [URL]

Exemples:
  node scripts/test-social-meta.mjs https://kapital-stores.shop/product/123
  node scripts/test-social-meta.mjs https://kapital-stores.shop/products

Options:
  --help, -h    Afficher cette aide
  --local       Tester l'URL locale (http://localhost:5173)

Ce script teste:
  ✅ Métadonnées Open Graph
  ✅ Twitter Cards
  ✅ Accessibilité des images
  ✅ Dimensions d'images
  ✅ Liens de validation
`);
}

/**
 * Fonction principale
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    return;
  }
  
  let url = args[0];
  
  if (!url) {
    log.error('URL requise. Utilisez --help pour plus d\'informations.');
    process.exit(1);
  }
  
  if (args.includes('--local')) {
    url = 'http://localhost:5173' + (url.startsWith('/') ? url : '/' + url);
  }
  
  // S'assurer que l'URL a un protocole
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  
  await testOpenGraphMeta(url);
}

// Exécuter le script
main().catch(error => {
  log.error(`Erreur fatale: ${error.message}`);
  process.exit(1);
});

