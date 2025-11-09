import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Search, Filter, ShoppingBag, Zap, TrendingUp, Award } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { supabase } from '../lib/supabase';
import { useCart } from '../contexts/CartContext';
import DynamicSocialMetaTags from '../components/DynamicSocialMetaTags';
import SocialShareButtons from '../components/SocialShareButtons';
import SocialMediaSection from '../components/SocialMediaSection';
import { formatDescriptionForCard } from '../utils/formatDescription.jsx';
import { toast } from 'react-hot-toast';
import ProductPrice from '../components/ProductPrice';
import PromotionBadge from '../components/PromotionBadge';
import { urlUtils } from '../utils/slugUtils';

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedColorForProduct, setSelectedColorForProduct] = useState({});
  const { addItem } = useCart();
  const { t } = useTranslation();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch active products only
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select(`
            *,
            categories(*),
            reviews(
              rate
            ),
            order_items(count)
          `)
          .eq('isActive', true);
        
        if (productsError) throw productsError;
        
        // Fetch views count for each product
        const productsWithViews = await Promise.all(
          products?.map(async (product) => {
            const { data: viewsCount } = await supabase
              .rpc('get_product_views_count', { p_product_id: product.id });
            return {
              ...product,
              views_count: viewsCount || 0
            };
          }) || []
        );
        
        if (productsError) throw productsError;
        
        // Fetch categories
        const { data: categories, error: categoriesError } = await supabase
          .from('categories')
          .select('*')
          .order('name');
        
        if (categoriesError) throw categoriesError;
        
        // Calculer la moyenne des notes pour chaque produit
        const productsWithStats = productsWithViews?.map(product => {
          const avgRating = product.reviews?.length > 0 
            ? product.reviews.reduce((acc, review) => acc + review.rate, 0) / product.reviews.length 
            : 0;
          return {
            ...product,
            reviews: {
              count: product.reviews?.length || 0,
              avg: avgRating
            }
          };
        }) || [];
        
        setProducts(productsWithStats);
        setCategories(categories || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const filteredProducts = products
    .filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !selectedCategory || product.category_id === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'name':
          return a.name.localeCompare(b.name);
        default: // newest
          return new Date(b.created_at) - new Date(a.created_at);
      }
    });

  const handleAddToCart = (product, e) => {
    e.preventDefault();
    if (product.inventory > 0) {
      const selectedColor = selectedColorForProduct[product.id];
      
      // Vérifier si une couleur est requise mais non sélectionnée
      if (product.colors && product.colors.length > 0 && !selectedColor) {
        toast.error(t('product.colorRequired'));
        return;
      }
      
      addItem(product, 1, selectedColor);
      // Réinitialiser la couleur sélectionnée pour ce produit
      setSelectedColorForProduct(prev => ({
        ...prev,
        [product.id]: null
      }));
    }
  };

  // Génération des données structurées JSON-LD pour le SEO
  const generateStructuredData = () => {
    const baseUrl = window.location.origin;
    
    // Schema.org - ItemList pour la liste des produits
    const itemListSchema = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": t('product.allProducts'),
      "description": t('product.browseDescription'),
      "url": `${baseUrl}/products`,
      "numberOfItems": filteredProducts.length,
      "itemListElement": filteredProducts.slice(0, 20).map((product, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "Product",
          "@id": `${baseUrl}/product/${product.id}`,
          "name": product.name,
          "description": product.description,
          "url": `${baseUrl}/product/${product.id}`,
          "image": product.image_url,
          "sku": product.id,
          "offers": {
            "@type": "Offer",
            "price": product.price,
            "priceCurrency": "XOF",
            "availability": product.inventory > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
                      "seller": {
            "@type": "Organization",
            "name": "Kapital Stores",
            "address": {
              "@type": "PostalAddress",
              "addressLocality": "Dakar",
              "addressRegion": "Dakar",
              "addressCountry": "SN"
            },
            "areaServed": [
              {
                "@type": "City",
                "name": "Dakar"
              },
              {
                "@type": "City", 
                "name": "Thiès"
              },
              {
                "@type": "Country",
                "name": "Sénégal"
              }
            ]
          }
          },
          "aggregateRating": product.reviews?.count > 0 ? {
            "@type": "AggregateRating",
            "ratingValue": product.reviews.avg,
            "reviewCount": product.reviews.count,
            "bestRating": 5,
            "worstRating": 1
          } : undefined,
          "brand": {
            "@type": "Brand",
            "name": "Kapital Stores"
          },
          "category": product.categories?.name || "Électronique",
          "keywords": `${product.categories?.name || 'électronique'}, gaming, jeux vidéo, high-tech, mini enceinte, souris gamer, clavier rétro éclairé, siège gamer LED, micro condensateur, IPTV, furycube, zifriend, adaptateur type c, horloge 3d, lampe led rgb, intercom motard, souris sans fil, Dakar, Thiès, Sénégal`,
          "audience": {
            "@type": "Audience",
            "geographicArea": {
              "@type": "Country",
              "name": "Sénégal"
            }
          }
        }
      }))
    };

    // Schema.org - WebPage
    const webPageSchema = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${baseUrl}/products`,
      "name": `${t('product.allProducts')} - Kapital Stores`,
      "description": t('product.browseDescription'),
      "url": `${baseUrl}/products`,
      "isPartOf": {
        "@type": "WebSite",
        "@id": `${baseUrl}`,
        "name": "Kapital Stores",
        "url": baseUrl
      },
      "mainEntity": {
        "@id": `${baseUrl}/products#itemlist`
      }
    };

    // Schema.org - BreadcrumbList
    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Accueil",
          "item": baseUrl
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": t('product.allProducts'),
          "item": `${baseUrl}/products`
        }
      ]
    };

    return [itemListSchema, webPageSchema, breadcrumbSchema];
  };

  // Génération des mots-clés SEO
  const generateKeywords = () => {
    const categoryNames = categories.map(cat => cat.name).join(', ');
    const baseKeywords = 'boutique en ligne, e-commerce, achats, produits, qualité, livraison';
    const locationKeywords = 'Sénégal, Dakar, Thiès, région de Dakar, région de Thiès';
    const thematicKeywords = 'électronique, gaming, jeu, jeux vidéo, console, accessoires gaming, high-tech, technologie';
    const commercialKeywords = 'vente en ligne, magasin, store, shopping, commande, livraison rapide';
    
    // Mots-clés produits spécifiques
    const productKeywords = [
      'mini enceinte', 'enceinte bluetooth', 'haut parleur portable',
      'micro à condensateur', 'microphone studio', 'micro streaming',
      'clavier rétro éclairé', 'clavier gaming', 'clavier mécanique', 'clavier led',
      'souris gamer programmable', 'souris gaming', 'souris rgb', 'souris sans fil',
      'station d\'accueil', 'docking station', 'hub usb', 'station de charge',
      'furycube', 'cube gaming', 'mini pc gaming',
      'zifriend', 'accessoire connecté', 'gadget tech',
      'adaptateur type c', 'adaptateur usb c', 'convertisseur usb', 'câble type c',
      'horloge 3d', 'horloge led', 'réveil numérique', 'affichage 3d',
      'siège gamer avec led', 'chaise gaming', 'fauteuil gamer', 'chaise bureau gaming',
      'lampe murale led rgb', 'éclairage led', 'lampe gaming', 'led strip', 'éclairage rgb',
      'intercom motard', 'kit mains libres moto', 'communication moto', 'casque moto bluetooth',
      'iptv', 'télévision internet', 'streaming tv', 'box iptv', 'abonnement iptv'
    ].join(', ');
    
    return `${baseKeywords}, ${locationKeywords}, ${thematicKeywords}, ${commercialKeywords}, ${productKeywords}, ${categoryNames}`.toLowerCase();
  };

  return (
    <>
      <Helmet>
        {/* Métadonnées de base */}
        <title>{`${t('product.allProducts')} - Boutique en ligne Kapital Stores | ${filteredProducts.length} produits`}</title>
        <meta name="description" content={`${filteredProducts.length} produits électronique & gaming : mini enceinte, souris gamer, clavier rétro éclairé, siège gamer LED, IPTV, micro condensateur. Livraison Dakar, Thiès, Sénégal. Furycube, Zifriend & accessoires high-tech.`} />
        <meta name="keywords" content={generateKeywords()} />
        
        {/* Métadonnées Open Graph */}
        <meta property="og:title" content={`${t('product.allProducts')} - Kapital Stores`} />
        <meta property="og:description" content={`${filteredProducts.length} produits : souris gamer, clavier LED, mini enceinte, siège gaming, IPTV, Furycube. Livraison Dakar, Thiès, Sénégal. Spécialiste gaming & high-tech.`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${window.location.origin}/products`} />
        <meta property="og:site_name" content="Kapital Stores" />
        <meta property="og:locale" content="fr_SN" />
        
        {/* Métadonnées Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${t('product.allProducts')} - Kapital Stores`} />
        <meta name="twitter:description" content={`${filteredProducts.length} produits gaming : souris gamer, clavier LED, enceinte, IPTV, Furycube. Livraison Dakar, Thiès, Sénégal.`} />
        
        {/* Métadonnées techniques */}
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <meta name="googlebot" content="index, follow" />
        <link rel="canonical" href={`${window.location.origin}/products`} />
        
        {/* Données structurées JSON-LD */}
        {generateStructuredData().map((schema, index) => (
          <script key={index} type="application/ld+json">
            {JSON.stringify(schema)}
          </script>
        ))}
        
        {/* Alternates pour les langues */}
        <link rel="alternate" hrefLang="fr" href={`${window.location.origin}/products`} />
        <link rel="alternate" hrefLang="x-default" href={`${window.location.origin}/products`} />
      </Helmet>

      {/* Hero Banner */}
      <div className="relative bg-gradient-to-br from-primary via-blue-600 to-indigo-700 dark:from-blue-800 dark:via-indigo-900 dark:to-purple-900 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-black bg-opacity-20 dark:bg-black dark:bg-opacity-20"></div>
        <div className="absolute inset-0 dark:opacity-80" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255,255,255,0.15) 2px, transparent 2px),
                           radial-gradient(circle at 75% 75%, rgba(255,255,255,0.15) 2px, transparent 2px)`,
          backgroundSize: '60px 60px'
        }}></div>
        
        {/* Content */}
        <div className="relative container mx-auto px-4 py-12 sm:py-16 lg:py-20">
          <div className="text-center text-white">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mb-6"
            >
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3 sm:mb-4">
                {t('product.allProducts')}
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl text-blue-100 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed px-2">
                Découvrez notre collection complète de produits technologiques de qualité
              </p>
            </motion.div>

            {/* Stats Cards */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 max-w-4xl mx-auto mt-8 sm:mt-12"
            >
              <div className="bg-white bg-opacity-20 dark:bg-gray-800 dark:bg-opacity-50 backdrop-blur-sm rounded-lg p-3 sm:p-4 lg:p-6">
                <ShoppingBag className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-300 dark:text-yellow-400 mx-auto mb-1 sm:mb-2" />
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold">{filteredProducts.length}+</div>
                <div className="text-xs sm:text-sm text-blue-100 dark:text-gray-300">Produits</div>
              </div>
              
              <div className="bg-white bg-opacity-20 dark:bg-gray-800 dark:bg-opacity-50 backdrop-blur-sm rounded-lg p-3 sm:p-4 lg:p-6">
                <Award className="h-6 w-6 sm:h-8 sm:w-8 text-green-300 dark:text-green-400 mx-auto mb-1 sm:mb-2" />
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold">{categories.length}+</div>
                <div className="text-xs sm:text-sm text-blue-100 dark:text-gray-300">Catégories</div>
              </div>
              
              <div className="bg-white bg-opacity-20 dark:bg-gray-800 dark:bg-opacity-50 backdrop-blur-sm rounded-lg p-3 sm:p-4 lg:p-6">
                <Zap className="h-6 w-6 sm:h-8 sm:w-8 text-orange-300 dark:text-orange-400 mx-auto mb-1 sm:mb-2" />
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold">1h</div>
                <div className="text-xs sm:text-sm text-blue-100 dark:text-gray-300">Livraison</div>
              </div>
              
              <div className="bg-white bg-opacity-20 dark:bg-gray-800 dark:bg-opacity-50 backdrop-blur-sm rounded-lg p-3 sm:p-4 lg:p-6">
                <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-pink-300 dark:text-pink-400 mx-auto mb-1 sm:mb-2" />
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold">4.8★</div>
                <div className="text-xs sm:text-sm text-blue-100 dark:text-gray-300">Satisfaction</div>
              </div>
            </motion.div>
          </div>
        </div>
        
        {/* Wave Separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,64L48,69.3C96,75,192,85,288,85.3C384,85,480,75,576,69.3C672,64,768,64,864,58.7C960,53,1056,43,1152,48C1248,53,1344,75,1392,85.3L1440,96L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z" fill="currentColor" className="text-white dark:text-gray-900"/>
          </svg>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 lg:py-12 dark:bg-gray-900 min-h-screen transition-colors duration-300">
        <DynamicSocialMetaTags 
          pageType="products"
          title={`${t('product.allProducts')} - KStores`}
          description={t('product.browseDescription')}
        />
      
      {/* Breadcrumb Navigation */}
      <nav aria-label="Fil d'Ariane" className="mb-4 sm:mb-6">
        <ol className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
          <li>
            <Link to="/" className="hover:text-primary dark:hover:text-blue-400 transition-colors">
              Accueil
            </Link>
          </li>
          <li className="text-gray-400 dark:text-gray-500">/</li>
          <li className="text-gray-900 dark:text-gray-100 font-medium">
            {t('product.allProducts')}
          </li>
        </ol>
      </nav>

      {/* Enhanced Filters Section */}
      <section className="mb-8 sm:mb-12 -mt-3 sm:-mt-6">
        {/* Quick Stats Bar */}
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 border border-gray-200 dark:border-gray-600 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center justify-between">
            <div className="mb-4 sm:mb-0 text-center sm:text-left">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                Explorer nos Produits
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
              {filteredProducts.length > 0 && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary text-white">
                    {filteredProducts.length} {filteredProducts.length === 1 ? 'produit trouvé' : 'produits trouvés'}
                </span>
              )}
              </p>
            </div>
            
            {/* Quick Category Pills */}
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
              {categories.slice(0, 3).map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id === selectedCategory ? '' : category.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    selectedCategory === category.id
                      ? 'bg-primary text-white shadow-lg transform scale-105'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 shadow-sm'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>

                {/* Modern Filters and Search */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-600 p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:gap-6">
            {/* Search Bar */}
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rechercher un produit
              </label>
              <div className="relative group">
                <input
                  type="search"
                  placeholder="Ex: souris gaming, iPhone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 sm:pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 focus:border-primary dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-800 transition-all duration-200 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-700"
                />
                <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400 dark:text-gray-500 group-focus-within:text-primary dark:group-focus-within:text-blue-400 transition-colors duration-200" />
              </div>
            </div>

            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row gap-4">
          
                          {/* Category Filter */}
              <div className="flex-1 sm:max-w-xs">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Catégorie
                </label>
                <div className="relative">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full appearance-none pl-4 pr-10 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 focus:border-primary dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-800 transition-all duration-200 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
                  >
                    <option value="">Toutes</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400 dark:text-gray-500 pointer-events-none" />
                </div>
              </div>

              {/* Sort Filter */}
              <div className="flex-1 sm:max-w-xs">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Trier par
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full appearance-none pl-4 pr-10 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 focus:border-primary dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-800 transition-all duration-200 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
                >
                <option value="newest">Plus récents</option>
                <option value="oldest">Plus anciens</option>
                <option value="price-low">Prix croissant</option>
                <option value="price-high">Prix décroissant</option>
                <option value="name">Nom A-Z</option>
                <option value="popular">Plus populaires</option>
              </select>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <main>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 sm:py-12" role="status" aria-label="Chargement des produits">
            <div className="h-12 w-12 sm:h-16 sm:w-16 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
            <span className="sr-only">Chargement des produits...</span>
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 animate-pulse">Chargement...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <section className="text-center py-12 sm:py-16 px-4" role="region" aria-label="Aucun produit trouvé">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-full flex items-center justify-center">
                <Filter className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 dark:text-gray-500" aria-hidden="true" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">Aucun produit trouvé</h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                Nous n'avons trouvé aucun produit correspondant à vos critères. 
                Essayez d'ajuster vos filtres ou votre recherche.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('');
                    setSortBy('newest');
                  }}
                  className="w-full sm:w-auto px-6 py-3 bg-primary hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-xl font-medium transition-colors duration-200 shadow-lg hover:shadow-xl"
                >
                  Réinitialiser les filtres
                </button>
                <div>
                  <Link 
                    to="/" 
                    className="text-primary hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200 font-medium"
                  >
                    Retour à l'accueil
                  </Link>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section aria-label={`${filteredProducts.length} produits trouvés`}>
            <h2 className="sr-only">
              Liste des produits ({filteredProducts.length} {filteredProducts.length === 1 ? 'résultat' : 'résultats'})
            </h2>
            <div 
              className="grid grid-cols-1 gap-4 xs:grid-cols-2 xs:gap-3 sm:gap-4 md:gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
              role="grid"
              aria-label="Grille de produits"
            >
            {filteredProducts.map((product, index) => (
              <motion.article
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="group overflow-hidden rounded-xl sm:rounded-2xl bg-white dark:bg-gray-800 shadow-sm hover:shadow-lg sm:shadow-md sm:hover:shadow-xl dark:shadow-gray-900/20 dark:hover:shadow-gray-900/40 transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:border-primary/20 dark:hover:border-blue-400/30 transform hover:-translate-y-1"
                role="gridcell"
                aria-label={`Produit ${index + 1} sur ${filteredProducts.length}`}
                itemScope
                itemType="https://schema.org/Product"
              >
                <Link 
                  to={urlUtils.generateProductUrl(product)} 
                  className="block overflow-hidden"
                  aria-label={`Voir les détails de ${product.name}`}
                >
                  <div className="h-40 xs:h-32 sm:h-36 md:h-44 lg:h-48 xl:h-52 overflow-hidden relative bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
                    <img
                      src={product.image_url}
                      alt={`${product.name} - ${product.categories?.name || 'Produit'}`}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      itemProp="image"
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  <div 
                    className="h-full w-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm"
                    style={{ display: 'none' }}
                  >
                    <div className="text-center">
                      <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center mb-2">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <span>Image non disponible</span>
                    </div>
                  </div>
                  {product.inventory === 0 && (
                    <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                      <span className="bg-red-600 text-white px-2 py-1 xs:px-3 rounded-full text-xs xs:text-sm font-medium shadow-lg">
                        Écoulé
                      </span>
                    </div>
                  )}
                  <PromotionBadge product={product} size="sm" showEndDate={false} />
                </div>
                <div className="p-3 xs:p-2 sm:p-3 md:p-4">
                  <div className="mb-2 text-xs font-medium text-primary dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-full inline-block" itemProp="category">
                    {product.categories?.name}
                  </div>
                  <h3 className="mb-2 text-sm xs:text-xs sm:text-sm md:text-base font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 group-hover:text-primary dark:group-hover:text-blue-400 transition-colors duration-200 leading-tight" itemProp="name">
                    {product.name}
                  </h3>
                  
                  {/* Données structurées cachées */}
                  <meta itemProp="description" content={product.description || product.name} />
                  <meta itemProp="sku" content={product.id} />
                  <meta itemProp="url" content={`${window.location.origin}/product/${product.id}`} />
                  
                  {/* Colors Display */}
                  {product.colors && product.colors.length > 0 && (
                    <div className="mb-3">
                      <div className="flex items-center gap-1.5">
                        {product.colors.filter(color => color.available !== false).slice(0, 4).map((color, index) => (
                          <div
                            key={index}
                            className={`w-5 h-5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 rounded-full border cursor-pointer transition-colors ${
                              selectedColorForProduct[product.id]?.name === color.name 
                                ? 'border-primary ring-1 ring-primary' 
                                : 'border-gray-300 hover:border-primary'
                            }`}
                            style={{ backgroundColor: color.hex }}
                            title={color.name}
                            onClick={(e) => {
                              e.preventDefault();
                              setSelectedColorForProduct(prev => ({
                                ...prev,
                                [product.id]: color
                              }));
                            }}
                          />
                        ))}
                        {product.colors.filter(color => color.available !== false).length > 4 && (
                          <span className="text-xs text-gray-500">
                            +{product.colors.filter(color => color.available !== false).length - 4}
                          </span>
                        )}
                      </div>
                      {selectedColorForProduct[product.id] && (
                        <p className="text-xs text-primary font-medium mt-1.5">
                          {selectedColorForProduct[product.id].name}
                        </p>
                      )}
                    </div>
                  )}
                  
                  <div className="mb-2 flex items-center" itemProp="aggregateRating" itemScope itemType="https://schema.org/AggregateRating">
                    <div className="flex text-accent" aria-label={`Note ${product.reviews?.avg || 0} sur 5 étoiles`}>
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`h-3 w-3 xs:h-3 xs:w-3 sm:h-4 sm:w-4 ${i < Math.round(product.reviews?.avg || 0) ? 'fill-current' : ''}`}
                          aria-hidden="true"
                        />
                      ))}
                    </div>
                    <span className="ml-1.5 text-xs text-gray-600 dark:text-gray-400">
                      ({product.reviews?.count || 0})
                    </span>
                    {product.reviews?.count > 0 && (
                      <>
                        <meta itemProp="ratingValue" content={product.reviews.avg} />
                        <meta itemProp="reviewCount" content={product.reviews.count} />
                        <meta itemProp="bestRating" content="5" />
                        <meta itemProp="worstRating" content="1" />
                      </>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 xs:flex-row xs:items-center xs:justify-between" itemProp="offers" itemScope itemType="https://schema.org/Offer">
                    <div className="flex flex-col">
                      <div itemProp="price" content={product.price}>
                        <ProductPrice product={product} size="sm" showEndDate={false} />
                      </div>
                      <meta itemProp="priceCurrency" content="XOF" />
                      <meta itemProp="availability" content={product.inventory > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"} />
                    </div>
                    <button
                      onClick={(e) => handleAddToCart(product, e)}
                      disabled={product.inventory === 0}
                      className={`w-full xs:w-auto rounded-lg px-3 py-2 text-xs sm:text-sm font-medium transition-colors shadow-sm ${
                        product.inventory === 0 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200' 
                          : 'bg-primary text-white hover:bg-blue-700 active:bg-blue-800 border border-primary hover:border-blue-700'
                      }`}
                    >
                      {product.inventory === 0 ? 'Indisponible' : 'Ajouter'}
                    </button>
                  </div>
                </div>
                </Link>
              </motion.article>
            ))}
            </div>
          </section>
        )}
      </main>
      
      {/* Section des réseaux sociaux */}
      <aside className="mt-12 pt-8 border-t border-gray-200" role="complementary" aria-label="Réseaux sociaux">
        <SocialMediaSection 
          variant="compact"
        />
      </aside>
      </div>
    </>
  );
};

export default ProductsPage;