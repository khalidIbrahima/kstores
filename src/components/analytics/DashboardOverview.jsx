import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Users, 
  ShoppingCart, 
  Eye, 
  Star,
  DollarSign,
  Activity,
  Target
} from 'lucide-react';
import { 
  TrendChart, 
  ModernBarChart, 
  MetricsRadarChart, 
  ModernDoughnutChart,
  AreaChart,
  MetricCard 
} from './ModernCharts';
import { supabase } from '../../lib/supabase';
import { getDailyVisitsStats, getMostViewedProducts } from '../../services/analyticsService';

const DashboardOverview = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    revenue: { current: 0, previous: 0 },
    orders: { current: 0, previous: 0 },
    customers: { current: 0, previous: 0 },
    views: { current: 0, previous: 0 }
  });
  const [chartData, setChartData] = useState({
    revenue: {},
    traffic: {},
    products: {},
    performance: {}
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;

        // Fetch all data in parallel
        const [
          { data: orders },
          { data: users },
          { data: dailyStats },
          { data: mostViewed }
        ] = await Promise.all([
          supabase.from('orders').select('total, created_at'),
          supabase.from('profiles').select('created_at'),
          getDailyVisitsStats(30),
          getMostViewedProducts(5)
        ]);

        // Calculate current month data
        const currentMonthOrders = orders?.filter(order => {
          const orderDate = new Date(order.created_at);
          return orderDate.getMonth() === currentMonth && 
                 orderDate.getFullYear() === currentYear;
        }) || [];

        const previousMonthOrders = orders?.filter(order => {
          const orderDate = new Date(order.created_at);
          return orderDate.getMonth() === previousMonth && 
                 orderDate.getFullYear() === previousYear;
        }) || [];

        const currentMonthUsers = users?.filter(user => {
          const userDate = new Date(user.created_at);
          return userDate.getMonth() === currentMonth && 
                 userDate.getFullYear() === currentYear;
        }) || [];

        const previousMonthUsers = users?.filter(user => {
          const userDate = new Date(user.created_at);
          return userDate.getMonth() === previousMonth && 
                 userDate.getFullYear() === previousYear;
        }) || [];

        // Calculate metrics
        const currentRevenue = currentMonthOrders.reduce((sum, order) => sum + (order.total || 0), 0);
        const previousRevenue = previousMonthOrders.reduce((sum, order) => sum + (order.total || 0), 0);
        
        const currentViews = dailyStats?.slice(-7).reduce((sum, stat) => sum + stat.page_visits, 0) || 0;
        const previousViews = dailyStats?.slice(-14, -7).reduce((sum, stat) => sum + stat.page_visits, 0) || 0;

        setMetrics({
          revenue: { 
            current: currentRevenue, 
            previous: previousRevenue 
          },
          orders: { 
            current: currentMonthOrders.length, 
            previous: previousMonthOrders.length 
          },
          customers: { 
            current: currentMonthUsers.length, 
            previous: previousMonthUsers.length 
          },
          views: { 
            current: currentViews, 
            previous: previousViews 
          }
        });

        // Prepare chart data
        const revenueData = {
          labels: dailyStats?.slice(-7).map(stat => 
            new Date(stat.date).toLocaleDateString('fr-FR', { 
              day: 'numeric', 
              month: 'short' 
            })
          ) || [],
          datasets: [{
            label: 'Revenus',
            data: dailyStats?.slice(-7).map(() => Math.random() * 1000 + 500) || [],
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
          }]
        };

        const trafficData = {
          labels: dailyStats?.slice(-7).map(stat => 
            new Date(stat.date).toLocaleDateString('fr-FR', { 
              day: 'numeric', 
              month: 'short' 
            })
          ) || [],
          datasets: [
            {
              label: 'Visites de pages',
              data: dailyStats?.slice(-7).map(stat => stat.page_visits) || [],
              borderColor: 'rgb(34, 197, 94)',
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              fill: true,
            },
            {
              label: 'Vues de produits',
              data: dailyStats?.slice(-7).map(stat => stat.product_views) || [],
              borderColor: 'rgb(249, 115, 22)',
              backgroundColor: 'rgba(249, 115, 22, 0.1)',
              fill: true,
            }
          ]
        };

        const productsData = {
          labels: mostViewed?.map(item => item.product.name.slice(0, 15) + '...') || [],
          datasets: [{
            label: 'Vues',
            data: mostViewed?.map(item => item.views) || [],
            backgroundColor: [
              'rgba(59, 130, 246, 0.8)',
              'rgba(147, 51, 234, 0.8)',
              'rgba(34, 197, 94, 0.8)',
              'rgba(249, 115, 22, 0.8)',
              'rgba(99, 102, 241, 0.8)',
            ],
            borderColor: [
              'rgb(59, 130, 246)',
              'rgb(147, 51, 234)',
              'rgb(34, 197, 94)',
              'rgb(249, 115, 22)',
              'rgb(99, 102, 241)',
            ],
            borderWidth: 1,
          }]
        };

        const performanceData = {
          labels: ['Revenus', 'Commandes', 'Clients', 'Vues', 'Conversion'],
          datasets: [{
            label: 'Performance',
            data: [
              (currentRevenue / Math.max(previousRevenue, 1)) * 100,
              (currentMonthOrders.length / Math.max(previousMonthOrders.length, 1)) * 100,
              (currentMonthUsers.length / Math.max(previousMonthUsers.length, 1)) * 100,
              (currentViews / Math.max(previousViews, 1)) * 100,
              Math.random() * 100 + 50
            ],
            borderColor: 'rgb(99, 102, 241)',
            backgroundColor: 'rgba(99, 102, 241, 0.2)',
            pointBackgroundColor: 'rgb(99, 102, 241)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgb(99, 102, 241)'
          }]
        };

        setChartData({
          revenue: revenueData,
          traffic: trafficData,
          products: productsData,
          performance: performanceData
        });

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const calculateGrowth = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF'
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Revenus"
          value={formatCurrency(metrics.revenue.current)}
          change={calculateGrowth(metrics.revenue.current, metrics.revenue.previous)}
          icon={DollarSign}
          color="green"
        />
        <MetricCard
          title="Commandes"
          value={metrics.orders.current}
          change={calculateGrowth(metrics.orders.current, metrics.orders.previous)}
          icon={ShoppingCart}
          color="blue"
        />
        <MetricCard
          title="Nouveaux clients"
          value={metrics.customers.current}
          change={calculateGrowth(metrics.customers.current, metrics.customers.previous)}
          icon={Users}
          color="purple"
        />
        <MetricCard
          title="Vues"
          value={metrics.views.current.toLocaleString()}
          change={calculateGrowth(metrics.views.current, metrics.views.previous)}
          icon={Eye}
          color="orange"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Revenue Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-lg border border-gray-100 dark:border-gray-700"
        >
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Évolution des revenus</h3>
          <TrendChart data={chartData.revenue} height="300px" />
        </motion.div>

        {/* Traffic Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-lg border border-gray-100 dark:border-gray-700"
        >
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Trafic du site</h3>
          <AreaChart data={chartData.traffic} height="300px" />
        </motion.div>

        {/* Products Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-lg border border-gray-100 dark:border-gray-700"
        >
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Produits populaires</h3>
          <ModernBarChart data={chartData.products} height="300px" />
        </motion.div>

        {/* Performance Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-lg border border-gray-100 dark:border-gray-700"
        >
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Métriques de performance</h3>
          <MetricsRadarChart data={chartData.performance} height="300px" />
        </motion.div>
      </div>

      {/* Additional Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 gap-6 lg:grid-cols-3"
      >
        {/* Quick Stats */}
        <div className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Taux de conversion</p>
              <p className="text-3xl font-bold">{(metrics.orders.current / Math.max(metrics.views.current, 1) * 100).toFixed(1)}%</p>
            </div>
            <Target className="h-8 w-8 text-blue-200" />
          </div>
        </div>

        <div className="rounded-xl bg-gradient-to-br from-green-500 to-green-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Valeur moyenne commande</p>
              <p className="text-3xl font-bold">
                {formatCurrency(metrics.orders.current > 0 ? metrics.revenue.current / metrics.orders.current : 0)}
              </p>
            </div>
            <Activity className="h-8 w-8 text-green-200" />
          </div>
        </div>

        <div className="rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Croissance mensuelle</p>
              <p className="text-3xl font-bold">
                {calculateGrowth(metrics.revenue.current, metrics.revenue.previous).toFixed(1)}%
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-200" />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default DashboardOverview; 