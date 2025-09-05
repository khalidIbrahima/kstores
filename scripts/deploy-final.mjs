#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { Client } from 'basic-ftp';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Couleurs
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

// Configuration
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

function validateConfig(config) {
  if (!config.host || !config.user || !config.password) {
    logError('Configuration FTP manquante !');
    log('Vérifiez votre fichier .env', 'yellow');
    process.exit(1);
  }
}

// Build
function buildProject() {
  log('🔨 Build du projet...', 'cyan');
  
  try {
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

// Upload récursif amélioré
async function uploadFiles(client, localDir, remoteDir = '') {
  const files = fs.readdirSync(localDir, { withFileTypes: true });
  let count = 0;

  for (const file of files) {
    const localPath = path.join(localDir, file.name);
    const remotePath = remoteDir ? `${remoteDir}/${file.name}` : file.name;

    if (file.isDirectory()) {
      // Créer le dossier s'il n'existe pas
      try {
        await client.ensureDir(remotePath);
        logInfo(`📁 ${remotePath}/ (créé/vérifié)`);
        count += await uploadFiles(client, localPath, remotePath);
      } catch (error) {
        logError(`Erreur dossier ${remotePath}: ${error.message}`);
      }
    } else {
      // Upload du fichier
      try {
        // S'assurer que le dossier parent existe
        if (remoteDir) {
          await client.ensureDir(remoteDir);
        }
        await client.uploadFrom(localPath, remotePath);
        logSuccess(`📤 ${remotePath}`);
        count++;
      } catch (error) {
        logError(`Erreur upload ${remotePath}: ${error.message}`);
      }
    }
  }

  return count;
}

// Déploiement principal
async function deploy(config, buildFirst = true) {
  log('🚀 DÉPLOIEMENT KSTORES-1', 'bright');
  log('========================', 'bright');
  
  const startTime = Date.now();
  
  // Build si nécessaire
  if (buildFirst) {
    buildProject();
  }

  // Vérifier que le dossier dist existe
  const buildPath = path.resolve(config.buildPath);
  if (!fs.existsSync(buildPath)) {
    logError(`Le dossier ${config.buildPath} n'existe pas`);
    log('Lancez d\'abord: npm run build', 'yellow');
    process.exit(1);
  }

  // Connexion FTP
  log('🌐 Connexion FTP...', 'cyan');
  const client = new Client();
  client.ftp.verbose = false;

  try {
    await client.access({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password
    });
    
    logSuccess(`Connecté à ${config.host}`);

    // Aller au bon dossier
    if (config.remotePath !== '/') {
      try {
        await client.cd(config.remotePath);
        logInfo(`📁 Dossier: ${config.remotePath}`);
      } catch (error) {
        logInfo(`📁 Utilisation du dossier racine`);
      }
    }

    // Upload tous les fichiers
    log('📤 Upload des fichiers...', 'cyan');
    const uploadCount = await uploadFiles(client, buildPath);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    logSuccess(`🎉 Déploiement réussi ! ${uploadCount} fichiers en ${duration}s`);

  } catch (error) {
    logError(`Erreur: ${error.message}`);
    
    if (error.message.includes('530')) {
      log('👉 Vérifiez username/password', 'yellow');
    } else if (error.message.includes('timeout')) {
      log('👉 Vérifiez l\'adresse du serveur', 'yellow');
    }
    
    process.exit(1);
  } finally {
    client.close();
  }
}

// Main
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    log('🚀 Déploiement Kstores-1', 'bright');
    log('');
    log('Commandes:', 'blue');
    log('  npm run deploy        # Build + Deploy');
    log('  npm run deploy:only   # Deploy seulement');
    log('  npm run deploy:config # Voir config');
    log('');
    return;
  }

  if (args.includes('--config')) {
    const config = getConfig();
    log('📋 Configuration:', 'blue');
    log(`  Host: ${config.host}`);
    log(`  User: ${config.user}`);
    log(`  Remote: ${config.remotePath}`);
    log(`  Build: ${config.buildPath}`);
    return;
  }

  if (args.includes('--explore')) {
    const config = getConfig();
    validateConfig(config);
    
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
      log('📁 Contenu du serveur :', 'blue');
      
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
    const config = getConfig();
    validateConfig(config);
    
    const buildFirst = !args.includes('--only');
    await deploy(config, buildFirst);
    
  } catch (error) {
    logError('Échec du déploiement');
    console.error(error);
    process.exit(1);
  }
}

main();
