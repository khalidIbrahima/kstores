// Configuration des métadonnées sociales pour KStores
export const socialConfig = {
  // Informations de base
  siteName: 'Kapital Stores',
  siteUrl: 'https://kapital-stores.shop',
  siteDescription: 'Boutique en ligne Kapital Stores - Produits tech, électronique et plus. Livraison rapide, prix bas, qualité garantie.',
  
  // Images par défaut
  defaultImage: 'https://kapital-stores.shop/src/assets/logo-transparent.png',
  defaultImageWidth: 1200,
  defaultImageHeight: 630,
  
  // Réseaux sociaux
  socialMedia: {
    facebook: {
      url: 'https://facebook.com/people/kstoressn/100063748556013',
      username: '@kstoressn'
    },
    twitter: {
      url: 'https://twitter.com/kapital_stores',
      username: '@kapital_stores'
    },
    instagram: {
      url: 'https://instagram.com/k.stores.sn',
      username: '@k.stores.sn'
    },
    youtube: {
      url: 'https://youtube.com/kstores',
      username: '@kstores'
    }
  },
  
  // Contact
  contact: {
    email: 'contact@kapital-stores.shop',
    phone: '+221761800649',
    address: 'Dakar, Sénégal'
  },
  
  // Métadonnées par défaut pour les pages
  defaultMeta: {
    keywords: 'boutique en ligne, produits tech, électronique, livraison rapide, Kapital Stores',
    author: 'Kapital Stores',
    robots: 'index, follow',
    locale: 'fr_FR',
    type: 'website'
  },
  
  // Configuration des données structurées
  structuredData: {
    organization: {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Kapital Stores",
      "url": "https://kapital-stores.shop",
      "logo": "https://kapital-stores.shop/src/assets/logo-transparent.png",
      "description": "Boutique en ligne spécialisée dans les produits tech et électronique",
      "sameAs": [
        "https://facebook.com/people/kstoressn/100063748556013",
        "https://twitter.com/kapital_stores",
        "https://instagram.com/k.stores.sn"
      ],
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": "+221761800649",
        "contactType": "customer service",
        "availableLanguage": ["French", "English"],
        "email": "contact@kapital-stores.shop"
      },
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Dakar",
        "addressCountry": "SN"
      }
    },
    
    website: {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "Kapital Stores",
      "url": "https://kapital-stores.shop",
      "description": "Boutique en ligne Kapital Stores - Produits tech, électronique et plus",
      "publisher": {
        "@type": "Organization",
        "name": "Kapital Stores"
      },
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://kapital-stores.shop/search?q={search_term_string}",
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
      "name": "Kapital Stores"
    },
    "offers": {
      "@type": "Offer",
      "price": product.price,
      "priceCurrency": "XOF",
      "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": "Kapital Stores"
      }
    },
    "aggregateRating": product.reviews?.avg ? {
      "@type": "AggregateRating",
      "ratingValue": product.reviews.avg,
      "reviewCount": product.reviews.count
    } : undefined
  };
}; 