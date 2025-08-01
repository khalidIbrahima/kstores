import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { socialConfig } from '../config/socialConfig';

const DynamicSocialMetaTags = ({ 
  title, 
  description, 
  image, 
  url, 
  type = 'website',
  keywords,
  structuredData,
  product = null,
  category = null,
  pageType = 'general'
}) => {
  const { t } = useTranslation();
  
  // Génération automatique des métadonnées selon le type de page
  const generateMetaData = () => {
    const baseUrl = window.location.origin;
    const currentUrl = url || window.location.href;
    
    switch (pageType) {
      case 'product':
        if (product) {
          return {
            title: `${product.name} - ${socialConfig.siteName}`,
            description: product.description?.substring(0, 160) || `Découvrez ${product.name} sur ${socialConfig.siteName}`,
            image: product.image_url || socialConfig.defaultImage,
            keywords: `${product.name}, ${product.category?.name || ''}, boutique en ligne, ${socialConfig.defaultMeta.keywords}`,
            structuredData: {
              "@context": "https://schema.org",
              "@type": "Product",
              "name": product.name,
              "description": product.description,
              "image": product.image_url,
              "url": currentUrl,
              "brand": {
                "@type": "Brand",
                "name": socialConfig.siteName
              },
              "offers": {
                "@type": "Offer",
                "price": product.price,
                "priceCurrency": "XOF",
                "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
                "seller": {
                  "@type": "Organization",
                  "name": socialConfig.siteName
                }
              },
              "aggregateRating": product.avgRating ? {
                "@type": "AggregateRating",
                "ratingValue": product.avgRating,
                "reviewCount": product.reviewCount || 0
              } : undefined
            }
          };
        }
        break;
        
      case 'category':
        if (category) {
          return {
            title: `${category.name} - ${socialConfig.siteName}`,
            description: category.description?.substring(0, 160) || `Découvrez notre sélection de ${category.name} sur ${socialConfig.siteName}`,
            image: category.image_url || socialConfig.defaultImage,
            keywords: `${category.name}, produits, ${socialConfig.defaultMeta.keywords}`,
            structuredData: {
              "@context": "https://schema.org",
              "@type": "CollectionPage",
              "name": category.name,
              "description": category.description,
              "url": currentUrl,
              "mainEntity": {
                "@type": "ItemList",
                "name": `${category.name} - ${socialConfig.siteName}`
              }
            }
          };
        }
        break;
        
      case 'home':
        return {
          title: `${socialConfig.siteName} - Boutique en ligne de produits technologiques`,
          description: "Découvrez notre sélection de produits technologiques : smartphones, ordinateurs, accessoires gaming et plus. Livraison rapide, prix compétitifs.",
          image: `${baseUrl}/src/assets/logo-transparent.png`,
          keywords: "boutique en ligne, produits technologiques, smartphones, ordinateurs, accessoires, livraison rapide",
          structuredData: {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": socialConfig.siteName,
            "url": baseUrl,
            "description": "Boutique en ligne de produits technologiques",
            "potentialAction": {
              "@type": "SearchAction",
              "target": `${baseUrl}/search?q={search_term_string}`,
              "query-input": "required name=search_term_string"
            }
          }
        };
        
      case 'products':
        return {
          title: `Tous nos produits - ${socialConfig.siteName}`,
          description: "Découvrez notre catalogue complet de produits technologiques. Smartphones, ordinateurs, accessoires et plus.",
          image: `${baseUrl}/src/assets/logo-transparent.png`,
          keywords: "produits, catalogue, boutique en ligne, tech, électronique",
          structuredData: {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": "Tous nos produits",
            "description": "Catalogue complet de produits technologiques",
            "url": currentUrl
          }
        };
        
      case 'privacy':
        return {
          title: title || `Règles de Confidentialité - ${socialConfig.siteName}`,
          description: description || "Découvrez comment Kapital Stores protège vos données personnelles et respecte votre vie privée. Politique de confidentialité complète et transparente.",
          image: `${baseUrl}/src/assets/logo-transparent.png`,
          keywords: "confidentialité, protection des données, RGPD, vie privée, politique de confidentialité",
          structuredData: {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Règles de Confidentialité",
            "description": "Politique de confidentialité de Kapital Stores",
            "url": currentUrl,
            "mainEntity": {
              "@type": "Article",
              "name": "Règles de Confidentialité",
              "description": "Politique de confidentialité et protection des données personnelles"
            }
          }
        };
        
      case 'terms':
        return {
          title: title || `Conditions Générales d'Utilisation - ${socialConfig.siteName}`,
          description: description || "Consultez les conditions générales d'utilisation de Kapital Stores pour comprendre vos droits et obligations. CGU complètes et transparentes.",
          image: `${baseUrl}/src/assets/logo-transparent.png`,
          keywords: "conditions générales, CGU, termes d'utilisation, droits, obligations, contrat",
          structuredData: {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Conditions Générales d'Utilisation",
            "description": "CGU de Kapital Stores",
            "url": currentUrl,
            "mainEntity": {
              "@type": "Article",
              "name": "Conditions Générales d'Utilisation",
              "description": "Conditions générales d'utilisation et termes de service"
            }
          }
        };
        
      default:
        return {
          title: title || socialConfig.siteName,
          description: description || socialConfig.siteDescription,
          image: image || socialConfig.defaultImage,
          keywords: keywords || socialConfig.defaultMeta.keywords,
          structuredData: structuredData || socialConfig.structuredData.website
        };
    }
  };

  const metaData = generateMetaData();
  const currentUrl = url || window.location.href;
  const imageUrl = metaData.image.startsWith('http') ? metaData.image : `${window.location.origin}${metaData.image}`;

  return (
    <Helmet>
      {/* Meta Tags de base */}
      <title>{metaData.title}</title>
      <meta name="description" content={metaData.description} />
      <meta name="keywords" content={metaData.keywords} />
      <meta name="author" content={socialConfig.defaultMeta.author} />
      <meta name="robots" content={socialConfig.defaultMeta.robots} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={metaData.title} />
      <meta property="og:description" content={metaData.description} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={metaData.title} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:site_name" content={socialConfig.siteName} />
      <meta property="og:locale" content={socialConfig.defaultMeta.locale} />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={metaData.title} />
      <meta name="twitter:description" content={metaData.description} />
      <meta name="twitter:image" content={imageUrl} />
      <meta name="twitter:image:alt" content={metaData.title} />
      <meta name="twitter:site" content={socialConfig.socialMedia.twitter.username} />
      <meta name="twitter:creator" content={socialConfig.socialMedia.twitter.username} />
      
      {/* LinkedIn */}
      <meta property="og:image:secure_url" content={imageUrl} />
      
      {/* URL canonique */}
      <link rel="canonical" href={currentUrl} />
      
      {/* Données structurées */}
      <script type="application/ld+json">
        {JSON.stringify(metaData.structuredData)}
      </script>
      
      {/* Données structurées supplémentaires pour l'organisation */}
      <script type="application/ld+json">
        {JSON.stringify(socialConfig.structuredData.organization)}
      </script>
    </Helmet>
  );
};

export default DynamicSocialMetaTags; 