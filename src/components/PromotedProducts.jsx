import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';
import ProductPrice from './ProductPrice';
import PromotionBadge from './PromotionBadge';
import { useCart } from '../contexts/CartContext';
import { urlUtils } from '../utils/slugUtils';

const PromotedProducts = () => {
  const [promotedProducts, setPromotedProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();
  const { addItem } = useCart();

  useEffect(() => {
    const fetchPromotedProducts = async () => {
      try {
        setIsLoading(true);
        
        // Récupérer les produits avec promotions actives
        const { data: products, error } = await supabase
          .from('products')
          .select(`
            *,
            categories(*),
            reviews(rate),
            order_items(count)
          `)
          .eq('isActive', true)
          .eq('promotion_active', true)
          .not('promotion_percentage', 'is', null)
          .order('promotion_percentage', { ascending: false })
          .limit(8);
        
        if (error) throw error;
        
        // Calculer les statistiques pour chaque produit
        const productsWithStats = products?.map(product => {
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
        
        setPromotedProducts(productsWithStats);
      } catch (error) {
        console.error('Error fetching promoted products:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPromotedProducts();
  }, []);

  const handleAddToCart = (e, product) => {
    e.preventDefault();
    if (product.inventory > 0) {
      addItem(product);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
      </div>
    );
  }

  if (promotedProducts.length === 0) {
    return null; // Ne pas afficher la section s'il n'y a pas de promotions
  }

  return (
    <section className="py-12 bg-gradient-to-r from-orange-50 to-red-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl font-bold text-gray-900 mb-4"
          >
            🔥 Promotions en cours
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg text-gray-600 max-w-2xl mx-auto"
          >
            Découvrez nos offres spéciales avec des réductions exceptionnelles. 
            Profitez-en avant qu'il ne soit trop tard !
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4"
        >
          {promotedProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="group overflow-hidden rounded-lg bg-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <Link to={urlUtils.generateProductUrl(product)} className="block">
                <div className="h-56 overflow-hidden relative">
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
                    className="h-full w-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm"
                    style={{ display: 'none' }}
                  >
                    <div className="text-center">
                      <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center mb-2">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <span>Image non disponible</span>
                    </div>
                  </div>
                  <PromotionBadge product={product} size="sm" />
                  {product.inventory === 0 && (
                    <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                      <span className="bg-red-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                        Écoulé
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="p-5">
                  <div className="mb-2 text-sm text-blue-600">{product.categories?.name}</div>
                  <h3 className="mb-3 text-lg font-medium text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {product.name}
                  </h3>
                  
                  <div className="mb-3 flex items-center">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-4 w-4 ${i < Math.round(product.reviews?.avg || 0) ? 'fill-current' : ''}`} />
                      ))}
                    </div>
                    <span className="ml-2 text-sm text-gray-600">
                      ({product.reviews?.count || 0})
                    </span>
                  </div>
                  
                  <ProductPrice product={product} size="base" showEndDate={false} />
                  
                  <div className="mt-4">
                    <button
                      onClick={(e) => handleAddToCart(e, product)}
                      disabled={product.inventory === 0}
                      className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                        product.inventory === 0 
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {product.inventory === 0 ? 'Indisponible' : 'Ajouter au panier'}
                    </button>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-8"
        >
          <Link
            to="/products"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-300 transform hover:scale-105"
          >
            Voir toutes les promotions
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default PromotedProducts; 