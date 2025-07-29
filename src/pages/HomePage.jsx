import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, Star, ShoppingBag, Truck, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useCart } from '../contexts/CartContext';
import { formatPrice } from '../utils/currency';
import DynamicSocialMetaTags from '../components/DynamicSocialMetaTags';
import PromotedProducts from '../components/PromotedProducts';

const HomePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addItem } = useCart();
  const { t } = useTranslation();

  // Images libres pour le slider de la bannière
  const bannerImages = [
    // Smartphone
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80',
    // TV
    'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=1200&q=80',
    // Console de jeux
    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=80',
    // Ordinateur portable
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80'
  ];
  const [currentBannerImage, setCurrentBannerImage] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch categories with their cover images
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('*')
          .order('name');
        
        if (categoriesError) throw categoriesError;
        
        // Process categories to get cover image or default
        const processedCategories = categoriesData.map(category => ({
          ...category,
          hero_image: category.cover_image_url || 
            'https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg' // Default hero image
        }));
        
        setCategories(processedCategories || []);
        
        // Fetch featured products
        const { data: featuredProducts, error: productsError } = await supabase
          .from('products')
          .select(`
            *,
            categories(*),
            reviews(
              rate
            ),
            order_items:order_items(count)
          `)
          .eq('isActive', true)
          .order('created_at', { ascending: false })
          .limit(8);
        
        if (productsError) throw productsError;

        // Calculer la moyenne des notes pour chaque produit
        const productsWithStats = featuredProducts?.map(product => {
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
        
        setFeaturedProducts(productsWithStats);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBannerImage((prev) => (prev + 1) % bannerImages.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [bannerImages.length]);

  const handleAddToCart = (e, product) => {
    e.preventDefault();
    if (product.inventory > 0) {
      addItem(product);
    }
  };

  // Structured data for the homepage
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "KStores",
    "description": "Boutique en ligne spécialisée dans les produits technologiques, smartphones, ordinateurs, accessoires gaming, claviers mécaniques et plus. Livraison rapide et prix compétitifs.",
    "url": window.location.origin,
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${window.location.origin}/products?search={search_term_string}`,
      "query-input": "required name=search_term_string"
    },
    "sameAs": [
      "https://facebook.com/kstores",
      "https://twitter.com/kstores",
      "https://instagram.com/kstores"
    ]
  };

  const organizationStructuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "KStores",
    "description": "Boutique en ligne de produits technologiques et accessoires gaming",
    "url": window.location.origin,
    "logo": `${window.location.origin}/logo192.png`,
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+221-76-180-06-49",
      "contactType": "customer service",
      "availableLanguage": ["French", "English"]
    },
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "SN",
      "addressLocality": "Dakar"
    },
    "areaServed": [
      {
        "@type": "Country",
        "name": "Sénégal"
      }
    ]
  };

  return (
    <div className="min-h-screen">
      <DynamicSocialMetaTags pageType="home" />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-primary via-primary/90 to-primary py-20 text-white md:py-32 h-[60vh] flex items-center justify-center overflow-hidden">
        {/* Slider d'images produits en fond */}
        <img
          src={bannerImages[currentBannerImage]}
          alt="Produits technologiques - Smartphones, ordinateurs et accessoires"
          className="absolute inset-0 w-full h-full object-cover z-0 transition-opacity duration-1000"
        />
        <div className="absolute inset-0 bg-background-dark opacity-50 z-10"></div>
        <div className="container relative z-20 mx-auto px-4 text-center flex flex-col items-center justify-center">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6 text-4xl font-bold leading-tight md:text-5xl lg:text-6xl"
          >
            {t('home.hero.title')} <br className="hidden md:inline" />
            <span className="text-accent">{t('home.hero.subtitle')}</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto mb-8 max-w-2xl text-lg text-text-light md:text-xl"
          >
            {t('home.hero.description')}
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col space-y-4 sm:flex-row sm:justify-center sm:space-x-4 sm:space-y-0"
          >
            <Link to="/products" className="btn-primary">
              {t('home.hero.shopNow')}
            </Link>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                const section = document.getElementById('categories-section');
                if (section) section.scrollIntoView({ behavior: 'smooth' });
              }}
            > {/* scroll to categories section */}
              {t('home.hero.browseCategories')}
            </button>
          </motion.div>
        </div>
      </section>

      {/* Categories Section */}
      <section id="categories-section" className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-2 text-3xl font-bold text-text-dark">{t('home.categories.title')}</h2>
            <p className="mx-auto max-w-2xl text-text-light">
              {t('home.categories.description')}
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center">
              <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  to={`/category/${category.slug}`}
                  className="group relative overflow-hidden rounded-lg shadow-lg transition-transform hover:-translate-y-1"
                  aria-label={`Voir les produits de la catégorie ${category.name}`}
                >
                  <div className="aspect-w-16 aspect-h-9 relative h-64">
                    <div 
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-110"
                      style={{ backgroundImage: `url(${category.hero_image})` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-background-dark/50 to-transparent"></div>
                    </div>
                    <div className="absolute inset-0 flex items-end justify-center p-6">
                      <div className="text-center">
                        <h3 className="mb-2 text-2xl font-bold text-white">{category.name}</h3>
                        <span className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-medium text-white transition-colors group-hover:bg-primary/90">
                          {t('common.shopNow')} <ChevronRight className="ml-1 h-4 w-4" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Promoted Products Section */}
      <PromotedProducts />

      {/* Featured Products */}
      <section className="bg-background py-16">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-2 text-3xl font-bold text-text-dark">{t('home.featured.title')}</h2>
            <p className="mx-auto max-w-2xl text-text-light">
              {t('home.featured.description')}
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center">
              <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
            </div>
          ) : (
            <>
              {/* Structured data for featured products */}
              <script type="application/ld+json">
                {JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "ItemList",
                  "name": "Produits en vedette - Accessoires Gaming et Claviers Mécaniques",
                  "description": "Sélection de nos meilleurs produits technologiques incluant accessoires gaming, claviers mécaniques, smartphones et ordinateurs",
                  "numberOfItems": featuredProducts.length,
                  "itemListElement": featuredProducts.map((product, index) => ({
                    "@type": "ListItem",
                    "position": index + 1,
                    "item": {
                      "@type": "Product",
                      "name": product.name,
                      "description": product.description,
                      "image": product.image_url,
                      "url": `${window.location.origin}/product/${product.id}`,
                      "category": product.categories?.name,
                      "brand": {
                        "@type": "Brand",
                        "name": "KStores"
                      },
                      "offers": {
                        "@type": "Offer",
                        "price": product.price,
                        "priceCurrency": "XOF",
                        "availability": product.inventory > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
                        "seller": {
                          "@type": "Organization",
                          "name": "KStores"
                        }
                      },
                      "aggregateRating": product.reviews?.count > 0 ? {
                        "@type": "AggregateRating",
                        "ratingValue": product.reviews.avg,
                        "reviewCount": product.reviews.count,
                        "bestRating": 5,
                        "worstRating": 1
                      } : undefined
                    }
                  }))
                })}
              </script>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {featuredProducts.map((product) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="group overflow-hidden rounded-lg bg-white shadow-md transition-all hover:shadow-lg"
                  >
                    <Link to={`/product/${product.id}`} className="block overflow-hidden">
                      <div className="h-64 overflow-hidden relative">
                        <img
                          src={product.image_url}
                          alt={`${product.name} - ${product.categories?.name || 'Produit technologique'}`}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                        <div 
                          className="h-full w-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs"
                          style={{ display: 'none' }}
                        >
                          <div className="text-center">
                            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mb-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                      </div>
                      <div className="p-4">
                        <div className="mb-2 text-sm text-blue-600">{product.categories?.name}</div>
                        <h3 className="mb-2 text-lg font-medium text-gray-900 line-clamp-2">{product.name}</h3>
                        
                        {/* Colors Display */}
                        {product.colors && product.colors.length > 0 && (
                          <div className="mb-2">
                            <div className="flex items-center gap-1">
                              {product.colors.filter(color => color.available !== false).slice(0, 5).map((color, index) => (
                                <div
                                  key={index}
                                  className="w-4 h-4 rounded-full border border-gray-300"
                                  style={{ backgroundColor: color.hex }}
                                  title={color.name}
                                  aria-label={`Couleur disponible: ${color.name}`}
                                />
                              ))}
                              {product.colors.filter(color => color.available !== false).length > 5 && (
                                <span className="text-xs text-gray-500">
                                  +{product.colors.filter(color => color.available !== false).length - 5}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                        
                        <div className="mb-2 flex items-center">
                          <div className="flex text-yellow-400" role="img" aria-label={`Note: ${product.reviews?.avg || 0} sur 5 étoiles`}>
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`h-4 w-4 ${i < Math.round(product.reviews?.avg || 0) ? 'fill-current' : ''}`} />
                            ))}
                          </div>
                          <span className="ml-2 text-sm text-gray-600">
                            ({product.reviews?.count || 0} {t('product.reviews')})
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                            <p className="text-xl font-bold text-blue-700">
                              {formatPrice(product.price)}
                            </p>
                          </div>
                          <button
                            onClick={(e) => handleAddToCart(e, product)}
                            disabled={product.inventory === 0}
                            className={`rounded-full px-3 py-1 text-sm transition-colors ${
                              product.inventory === 0 
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                : 'bg-gray-100 text-gray-700 hover:bg-blue-600 hover:text-white'
                            }`}
                            aria-label={product.inventory === 0 ? 'Produit indisponible' : `Ajouter ${product.name} au panier`}
                          >
                            {product.inventory === 0 ? 'Indisponible' : t('product.addToCart')}
                          </button>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </>
          )}

          <div className="mt-12 text-center">
            <Link
              to="/products"
              className="inline-flex items-center rounded-full border border-blue-600 px-6 py-3 font-medium text-blue-600 transition-colors hover:bg-blue-600 hover:text-white"
              aria-label="Voir tous nos produits"
            >
              {t('common.viewAll')} <ChevronRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <ShoppingBag className="h-8 w-8" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">{t('home.features.quality.title')}</h3>
              <p className="text-gray-600">{t('home.features.quality.description')}</p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <Truck className="h-8 w-8" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">{t('home.features.delivery.title')}</h3>
              <p className="text-gray-600">{t('home.features.delivery.description')}</p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <Shield className="h-8 w-8" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">{t('home.features.payment.title')}</h3>
              <p className="text-gray-600">{t('home.features.payment.description')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="bg-blue-800 py-16 text-white">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold">{t('home.newsletter.title')}</h2>
            <p className="mb-8 text-blue-100">
              {t('home.newsletter.description')}
            </p>
            <form className="mx-auto flex max-w-md flex-col space-y-3 sm:flex-row sm:space-x-3 sm:space-y-0">
              <input
                type="email"
                placeholder={t('home.newsletter.placeholder')}
                className="w-full rounded-full px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <button
                type="submit"
                className="rounded-full bg-yellow-500 px-6 py-3 font-medium text-gray-900 transition-colors hover:bg-yellow-400"
              >
                {t('home.newsletter.subscribe')}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;