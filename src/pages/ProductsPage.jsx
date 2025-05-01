import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Search, Filter } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useCart } from '../contexts/CartContext';

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const { addItem } = useCart();
  const { t } = useTranslation();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch products
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select('*, categories(*)');
        
        if (productsError) throw productsError;
        
        // Fetch categories
        const { data: categories, error: categoriesError } = await supabase
          .from('categories')
          .select('*')
          .order('name');
        
        if (categoriesError) throw categoriesError;
        
        setProducts(products || []);
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

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t('product.allProducts')}</h1>
        <p className="text-gray-600">{t('product.browseDescription')}</p>
      </div>

      {/* Filters and Search */}
      <div className="mb-8 flex flex-wrap gap-4">
        <div className="flex-1">
          <div className="relative">
            <input
              type="text"
              placeholder={t('common.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          </div>
        </div>
        
        <div className="flex gap-4">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          >
            <option value="">{t('categories.all')}</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          >
            <option value="newest">{t('product.sortBy.newest')}</option>
            <option value="price-low">{t('product.sortBy.priceLow')}</option>
            <option value="price-high">{t('product.sortBy.priceHigh')}</option>
            <option value="name">{t('product.sortBy.name')}</option>
          </select>
        </div>
      </div>

      {/* Products Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <Filter className="mx-auto h-16 w-16 text-gray-400" />
          <h2 className="mt-4 text-xl font-medium">{t('product.noProducts')}</h2>
          <p className="mt-2 text-gray-600">{t('product.adjustFilters')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product) => (
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
                  <div className="mb-2 text-sm text-blue-600">{product.categories?.name}</div>
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

export default ProductsPage;