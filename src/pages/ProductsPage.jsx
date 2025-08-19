import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Search, Filter } from 'lucide-react';
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

      <div className="container mx-auto px-4 py-12">
        <DynamicSocialMetaTags 
          pageType="products"
          title={`${t('product.allProducts')} - KStores`}
          description={t('product.browseDescription')}
        />
      
      {/* Breadcrumb Navigation */}
      <nav aria-label="Fil d'Ariane" className="mb-6">
        <ol className="flex items-center space-x-2 text-sm text-gray-600">
          <li>
            <Link to="/" className="hover:text-primary transition-colors">
              Accueil
            </Link>
          </li>
          <li className="text-gray-400">/</li>
          <li className="text-gray-900 font-medium">
            {t('product.allProducts')}
          </li>
        </ol>
      </nav>

      {/* Header */}
      <header className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {t('product.allProducts')}
              {filteredProducts.length > 0 && (
                <span className="text-lg font-normal text-gray-600 ml-2">
                  ({filteredProducts.length} {filteredProducts.length === 1 ? 'produit' : 'produits'})
                </span>
              )}
            </h1>
            <p className="text-gray-600 max-w-2xl leading-relaxed">
              {t('product.browseDescription')} Découvrez notre sélection <strong>électronique</strong>, <strong>gaming</strong> et <strong>high-tech</strong> : mini enceinte, souris gamer programmable, clavier rétro éclairé, siège gamer LED, micro à condensateur, IPTV, Furycube, Zifriend et plus. Livraison rapide à <strong>Dakar</strong>, <strong>Thiès</strong> et partout au <strong>Sénégal</strong>.
            </p>
          </div>
          {/* <div className="mt-4 md:mt-0">
            <SocialShareButtons 
              title={`${t('product.allProducts')} - KStores`}
              description={t('product.browseDescription')}
              showTitle={false}
            />
          </div> */}
        </div>
      </header>

      {/* Filters and Search */}
      <section aria-label="Filtres et recherche" className="mb-8">
        <h2 className="sr-only">Filtrer et rechercher des produits</h2>
        <div className="flex flex-wrap gap-4">
          <div className="flex-1">
            <label htmlFor="product-search" className="sr-only">
              Rechercher des produits
            </label>
            <div className="relative">
              <input
                id="product-search"
                type="search"
                placeholder={t('common.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                aria-label="Rechercher parmi les produits"
              />
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" aria-hidden="true" />
            </div>
          </div>
          
          <div className="flex gap-4">
            <div>
              <label htmlFor="category-filter" className="sr-only">
                Filtrer par catégorie
              </label>
              <select
                id="category-filter"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                aria-label="Filtrer les produits par catégorie"
              >
                <option value="">{t('categories.all')}</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="sort-filter" className="sr-only">
                Trier les produits
              </label>
              <select
                id="sort-filter"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                aria-label="Trier les produits par"
              >
                <option value="newest">{t('product.sortBy.newest')}</option>
                <option value="price-low">{t('product.sortBy.priceLow')}</option>
                <option value="price-high">{t('product.sortBy.priceHigh')}</option>
                <option value="name">{t('product.sortBy.name')}</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <main>
        {isLoading ? (
          <div className="flex justify-center py-12" role="status" aria-label="Chargement des produits">
            <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
            <span className="sr-only">Chargement des produits...</span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <section className="text-center py-12" role="region" aria-label="Aucun produit trouvé">
            <Filter className="mx-auto h-16 w-16 text-gray-400" aria-hidden="true" />
            <h2 className="mt-4 text-xl font-medium">{t('product.noProducts')}</h2>
            <p className="mt-2 text-gray-600">{t('product.adjustFilters')}</p>
          </section>
        ) : (
          <section aria-label={`${filteredProducts.length} produits trouvés`}>
            <h2 className="sr-only">
              Liste des produits ({filteredProducts.length} {filteredProducts.length === 1 ? 'résultat' : 'résultats'})
            </h2>
            <div 
              className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4"
              role="grid"
              aria-label="Grille de produits"
            >
            {filteredProducts.map((product, index) => (
              <motion.article
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="group overflow-hidden rounded-lg bg-white shadow-md transition-all hover:shadow-lg"
                role="gridcell"
                aria-label={`Produit ${index + 1} sur ${filteredProducts.length}`}
                itemScope
                itemType="https://schema.org/Product"
              >
                <Link 
                  to={`/product/${product.id}`} 
                  className="block overflow-hidden"
                  aria-label={`Voir les détails de ${product.name}`}
                >
                  <div className="h-40 overflow-hidden relative">
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
                      <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
                        Écoulé
                      </span>
                    </div>
                  )}
                  <PromotionBadge product={product} size="sm" showEndDate={false} />
                </div>
                <div className="p-2">
                  <div className="mb-1 text-xs text-blue-600" itemProp="category">
                    {product.categories?.name}
                  </div>
                  <h3 className="mb-1 text-base font-medium text-gray-900 line-clamp-2" itemProp="name">
                    {product.name}
                  </h3>
                  
                  {/* Données structurées cachées */}
                  <meta itemProp="description" content={product.description || product.name} />
                  <meta itemProp="sku" content={product.id} />
                  <meta itemProp="url" content={`${window.location.origin}/product/${product.id}`} />
                  
                  {/* Colors Display */}
                  {product.colors && product.colors.length > 0 && (
                    <div className="mb-2">
                      <div className="flex items-center gap-1">
                        {product.colors.filter(color => color.available !== false).slice(0, 5).map((color, index) => (
                          <div
                            key={index}
                            className={`w-4 h-4 rounded-full border cursor-pointer transition-colors ${
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
                        {product.colors.filter(color => color.available !== false).length > 5 && (
                          <span className="text-xs text-gray-500">
                            +{product.colors.filter(color => color.available !== false).length - 5}
                          </span>
                        )}
                      </div>
                      {selectedColorForProduct[product.id] && (
                        <p className="text-xs text-primary font-medium mt-1">
                          {selectedColorForProduct[product.id].name}
                        </p>
                      )}
                    </div>
                  )}
                  
                  <div className="mb-1 flex items-center" itemProp="aggregateRating" itemScope itemType="https://schema.org/AggregateRating">
                    <div className="flex text-accent" aria-label={`Note ${product.reviews?.avg || 0} sur 5 étoiles`}>
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`h-4 w-4 ${i < Math.round(product.reviews?.avg || 0) ? 'fill-current' : ''}`}
                          aria-hidden="true"
                        />
                      ))}
                    </div>
                    <span className="ml-2 text-xs text-gray-600">
                      ({product.reviews?.count || 0} {t('product.reviews')})
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
                  <div className="flex items-center justify-between" itemProp="offers" itemScope itemType="https://schema.org/Offer">
                    <div className="flex flex-col">
                      <div itemProp="price" content={product.price}>
                        <ProductPrice product={product} size="base" showEndDate={false} />
                      </div>
                      <meta itemProp="priceCurrency" content="XOF" />
                      <meta itemProp="availability" content={product.inventory > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"} />
                    </div>
                    <button
                      onClick={(e) => handleAddToCart(product, e)}
                      disabled={product.inventory === 0}
                      className={`rounded-full px-2 py-1 text-xs transition-colors ${
                        product.inventory === 0 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                          : 'bg-gray-100 text-gray-700 hover:bg-blue-600 hover:text-white'
                      }`}
                    >
                      {product.inventory === 0 ? 'Indisponible' : t('product.addToCart')}
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