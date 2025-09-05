import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Truck, ShieldCheck, Heart, Share2, Minus, Plus, Eye } from 'lucide-react';
import EnhancedShareButtons from '../components/EnhancedShareButtons';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useCart } from '../contexts/CartContext';
import { useFavorites } from '../contexts/FavoritesContext';
import toast from 'react-hot-toast';
import ProductImageCarousel from '../components/ProductImageCarousel';
import { formatPrice } from '../utils/currency';
import LocationPicker from '../components/LocationPicker';
import OrderLocationMap from '../components/OrderLocationMap';
import ServerSideMeta from '../components/ServerSideMeta';
import ProductReviewList from '../components/ProductReviewList';
import { useAuth } from '../contexts/AuthContext';
import { formatDescriptionFull } from '../utils/formatDescription.jsx';
import { useProductAnalytics, useProductStats } from '../hooks/useAnalytics';
import ProductStats from '../components/analytics/ProductStats';
import ProductPrice from '../components/ProductPrice';
import PromotionBadge from '../components/PromotionBadge';
import { urlUtils } from '../utils/slugUtils';
import { scrollToTop } from '../utils/scrollUtils';
import { debugProductSocialMeta, testSocialMetaValidation } from '../utils/debugSocialMeta';

const ProductPage = () => {
  const { id: idOrSlug } = useParams();
  const [product, setProduct] = useState(null);
  const [productId, setProductId] = useState(null);
  const [category, setCategory] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedProperties, setSelectedProperties] = useState({});
  const { addItem } = useCart();
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites();
  const { t } = useTranslation();
  const [userRating, setUserRating] = useState(5);
  const [userComment, setUserComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [hasUserReviewed, setHasUserReviewed] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const { user } = useAuth();
  
  // Tracking des vues de produits (utilise l'ID résolu)
  useProductAnalytics(productId);
  const { viewsCount, isLoading: viewsLoading } = useProductStats(productId);

  // Fonction pour gérer l'affichage de la description
  const getDisplayDescription = (description) => {
    if (!description) return '';
    
    const MAX_LENGTH = 300; // Nombre de caractères maximum avant "Voir plus"
    
    if (description.length <= MAX_LENGTH || showFullDescription) {
      return description; // Retourner la description complète
    }
    
    // Tronquer au dernier espace avant MAX_LENGTH pour éviter de couper les mots
    const truncated = description.substring(0, MAX_LENGTH);
    const lastSpace = truncated.lastIndexOf(' ');
    const finalText = lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated;
    
    return finalText + '...';
  };

  useEffect(() => {
    // Faire défiler vers le haut quand on change de produit
    scrollToTop({ behavior: 'instant' });
    
    const fetchProduct = async () => {
      if (!idOrSlug) return;
      
      try {
        setIsLoading(true);
        
        // Déterminer si c'est un ID UUID ou un slug
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
        let productQuery;
        
        if (isUUID) {
          // C'est un UUID, recherche directe par ID
          productQuery = supabase
            .from('products')
            .select(`
              *,
              reviews (
                rate
              )
            `)
            .eq('id', idOrSlug);
        } else {
          // C'est potentiellement un slug
          // D'abord essayer de trouver par slug exact
          productQuery = supabase
            .from('products')
            .select(`
              *,
              reviews (
                rate
              )
            `)
            .eq('slug', idOrSlug);
        }
        
        let { data: productData, error: productError } = await productQuery.single();
        
        // Si pas trouvé et c'est un slug, essayer d'extraire l'ID court
        if (productError && !isUUID) {
          const shortId = urlUtils.extractIdFromProductSlug(idOrSlug);
          
          if (shortId) {
            // Chercher par correspondance partielle d'ID
            const { data: products, error: searchError } = await supabase
              .from('products')
              .select(`
                *,
                reviews (
                  rate
                )
              `)
              .ilike('id', `%${shortId}`);
            
            if (!searchError && products && products.length > 0) {
              productData = products[0];
              productError = null;
            }
          }
        }
        
        if (productError) throw productError;
        if (!productData) throw new Error('Product not found');
        
        // Calculate average rating and review count
        const reviews = productData.reviews || [];
        const avgRating = reviews.length > 0 
          ? reviews.reduce((acc, review) => acc + review.rate, 0) / reviews.length 
          : 0;
        const reviewCount = reviews.length;

        const productWithRating = {
          ...productData,
          avgRating,
          reviewCount
        };
        
        setProduct(productWithRating);
        setProductId(productData.id);
        
        // Vérifier si l'utilisateur a déjà laissé un avis
        if (user) {
          const { data: userReview } = await supabase
            .from('reviews')
            .select('*')
            .eq('productId', productData.id)
            .eq('userId', user.id)
            .maybeSingle();
          
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
            .neq('id', productData.id)
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
  }, [idOrSlug, user]);

  const handleAddToCart = () => {
    if (product && product.inventory > 0) {
      // Vérifier si une couleur est requise mais non sélectionnée
      if (product.colors && product.colors.length > 0 && !selectedColor) {
        toast.error(t('product.colorRequired'));
        return;
      }
      
      // Vérifier si des propriétés requises ne sont pas sélectionnées
      if (product.properties && product.properties.length > 0) {
        const missingRequiredProperties = product.properties.filter(
          prop => prop.required && !selectedProperties[prop.name]
        );
        
        if (missingRequiredProperties.length > 0) {
          toast.error(`Veuillez sélectionner: ${missingRequiredProperties.map(p => p.name).join(', ')}`);
          return;
        }
      }
      
      addItem(product, quantity, selectedColor, selectedProperties);
      setQuantity(1);
      setSelectedColor(null);
      setSelectedProperties({});
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
        <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-gray-100">{t('product.notFound')}</h2>
        <p className="mb-8 text-gray-600 dark:text-gray-400">{t('product.notFoundDesc')}</p>
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

  // Fonction de debug pour les métadonnées sociales (développement uniquement)
  const handleDebugSocialMeta = () => {
    if (process.env.NODE_ENV === 'development') {
      debugProductSocialMeta(product, category);
      testSocialMetaValidation();
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <ServerSideMeta 
        pageType="product"
        product={product}
        category={category}
      />
      {/* Breadcrumbs */}
      <nav className="mb-8 flex text-sm">
        <Link to="/" className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-blue-400">{t('nav.home')}</Link>
        <span className="mx-2 text-gray-400 dark:text-gray-500">/</span>
        {category && (
          <>
            <Link to={`/category/${category.slug}`} className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-blue-400">
              {category.name}
            </Link>
            <span className="mx-2 text-gray-400 dark:text-gray-500">/</span>
          </>
        )}
        <span className="text-gray-900 dark:text-gray-100 font-medium">{product.name}</span>
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
          <h1 className="mb-4 text-3xl font-bold text-gray-900 dark:text-gray-100">{product.name}</h1>
          
          {/* Colors Display */}
          {product.colors && product.colors.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Couleurs disponibles</label>
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
                    <span className="text-xs text-gray-600 dark:text-gray-400">{color.name}</span>
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

          {/* Properties Display */}
          {product.properties && product.properties.length > 0 && (
            <div className="mb-6 space-y-4">
              {product.properties.map((property, index) => (
                <div key={index} className="space-y-2">
                  <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                    {property.name}
                    {property.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  
                  {property.type === 'select' && (
                    <div className="flex flex-wrap gap-2">
                      {property.values.map((value, valueIndex) => (
                        <button
                          key={valueIndex}
                          onClick={() => setSelectedProperties(prev => ({
                            ...prev,
                            [property.name]: value
                          }))}
                          className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                            selectedProperties[property.name] === value
                              ? 'border-primary bg-primary text-white'
                              : 'border-gray-300 bg-white text-text-dark hover:border-primary hover:bg-primary hover:text-white'
                          }`}
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                  )}

                  {property.type === 'image' && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {(property.imageOptions || []).map((option, optionIndex) => (
                        <button
                          key={optionIndex}
                          onClick={() => setSelectedProperties(prev => ({
                            ...prev,
                            [property.name]: option.name,
                            [`${property.name}_url`]: option.url
                          }))}
                          className={`relative group rounded-lg border-2 overflow-hidden transition-all ${
                            selectedProperties[property.name] === option.name
                              ? 'border-primary ring-2 ring-primary ring-opacity-50'
                              : 'border-gray-300 hover:border-primary'
                          }`}
                        >
                          <div className="aspect-square">
                            <img
                              src={option.url}
                              alt={option.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                            <div 
                              className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs"
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
                          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs p-2 text-center">
                            {option.name}
                          </div>
                          {selectedProperties[property.name] === option.name && (
                            <div className="absolute top-2 right-2 bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {property.type === 'text' && (
                    <input
                      type="text"
                      placeholder={`Entrez ${property.name.toLowerCase()}`}
                      value={selectedProperties[property.name] || ''}
                      onChange={(e) => setSelectedProperties(prev => ({
                        ...prev,
                        [property.name]: e.target.value
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  )}
                  
                  {property.type === 'number' && (
                    <input
                      type="number"
                      placeholder={`Entrez ${property.name.toLowerCase()}`}
                      value={selectedProperties[property.name] || ''}
                      onChange={(e) => setSelectedProperties(prev => ({
                        ...prev,
                        [property.name]: e.target.value
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  )}
                  
                  {property.type === 'boolean' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedProperties(prev => ({
                          ...prev,
                          [property.name]: 'Oui'
                        }))}
                        className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                          selectedProperties[property.name] === 'Oui'
                            ? 'border-primary bg-primary text-white'
                            : 'border-gray-300 bg-white text-text-dark hover:border-primary'
                        }`}
                      >
                        Oui
                      </button>
                      <button
                        onClick={() => setSelectedProperties(prev => ({
                          ...prev,
                          [property.name]: 'Non'
                        }))}
                        className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                          selectedProperties[property.name] === 'Non'
                            ? 'border-primary bg-primary text-white'
                            : 'border-gray-300 bg-white text-text-dark hover:border-primary'
                        }`}
                      >
                        Non
                      </button>
                    </div>
                  )}
                  
                  {selectedProperties[property.name] && (
                    <p className="text-sm text-primary font-medium">
                      {property.name} sélectionné(e) : {selectedProperties[property.name]}
                    </p>
                  )}
                </div>
              ))}
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
              <span className="ml-2 text-gray-600 dark:text-gray-400">
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
              <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-100">
                {t('product.quantity')}
              </label>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="rounded-lg p-2 transition-colors bg-background-light text-text-dark hover:bg-background hover:text-primary"
                >
                  <Minus className="h-5 w-5" />
                </button>
                <span className="text-lg font-medium text-gray-900 dark:text-gray-100">{quantity}</span>
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
            <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-gray-100">
              {t('product.description')}
            </h2>
            <div className="text-gray-700 dark:text-gray-300 leading-relaxed">
              <div className="text-base text-readable">
                {showFullDescription ? 
                  <div>{formatDescriptionFull(product.description)}</div> : 
                  <div>{getDisplayDescription(product.description)}</div>
                }
              </div>
              
              {/* Bouton Voir plus / Voir moins */}
              {product.description && product.description.length > 300 && (
                <button
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className="mt-3 inline-flex items-center text-sm font-medium text-primary hover:text-primary-dark dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                >
                  {showFullDescription ? (
                    <>
                      <Minus className="w-4 h-4 mr-1" />
                      Voir moins
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-1" />
                      Voir plus
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Features */}
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex items-center space-x-3 rounded-lg bg-gray-50 dark:bg-gray-800 p-4 border border-gray-200 dark:border-gray-700">
              <Truck className="h-6 w-6 text-primary dark:text-blue-400" />
              <div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100">{t('product.freeShipping')}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('product.freeShippingDesc')}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 rounded-lg bg-gray-50 dark:bg-gray-800 p-4 border border-gray-200 dark:border-gray-700">
              <ShieldCheck className="h-6 w-6 text-green-500 dark:text-green-400" />
              <div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100">{t('product.securePayment')}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('product.securePaymentDesc')}</p>
              </div>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="mt-12">
            <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-gray-100">{t('product.reviews')}</h2>
            
            {/* Review List */}
            <ProductReviewList productId={product.id} />
          </div>

          {/* Share Section */}
          <div className="mt-12">
            <EnhancedShareButtons 
              title={product.name}
              description={product.description}
              image={product.image_url}
              url={window.location.href}
              variant="default"
            />
          </div>
        </motion.div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="mt-16 px-4 sm:px-6 py-8 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
          <h2 className="mb-8 text-2xl font-bold text-gray-900 dark:text-white">{t('product.relatedProducts')}</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProducts.map((relatedProduct) => (
              <motion.div
                key={relatedProduct.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="group overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow-md transition-all hover:shadow-lg hover:shadow-gray-500/25 dark:hover:shadow-gray-900/50 border border-gray-200 dark:border-gray-600"
              >
                <Link to={urlUtils.generateProductUrl(relatedProduct)} className="block overflow-hidden hover:no-underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 rounded-lg">
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
                      className="h-full w-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 text-xs"
                      style={{ display: 'none' }}
                    >
                      <div className="text-center">
                        <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center mb-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <span>Image non disponible</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-5 bg-white dark:bg-gray-800">
                    <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white line-clamp-2">
                      {relatedProduct.name}
                    </h3>
                    
                    {/* Colors Display for Related Products */}
                    {relatedProduct.colors && relatedProduct.colors.length > 0 && (
                      <div className="mb-3">
                        <div className="flex items-center gap-1.5">
                          {relatedProduct.colors.filter(color => color.available !== false).slice(0, 4).map((color, index) => (
                            <div
                              key={index}
                              className="w-3 h-3 rounded-full border border-gray-300 dark:border-gray-500"
                              style={{ backgroundColor: color.hex }}
                              title={color.name}
                            />
                          ))}
                          {relatedProduct.colors.filter(color => color.available !== false).length > 4 && (
                            <span className="text-xs text-gray-500 dark:text-gray-300">
                              +{relatedProduct.colors.filter(color => color.available !== false).length - 4}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <p className="text-xl font-bold text-primary dark:text-blue-400 mt-1">
                      {formatPrice(relatedProduct.price)}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Floating Share Button */}
      <EnhancedShareButtons 
        title={product?.name}
        description={product?.description}
        image={product?.image_url}
        url={window.location.href}
        variant="floating"
      />

      {/* Debug Button (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <button
          onClick={handleDebugSocialMeta}
          className="fixed bottom-20 right-4 bg-red-500 hover:bg-red-600 text-white p-3 rounded-full shadow-lg z-50"
          title="Debug Social Meta (Dev Only)"
        >
          🔍
        </button>
      )}
    </div>
  );
};

export default ProductPage;