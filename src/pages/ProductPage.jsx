import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Truck, ShieldCheck, Heart, Share2, Minus, Plus, Eye } from 'lucide-react';
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
import ProductReviewList from '../components/ProductReviewList';
import { useAuth } from '../contexts/AuthContext';
import { formatDescriptionFull } from '../utils/formatDescription.jsx';
import { useProductAnalytics, useProductStats } from '../hooks/useAnalytics';
import ProductStats from '../components/analytics/ProductStats';
import ProductPrice from '../components/ProductPrice';
import PromotionBadge from '../components/PromotionBadge';

const ProductPage = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [category, setCategory] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState(null);
  const { addItem } = useCart();
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites();
  const { t } = useTranslation();
  const [userRating, setUserRating] = useState(5);
  const [userComment, setUserComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [hasUserReviewed, setHasUserReviewed] = useState(false);
  const { user } = useAuth();
  
  // Tracking des vues de produits
  useProductAnalytics(id);
  const { viewsCount, isLoading: viewsLoading } = useProductStats(id);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        
        // Fetch product
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select(`
            *,
            reviews (
              rate
            )
          `)
          .eq('id', id)
          .single();
        
        if (productError) throw productError;
        if (!productData) throw new Error('Product not found');
        
        // Calculate average rating and review count
        const reviews = productData.reviews || [];
        const avgRating = reviews.length > 0 
          ? reviews.reduce((acc, review) => acc + review.rate, 0) / reviews.length 
          : 0;
        const reviewCount = reviews.length;

        setProduct({
          ...productData,
          avgRating,
          reviewCount
        });
        
        // Vérifier si l'utilisateur a déjà laissé un avis
        if (user) {
          const { data: userReview } = await supabase
            .from('reviews')
            .select('*')
            .eq('productId', id)
            .eq('userId', user.id)
            .single();
          
          setHasUserReviewed(!!userReview);
        }
        
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
  }, [id, user]);

  const handleAddToCart = () => {
    if (product && product.inventory > 0) {
      // Vérifier si une couleur est requise mais non sélectionnée
      if (product.colors && product.colors.length > 0 && !selectedColor) {
        toast.error(t('product.colorRequired'));
        return;
      }
      
      addItem(product, quantity, selectedColor);
      setQuantity(1);
      setSelectedColor(null);
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

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error(t('reviews.login_required'));
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('reviews')
        .insert({
          user_id: user.id,
          product_id: product.id,
          rate: userRating,
          comment: userComment
        });

      if (error) throw error;

      // Réinitialiser le formulaire
      setUserRating(5);
      setUserComment('');
      
      // Rafraîchir les avis
      await fetchProduct();
      
      toast.success(t('reviews.success'));
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error(t('reviews.error'));
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto my-16 px-4 text-center">
        <h2 className="mb-6 text-2xl font-bold text-text-dark">{t('product.notFound')}</h2>
        <p className="mb-8 text-text-light">{t('product.notFoundDesc')}</p>
        <Link to="/products" className="btn-primary">
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
        <meta name="description" content={product.description} />
        <meta property="og:title" content={product.name} />
        <meta property="og:description" content={product.description} />
        <meta property="og:image" content={product.image_url} />
        <meta property="og:url" content={window.location.href} />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>
      {/* Breadcrumbs */}
      <nav className="mb-8 flex text-sm">
        <Link to="/" className="text-text-light hover:text-primary">{t('nav.home')}</Link>
        <span className="mx-2 text-text-light">/</span>
        {category && (
          <>
            <Link to={`/category/${category.slug}`} className="text-text-light hover:text-primary">
              {category.name}
            </Link>
            <span className="mx-2 text-text-light">/</span>
          </>
        )}
        <span className="text-text-dark">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
        {/* Product Image */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="overflow-hidden rounded-lg bg-background relative"
        >
          <ProductImageCarousel images={images} />
          <PromotionBadge product={product} size="lg" />
        </motion.div>

        {/* Product Details */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h1 className="mb-4 text-3xl font-bold text-text-dark">{product.name}</h1>
          
          {/* Colors Display */}
          {product.colors && product.colors.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-text-dark mb-2">Couleurs disponibles</label>
              <div className="flex items-center gap-3">
                {product.colors.filter(color => color.available !== false).map((color, index) => (
                  <div
                    key={index}
                    className="flex flex-col items-center gap-1"
                  >
                    <div
                      className={`w-8 h-8 rounded-full border-2 cursor-pointer transition-colors ${
                        selectedColor?.name === color.name 
                          ? 'border-primary ring-2 ring-primary ring-opacity-50' 
                          : 'border-gray-300 hover:border-primary'
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                      onClick={() => setSelectedColor(color)}
                    />
                    <span className="text-xs text-text-light">{color.name}</span>
                  </div>
                ))}
              </div>
              {selectedColor && (
                <p className="mt-2 text-sm text-primary font-medium">
                  {t('product.selectedColor')} : {selectedColor.name}
                </p>
              )}
            </div>
          )}
          
          {/* Reviews and Views */}
          <div className="mb-4 flex items-center">
            <div className="flex items-center">
              <div className="flex text-accent">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`h-5 w-5 ${i < Math.round(product.avgRating || 0) ? 'fill-current' : ''}`} />
                ))}
              </div>
              <span className="ml-2 text-text-light">
                ({product.reviewCount || 0} {t('product.reviews')})
              </span>
            </div>
          </div>
          
          {/* Price and Actions */}
          <div className="mb-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <ProductPrice product={product} size="3xl" />
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={toggleFavorite}
                  className={`rounded-full p-2 transition-colors ${
                    isFavorite(product.id)
                      ? 'bg-accent-light text-accent'
                      : 'bg-background-light text-text-light hover:bg-background hover:text-accent'
                  }`}
                >
                  <Heart className="h-6 w-6" />
                </button>
                <button
                  onClick={() => {
                    navigator.share({
                      title: product.name,
                      text: product.description,
                      url: window.location.href
                    }).catch(() => {
                      toast.error(t('product.shareError'));
                    });
                  }}
                  className="rounded-full bg-background-light p-2 text-text-light transition-colors hover:bg-background hover:text-primary"
                >
                  <Share2 className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-text-dark">
                {t('product.quantity')}
              </label>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="rounded-lg p-2 transition-colors bg-background-light text-text-dark hover:bg-background hover:text-primary"
                >
                  <Minus className="h-5 w-5" />
                </button>
                <span className="text-lg font-medium text-text-dark">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="rounded-lg p-2 transition-colors bg-background-light text-text-dark hover:bg-background hover:text-primary"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              disabled={product.inventory === 0}
              className={`w-full px-6 py-3 rounded-lg font-medium transition-colors ${
                product.inventory === 0 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'btn-primary'
              }`}
            >
              {product.inventory === 0 ? 'Indisponible' : t('product.addToCart')}
            </button>
          </div>

          {/* Product Description */}
          <div className="mb-8">
            <h2 className="mb-4 text-xl font-bold text-text-dark">{t('product.description')}</h2>
            <div className="prose prose-sm max-w-none text-text-light">
              {formatDescriptionFull(product.description)}
            </div>
          </div>

          {/* Features */}
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex items-center space-x-3 rounded-lg bg-background-light p-4">
              <Truck className="h-6 w-6 text-primary" />
              <div>
                <h3 className="font-medium text-text-dark">{t('product.freeShipping')}</h3>
                <p className="text-sm text-text-light">{t('product.freeShippingDesc')}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 rounded-lg bg-background-light p-4">
              <ShieldCheck className="h-6 w-6 text-primary" />
              <div>
                <h3 className="font-medium text-text-dark">{t('product.securePayment')}</h3>
                <p className="text-sm text-text-light">{t('product.securePaymentDesc')}</p>
              </div>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="mt-12">
            <h2 className="mb-6 text-2xl font-bold text-text-dark">{t('product.reviews')}</h2>
            
            

            {/* Review List */}
            <ProductReviewList productId={product.id} />
          </div>
        </motion.div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-8 text-2xl font-bold text-text-dark">{t('product.relatedProducts')}</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProducts.map((relatedProduct) => (
              <motion.div
                key={relatedProduct.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="group overflow-hidden rounded-lg bg-background shadow-md transition-all hover:shadow-lg"
              >
                <Link to={`/product/${relatedProduct.id}`} className="block overflow-hidden">
                  <div className="h-48 overflow-hidden relative">
                    <img
                      src={relatedProduct.image_url}
                      alt={relatedProduct.name}
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
                  </div>
                  <div className="p-4">
                    <h3 className="mb-2 text-lg font-medium text-text-dark line-clamp-2">
                      {relatedProduct.name}
                    </h3>
                    
                    {/* Colors Display for Related Products */}
                    {relatedProduct.colors && relatedProduct.colors.length > 0 && (
                      <div className="mb-2">
                        <div className="flex items-center gap-1">
                          {relatedProduct.colors.filter(color => color.available !== false).slice(0, 4).map((color, index) => (
                            <div
                              key={index}
                              className="w-3 h-3 rounded-full border border-gray-300"
                              style={{ backgroundColor: color.hex }}
                              title={color.name}
                            />
                          ))}
                          {relatedProduct.colors.filter(color => color.available !== false).length > 4 && (
                            <span className="text-xs text-gray-500">
                              +{relatedProduct.colors.filter(color => color.available !== false).length - 4}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <p className="text-xl font-bold text-primary">
                      {formatPrice(relatedProduct.price)}
                    </p>
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