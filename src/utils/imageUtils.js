// Utilitaires pour la gestion des images et des métadonnées sociales
import { socialConfig } from '../config/socialConfig';
import { supabase } from '../lib/supabase';

/**
 * Génère une URL publique pour une image stockée dans Supabase Storage
 * @param {string} filePath - Chemin du fichier dans le bucket
 * @param {string} bucketName - Nom du bucket (défaut: 'product-media')
 * @returns {string} URL publique de l'image
 */
export const getSupabasePublicUrl = (filePath, bucketName = 'product-media') => {
  if (!filePath) return socialConfig.defaultImage;
  
  try {
    const { data } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  } catch (error) {
    console.warn('Erreur lors de la génération de l\'URL publique:', error);
    return socialConfig.defaultImage;
  }
};

/**
 * Valide et normalise une URL d'image pour les métadonnées sociales
 * @param {string} imageUrl - URL de l'image à valider
 * @param {string} fallbackUrl - URL de fallback (optionnelle)
 * @returns {string} URL d'image validée et normalisée
 */
export const normalizeImageUrl = (imageUrl, fallbackUrl = null) => {
  // Si pas d'URL, retourner l'image par défaut
  if (!imageUrl || imageUrl.trim() === '') {
    return fallbackUrl || socialConfig.defaultImage;
  }

  // Si l'URL est déjà absolue (commence par http), la retourner telle quelle
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  // Si l'URL est relative (commence par /), la convertir en URL absolue
  if (imageUrl.startsWith('/')) {
    return `${socialConfig.siteUrl}${imageUrl}`;
  }

  // Si c'est une URL Supabase Storage, s'assurer qu'elle est publique
  if (imageUrl.includes('supabase') || imageUrl.includes('storage')) {
    // Si l'URL contient déjà le domaine complet, la retourner
    if (imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    // Sinon, construire l'URL complète
    return imageUrl.startsWith('/') ? `${socialConfig.siteUrl}${imageUrl}` : `${socialConfig.siteUrl}/${imageUrl}`;
  }

  // Pour les autres cas (URLs relatives sans /), ajouter le domaine de base
  return `${socialConfig.siteUrl}/${imageUrl}`;
};

/**
 * Obtient la meilleure image disponible pour un produit
 * @param {Object} product - Objet produit
 * @returns {string} URL de la meilleure image disponible
 */
export const getBestProductImage = (product) => {
  if (!product) return socialConfig.defaultImage;

  // Liste des champs d'images par ordre de priorité
  const imageFields = [
    'image_url',
    'image_url1', 
    'image_url2',
    'image_url3',
    'image_url4'
  ];

  // Trouver la première image valide
  for (const field of imageFields) {
    const imageUrl = product[field];
    if (imageUrl && imageUrl.trim() !== '') {
      // Si c'est un chemin de fichier Supabase Storage (sans domaine)
      if (!imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
        // Générer une URL publique Supabase
        return getSupabasePublicUrl(imageUrl);
      }
      
      // Normaliser l'URL pour s'assurer qu'elle est accessible publiquement
      const normalizedUrl = normalizeImageUrl(imageUrl);
      
      // Vérifier si c'est une URL Supabase Storage et s'assurer qu'elle est publique
      if (normalizedUrl.includes('supabase') && normalizedUrl.includes('storage')) {
        // S'assurer que l'URL est publique (pas de token d'authentification)
        return normalizedUrl.split('?')[0]; // Enlever les paramètres de query
      }
      
      return normalizedUrl;
    }
  }

  // Si aucune image trouvée, retourner l'image par défaut
  return socialConfig.defaultImage;
};

/**
 * Valide qu'une image est accessible pour les métadonnées sociales
 * @param {string} imageUrl - URL de l'image à valider
 * @returns {Promise<boolean>} True si l'image est accessible
 */
export const validateImageUrl = async (imageUrl) => {
  if (!imageUrl || !imageUrl.startsWith('http')) {
    return false;
  }

  try {
    const response = await fetch(imageUrl, { method: 'HEAD' });
    return response.ok && response.headers.get('content-type')?.startsWith('image/');
  } catch (error) {
    console.warn('Image validation failed:', error);
    return false;
  }
};

/**
 * Génère les dimensions optimales pour une image sociale
 * @param {number} width - Largeur originale
 * @param {number} height - Hauteur originale
 * @returns {Object} Dimensions optimisées pour les réseaux sociaux
 */
export const getSocialImageDimensions = (width, height) => {
  // Dimensions recommandées pour Open Graph
  const targetRatio = 1.91; // 1200x630
  const maxWidth = 1200;
  const maxHeight = 630;

  // Si pas de dimensions fournies, utiliser les valeurs par défaut
  if (!width || !height) {
    return {
      width: maxWidth,
      height: maxHeight
    };
  }

  const currentRatio = width / height;

  // Calculer les nouvelles dimensions en respectant le ratio optimal
  let newWidth, newHeight;

  if (currentRatio > targetRatio) {
    // Image trop large, ajuster la hauteur
    newHeight = Math.min(height, maxHeight);
    newWidth = Math.round(newHeight * targetRatio);
  } else {
    // Image trop haute, ajuster la largeur
    newWidth = Math.min(width, maxWidth);
    newHeight = Math.round(newWidth / targetRatio);
  }

  return {
    width: Math.min(newWidth, maxWidth),
    height: Math.min(newHeight, maxHeight)
  };
};

/**
 * Génère un texte alt descriptif pour une image de produit
 * @param {Object} product - Objet produit
 * @param {Object} category - Objet catégorie (optionnel)
 * @returns {string} Texte alt descriptif
 */
export const generateProductImageAlt = (product, category = null) => {
  if (!product) return 'Image de produit';

  let alt = product.name;
  
  if (category && category.name) {
    alt += ` - ${category.name}`;
  }
  
  alt += ` | ${socialConfig.siteName}`;
  
  return alt;
};

/**
 * Génère un ensemble complet de métadonnées d'image pour les réseaux sociaux
 * @param {Object} product - Objet produit
 * @param {Object} category - Objet catégorie (optionnel)
 * @returns {Object} Métadonnées d'image complètes
 */
export const generateImageMetadata = (product, category = null) => {
  const imageUrl = getBestProductImage(product);
  const dimensions = getSocialImageDimensions(socialConfig.defaultImageWidth, socialConfig.defaultImageHeight);
  const alt = generateProductImageAlt(product, category);

  // Déterminer le type d'image basé sur l'URL
  let imageType = 'image/png'; // Type par défaut
  if (imageUrl.includes('.jpg') || imageUrl.includes('.jpeg')) {
    imageType = 'image/jpeg';
  } else if (imageUrl.includes('.webp')) {
    imageType = 'image/webp';
  } else if (imageUrl.includes('.gif')) {
    imageType = 'image/gif';
  }

  return {
    url: imageUrl,
    alt: alt,
    width: dimensions.width,
    height: dimensions.height,
    type: imageType
  };
};
