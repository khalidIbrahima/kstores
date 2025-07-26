import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { socialConfig } from '../config/socialConfig';

const SocialMetaTags = ({ 
  title, 
  description, 
  image, 
  url, 
  type = 'website',
  keywords,
  structuredData
}) => {
  const { t } = useTranslation();
  
  // Valeurs par défaut depuis la configuration
  const defaultTitle = title || socialConfig.siteName;
  const defaultDescription = description || socialConfig.siteDescription;
  const defaultImage = image || socialConfig.defaultImage;
  const defaultUrl = url || window.location.href;
  const defaultKeywords = keywords || socialConfig.defaultMeta.keywords;
  
  // Données structurées par défaut
  const defaultStructuredData = structuredData || socialConfig.structuredData.website;

  return (
    <Helmet>
      {/* Meta Tags de base */}
      <title>{defaultTitle}</title>
      <meta name="description" content={defaultDescription} />
      <meta name="keywords" content={defaultKeywords} />
      <meta name="author" content={socialConfig.defaultMeta.author} />
      <meta name="robots" content={socialConfig.defaultMeta.robots} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={defaultTitle} />
      <meta property="og:description" content={defaultDescription} />
      <meta property="og:image" content={defaultImage} />
      <meta property="og:image:width" content={socialConfig.defaultImageWidth} />
      <meta property="og:image:height" content={socialConfig.defaultImageHeight} />
      <meta property="og:url" content={defaultUrl} />
      <meta property="og:site_name" content={socialConfig.siteName} />
      <meta property="og:locale" content={socialConfig.defaultMeta.locale} />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={defaultTitle} />
      <meta name="twitter:description" content={defaultDescription} />
      <meta name="twitter:image" content={defaultImage} />
      <meta name="twitter:site" content={socialConfig.socialMedia.twitter.username} />
      <meta name="twitter:creator" content={socialConfig.socialMedia.twitter.username} />
      
      {/* URL canonique */}
      <link rel="canonical" href={defaultUrl} />
      
      {/* Données structurées */}
      <script type="application/ld+json">
        {JSON.stringify(defaultStructuredData)}
      </script>
    </Helmet>
  );
};

export default SocialMetaTags; 