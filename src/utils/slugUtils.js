/**
 * Utilitaires pour la génération et gestion des slugs
 * Rendent les URLs plus lisibles et SEO-friendly
 */

/**
 * Génère un slug à partir d'un texte
 * @param {string} text - Texte à convertir en slug
 * @returns {string} Slug généré
 */
export const generateSlug = (text) => {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text
    .toString()
    .toLowerCase()
    .trim()
    // Remplacer les caractères spéciaux français
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ýÿ]/g, 'y')
    .replace(/[ñ]/g, 'n')
    .replace(/[ç]/g, 'c')
    .replace(/[œ]/g, 'oe')
    .replace(/[æ]/g, 'ae')
    // Remplacer les espaces et caractères spéciaux par des tirets
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    // Supprimer les tirets au début et à la fin
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

/**
 * Génère un slug unique pour un produit
 * @param {string} productName - Nom du produit
 * @param {string} productId - ID du produit (pour garantir l'unicité)
 * @returns {string} Slug unique
 */
export const generateProductSlug = (productName, productId = null) => {
  const baseSlug = generateSlug(productName);
  
  if (!baseSlug) {
    return productId ? `produit-${productId.slice(0, 8)}` : 'produit';
  }

  // Limiter la longueur du slug à 50 caractères
  const truncatedSlug = baseSlug.substring(0, 50).replace(/-$/, '');
  
  // Ajouter un court suffixe basé sur l'ID pour garantir l'unicité
  if (productId) {
    const shortId = productId.slice(-8);
    return `${truncatedSlug}-${shortId}`;
  }
  
  return truncatedSlug;
};

/**
 * Génère un slug pour une catégorie
 * @param {string} categoryName - Nom de la catégorie
 * @returns {string} Slug de la catégorie
 */
export const generateCategorySlug = (categoryName) => {
  const slug = generateSlug(categoryName);
  return slug || 'categorie';
};

/**
 * Valide qu'un slug respecte les bonnes pratiques
 * @param {string} slug - Slug à valider
 * @returns {boolean} True si le slug est valide
 */
export const isValidSlug = (slug) => {
  if (!slug || typeof slug !== 'string') {
    return false;
  }
  
  // Un slug valide :
  // - Contient uniquement des lettres minuscules, chiffres et tirets
  // - Ne commence ni ne finit par un tiret
  // - N'a pas de tirets consécutifs
  // - Fait entre 1 et 100 caractères
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug) && slug.length >= 1 && slug.length <= 100;
};

/**
 * Nettoie un slug existant pour qu'il respecte les bonnes pratiques
 * @param {string} slug - Slug à nettoyer
 * @returns {string} Slug nettoyé
 */
export const cleanSlug = (slug) => {
  if (!slug || typeof slug !== 'string') {
    return '';
  }
  
  return generateSlug(slug);
};

/**
 * Convertit une URL avec slug vers une URL avec ID et vice versa
 */
export const urlUtils = {
  /**
   * Extrait l'ID depuis un slug de produit (format: nom-produit-12345678)
   * @param {string} slug - Slug du produit
   * @returns {string|null} ID extrait ou null
   */
  extractIdFromProductSlug: (slug) => {
    if (!slug || typeof slug !== 'string') {
      return null;
    }
    
    // Chercher le pattern d'ID à la fin du slug (8 caractères alphanumériques)
    const match = slug.match(/-([a-f0-9]{8})$/);
    return match ? match[1] : null;
  },

  /**
   * Convertit un slug en ID complet (ajoute les tirets UUID)
   * @param {string} shortId - ID court (8 caractères)
   * @returns {string|null} UUID complet ou null
   */
  expandShortId: (shortId) => {
    if (!shortId || shortId.length !== 8) {
      return null;
    }
    
    // Note: Cette fonction nécessiterait une recherche en base de données
    // pour convertir l'ID court en UUID complet
    return shortId;
  },

  /**
   * Génère une URL de produit avec slug
   * @param {Object} product - Objet produit
   * @returns {string} URL avec slug
   */
  generateProductUrl: (product) => {
    if (!product) return '/products';
    
    const slug = product.slug || generateProductSlug(product.name, product.id);
    return `/product/${slug}`;
  },

  /**
   * Génère une URL de catégorie avec slug
   * @param {Object} category - Objet catégorie
   * @returns {string} URL avec slug
   */
  generateCategoryUrl: (category) => {
    if (!category) return '/categories';
    
    const slug = category.slug || generateCategorySlug(category.name);
    return `/category/${slug}`;
  }
};

/**
 * Exemples d'utilisation :
 * 
 * generateSlug("iPhone 15 Pro Max 256GB") 
 * // → "iphone-15-pro-max-256gb"
 * 
 * generateProductSlug("MacBook Air M2", "abc123def456") 
 * // → "macbook-air-m2-def456"
 * 
 * urlUtils.extractIdFromProductSlug("iphone-15-pro-max-def456")
 * // → "def456"
 */

export default {
  generateSlug,
  generateProductSlug,
  generateCategorySlug,
  isValidSlug,
  cleanSlug,
  urlUtils
};
