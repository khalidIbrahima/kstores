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
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Utilisateurs totaux',
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      color: 'blue',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-900',
      iconColor: 'text-blue-600'
    },
    {
      title: 'Commandes totales',
      value: stats.totalOrders.toLocaleString(),
      icon: ShoppingCart,
      color: 'purple',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-900',
      iconColor: 'text-purple-600'
    },
    {
      title: 'Revenus totaux',
      value: formatCurrency(stats.totalRevenue),
      icon: TrendingUp,
      color: 'green',
      bgColor: 'bg-green-50',
      textColor: 'text-green-900',
      iconColor: 'text-green-600'
    },
    {
      title: 'Vues de pages',
      value: stats.totalViews.toLocaleString(),
      icon: Eye,
      color: 'orange',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-900',
      iconColor: 'text-orange-600'
    },
    {
      title: 'Vues de produits',
      value: stats.totalProductViews.toLocaleString(),
      icon: Star,
      color: 'indigo',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-900',
      iconColor: 'text-indigo-600'
    },
    {
      title: 'Valeur moyenne commande',
      value: formatCurrency(stats.avgOrderValue),
      icon: Target,
      color: 'pink',
      bgColor: 'bg-pink-50',
      textColor: 'text-pink-900',
      iconColor: 'text-pink-600'
    },
    {
      title: 'Taux de conversion',
      value: `${stats.conversionRate.toFixed(2)}%`,
      icon: Globe,
      color: 'teal',
      bgColor: 'bg-teal-50',
      textColor: 'text-teal-900',
      iconColor: 'text-teal-600'
    },
    {
      title: 'Produits actifs',
      value: stats.activeProducts.toString(),
      icon: Clock,
      color: 'yellow',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-900',
      iconColor: 'text-yellow-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {statCards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`rounded-lg p-6 shadow-md ${card.bgColor}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{card.title}</p>
              <p className={`mt-2 text-2xl font-bold ${card.textColor}`}>{card.value}</p>
            </div>
            <div className={`rounded-full p-3 ${card.bgColor.replace('50', '100')}`}>
              <card.icon className={`h-6 w-6 ${card.iconColor}`} />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default SiteStats; 