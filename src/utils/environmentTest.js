/**
 * Fichier de test pour les utilitaires d'environnement
 * Ce fichier peut être supprimé en production
 */

import { isProduction, isDevelopment, getEnvironment, devLog } from './environment';

// Test des fonctions d'environnement
export const testEnvironmentUtils = () => {
  console.log('=== TEST DES UTILITAIRES D\'ENVIRONNEMENT ===');
  
  console.log('Environment actuel:', getEnvironment());
  console.log('Est en production:', isProduction());
  console.log('Est en développement:', isDevelopment());
  console.log('Hostname:', window.location.hostname);
  console.log('NODE_ENV:', import.meta.env.NODE_ENV);
  console.log('VITE_NODE_ENV:', import.meta.env.VITE_NODE_ENV);
  
  devLog('Ce message ne s\'affiche qu\'en développement');
  
  if (isProduction()) {
    console.log('✅ Analytics activés (Production)');
  } else {
    console.log('🚫 Analytics désactivés (Développement)');
  }
  
  console.log('=== FIN DU TEST ===');
};

// Exécuter le test automatiquement en développement
if (isDevelopment()) {
  // Attendre que le DOM soit chargé
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', testEnvironmentUtils);
  } else {
    testEnvironmentUtils();
  }
}
