import { supabase } from '../lib/supabase';
import { socialConfig } from '../config/socialConfig';
import { getBestProductImage } from '../utils/imageUtils';

/**
 * Service pour précharger les métadonnées des produits populaires
 * Améliore les performances des aperçus sociaux
 */
class MetaPreloadService {
  constructor() {
    this.cache = new Map();
    this.preloadInterval = null;
  }

  /**
   * Démarre le service de préchargement
   */
  start() {
    // Précharger immédiatement
    this.preloadPopularProducts();
    
    // Ensuite précharger toutes les 30 minutes
    this.preloadInterval = setInterval(() => {
      this.preloadPopularProducts();
    }, 30 * 60 * 1000);
  }

  /**
   * Arrête le service de préchargement
   */
  stop() {
    if (this.preloadInterval) {
      clearInterval(this.preloadInterval);
      this.preloadInterval = null;
    }
  }

  /**
   * Précharge les métadonnées des produits populaires
   */
  async preloadPopularProducts() {
    try {
      // Récupérer les produits populaires (les plus vus ou les plus récents)
      const { data: products, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          description,
          price,
          image_url,
          image_url1,
          image_url2,
          image_url3,
          image_url4,
          stock,
          categories(name, slug)
        `)
        .eq('isActive', true)
        .order('created_at', { ascending: false })
        .limit(50); // Précharger les 50 produits les plus récents

      if (error) {
        console.warn('Erreur lors du préchargement des métadonnées:', error);
        return;
      }

      // Mettre en cache les métadonnées de chaque produit
      for (const product of products) {
        this.cacheProductMeta(product);
      }

      console.log(`Métadonnées préchargées pour ${products.length} produits`);
    } catch (error) {
      console.error('Erreur lors du préchargement:', error);
    }
  }

  /**
   * Met en cache les métadonnées d'un produit
   */
  cacheProductMeta(product) {
    const productImage = getBestProductImage(product);
    const category = product.categories;

    const metaData = {
      title: `${product.name} - ${socialConfig.siteName}`,
      description: product.description?.substring(0, 160) || `Découvrez ${product.name} sur ${socialConfig.siteName}`,
      image: productImage,
      url: `${socialConfig.siteUrl}/product/${product.id}`,
      keywords: `${product.name}, ${category?.name || ''}, produits tech, ${socialConfig.defaultMeta.keywords}`,
      type: 'product',
      structuredData: {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": product.name,
        "description": product.description,
        "image": productImage,
        "url": `${socialConfig.siteUrl}/product/${product.id}`,
        "brand": {
          "@type": "Brand",
          "name": socialConfig.siteName
        },
        "offers": {
          "@type": "Offer",
          "price": product.price,
          "priceCurrency": "XOF",
          "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
        }
      }
    };

    this.cache.set(`product:${product.id}`, metaData);
  }

  /**
   * Récupère les métadonnées en cache pour un produit
   */
  getCachedProductMeta(productId) {
    return this.cache.get(`product:${productId}`);
  }

  /**
   * Précharge les métadonnées pour une catégorie
   */
  async preloadCategoryMeta(categorySlug) {
    try {
      const { data: category, error } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', categorySlug)
        .single();

      if (!error && category) {
        const metaData = {
          title: `${category.name} - ${socialConfig.siteName}`,
          description: category.description?.substring(0, 160) || `Découvrez notre sélection de ${category.name} sur ${socialConfig.siteName}`,
          image: category.image_url || socialConfig.defaultImage,
          url: `${socialConfig.siteUrl}/category/${categorySlug}`,
          keywords: `${category.name}, produits, boutique en ligne, ${socialConfig.defaultMeta.keywords}`,
          type: 'website'
        };

        this.cache.set(`category:${categorySlug}`, metaData);
        return metaData;
      }
    } catch (error) {
      console.error('Erreur lors du préchargement de la catégorie:', error);
    }
    return null;
  }

  /**
   * Récupère les métadonnées en cache pour une catégorie
   */
  getCachedCategoryMeta(categorySlug) {
    return this.cache.get(`category:${categorySlug}`);
  }

  /**
   * Vide le cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Retourne les statistiques du cache
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      products: Array.from(this.cache.keys()).filter(key => key.startsWith('product:')).length,
      categories: Array.from(this.cache.keys()).filter(key => key.startsWith('category:')).length
    };
  }
}

// Instance singleton
export const metaPreloadService = new MetaPreloadService();

export default MetaPreloadService;
