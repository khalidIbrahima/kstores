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

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`[${step}] ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Configuration de déploiement
async function getDeploymentConfig() {
  let config = {};
  
  // Essayer de charger le fichier de configuration
  const configPath = path.join(__dirname, '../config/deployment.js');
  if (fs.existsSync(configPath)) {
    try {
      const configModule = await import(path.resolve(configPath));
      config = configModule.default || configModule;
      log('📁 Configuration chargée depuis deployment.js', 'blue');
    } catch (error) {
      logWarning('Erreur lors du chargement de deployment.js, utilisation des variables d\'environnement');
    }
  }

  // Configuration avec variables d'environnement
  return {
    ftp: {
      host: process.env.FTP_HOST || config.ftp?.host || '',
      port: parseInt(process.env.FTP_PORT) || config.ftp?.port || 21,
      user: process.env.FTP_USER || config.ftp?.user || '',
      password: process.env.FTP_PASSWORD || config.ftp?.password || '',
      remotePath: process.env.FTP_REMOTE_PATH || config.ftp?.remotePath || '/public_html',
      secure: process.env.FTP_SECURE === 'true' || config.ftp?.secure || false,
      timeout: parseInt(process.env.FTP_TIMEOUT) || config.ftp?.timeout || 30000
    },
    build: {
      buildPath: process.env.BUILD_PATH || config.build?.buildPath || 'dist',
      nodeEnv: process.env.NODE_ENV || config.build?.nodeEnv || 'production'
    },
    backup: {
      enabled: process.env.BACKUP_ENABLED === 'true' || config.backup?.enabled || false,
      path: process.env.BACKUP_PATH || config.backup?.path || './backups'
    }
  };
}

// Validation de la configuration
function validateConfig(config) {
  const required = ['host', 'user', 'password'];
  const missing = required.filter(field => !config.ftp[field]);
  
  if (missing.length > 0) {
    logError(`Configuration FTP manquante: ${missing.join(', ')}`);
    log('Créez un fichier .env avec:', 'yellow');
    log('FTP_HOST=your-host.com', 'yellow');
    log('FTP_USER=your-username', 'yellow');
    log('FTP_PASSWORD=your-password', 'yellow');
    log('FTP_REMOTE_PATH=/public_html', 'yellow');
    process.exit(1);
  }
}

// Build du projet
async function buildProject(config) {
  logStep('BUILD', 'Construction du projet...');
  
  try {
    const env = { ...process.env, NODE_ENV: config.build.nodeEnv };
    
    log('🔨 Installation des dépendances...', 'blue');
    execSync('npm ci', { stdio: 'inherit', env });
    
    log('🏗️  Construction du build de production...', 'blue');
    execSync('npm run build', { stdio: 'inherit', env });
    
    if (!fs.existsSync(config.build.buildPath)) {
      throw new Error(`Le dossier de build '${config.build.buildPath}' n'existe pas`);
    }
    
    logSuccess('Build terminé avec succès');
    
  } catch (error) {
    logError('Erreur lors du build:');
    console.error(error.message);
    process.exit(1);
  }
}

// Upload récursif de dossier
async function uploadDirectory(client, localPath, remotePath) {
  const items = fs.readdirSync(localPath, { withFileTypes: true });
  let uploadedCount = 0;
  
  for (const item of items) {
    const localItemPath = path.join(localPath, item.name);
    const remoteItemPath = path.posix.join(remotePath, item.name);
    
    if (item.isDirectory()) {
      // Créer le dossier distant
      try {
        await client.ensureDir(remoteItemPath);
        log(`📁 Dossier créé: ${remoteItemPath}`, 'cyan');
      } catch (error) {
        // Le dossier existe peut-être déjà
      }
      
      // Upload récursif
      uploadedCount += await uploadDirectory(client, localItemPath, remoteItemPath);
    } else {
      // Upload du fichier
      try {
        await client.uploadFrom(localItemPath, remoteItemPath);
        logSuccess(`📤 Uploadé: ${item.name}`);
        uploadedCount++;
      } catch (error) {
        logError(`❌ Erreur upload ${item.name}: ${error.message}`);
      }
    }
  }
  
  return uploadedCount;
}

