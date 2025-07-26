import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, TrendingUp, TrendingDown, Star } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getProductViewsCount } from '../../services/analyticsService';

const ProductStats = ({ productId }) => {
  const [stats, setStats] = useState({
    views: 0,
    reviews: 0,
    avgRating: 0,
    orders: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!productId) return;
      
      try {
        setIsLoading(true);
        
        // Fetch views count
        const viewsCount = await getProductViewsCount(productId);
        
        // Fetch reviews
        const { data: reviews } = await supabase
          .from('reviews')
          .select('rate')
          .eq('product_id', productId);
        
        // Fetch orders count
        const { data: orderItems } = await supabase
          .from('order_items')
          .select('quantity')
          .eq('product_id', productId);
        
        const avgRating = reviews?.length > 0 
          ? reviews.reduce((acc, review) => acc + review.rate, 0) / reviews.length 
          : 0;
        
        const totalOrders = orderItems?.reduce((acc, item) => acc + item.quantity, 0) || 0;
        
        setStats({
          views: viewsCount,
          reviews: reviews?.length || 0,
          avgRating,
          orders: totalOrders
        });
      } catch (error) {
        console.error('Error fetching product stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [productId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-lg bg-blue-50 p-4"
      >
        <div className="flex items-center space-x-2">
          <Eye className="h-5 w-5 text-blue-600" />
          <span className="text-sm font-medium text-blue-900">Vues</span>
        </div>
        <p className="mt-2 text-2xl font-bold text-blue-900">{stats.views}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="rounded-lg bg-green-50 p-4"
      >
        <div className="flex items-center space-x-2">
          <Star className="h-5 w-5 text-green-600" />
          <span className="text-sm font-medium text-green-900">Avis</span>
        </div>
        <p className="mt-2 text-2xl font-bold text-green-900">{stats.reviews}</p>
        {stats.avgRating > 0 && (
          <p className="text-sm text-green-700">{stats.avgRating.toFixed(1)}/5</p>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="rounded-lg bg-purple-50 p-4"
      >
        <div className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5 text-purple-600" />
          <span className="text-sm font-medium text-purple-900">Commandes</span>
        </div>
        <p className="mt-2 text-2xl font-bold text-purple-900">{stats.orders}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="rounded-lg bg-orange-50 p-4"
      >
        <div className="flex items-center space-x-2">
          <TrendingDown className="h-5 w-5 text-orange-600" />
          <span className="text-sm font-medium text-orange-900">Taux de conversion</span>
        </div>
        <p className="mt-2 text-2xl font-bold text-orange-900">
          {stats.views > 0 ? ((stats.orders / stats.views) * 100).toFixed(1) : 0}%
        </p>
      </motion.div>
    </div>
  );
};

export default ProductStats; 