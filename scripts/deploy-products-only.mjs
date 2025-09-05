#!/usr/bin/env node

/**
 * Script pour déployer uniquement les pages produits
 * Upload les fichiers HTML des produits directement dans le dossier racine
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Client } from 'basic-ftp';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

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
 * Déploie les pages produits
 */
async function deployProducts() {
  log.header('🚀 DÉPLOIEMENT DES PAGES PRODUITS');
  
  const client = new Client();
  client.ftp.verbose = false;
  
  try {
    // Connexion FTP
    log.info('🌐 Connexion FTP...');
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
      secure: false
    });
    log.success('✅ Connecté à ' + process.env.FTP_HOST);
    
    // Vérifier le dossier des produits
    const productDir = join(__dirname, '..', 'dist', 'product');
    if (!existsSync(productDir)) {
      log.error('❌ Dossier product/ non trouvé. Exécutez d\'abord npm run generate:products');
      return;
    }
    
    // Lire les fichiers produits
    const productFiles = readdirSync(productDir).filter(file => file.endsWith('.html'));
    log.info(`📦 ${productFiles.length} fichiers produits trouvés`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Upload chaque fichier produit
    for (const file of productFiles) {
      try {
        const localPath = join(productDir, file);
        const remotePath = `product-${file}`; // Préfixe pour éviter les conflits
        
        await client.uploadFrom(localPath, remotePath);
        log.success(`📤 ${remotePath}`);
        successCount++;
      } catch (error) {
        log.error(`❌ Erreur upload ${file}: ${error.message}`);
        errorCount++;
      }
    }
    
    // Upload du fichier .htaccess modifié
    try {
      const htaccessPath = join(__dirname, '..', 'dist', '.htaccess');
      if (existsSync(htaccessPath)) {
        // Lire le contenu actuel
        let htaccessContent = readFileSync(htaccessPath, 'utf8');
        
        // Ajouter les règles pour les pages produits
        const productRules = `
# Règles pour les pages produits
RewriteRule ^product/([a-f0-9-]+)$ /product-$1.html [L]`;
        
        if (!htaccessContent.includes('product-')) {
          htaccessContent = htaccessContent.replace(
            'RewriteRule ^product/([a-f0-9-]+)$ /product/$1.html [L]',
            'RewriteRule ^product/([a-f0-9-]+)$ /product-$1.html [L]'
          );
        }
        
        // Écrire le fichier temporaire
        const tempHtaccessPath = join(__dirname, '..', 'dist', '.htaccess.temp');
        writeFileSync(tempHtaccessPath, htaccessContent, 'utf8');
        
        await client.uploadFrom(tempHtaccessPath, '.htaccess');
        log.success('📤 .htaccess (mis à jour)');
        
        // Supprimer le fichier temporaire
        const fs = await import('fs');
        fs.unlinkSync(tempHtaccessPath);
      }
    } catch (error) {
      log.error(`❌ Erreur upload .htaccess: ${error.message}`);
    }
    
    log.header('📊 Résumé');
    log.success(`${successCount} pages produits uploadées`);
    if (errorCount > 0) {
      log.error(`${errorCount} erreurs`);
    }
    
    log.success('🎉 Déploiement des pages produits terminé !');
    
  } catch (error) {
    log.error(`❌ Erreur FTP: ${error.message}`);
  } finally {
    client.close();
  }
}

// Exécuter le script
deployProducts();

