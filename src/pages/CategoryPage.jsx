import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useCart } from '../contexts/CartContext';

const CategoryPage = () => {
  const { slug } = useParams();
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addItem } = useCart();
  const { t } = useTranslation();

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
        
        // Fetch products in this category
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .eq('category_id', categoryData.id);
        
        if (productsError) throw productsError;
        setProducts(productsData || []);
      } catch (error) {
        console.error('Error fetching category:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCategory();
  }, [slug]);

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
    <div className="container mx-auto px-4 py-12">
      {/* Breadcrumbs */}
      <nav className="mb-8 flex text-sm">
        <Link to="/" className="text-gray-500 hover:text-blue-600">{t('nav.home')}</Link>
        <span className="mx-2 text-gray-400">/</span>
        <span className="text-gray-800">{category.name}</span>
      </nav>

      <div className="mb-12">
        <h1 className="mb-4 text-3xl font-bold">{category.name}</h1>
        <p className="text-lg text-gray-600">
          {t('categories.browseProducts', { category: category.name.toLowerCase() })}
        </p>
      </div>

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
    </div>
  );
};

export default CategoryPage;