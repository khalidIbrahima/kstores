/**
 * Utilitaires pour gérer l'environnement de l'application
 */

/**
 * Vérifie si l'application est en environnement de production
 * @returns {boolean} true si en production, false sinon
 */
export const isProduction = () => {
  // Vérifier NODE_ENV d'abord
  if (import.meta.env.NODE_ENV === 'production') {
    return true;
  }
  
  // Vérifier VITE_NODE_ENV comme alternative
  if (import.meta.env.VITE_NODE_ENV === 'production') {
    return true;
  }
  
  // Vérifier les domaines de production connus
  const hostname = window.location.hostname;
  const productionDomains = [
    'kstores.netlify.app',
    'kapital-stores.shop',
    'votre-domaine-prod.com' // Ajouter ici vos domaines de production
  ];
  
  return productionDomains.includes(hostname);
};

/**
 * Vérifie si l'application est en environnement de développement
 * @returns {boolean} true si en développement, false sinon
 */
export const isDevelopment = () => {
  return !isProduction() && (
    import.meta.env.NODE_ENV === 'development' ||
    import.meta.env.VITE_NODE_ENV === 'development' ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.includes('3000') ||
    window.location.hostname.includes('3001') ||
    window.location.hostname.includes('3002')
  );
};

/**
 * Obtient l'environnement actuel sous forme de chaîne
 * @returns {string} 'production', 'development', ou 'unknown'
 */
export const getEnvironment = () => {
  if (isProduction()) return 'production';
  if (isDevelopment()) return 'development';
  return 'unknown';
};

/**
 * Log conditionnel basé sur l'environnement
 * @param {string} message - Message à logger
 * @param {any} data - Données à logger (optionnel)
 */
export const devLog = (message, data = null) => {
  if (isDevelopment()) {
    if (data) {
      console.log(`[DEV] ${message}`, data);
    } else {
      console.log(`[DEV] ${message}`);
    }
  }
};

/**
 * Avertissement conditionnel basé sur l'environnement
 * @param {string} message - Message d'avertissement
 * @param {any} data - Données à logger (optionnel)
 */
export const devWarn = (message, data = null) => {
  if (isDevelopment()) {
    if (data) {
      console.warn(`[DEV] ${message}`, data);
    } else {
      console.warn(`[DEV] ${message}`);
    }
  }
};
