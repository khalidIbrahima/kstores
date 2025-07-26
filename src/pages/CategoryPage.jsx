import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ArrowLeft, ShoppingCart, Monitor, Gamepad, Cpu, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useCart } from '../contexts/CartContext';
import { formatPrice } from '../utils/currency';
import DynamicSocialMetaTags from '../components/DynamicSocialMetaTags';

const CategoryPage = () => {
  const { slug } = useParams();
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [heroImages, setHeroImages] = useState([]);
  const [currentHeroImage, setCurrentHeroImage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { addItem } = useCart();
  const { t } = useTranslation();

  const isGamingCategory = slug === 'gaming';

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        setIsLoading(true);
        
        // Fetch category
        const { data: categoryData, error: categoryError } = await supabase
          .from('categories')
          .select('*')
          .eq('slug', slug)
          .single();
        
        if (categoryError) throw categoryError;
        if (!categoryData) throw new Error('Category not found');
        
        setCategory(categoryData);
        
        // Use cover image if available
        if (categoryData.cover_image_url) {
          setHeroImages([{ url: categoryData.cover_image_url }]);
        }
        
        // Fetch products with their images
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select(`
            *,
            categories(*),
            reviews(
              rate
            )
          `)
          .eq('category_id', categoryData.id)
          .eq('isActive', true);
        
        if (productsError) throw productsError;
        
        // Calculer la moyenne des notes pour chaque produit
        const productsWithStats = productsData?.map(product => {
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
      } catch (error) {
        console.error('Error fetching category:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCategory();

    // Start hero image rotation for gaming category
    let interval;
    if (isGamingCategory) {
      interval = setInterval(() => {
        setCurrentHeroImage(current => 
          current === heroImages.length - 1 ? 0 : current + 1
        );
      }, 5000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [slug, isGamingCategory, heroImages.length]);

  const nextHeroImage = () => {
    setCurrentHeroImage(current => 
      current === heroImages.length - 1 ? 0 : current + 1
    );
  };

  const prevHeroImage = () => {
    setCurrentHeroImage(current => 
      current === 0 ? heroImages.length - 1 : current - 1
    );
  };

  const handleAddToCart = (e, product) => {
    e.preventDefault();
    if (product.inventory > 0) {
      addItem(product);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="container mx-auto my-16 px-4 text-center">
        <h2 className="mb-6 text-2xl font-bold">{t('categories.notFound')}</h2>
        <p className="mb-8 text-gray-600">{t('categories.notFoundDesc')}</p>
        <Link to="/" className="rounded-md bg-blue-600 px-6 py-3 text-white hover:bg-blue-700">
          <ArrowLeft className="mr-2 inline-block h-5 w-5" />
          {t('nav.home')}
        </Link>
      </div>
    );
  }

  return (
    <div>
<<<<<<< HEAD
      <DynamicSocialMetaTags 
        pageType="category"
        category={category}
      />
=======
      <Helmet>
        <title>{category?.name ? `${category.name} - KStores` : 'Catégorie - KStores'}</title>
        <meta name="description" content={category?.description || 'Catégorie de produits KStores'} />
        <meta property="og:title" content={category?.name ? `${category.name} - KStores` : 'Catégorie - KStores'} />
        <meta property="og:description" content={category?.description || 'Catégorie de produits KStores'} />
        <meta property="og:image" content={category?.hero_image || '/logo192.png'} />
        <meta property="og:url" content={window.location.href} />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>
>>>>>>> 5450a43 (Merge branch 'main' of https://github.com/khalidIbrahima/kstores)
      {/* Hero Section for Categories with Cover Images */}
      {heroImages.length > 0 && (
        <div className="relative overflow-hidden bg-gray-900 py-24 text-white">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentHeroImage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 z-0"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-900 via-blue-900 to-purple-900 opacity-90"></div>
              <div 
                className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20 transition-opacity duration-500"
                style={{ backgroundImage: `url(${heroImages[currentHeroImage]?.url})` }}
              ></div>
            </motion.div>
          </AnimatePresence>

          {/* Hero Navigation */}
          <div className="absolute inset-y-0 left-0 flex items-center">
            <button
              onClick={prevHeroImage}
              className="ml-4 rounded-full bg-black bg-opacity-50 p-2 text-white transition-colors hover:bg-opacity-75"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          </div>
          <div className="absolute inset-y-0 right-0 flex items-center">
            <button
              onClick={nextHeroImage}
              className="mr-4 rounded-full bg-black bg-opacity-50 p-2 text-white transition-colors hover:bg-opacity-75"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>

          {/* Hero Content */}
          <div className="container relative z-10 mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <h1 className="mb-6 text-5xl font-bold">Gaming Zone</h1>
              <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-300">
                Level up your gaming experience with our premium selection of gaming gear and accessories.
              </p>
              <div className="flex justify-center space-x-12">
                <div className="text-center">
                  <Monitor className="mx-auto mb-2 h-8 w-8 text-blue-400" />
                  <p className="font-medium">Premium Displays</p>
                </div>
                <div className="text-center">
                  <Gamepad className="mx-auto mb-2 h-8 w-8 text-purple-400" />
                  <p className="font-medium">Pro Controllers</p>
                </div>
                <div className="text-center">
                  <Cpu className="mx-auto mb-2 h-8 w-8 text-pink-400" />
                  <p className="font-medium">High Performance</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Hero Image Indicators */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
            {heroImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentHeroImage(index)}
                className={`h-2 w-2 rounded-full transition-all ${
                  index === currentHeroImage ? 'bg-white w-4' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-12">
        <Helmet>
          <title>{category?.name ? `${category.name} - KStores` : 'Catégorie - KStores'}</title>
          <meta name="description" content={category?.description || 'Catégorie de produits KStores'} />
          <meta property="og:title" content={category?.name ? `${category.name} - KStores` : 'Catégorie - KStores'} />
          <meta property="og:description" content={category?.description || 'Catégorie de produits KStores'} />
          <meta property="og:image" content={category?.hero_image || '/logo192.png'} />
          <meta property="og:url" content={window.location.href} />
          <meta name="twitter:card" content="summary_large_image" />
        </Helmet>
        {/* Breadcrumbs */}
        <nav className="mb-8 flex text-sm">
          <Link to="/" className="text-gray-500 hover:text-blue-600">{t('nav.home')}</Link>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-gray-800">{category.name}</span>
        </nav>

        {heroImages.length === 0 && (
          <div className="mb-12">
            <h1 className="mb-4 text-3xl font-bold">{category.name}</h1>
            <p className="text-lg text-gray-600">
              {t('categories.browseProducts', { category: category.name.toLowerCase() })}
            </p>
          </div>
        )}

        {products.length === 0 ? (
          <div className="text-center">
            <p className="text-lg text-gray-600">{t('product.noProducts')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`group overflow-hidden rounded-lg bg-white shadow-md transition-all hover:shadow-lg ${
                  isGamingCategory ? 'hover:shadow-purple-200' : ''
                }`}
              >
                <Link to={`/product/${product.id}`} className="block overflow-hidden">
                  <div className="h-64 overflow-hidden relative">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
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
                      <div className="flex text-yellow-400">
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
                      >
                        {product.inventory === 0 ? 'Indisponible' : t('product.addToCart')}
                      </button>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryPage;