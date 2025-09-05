import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { getBestProductImage, generateImageMetadata } from '../utils/imageUtils';

/**
 * Composant pour injecter les métadonnées côté serveur
 * Ce composant utilise une approche différente pour s'assurer que les métadonnées
 * sont présentes dans le HTML initial
 */
const ServerSideMeta = ({ 
  product = null, 
  category = null, 
  pageType = 'general',
  title = null,
  description = null,
  image = null,
  url = null
}) => {
  // Générer les métadonnées
  const generateMetaData = () => {
    const baseUrl = window.location.origin;
    const currentUrl = url || window.location.href;
    
    switch (pageType) {
      case 'product':
        if (product) {
          const imageMetadata = generateImageMetadata(product, category);
          const publicImageUrl = imageMetadata.url;
          
          return {
            title: `${product.name} - Kapital Stores`,
            description: product.description?.substring(0, 160) || `Découvrez ${product.name} sur Kapital Stores`,
            image: publicImageUrl,
            url: currentUrl,
            type: 'product',
            keywords: `${product.name}, ${product.categories?.name || ''}, boutique en ligne, Kapital Stores`
          };
        }
        break;
        
      case 'products':
        return {
          title: 'Tous nos produits - Kapital Stores',
          description: 'Découvrez notre catalogue complet de produits technologiques. Smartphones, ordinateurs, accessoires et plus.',
          image: 'https://kapital-stores.shop/src/assets/logo-transparent.png',
          url: currentUrl,
          type: 'website',
          keywords: 'produits, catalogue, boutique en ligne, tech, électronique, Kapital Stores'
        };
        
      case 'home':
        return {
          title: 'Kapital Stores - Boutique en ligne de produits technologiques',
          description: 'Découvrez notre sélection de produits technologiques : smartphones, ordinateurs, accessoires gaming et plus. Livraison rapide, prix compétitifs.',
          image: 'https://kapital-stores.shop/src/assets/logo-transparent.png',
          url: currentUrl,
          type: 'website',
          keywords: 'boutique en ligne, produits technologiques, smartphones, ordinateurs, accessoires, livraison rapide, Kapital Stores'
        };
        
      default:
        return {
          title: title || 'Kapital Stores',
          description: description || 'Boutique en ligne Kapital Stores - Produits tech, électronique et plus. Livraison rapide, prix bas, qualité garantie.',
          image: image || 'https://kapital-stores.shop/src/assets/logo-transparent.png',
          url: currentUrl,
          type: 'website',
          keywords: 'boutique en ligne, produits tech, électronique, livraison rapide, Kapital Stores'
        };
    }
  };

  const metaData = generateMetaData();
  
  // Forcer la mise à jour des métadonnées dans le head
  useEffect(() => {
    // Mettre à jour le titre de la page
    document.title = metaData.title;
    
    // Mettre à jour les métadonnées Open Graph
    updateMetaTag('og:title', metaData.title);
    updateMetaTag('og:description', metaData.description);
    updateMetaTag('og:image', metaData.image);
    updateMetaTag('og:url', metaData.url);
    updateMetaTag('og:type', metaData.type);
    
    // Mettre à jour les métadonnées Twitter
    updateMetaTag('twitter:title', metaData.title);
    updateMetaTag('twitter:description', metaData.description);
    updateMetaTag('twitter:image', metaData.image);
    
    // Mettre à jour la description
    updateMetaTag('description', metaData.description);
    updateMetaTag('keywords', metaData.keywords);
    
  }, [product, category, pageType, title, description, image, url]);

  return (
    <Helmet>
      {/* Meta Tags de base */}
      <title>{metaData.title}</title>
      <meta name="description" content={metaData.description} />
      <meta name="keywords" content={metaData.keywords} />
      <meta name="author" content="Kapital Stores" />
      <meta name="robots" content="index, follow" />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={metaData.type} />
      <meta property="og:title" content={metaData.title} />
      <meta property="og:description" content={metaData.description} />
      <meta property="og:image" content={metaData.image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={`${metaData.title} | Kapital Stores`} />
      <meta property="og:url" content={metaData.url} />
      <meta property="og:site_name" content="Kapital Stores" />
      <meta property="og:locale" content="fr_FR" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={metaData.title} />
      <meta name="twitter:description" content={metaData.description} />
      <meta name="twitter:image" content={metaData.image} />
      <meta name="twitter:image:alt" content={`${metaData.title} | Kapital Stores`} />
      <meta name="twitter:site" content="@kapital_stores" />
      <meta name="twitter:creator" content="@kapital_stores" />
      
      {/* LinkedIn et autres plateformes */}
      <meta property="og:image:secure_url" content={metaData.image} />
      <meta property="og:image:type" content="image/png" />
      
      {/* URL canonique */}
      <link rel="canonical" href={metaData.url} />
      
      {/* Données structurées pour les produits */}
      {pageType === 'product' && product && (
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            "name": product.name,
            "description": product.description,
            "image": metaData.image,
            "url": metaData.url,
            "sku": product.id,
            "brand": {
              "@type": "Brand",
              "name": "Kapital Stores"
            },
            "offers": {
              "@type": "Offer",
              "price": product.price,
              "priceCurrency": "XOF",
              "availability": product.inventory > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
              "seller": {
                "@type": "Organization",
                "name": "Kapital Stores"
              }
            },
            "category": product.categories?.name || "Produit"
          })}
        </script>
      )}
    </Helmet>
  );
};

/**
 * Fonction utilitaire pour mettre à jour les métadonnées dans le head
 */
function updateMetaTag(property, content) {
  // Mettre à jour les balises meta existantes
  const existingTag = document.querySelector(`meta[property="${property}"], meta[name="${property}"]`);
  if (existingTag) {
    existingTag.setAttribute('content', content);
  } else {
    // Créer une nouvelle balise meta si elle n'existe pas
    const meta = document.createElement('meta');
    if (property.startsWith('og:') || property.startsWith('twitter:')) {
      meta.setAttribute('property', property);
    } else {
      meta.setAttribute('name', property);
    }
    meta.setAttribute('content', content);
    document.head.appendChild(meta);
  }
}

export default ServerSideMeta;

