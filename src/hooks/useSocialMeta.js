import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { socialConfig } from '../config/socialConfig';
import { getBestProductImage, normalizeImageUrl } from '../utils/imageUtils';
import { metaPreloadService } from '../services/metaPreloadService';
import { urlUtils } from '../utils/slugUtils';

/**
 * Hook pour gérer les métadonnées sociales dynamiques
 * Améliore les aperçus de liens pour les réseaux sociaux
 */
export const useSocialMeta = () => {
  const location = useLocation();

  useEffect(() => {
    // Fonction pour mettre à jour les métadonnées en temps réel
    const updateMetaTags = (metaData) => {
      // Mise à jour du titre de la page
      document.title = metaData.title;

      // Fonction helper pour mettre à jour ou créer une balise meta
      const updateMetaTag = (property, content, isProperty = false) => {
        const selector = isProperty ? `meta[property="${property}"]` : `meta[name="${property}"]`;
        let tag = document.querySelector(selector);
        
        if (!tag) {
          tag = document.createElement('meta');
          if (isProperty) {
            tag.setAttribute('property', property);
          } else {
            tag.setAttribute('name', property);
          }
          document.head.appendChild(tag);
        }
        
        tag.setAttribute('content', content);
      };

      // Mise à jour des métadonnées de base
      updateMetaTag('description', metaData.description);
      updateMetaTag('keywords', metaData.keywords);

      // Mise à jour des métadonnées Open Graph
      updateMetaTag('og:title', metaData.title, true);
      updateMetaTag('og:description', metaData.description, true);
      updateMetaTag('og:image', metaData.image, true);
      updateMetaTag('og:url', metaData.url, true);
      updateMetaTag('og:site_name', socialConfig.siteName, true);
      updateMetaTag('og:type', metaData.type || 'website', true);

      // Mise à jour des métadonnées Twitter
      updateMetaTag('twitter:title', metaData.title);
      updateMetaTag('twitter:description', metaData.description);
      updateMetaTag('twitter:image', metaData.image);
      updateMetaTag('twitter:card', 'summary_large_image');

      // Mise à jour de l'URL canonique
      let canonicalLink = document.querySelector('link[rel="canonical"]');
      if (!canonicalLink) {
        canonicalLink = document.createElement('link');
        canonicalLink.setAttribute('rel', 'canonical');
        document.head.appendChild(canonicalLink);
      }
      canonicalLink.setAttribute('href', metaData.url);
    };

    // Détecter le type de page et charger les métadonnées appropriées
    const loadPageMetadata = async () => {
      const path = location.pathname;
      const currentUrl = `${window.location.origin}${path}`;

      try {
        // Page produit
        if (path.startsWith('/product/')) {
          const idOrSlug = path.split('/')[2];
          
          // Déterminer si c'est un UUID ou un slug
          const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
          let productId = idOrSlug;
          
          // Si c'est un slug, essayer d'extraire l'ID
          if (!isUUID) {
            const extractedId = urlUtils.extractIdFromProductSlug(idOrSlug);
            if (extractedId) {
              productId = extractedId;
            }
          }
          
          // Essayer d'abord le cache
          let cachedMeta = metaPreloadService.getCachedProductMeta(productId);
          
          if (cachedMeta) {
            // Utiliser les métadonnées du cache
            updateMetaTags(cachedMeta);
            
            // Ajouter les données structurées
            let structuredDataScript = document.querySelector('script[type="application/ld+json"]#product-data');
            if (!structuredDataScript) {
              structuredDataScript = document.createElement('script');
              structuredDataScript.type = 'application/ld+json';
              structuredDataScript.id = 'product-data';
              document.head.appendChild(structuredDataScript);
            }
            structuredDataScript.textContent = JSON.stringify(cachedMeta.structuredData);
            return;
          }
          
          // Si pas en cache, charger depuis la base de données
          let productQuery;
          
          if (isUUID) {
            // Recherche directe par ID
            productQuery = supabase
              .from('products')
              .select(`
                *,
                categories(name, slug)
              `)
              .eq('id', idOrSlug);
          } else {
            // Recherche par slug
            productQuery = supabase
              .from('products')
              .select(`
                *,
                categories(name, slug)
              `)
              .eq('slug', idOrSlug);
          }
          
          let { data: product, error } = await productQuery.single();
          
          // Si pas trouvé et c'est un slug, essayer la recherche par ID partiel
          if (error && !isUUID && productId !== idOrSlug) {
            const { data: products, error: searchError } = await supabase
              .from('products')
              .select(`
                *,
                categories(name, slug)
              `)
              .ilike('id', `%${productId}`);
            
            if (!searchError && products && products.length > 0) {
              product = products[0];
              error = null;
            }
          }

          if (!error && product) {
            const productImage = getBestProductImage(product);
            const category = product.categories;
            
            updateMetaTags({
              title: `${product.name} - ${socialConfig.siteName}`,
              description: product.description?.substring(0, 160) || `Découvrez ${product.name} sur ${socialConfig.siteName}`,
              image: productImage,
              url: currentUrl,
              keywords: `${product.name}, ${category?.name || ''}, produits tech, ${socialConfig.defaultMeta.keywords}`,
              type: 'product'
            });

            // Ajouter les données structurées pour le produit
            const structuredData = {
              "@context": "https://schema.org",
              "@type": "Product",
              "name": product.name,
              "description": product.description,
              "image": productImage,
              "url": currentUrl,
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
            };

            // Mettre à jour ou créer le script de données structurées
            let structuredDataScript = document.querySelector('script[type="application/ld+json"]#product-data');
            if (!structuredDataScript) {
              structuredDataScript = document.createElement('script');
              structuredDataScript.type = 'application/ld+json';
              structuredDataScript.id = 'product-data';
              document.head.appendChild(structuredDataScript);
            }
            structuredDataScript.textContent = JSON.stringify(structuredData);
            
            // Mettre en cache pour les prochaines fois
            metaPreloadService.cacheProductMeta(product);
          }
        }
        // Page catégorie
        else if (path.startsWith('/category/')) {
          const categorySlug = path.split('/')[2];
          
          // Essayer d'abord le cache
          let cachedMeta = metaPreloadService.getCachedCategoryMeta(categorySlug);
          
          if (cachedMeta) {
            updateMetaTags(cachedMeta);
            return;
          }
          
          // Si pas en cache, charger depuis la base de données
          const { data: category, error } = await supabase
            .from('categories')
            .select('*')
            .eq('slug', categorySlug)
            .single();

          if (!error && category) {
            const categoryImage = normalizeImageUrl(category.image_url);
            
            updateMetaTags({
              title: `${category.name} - ${socialConfig.siteName}`,
              description: category.description?.substring(0, 160) || `Découvrez notre sélection de ${category.name} sur ${socialConfig.siteName}`,
              image: categoryImage,
              url: currentUrl,
              keywords: `${category.name}, produits, boutique en ligne, ${socialConfig.defaultMeta.keywords}`,
              type: 'website'
            });
          }
        }
        // Page d'accueil
        else if (path === '/') {
          updateMetaTags({
            title: `${socialConfig.siteName} - Boutique en ligne de produits technologiques`,
            description: socialConfig.siteDescription,
            image: socialConfig.defaultImage,
            url: currentUrl,
            keywords: socialConfig.defaultMeta.keywords,
            type: 'website'
          });
        }
        // Pages produits (liste)
        else if (path === '/products') {
          updateMetaTags({
            title: `Tous nos produits - ${socialConfig.siteName}`,
            description: "Découvrez notre catalogue complet de produits technologiques. Smartphones, ordinateurs, accessoires et plus.",
            image: socialConfig.defaultImage,
            url: currentUrl,
            keywords: "produits, catalogue, boutique en ligne, tech, électronique",
            type: 'website'
          });
        }
      } catch (error) {
        console.error('Erreur lors du chargement des métadonnées:', error);
        
        // Fallback vers les métadonnées par défaut
        updateMetaTags({
          title: socialConfig.siteName,
          description: socialConfig.siteDescription,
          image: socialConfig.defaultImage,
          url: currentUrl,
          keywords: socialConfig.defaultMeta.keywords,
          type: 'website'
        });
      }
    };

    // Charger les métadonnées quand la route change
    loadPageMetadata();
  }, [location]);

  return null;
};

export default useSocialMeta;
