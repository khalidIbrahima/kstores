#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupEnv() {
  log('🔧 Configuration FTP pour le déploiement', 'bright');
  log('=========================================', 'bright');
  log('', 'reset');
  
  const envPath = path.join(__dirname, '../.env');
  
  if (fs.existsSync(envPath)) {
    log('⚠️  Le fichier .env existe déjà', 'yellow');
    const overwrite = await question('Voulez-vous le remplacer ? (y/N): ');
    if (overwrite.toLowerCase() !== 'y' && overwrite.toLowerCase() !== 'yes') {
      log('❌ Configuration annulée', 'yellow');
      rl.close();
      return;
    }
  }
  
  log('📝 Veuillez entrer vos informations FTP:', 'blue');
  log('', 'reset');
  
  const ftpHost = await question('🌐 Host FTP (ex: ftp.votre-domaine.com): ');
  const ftpUser = await question('👤 Nom d\'utilisateur FTP: ');
  const ftpPassword = await question('🔐 Mot de passe FTP: ');
  const ftpRemotePath = await question('📁 Chemin distant (ex: /public_html): ') || '/public_html';
  const ftpPort = await question('🔌 Port FTP (défaut: 21): ') || '21';
  
  const envContent = `# FTP Deployment Configuration
# Généré automatiquement le ${new Date().toLocaleString('fr-FR')}

# Configuration FTP (Obligatoire)
FTP_HOST=${ftpHost}
FTP_PORT=${ftpPort}
FTP_USER=${ftpUser}
FTP_PASSWORD=${ftpPassword}
FTP_REMOTE_PATH=${ftpRemotePath}

# Configuration optionnelle
FTP_SECURE=false
FTP_TIMEOUT=30000

# Build Configuration
BUILD_PATH=dist
NODE_ENV=production

# Backup Configuration
BACKUP_ENABLED=true
BACKUP_PATH=./backups
`;

  try {
    fs.writeFileSync(envPath, envContent);
    log('', 'reset');
    log('✅ Fichier .env créé avec succès!', 'green');
    log('', 'reset');
    log('🚀 Vous pouvez maintenant déployer avec:', 'cyan');
    log('   npm run build:deploy', 'bright');
    log('', 'reset');
    log('📋 Autres commandes utiles:', 'blue');
    log('   npm run deploy:config  # Voir la configuration', 'reset');
    log('   npm run deploy:help    # Aide détaillée', 'reset');
    
  } catch (error) {
    log('❌ Erreur lors de la création du fichier .env:', 'red');
    console.error(error.message);
  }
  
  rl.close();
}

setupEnv();