// Déploiement FTP
async function deployToFTP(config) {
  logStep('DEPLOY', 'Déploiement via FTP...');
  
  const client = new Client();
  client.ftp.verbose = false; // Désactiver les logs verbeux
  
  log(`📡 Connexion à ${config.ftp.host}:${config.ftp.port}...`, 'blue');
  
  try {
    // Connexion au serveur FTP
    await client.access({
      host: config.ftp.host,
      port: config.ftp.port,
      user: config.ftp.user,
      password: config.ftp.password,
      secure: config.ftp.secure
    });
    
    logSuccess('✅ Connexion FTP établie');
    
    // Aller au dossier distant
    await client.ensureDir(config.ftp.remotePath);
    await client.cd(config.ftp.remotePath);
    
    log(`📁 Upload vers ${config.ftp.remotePath}...`, 'blue');
    
    // Upload de tous les fichiers
    const localPath = path.resolve(config.build.buildPath);
    const uploadedCount = await uploadDirectory(client, localPath, '.');
    
    logSuccess('🚀 Déploiement terminé avec succès!');
    log(`📊 Fichiers uploadés: ${uploadedCount}`, 'green');
    
  } catch (error) {
    logError('Erreur lors du déploiement FTP:');
    console.error(error.message);
    
    // Messages d'aide selon le type d'erreur
    if (error.message.includes('530')) {
      log('🔧 Erreur d\'authentification - vérifiez username/password', 'yellow');
    } else if (error.message.includes('timeout')) {
      log('🔧 Timeout - vérifiez l\'adresse du serveur', 'yellow');
    } else {
      log('🔧 Vérifiez vos credentials FTP et la connectivité', 'yellow');
    }
    
    process.exit(1);
  } finally {
    client.close();
  }
}

// Fonction principale
async function main() {
  try {
    log('🚀 DÉPLOIEMENT KSTORES-1', 'bright');
    log('================================', 'bright');
    
    const startTime = Date.now();
    
    // 1. Configuration
    const config = await getDeploymentConfig();
    validateConfig(config);
    
    log(`📋 Configuration:`, 'blue');
    log(`   • Serveur: ${config.ftp.host}:${config.ftp.port}`, 'blue');
    log(`   • Utilisateur: ${config.ftp.user}`, 'blue');
    log(`   • Dossier distant: ${config.ftp.remotePath}`, 'blue');
    log(`   • Build: ${config.build.buildPath}`, 'blue');
    
    // 2. Build
    await buildProject(config);
    
    // 3. Déploiement
    await deployToFTP(config);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    log('\n🎉 DÉPLOIEMENT RÉUSSI!', 'green');
    log(`⏱️  Durée totale: ${duration}s`, 'green');
    log('================================', 'bright');
    
  } catch (error) {
    logError('\n💥 ÉCHEC DU DÉPLOIEMENT');
    console.error(error);
    process.exit(1);
  }
}

// Gestion des arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  log('🚀 Script de déploiement Kstores-1', 'bright');
  log('', 'reset');
  log('Usage: npm run deploy [options]', 'blue');
  log('', 'reset');
  log('Configuration requise (.env):', 'yellow');
  log('  FTP_HOST=your-host.com', 'reset');
  log('  FTP_USER=your-username', 'reset');
  log('  FTP_PASSWORD=your-password', 'reset');
  log('  FTP_REMOTE_PATH=/public_html', 'reset');
  process.exit(0);
}

if (args.includes('--config')) {
  const config = await getDeploymentConfig();
  log('📋 Configuration actuelle:', 'blue');
  console.log(JSON.stringify({
    ...config,
    ftp: { ...config.ftp, password: '***' } // Masquer le mot de passe
  }, null, 2));
  process.exit(0);
}

// Lancer le déploiement
main();
