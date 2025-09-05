#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { Client } from 'basic-ftp';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger les variables d'environnement
dotenv.config();

// Couleurs pour les logs
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Configuration FTP
function getConfig() {
  return {
    host: process.env.FTP_HOST,
    port: parseInt(process.env.FTP_PORT) || 21,
    user: process.env.FTP_USER,
    password: process.env.FTP_PASSWORD,
    remotePath: process.env.FTP_REMOTE_PATH || '/',
    buildPath: process.env.BUILD_PATH || 'dist'
  };
}

// Validation de la configuration
function validateConfig(config) {
  if (!config.host || !config.user || !config.password) {
    logError('Configuration FTP manquante !');
    log('Créez un fichier .env avec :', 'yellow');
    log('FTP_HOST=ftp.kapital-stores.shop', 'yellow');
    log('FTP_USER=u410438193.admin', 'yellow');
    log('FTP_PASSWORD=votre-mot-de-passe', 'yellow');
    log('FTP_REMOTE_PATH=/public_html', 'yellow');
    process.exit(1);
  }
}

// Upload récursif
async function uploadDirectory(client, localDir, remoteDir) {
  const files = fs.readdirSync(localDir, { withFileTypes: true });
  let uploadCount = 0;

  for (const file of files) {
    const localPath = path.join(localDir, file.name);
    const remotePath = remoteDir + '/' + file.name;

    if (file.isDirectory()) {
      try {
        // Créer le dossier s'il n'existe pas
        await client.ensureDir(remotePath);
        logInfo(`📁 Dossier: ${remotePath}`);
        
        // Aller dans le dossier
        await client.cd(remotePath);
        uploadCount += await uploadDirectory(client, localPath, '.');
        
        // Revenir au dossier parent
        await client.cd('..');
      } catch (error) {
        logError(`Erreur dossier ${remotePath}: ${error.message}`);
      }
    } else {
      try {
        await client.uploadFrom(localPath, remotePath);
        logSuccess(`📤 ${file.name}`);
        uploadCount++;
      } catch (error) {
        logError(`Erreur upload ${file.name}: ${error.message}`);
      }
    }
  }

  return uploadCount;
}

// Build du projet
function buildProject() {
  log('🔨 Construction du projet...', 'cyan');
  
  try {
    // Build de production
    execSync('npm run build', { 
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'production' }
    });
    logSuccess('Build terminé');
  } catch (error) {
    logError('Erreur lors du build');
    process.exit(1);
  }
}

// Déploiement FTP
async function deployFTP(config) {
  log('🚀 Connexion FTP...', 'cyan');
  
  const client = new Client();
  client.ftp.verbose = false;

  try {
    // Connexion
    await client.access({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password
    });
    
    logSuccess(`Connecté à ${config.host}`);

    // Aller au dossier de destination
    try {
      await client.cd(config.remotePath);
      logInfo(`📁 Dossier actuel: ${config.remotePath}`);
    } catch (error) {
      // Essayer des chemins alternatifs
      const alternatePaths = [
        `/domains/kapital-stores.shop/public_html`,
        `/`,
        `/htdocs`,
        `/www`,
        `/public_html/kapital-stores.shop`
      ];
      
      let found = false;
      for (const altPath of alternatePaths) {
        try {
          await client.cd(altPath);
          logInfo(`📁 Dossier trouvé: ${altPath}`);
          found = true;
          break;
        } catch (e) {
          // Continue
        }
      }
      
      if (!found) {
        logError(`Impossible de trouver le dossier de destination`);
        log('Chemins testés :', 'yellow');
        log(`  - ${config.remotePath}`, 'yellow');
        alternatePaths.forEach(p => log(`  - ${p}`, 'yellow'));
        throw error;
      }
    }

    // Upload des fichiers
    log('📤 Upload des fichiers...', 'cyan');
    const buildPath = path.resolve(config.buildPath);
    
    if (!fs.existsSync(buildPath)) {
      logError(`Le dossier ${config.buildPath} n'existe pas. Lancez d'abord npm run build`);
      process.exit(1);
    }

    const uploadCount = await uploadDirectory(client, buildPath, '.');
    
    logSuccess(`🎉 Déploiement terminé ! ${uploadCount} fichiers uploadés`);

  } catch (error) {
    logError(`Erreur FTP: ${error.message}`);
    
    if (error.message.includes('530')) {
      log('👉 Vérifiez vos identifiants FTP', 'yellow');
    } else if (error.message.includes('timeout')) {
      log('👉 Vérifiez l\'adresse du serveur', 'yellow');
    }
    
    process.exit(1);
  } finally {
    client.close();
  }
}

// Fonction principale
async function main() {
  const args = process.argv.slice(2);
  
  // Aide
  if (args.includes('--help') || args.includes('-h')) {
    log('🚀 Script de déploiement Kstores-1', 'bright');
    log('');
    log('Usage:', 'blue');
    log('  npm run deploy        # Build + Deploy');
    log('  npm run deploy:only   # Deploy seulement');
    log('  npm run deploy:config # Voir config');
    log('');
    log('Variables .env requises:', 'yellow');
    log('  FTP_HOST=ftp.kapital-stores.shop');
    log('  FTP_USER=u410438193.admin');
    log('  FTP_PASSWORD=votre-mot-de-passe');
    log('  FTP_REMOTE_PATH=/public_html');
    return;
  }

  // Configuration
  if (args.includes('--config')) {
    const config = getConfig();
    log('📋 Configuration:', 'blue');
    log(`  Host: ${config.host}`);
    log(`  Port: ${config.port}`);
    log(`  User: ${config.user}`);
    log(`  Password: ${'*'.repeat(config.password?.length || 0)}`);
    log(`  Remote: ${config.remotePath}`);
    log(`  Build: ${config.buildPath}`);
    return;
  }

  // Explorer la structure du serveur
  if (args.includes('--explore')) {
    const config = getConfig();
    validateConfig(config);
    
    log('🔍 Exploration du serveur FTP...', 'cyan');
    const client = new Client();
    
    try {
      await client.access({
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password
      });
      
      logSuccess('Connecté au serveur FTP');
      
      const list = await client.list();
      log('📁 Contenu du répertoire racine :', 'blue');
      
      for (const item of list) {
        const type = item.isDirectory ? '📁' : '📄';
        log(`  ${type} ${item.name}`);
      }
      
    } catch (error) {
      logError(`Erreur: ${error.message}`);
    } finally {
      client.close();
    }
    return;
  }

  try {
    log('🚀 DÉPLOIEMENT KSTORES-1', 'bright');
    log('========================', 'bright');
    
    const config = getConfig();
    validateConfig(config);
    
    const startTime = Date.now();
    
    // Build seulement si pas --only
    if (!args.includes('--only')) {
      buildProject();
    }
    
    // Déploiement
    await deployFTP(config);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    log('');
    logSuccess(`🎉 SUCCÈS ! Déployé en ${duration}s`);
    
  } catch (error) {
    logError('Échec du déploiement');
    console.error(error);
    process.exit(1);
  }
}

main();
