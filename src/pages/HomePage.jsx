import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useCart } from '../contexts/CartContext';

const HomePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addItem } = useCart();
  const { t } = useTranslation();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch featured products
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select('*, categories(*)')
          .order('created_at', { ascending: false })
          .limit(8);
        
        if (productsError) throw productsError;
        
        // Fetch categories
        const { data: categories, error: categoriesError } = await supabase
          .from('categories')
          .select('*')
          .order('name');
        
        if (categoriesError) throw categoriesError;
        
        setFeaturedProducts(products || []);
        setCategories(categories || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 py-20 text-white md:py-32">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-black opacity-30"></div>
        </div>
        <div className="container relative mx-auto px-4 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6 text-4xl font-bold leading-tight md:text-5xl lg:text-6xl"
          >
            {t('home.hero.title')} <br className="hidden md:inline" />
            <span className="text-yellow-400">{t('home.hero.subtitle')}</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto mb-8 max-w-2xl text-lg text-gray-200 md:text-xl"
          >
            {t('home.hero.description')}
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col space-y-4 sm:flex-row sm:justify-center sm:space-x-4 sm:space-y-0"
          >
            <Link to="/products" className="rounded-full bg-yellow-500 px-8 py-3 font-medium text-gray-900 transition-colors hover:bg-yellow-400">
              {t('home.hero.shopNow')}
            </Link>
            <Link to="/categories" className="rounded-full border border-white px-8 py-3 font-medium text-white transition-colors hover:bg-white hover:text-blue-900">
              {t('home.hero.browseCategories')}
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-2 text-3xl font-bold text-gray-900">{t('home.categories.title')}</h2>
            <p className="mx-auto max-w-2xl text-gray-600">
              {t('home.categories.description')}
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center">
              <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  to={`/category/${category.slug}`}
                  className="group overflow-hidden rounded-lg bg-gray-100 transition-transform hover:-translate-y-1"
                >
                  <div className="p-6 text-center">
                    <h3 className="mb-2 text-lg font-medium text-gray-900">{category.name}</h3>
                    <p className="inline-flex items-center text-sm text-blue-600 group-hover:underline">
                      {t('common.shopNow')} <ChevronRight className="ml-1 h-4 w-4" />
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured Products */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-2 text-3xl font-bold text-gray-900">{t('home.featured.title')}</h2>
            <p className="mx-auto max-w-2xl text-gray-600">
              {t('home.featured.description')}
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center">
              <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
            </div>
          ) : (
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
                        <p className="text-xl font-bold text-blue-700">
                          {t('common.currency')} {product.price.toFixed(2)}
                        </p>
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            addItem(product);
                          }}
                          className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700 transition-colors hover:bg-blue-600 hover:text-white"
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

          <div className="mt-12 text-center">
            <Link
              to="/products"
              className="inline-flex items-center rounded-full border border-blue-600 px-6 py-3 font-medium text-blue-600 transition-colors hover:bg-blue-600 hover:text-white"
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
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold">{t('home.features.quality.title')}</h3>
              <p className="text-gray-600">{t('home.features.quality.description')}</p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold">{t('home.features.delivery.title')}</h3>
              <p className="text-gray-600">{t('home.features.delivery.description')}</p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
                </svg>
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