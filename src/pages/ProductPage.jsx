import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Truck, ShieldCheck, Heart, Share2, Minus, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useCart } from '../contexts/CartContext';
import { useFavorites } from '../contexts/FavoritesContext';
import toast from 'react-hot-toast';
import ProductImageCarousel from '../components/ProductImageCarousel';
import { formatPrice } from '../utils/currency';
import LocationPicker from '../components/LocationPicker';
import OrderLocationMap from '../components/OrderLocationMap';
import { Helmet } from 'react-helmet';

const ProductPage = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [category, setCategory] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites();
  const { t } = useTranslation();


  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        
        // Fetch product
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single();
        
        if (productError) throw productError;
        if (!productData) throw new Error('Product not found');
        
        setProduct(productData);
        
        // Fetch category
        if (productData.category_id) {
          const { data: categoryData } = await supabase
            .from('categories')
            .select('*')
            .eq('id', productData.category_id)
            .single();
          
          setCategory(categoryData || null);
          
          // Fetch related products
          const { data: relatedData } = await supabase
            .from('products')
            .select('*')
            .eq('category_id', productData.category_id)
            .eq('isActive', true)
            .neq('id', id)
            .limit(4);
          
          setRelatedProducts(relatedData || []);
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        toast.error('Failed to load product');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    if (product) {
      addItem(product, quantity);
      setQuantity(1);
    }
  };

  const toggleFavorite = () => {
    if (!product) return;
    
    if (isFavorite(product.id)) {
      removeFromFavorites(product.id);
    } else {
      addToFavorites(product);
    }
  };


  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto my-16 px-4 text-center">
        <h2 className="mb-6 text-2xl font-bold">{t('product.notFound')}</h2>
        <p className="mb-8 text-gray-600">{t('product.notFoundDesc')}</p>
        <Link to="/products" className="rounded-md bg-blue-600 px-6 py-3 text-white hover:bg-blue-700">
          {t('product.browseCatalog')}
        </Link>
      </div>
    );
  }

  const images = [
    product.image_url,
    product.image_url1,
    product.image_url2,
    product.image_url3,
    product.image_url4
  ].filter(Boolean);

  return (
    <div className="container mx-auto px-4 py-12">
      <Helmet>
        <title>{product.name} - KStores</title>
        <meta name="description" content={product.description?.slice(0, 160) || 'Produit KStores'} />
        <meta property="og:title" content={product.name + ' - KStores'} />
        <meta property="og:description" content={product.description?.slice(0, 160) || 'Produit KStores'} />
        <meta property="og:image" content={product.image_url} />
        <meta property="og:url" content={window.location.href} />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>
      {/* Breadcrumbs */}
      <nav className="mb-8 flex text-sm">
        <Link to="/" className="text-gray-500 hover:text-blue-600">{t('nav.home')}</Link>
        <span className="mx-2 text-gray-400">/</span>
        {category && (
          <>
            <Link to={`/category/${category.slug}`} className="text-gray-500 hover:text-blue-600">
              {category.name}
            </Link>
            <span className="mx-2 text-gray-400">/</span>
          </>
        )}
        <span className="text-gray-800">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
        {/* Product Image */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="overflow-hidden rounded-lg bg-white"
        >
          <ProductImageCarousel images={images} />
        </motion.div>

        {/* Product Details */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h1 className="mb-4 text-3xl font-bold text-gray-900">{product.name}</h1>
          
          {/* Reviews */}
          <div className="mb-4 flex items-center">
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-current" />
              ))}
            </div>
            <span className="ml-2 text-gray-600">
              (24 {t('product.reviews')})
            </span>
          </div>
          
          {/* Price */}
          <div className="mb-6">
            <span className="text-3xl font-bold text-blue-700">
              {formatPrice(product.price)}
            </span>
            {product.inventory < 10 && product.inventory > 0 && (
              <span className="ml-4 text-sm text-red-600">
                {t('product.onlyLeft', { count: product.inventory })}
              </span>
            )}
            {product.inventory === 0 && (
              <span className="ml-4 text-sm text-red-600">{t('product.outOfStock')}</span>
            )}
          </div>
          
          {/* Description */}
          <div className="mb-8">
            <h3 className="mb-2 text-lg font-medium">{t('product.description')}</h3>
            <p className="text-gray-600">{product.description}</p>
          </div>
          
          {/* Quantity Selector */}
          <div className="mb-8">
            <h3 className="mb-2 text-lg font-medium">{t('product.quantity')}</h3>
            <div className="flex items-center">
              <button 
                onClick={() => quantity > 1 && setQuantity(quantity - 1)}
                className="rounded-l-md border border-gray-300 bg-gray-100 px-4 py-2 text-gray-600 hover:bg-gray-200"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="flex w-16 items-center justify-center border-y border-gray-300 py-2">
                {quantity}
              </span>
              <button 
                onClick={() => quantity < product.inventory && setQuantity(quantity + 1)}
                className="rounded-r-md border border-gray-300 bg-gray-100 px-4 py-2 text-gray-600 hover:bg-gray-200"
                disabled={product.inventory <= quantity}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="mb-8 flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-4">
            <button
              onClick={handleAddToCart}
              disabled={product.inventory === 0}
              className="flex w-full items-center justify-center rounded-md bg-blue-600 px-8 py-3 font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 sm:w-2/3"
            >
              {t('product.addToCart')}
            </button>
            <button 
              onClick={toggleFavorite}
              className={`flex w-full items-center justify-center rounded-md border px-8 py-3 font-medium transition-colors sm:w-1/3 ${
                isFavorite(product.id)
                  ? 'border-red-500 bg-red-50 text-red-500 hover:bg-red-100'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Heart 
                className={`mr-2 h-5 w-5 ${isFavorite(product.id) ? 'fill-current' : ''}`} 
              />
              {t('product.wishlist')}
            </button>
          </div>
          
          {/* Additional Info */}
          <div className="space-y-4 rounded-md bg-gray-50 p-4">
            <div className="flex items-start">
              <Truck className="mr-3 h-5 w-5 flex-shrink-0 text-blue-600" />
              <div>
                <h4 className="font-medium">{t('product.freeShipping')}</h4>
                <p className="text-sm text-gray-600">{t('product.freeShippingDesc')}</p>
              </div>
            </div>
            <div className="flex items-start">
              <ShieldCheck className="mr-3 h-5 w-5 flex-shrink-0 text-blue-600" />
              <div>
                <h4 className="font-medium">{t('product.securePayment')}</h4>
                <p className="text-sm text-gray-600">{t('product.securePaymentDesc')}</p>
              </div>
            </div>
          </div>
          
          {/* Share */}
          <div className="mt-8 flex items-center">
            <span className="mr-4 text-gray-700">{t('product.share')}:</span>
            <div className="flex space-x-3">
              <a href="#" className="text-gray-500 hover:text-blue-600">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="text-gray-500 hover:text-blue-500">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
            </div>
          </div>
          
          <div className="mb-4"><span className="font-semibold text-gray-700">Catégorie :</span> {category?.name || '-'}</div>
          {isFavorite(product.id) && product.inventory === 0 && (
            <div className="mb-4 flex items-center gap-2">
              <span className="px-3 py-1 rounded bg-red-100 text-red-700 text-sm font-semibold">Ce produit est dans vos favoris mais il est en rupture de stock</span>
            </div>
          )}
        </motion.div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-8 text-2xl font-bold">{t('product.relatedProducts')}</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProducts.map((relatedProduct) => (
              <motion.div
                key={relatedProduct.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="group overflow-hidden rounded-lg bg-white shadow-md transition-all hover:shadow-lg"
              >
                <Link to={`/product/${relatedProduct.id}`} className="block overflow-hidden">
                  <div className="h-48 overflow-hidden">
                    <img
                      src={relatedProduct.image_url}
                      alt={relatedProduct.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="mb-2 text-lg font-medium text-gray-900 line-clamp-1">
                      {relatedProduct.name}
                    </h3>
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-bold text-blue-700">
                        {formatPrice(relatedProduct.price)}
                      </p>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          addItem(relatedProduct, 1);
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
        </section>
      )}
    </div>
  );
};

export default ProductPage;