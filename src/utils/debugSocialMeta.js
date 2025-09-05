// Utilitaire de debug pour les métadonnées sociales
import { getBestProductImage, generateImageMetadata } from './imageUtils';

/**
 * Debug les métadonnées sociales d'un produit
 * @param {Object} product - Objet produit
 * @param {Object} category - Objet catégorie (optionnel)
 */
export const debugProductSocialMeta = (product, category = null) => {
  console.group('🔍 Debug Métadonnées Sociales - Produit');
  
  console.log('📦 Produit:', product?.name);
  console.log('🏷️ Catégorie:', category?.name || 'Non définie');
  
  // Tester les URLs d'images
  const imageFields = ['image_url', 'image_url1', 'image_url2', 'image_url3', 'image_url4'];
  console.log('🖼️ Images disponibles:');
  imageFields.forEach(field => {
    const imageUrl = product?.[field];
    if (imageUrl) {
      console.log(`  ${field}:`, imageUrl);
    }
  });
  
  // Tester la fonction getBestProductImage
  const bestImage = getBestProductImage(product);
  console.log('⭐ Meilleure image:', bestImage);
  
  // Tester generateImageMetadata
  const imageMetadata = generateImageMetadata(product, category);
  console.log('📊 Métadonnées d\'image:', imageMetadata);
  
  // Vérifier l'accessibilité de l'image
  if (bestImage && bestImage !== 'https://kapital-stores.shop/src/assets/logo-transparent.png') {
    console.log('🔗 Test d\'accessibilité de l\'image...');
    fetch(bestImage, { method: 'HEAD' })
      .then(response => {
        if (response.ok) {
          console.log('✅ Image accessible:', response.status);
          console.log('📏 Content-Type:', response.headers.get('content-type'));
          console.log('📦 Content-Length:', response.headers.get('content-length'));
        } else {
          console.log('❌ Image non accessible:', response.status);
        }
      })
      .catch(error => {
        console.log('❌ Erreur de test:', error.message);
      });
  }
  
  console.groupEnd();
};

/**
 * Génère un aperçu des métadonnées Open Graph
 * @param {Object} product - Objet produit
 * @param {Object} category - Objet catégorie (optionnel)
 */
export const generateOpenGraphPreview = (product, category = null) => {
  const imageMetadata = generateImageMetadata(product, category);
  
  return {
    title: `${product?.name} - Kapital Stores`,
    description: product?.description?.substring(0, 160) || `Découvrez ${product?.name} sur Kapital Stores`,
    image: imageMetadata.url,
    url: window.location.href,
    type: 'product',
    siteName: 'Kapital Stores',
    locale: 'fr_FR'
  };
};

/**
 * Teste les métadonnées sur les outils de validation
 * @param {string} url - URL à tester
 */
export const testSocialMetaValidation = (url = window.location.href) => {
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
  
  console.group('🔧 Outils de Validation des Métadonnées');
  validators.forEach(validator => {
    console.log(`${validator.name}:`, validator.url);
  });
  console.groupEnd();
  
  return validators;
};

