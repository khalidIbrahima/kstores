import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  ShoppingCart, 
  Eye, 
  Star, 
  TrendingUp, 
  Globe,
  Clock,
  Target
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getDailyVisitsStats } from '../../services/analyticsService';

const SiteStats = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalViews: 0,
    totalProductViews: 0,
    avgOrderValue: 0,
    conversionRate: 0,
    activeProducts: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSiteStats = async () => {
      try {
        setIsLoading(true);
        
        // Fetch all data in parallel
        const [
          { data: users },
          { data: orders },
          { data: products },
          { data: dailyStats }
        ] = await Promise.all([
          supabase.from('profiles').select('id'),
          supabase.from('orders').select('total, status').eq('status', 'delivered'),
          supabase.from('products').select('id, isActive'),
          getDailyVisitsStats(30)
        ]);

        // Calculate stats
        const totalUsers = users?.length || 0;
        const totalOrders = orders?.length || 0;
        const totalRevenue = orders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        const activeProducts = products?.filter(p => p.isActive).length || 0;
        
        const totalViews = dailyStats?.reduce((sum, stat) => sum + stat.page_visits, 0) || 0;
        const totalProductViews = dailyStats?.reduce((sum, stat) => sum + stat.product_views, 0) || 0;
        const conversionRate = totalViews > 0 ? (totalOrders / totalViews) * 100 : 0;

        setStats({
          totalUsers,
          totalOrders,
          totalRevenue,
          totalViews,
          totalProductViews,
          avgOrderValue,
          conversionRate,
          activeProducts
        });
      } catch (error) {
        console.error('Error fetching site stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSiteStats();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF'
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-500 dark:border-blue-400"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Utilisateurs totaux',
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      color: 'blue',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      textColor: 'text-blue-900 dark:text-blue-100',
      iconColor: 'text-blue-600 dark:text-blue-400'
    },
    {
      title: 'Commandes totales',
      value: stats.totalOrders.toLocaleString(),
      icon: ShoppingCart,
      color: 'purple',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      textColor: 'text-purple-900 dark:text-purple-100',
      iconColor: 'text-purple-600 dark:text-purple-400'
    },
    {
      title: 'Revenus totaux',
      value: formatCurrency(stats.totalRevenue),
      icon: TrendingUp,
      color: 'green',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      textColor: 'text-green-900 dark:text-green-100',
      iconColor: 'text-green-600 dark:text-green-400'
    },
    {
      title: 'Vues de pages',
      value: stats.totalViews.toLocaleString(),
      icon: Eye,
      color: 'orange',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      textColor: 'text-orange-900 dark:text-orange-100',
      iconColor: 'text-orange-600 dark:text-orange-400'
    },
    {
      title: 'Vues de produits',
      value: stats.totalProductViews.toLocaleString(),
      icon: Star,
      color: 'indigo',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
      textColor: 'text-indigo-900 dark:text-indigo-100',
      iconColor: 'text-indigo-600 dark:text-indigo-400'
    },
    {
      title: 'Valeur moyenne commande',
      value: formatCurrency(stats.avgOrderValue),
      icon: Target,
      color: 'pink',
      bgColor: 'bg-pink-50 dark:bg-pink-900/20',
      textColor: 'text-pink-900 dark:text-pink-100',
      iconColor: 'text-pink-600 dark:text-pink-400'
    },
    {
      title: 'Taux de conversion',
      value: `${stats.conversionRate.toFixed(2)}%`,
      icon: Globe,
      color: 'teal',
      bgColor: 'bg-teal-50 dark:bg-teal-900/20',
      textColor: 'text-teal-900 dark:text-teal-100',
      iconColor: 'text-teal-600 dark:text-teal-400'
    },
    {
      title: 'Produits actifs',
      value: stats.activeProducts.toString(),
      icon: Clock,
      color: 'yellow',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      textColor: 'text-yellow-900 dark:text-yellow-100',
      iconColor: 'text-yellow-600 dark:text-yellow-400'
    }
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {statCards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`rounded-lg p-4 sm:p-6 shadow-md border border-gray-200 dark:border-gray-700 ${card.bgColor}`}
        >
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">{card.title}</p>
              <p className={`mt-1 sm:mt-2 text-lg sm:text-2xl font-bold ${card.textColor} truncate`}>{card.value}</p>
            </div>
            <div className={`rounded-full p-2 sm:p-3 flex-shrink-0 ${card.bgColor.replace('50', '100').replace('dark:bg-', 'dark:bg-').replace('/20', '/40')}`}>
              <card.icon className={`h-4 w-4 sm:h-6 sm:w-6 ${card.iconColor}`} />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default SiteStats; 