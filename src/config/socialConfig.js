// Configuration des métadonnées sociales pour KStores
export const socialConfig = {
  // Informations de base
  siteName: 'KStores',
  siteUrl: 'https://kstores.com',
  siteDescription: 'Boutique en ligne KStores - Produits tech, électronique et plus. Livraison rapide, prix bas, qualité garantie.',
  
  // Images par défaut
  defaultImage: '/src/assets/logo-transparent.png',
  defaultImageWidth: 1200,
  defaultImageHeight: 630,
  
  // Réseaux sociaux
  socialMedia: {
    facebook: {
      url: 'https://facebook.com/kstores',
      username: '@kstores'
    },
    twitter: {
      url: 'https://twitter.com/kstores',
      username: '@kstores'
    },
    instagram: {
      url: 'https://instagram.com/kstores',
      username: '@kstores'
    },
    youtube: {
      url: 'https://youtube.com/kstores',
      username: '@kstores'
    }
  },
  
  // Contact
  contact: {
    email: 'contact@kstores.com',
    phone: '+1-555-123-4567',
    address: '123 Commerce Street, Business City, 12345'
  },
  
  // Métadonnées par défaut pour les pages
  defaultMeta: {
    keywords: 'boutique en ligne, produits tech, électronique, livraison rapide, KStores',
    author: 'KStores',
    robots: 'index, follow',
    locale: 'fr_FR',
    type: 'website'
  },
  
  // Configuration des données structurées
  structuredData: {
    organization: {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "KStores",
      "url": "https://kstores.com",
      "logo": "https://kstores.com/src/assets/logo-transparent.png",
      "description": "Boutique en ligne spécialisée dans les produits tech et électronique",
      "sameAs": [
        "https://facebook.com/kstores",
        "https://twitter.com/kstores",
        "https://instagram.com/kstores",
        "https://youtube.com/kstores"
      ],
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": "+1-555-123-4567",
        "contactType": "customer service",
        "availableLanguage": ["French", "English"],
        "email": "contact@kstores.com"
      },
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "123 Commerce Street",
        "addressLocality": "Business City",
        "postalCode": "12345",
        "addressCountry": "CI"
      }
    },
    
    website: {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "KStores",
      "url": "https://kstores.com",
      "description": "Boutique en ligne KStores - Produits tech, électronique et plus",
      "publisher": {
        "@type": "Organization",
        "name": "KStores"
      },
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://kstores.com/search?q={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    }
  },
  
  // Configuration des boutons de partage
  shareButtons: {
    facebook: {
      enabled: true,
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    twitter: {
      enabled: true,
      color: 'bg-sky-500 hover:bg-sky-600'
    },
    whatsapp: {
      enabled: true,
      color: 'bg-green-500 hover:bg-green-600'
    },
    telegram: {
      enabled: true,
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    copy: {
      enabled: true,
      color: 'bg-gray-600 hover:bg-gray-700'
    }
  }
};

// Fonction utilitaire pour générer les métadonnées d'une page
export const generatePageMeta = (pageConfig) => {
  const {
    title,
    description,
    image,
    url,
    type = 'website',
    keywords,
    structuredData
  } = pageConfig;
  
  return {
    title: title ? `${title} - ${socialConfig.siteName}` : socialConfig.siteName,
    description: description || socialConfig.siteDescription,
    image: image || socialConfig.defaultImage,
    url: url || socialConfig.siteUrl,
    type,
    keywords: keywords || socialConfig.defaultMeta.keywords,
    structuredData: structuredData || socialConfig.structuredData.website
  };
};

// Fonction utilitaire pour générer les données structurées d'un produit
export const generateProductStructuredData = (product) => {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.description,
    "image": product.image_url,
    "url": `${socialConfig.siteUrl}/product/${product.id}`,
    "brand": {
      "@type": "Brand",
      "name": "KStores"
    },
    "offers": {
      "@type": "Offer",
      "price": product.price,
      "priceCurrency": "XOF",
      "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": "KStores"
      }
    },
    "aggregateRating": product.reviews?.avg ? {
      "@type": "AggregateRating",
      "ratingValue": product.reviews.avg,
      "reviewCount": product.reviews.count
    } : undefined
  };
}; 