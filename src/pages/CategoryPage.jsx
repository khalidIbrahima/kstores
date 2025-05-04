import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ArrowLeft, ShoppingCart, Monitor, Gamepad, Cpu, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useCart } from '../contexts/CartContext';

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
        
        // Fetch hero images if gaming category
        if (slug === 'gaming') {
          const { data: heroImagesData } = await supabase
            .from('category_hero_images')
            .select('*')
            .eq('category_id', categoryData.id)
            .eq('is_active', true);
          
          setHeroImages(heroImagesData || []);
        }
        
        // Fetch products with their images
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select(`
            *,
            product_images (
              id,
              url,
              is_primary
            )
          `)
          .eq('category_id', categoryData.id);
        
        if (productsError) throw productsError;
        
        // Process products to set primary image
        const processedProducts = productsData.map(product => ({
          ...product,
          image_url: product.product_images.find(img => img.is_primary)?.url || product.product_images[0]?.url || product.image_url,
          additional_images: product.product_images.filter(img => !img.is_primary).map(img => img.url)
        }));
        
        setProducts(processedProducts || []);
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
      {/* Hero Section for Gaming Category */}
      {isGamingCategory && heroImages.length > 0 && (
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
        {/* Breadcrumbs */}
        <nav className="mb-8 flex text-sm">
          <Link to="/" className="text-gray-500 hover:text-blue-600">{t('nav.home')}</Link>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-gray-800">{category.name}</span>
        </nav>

        {!isGamingCategory && (
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
                  <div className="h-64 overflow-hidden">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="mb-2 text-lg font-medium text-gray-900 line-clamp-2">{product.name}</h3>
                    <div className="mb-2 flex items-center">
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-current" />
                        ))}
                      </div>
                      <span className="ml-2 text-sm text-gray-600">
                        (27 {t('product.reviews')})
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className={`text-xl font-bold ${isGamingCategory ? 'text-purple-600' : 'text-blue-700'}`}>
                        {t('common.currency')} {product.price.toFixed(2)}
                      </p>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          addItem(product, 1);
                        }}
                        className={`rounded-full px-3 py-1 text-sm transition-colors ${
                          isGamingCategory
                            ? 'bg-purple-100 text-purple-700 hover:bg-purple-600 hover:text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-blue-600 hover:text-white'
                        }`}
                      >
                        {t('product.addToCart')}
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