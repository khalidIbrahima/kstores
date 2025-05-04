import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Truck, ShieldCheck, Heart, Share2, Minus, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useCart } from '../contexts/CartContext';
import toast from 'react-hot-toast';

const ProductPage = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [category, setCategory] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();
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
            .neq('id', id)
            .limit(4);
          
          setRelatedProducts(relatedData || []);
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProduct();
  }, [id]);

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };
  
  const increaseQuantity = () => {
    if (product && quantity < product.inventory) {
      setQuantity(quantity + 1);
    } else {
      toast.error(t('product.errorExceedStock'));
    }
  };
  
  const handleAddToCart = () => {
    if (product) {
      addItem(product, quantity);
      setQuantity(1); // Reset quantity after adding to cart
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

  return (
    <div className="container mx-auto px-4 py-12">
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
          <img 
            src={product.image_url} 
            alt={product.name} 
            className="h-full w-full object-contain"
          />
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
              {t('common.currency')} {product.price.toFixed(2)}
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
                onClick={decreaseQuantity}
                className="rounded-l-md border border-gray-300 bg-gray-100 px-4 py-2 text-gray-600 hover:bg-gray-200"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="flex w-16 items-center justify-center border-y border-gray-300 py-2">
                {quantity}
              </span>
              <button 
                onClick={increaseQuantity}
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
            <button className="flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-8 py-3 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-1/3">
              <Heart className="mr-2 h-5 w-5" /> {t('product.wishlist')}
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
              <a href="#" className="text-gray-500 hover:text-red-600">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-8 text-2xl font-bold">{t('product.relatedProducts')}</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProducts.map((relatedProduct) => (
              <div key={relatedProduct.id} className="group overflow-hidden rounded-lg bg-white shadow-md transition-all hover:shadow-lg">
                <Link to={`/product/${relatedProduct.id}`} className="block overflow-hidden">
                  <div className="h-48 overflow-hidden">
                    <img
                      src={relatedProduct.image_url}
                      alt={relatedProduct.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="mb-2 text-lg font-medium text-gray-900 line-clamp-1">{relatedProduct.name}</h3>
                    <p className="text-lg font-bold text-blue-700">
                      {t('common.currency')} {relatedProduct.price.toFixed(2)}
                    </p>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductPage;