import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  LineChart, 
  BarChart, 
  PieChart, 
  ArrowUpRight, 
  ArrowDownRight, 
  Eye, 
  Users, 
  TrendingUp,
  Calendar,
  Filter,
  Download
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';
import { 
  getDailyVisitsStats, 
  getMostViewedProducts,
  getProductViewsCount,
  getPageVisitsCount 
} from '../../services/analyticsService';
import AnalyticsChart from '../../components/analytics/AnalyticsChart';
import SiteStats from '../../components/analytics/SiteStats';
import DashboardOverview from '../../components/analytics/DashboardOverview';
import RealTimeChart from '../../components/analytics/RealTimeChart';
import AdvancedMetrics from '../../components/analytics/AdvancedMetrics';
import ThreeDChart from '../../components/analytics/3DChart';
import { generateTestAnalyticsData, clearTestAnalyticsData } from '../../utils/generateTestData';

const Analytics = () => {
  const { t, i18n } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30'); // days
  const [data, setData] = useState({
    revenue: { current: 0, previous: 0 },
    orders: { current: 0, previous: 0 },
    customers: { current: 0, previous: 0 },
    pageViews: { current: 0, previous: 0 },
    productViews: { current: 0, previous: 0 }
  });
  const [dailyStats, setDailyStats] = useState([]);
  const [mostViewedProducts, setMostViewedProducts] = useState([]);
  const [topPages, setTopPages] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setIsLoading(true);
        
        const days = parseInt(timeRange);
        const now = new Date();
        const currentPeriodStart = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
        const previousPeriodStart = new Date(currentPeriodStart.getTime() - (days * 24 * 60 * 60 * 1000));

        // Fetch delivered orders data
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('total, created_at, user_id')
          .eq('status', 'delivered')
          .gte('created_at', previousPeriodStart.toISOString())
          .order('created_at', { ascending: false });

        if (ordersError) throw ordersError;

        // Fetch users data
        const { data: usersData, error: usersError } = await supabase
          .from('profiles')
          .select('id, created_at')
          .gte('created_at', previousPeriodStart.toISOString());

        if (usersError) throw usersError;

        // Fetch analytics data for views and visits
        const [dailyStatsData, mostViewedData] = await Promise.all([
          getDailyVisitsStats(days * 2), // Get data for comparison
          getMostViewedProducts(10)
        ]);

        setDailyStats(dailyStatsData);
        setMostViewedProducts(mostViewedData);

        // Calculate periods
        const currentPeriodOrders = ordersData?.filter(order => 
          new Date(order.created_at) >= currentPeriodStart
        ) || [];

        const previousPeriodOrders = ordersData?.filter(order => 
          new Date(order.created_at) >= previousPeriodStart && 
          new Date(order.created_at) < currentPeriodStart
        ) || [];

        const currentPeriodUsers = usersData?.filter(user => 
          new Date(user.created_at) >= currentPeriodStart
        ) || [];

        const previousPeriodUsers = usersData?.filter(user => 
          new Date(user.created_at) >= previousPeriodStart && 
          new Date(user.created_at) < currentPeriodStart
        ) || [];

        // Calculate current and previous period stats for views
        const currentPeriodViews = dailyStatsData?.filter(stat => 
          new Date(stat.date) >= currentPeriodStart
        );

        const previousPeriodViews = dailyStatsData?.filter(stat => 
          new Date(stat.date) >= previousPeriodStart && 
          new Date(stat.date) < currentPeriodStart
        );

        // Fetch top pages
        const { data: pageVisitsData } = await supabase
          .from('page_visits')
          .select('page_path, created_at')
          .gte('created_at', currentPeriodStart.toISOString());

        const pageStats = {};
        pageVisitsData?.forEach(visit => {
          if (!pageStats[visit.page_path]) {
            pageStats[visit.page_path] = 0;
          }
          pageStats[visit.page_path]++;
        });

        const topPagesData = Object.entries(pageStats)
          .map(([path, count]) => ({ path, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        setTopPages(topPagesData);

        // Fetch recent delivered orders
        const { data: recentOrders } = await supabase
          .from('orders')
          .select(`
            id,
            total,
            status,
            created_at,
            user_id
          `)
          .eq('status', 'delivered')
          .order('created_at', { ascending: false })
          .limit(5);

        const { data: recentViews } = await supabase
          .from('product_views')
          .select(`
            created_at,
            products (name, image_url)
          `)
          .order('created_at', { ascending: false })
          .limit(5);

        setRecentActivity({
          orders: recentOrders || [],
          views: recentViews || []
        });

        setData({
          revenue: {
            current: currentPeriodOrders.reduce((sum, order) => sum + (order.total || 0), 0),
            previous: previousPeriodOrders.reduce((sum, order) => sum + (order.total || 0), 0)
          },
          orders: {
            current: currentPeriodOrders.length,
            previous: previousPeriodOrders.length
          },
          customers: {
            current: currentPeriodUsers.length,
            previous: previousPeriodUsers.length
          },
          pageViews: {
            current: currentPeriodViews?.reduce((sum, stat) => sum + stat.page_visits, 0) || 0,
            previous: previousPeriodViews?.reduce((sum, stat) => sum + stat.page_visits, 0) || 0
          },
          productViews: {
            current: currentPeriodViews?.reduce((sum, stat) => sum + stat.product_views, 0) || 0,
            previous: previousPeriodViews?.reduce((sum, stat) => sum + stat.product_views, 0) || 0
          }
        });
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [timeRange]);

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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 py-6 sm:space-y-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 sm:text-2xl">Analytics</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 sm:text-base">Vue d'ensemble de vos performances</p>
        </div>
        <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-x-4 sm:space-y-0">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          >
            <option value="7">7 derniers jours</option>
            <option value="30">30 derniers jours</option>
            <option value="90">90 derniers jours</option>
          </select>
          <button className="flex items-center justify-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 sm:justify-start">
            <Download className="h-4 w-4" />
            <span>Exporter</span>
          </button>
          {process.env.NODE_ENV === 'development' && (
            <div className="flex flex-col space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0">
              <button 
                onClick={generateTestAnalyticsData}
                className="flex items-center justify-center space-x-2 rounded-lg bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 sm:justify-start"
              >
                <span>Générer données test</span>
              </button>
              <button 
                onClick={clearTestAnalyticsData}
                className="flex items-center justify-center space-x-2 rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 sm:justify-start"
              >
                <span>Nettoyer données test</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modern Dashboard Overview */}
      <DashboardOverview />

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {/* Revenue */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg bg-white p-4 shadow-md sm:p-6"
        >
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-600 sm:text-sm">Revenus</p>
              <h3 className="text-lg font-bold text-gray-900 sm:text-xl lg:text-2xl">{formatCurrency(data.revenue.current)}</h3>
            </div>
            <div className="ml-4 rounded-full bg-blue-100 p-2 sm:p-3">
              <LineChart className="h-5 w-5 text-blue-600 sm:h-6 sm:w-6" />
            </div>
          </div>
          <div className="mt-3 flex items-center sm:mt-4">
            {calculateGrowth(data.revenue.current, data.revenue.previous) >= 0 ? (
              <ArrowUpRight className="h-3 w-3 text-green-500 sm:h-4 sm:w-4" />
            ) : (
              <ArrowDownRight className="h-3 w-3 text-red-500 sm:h-4 sm:w-4" />
            )}
            <span className={`ml-1 text-xs sm:text-sm ${
              calculateGrowth(data.revenue.current, data.revenue.previous) >= 0 
                ? 'text-green-500' 
                : 'text-red-500'
            }`}>
              {Math.abs(calculateGrowth(data.revenue.current, data.revenue.previous)).toFixed(1)}%
            </span>
            <span className="ml-1 text-xs text-gray-500 sm:text-sm">vs période précédente</span>
          </div>
        </motion.div>

        {/* Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-lg bg-white p-4 shadow-md sm:p-6"
        >
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-600 sm:text-sm">Commandes</p>
              <h3 className="text-lg font-bold text-gray-900 sm:text-xl lg:text-2xl">{data.orders.current}</h3>
            </div>
            <div className="ml-4 rounded-full bg-purple-100 p-2 sm:p-3">
              <BarChart className="h-5 w-5 text-purple-600 sm:h-6 sm:w-6" />
            </div>
          </div>
          <div className="mt-3 flex items-center sm:mt-4">
            {calculateGrowth(data.orders.current, data.orders.previous) >= 0 ? (
              <ArrowUpRight className="h-3 w-3 text-green-500 sm:h-4 sm:w-4" />
            ) : (
              <ArrowDownRight className="h-3 w-3 text-red-500 sm:h-4 sm:w-4" />
            )}
            <span className={`ml-1 text-xs sm:text-sm ${
              calculateGrowth(data.orders.current, data.orders.previous) >= 0 
                ? 'text-green-500' 
                : 'text-red-500'
            }`}>
              {Math.abs(calculateGrowth(data.orders.current, data.orders.previous)).toFixed(1)}%
            </span>
            <span className="ml-1 text-xs text-gray-500 sm:text-sm">vs période précédente</span>
          </div>
        </motion.div>

        {/* Customers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-lg bg-white p-4 shadow-md sm:p-6"
        >
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-600 sm:text-sm">Nouveaux clients</p>
              <h3 className="text-lg font-bold text-gray-900 sm:text-xl lg:text-2xl">{data.customers.current}</h3>
            </div>
            <div className="ml-4 rounded-full bg-green-100 p-2 sm:p-3">
              <Users className="h-5 w-5 text-green-600 sm:h-6 sm:w-6" />
            </div>
          </div>
          <div className="mt-3 flex items-center sm:mt-4">
            {calculateGrowth(data.customers.current, data.customers.previous) >= 0 ? (
              <ArrowUpRight className="h-3 w-3 text-green-500 sm:h-4 sm:w-4" />
            ) : (
              <ArrowDownRight className="h-3 w-3 text-red-500 sm:h-4 sm:w-4" />
            )}
            <span className={`ml-1 text-xs sm:text-sm ${
              calculateGrowth(data.customers.current, data.customers.previous) >= 0 
                ? 'text-green-500' 
                : 'text-red-500'
            }`}>
              {Math.abs(calculateGrowth(data.customers.current, data.customers.previous)).toFixed(1)}%
            </span>
            <span className="ml-1 text-xs text-gray-500 sm:text-sm">vs période précédente</span>
          </div>
        </motion.div>

        {/* Page Views */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-lg bg-white p-4 shadow-md sm:p-6"
        >
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-600 sm:text-sm">Visites de pages</p>
              <h3 className="text-lg font-bold text-gray-900 sm:text-xl lg:text-2xl">{data.pageViews.current.toLocaleString()}</h3>
            </div>
            <div className="ml-4 rounded-full bg-orange-100 p-2 sm:p-3">
              <TrendingUp className="h-5 w-5 text-orange-600 sm:h-6 sm:w-6" />
            </div>
          </div>
          <div className="mt-3 flex items-center sm:mt-4">
            {calculateGrowth(data.pageViews.current, data.pageViews.previous) >= 0 ? (
              <ArrowUpRight className="h-3 w-3 text-green-500 sm:h-4 sm:w-4" />
            ) : (
              <ArrowDownRight className="h-3 w-3 text-red-500 sm:h-4 sm:w-4" />
            )}
            <span className={`ml-1 text-xs sm:text-sm ${
              calculateGrowth(data.pageViews.current, data.pageViews.previous) >= 0 
                ? 'text-green-500' 
                : 'text-red-500'
            }`}>
              {Math.abs(calculateGrowth(data.pageViews.current, data.pageViews.previous)).toFixed(1)}%
            </span>
            <span className="ml-1 text-xs text-gray-500 sm:text-sm">vs période précédente</span>
          </div>
        </motion.div>

        {/* Product Views */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-lg bg-white p-4 shadow-md sm:p-6"
        >
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-600 sm:text-sm">Vues de produits</p>
              <h3 className="text-lg font-bold text-gray-900 sm:text-xl lg:text-2xl">{data.productViews.current.toLocaleString()}</h3>
            </div>
            <div className="ml-4 rounded-full bg-indigo-100 p-2 sm:p-3">
              <Eye className="h-5 w-5 text-indigo-600 sm:h-6 sm:w-6" />
            </div>
          </div>
          <div className="mt-3 flex items-center sm:mt-4">
            {calculateGrowth(data.productViews.current, data.productViews.previous) >= 0 ? (
              <ArrowUpRight className="h-3 w-3 text-green-500 sm:h-4 sm:w-4" />
            ) : (
              <ArrowDownRight className="h-3 w-3 text-red-500 sm:h-4 sm:w-4" />
            )}
            <span className={`ml-1 text-xs sm:text-sm ${
              calculateGrowth(data.productViews.current, data.productViews.previous) >= 0 
                ? 'text-green-500' 
                : 'text-red-500'
            }`}>
              {Math.abs(calculateGrowth(data.productViews.current, data.productViews.previous)).toFixed(1)}%
            </span>
            <span className="ml-1 text-xs text-gray-500 sm:text-sm">vs période précédente</span>
          </div>
        </motion.div>
      </div>

      {/* Global Site Statistics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-lg bg-white p-4 shadow-md sm:p-6"
      >
        <h3 className="mb-4 text-base font-medium text-gray-900 sm:text-lg">Statistiques globales du site</h3>
        <SiteStats />
      </motion.div>

      {/* Real-time Analytics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-1 gap-6 lg:grid-cols-2"
      >
        <RealTimeChart
          title="Visiteurs en temps réel"
          showVisitors={true}
          updateInterval={30000}
        />
        <RealTimeChart
          title="Commandes en temps réel"
          showOrders={true}
          showVisitors={false}
          updateInterval={60000}
        />
      </motion.div>

      {/* Advanced Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <AdvancedMetrics />
      </motion.div>

      {/* 3D Charts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="grid grid-cols-1 gap-6 lg:grid-cols-2"
      >
        <ThreeDChart
          type="line"
          title="Évolution des ventes 3D"
          data={{
            labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'],
            datasets: [{
              label: 'Ventes',
              data: [1200, 1900, 3000, 5000, 2000, 3000],
              borderColor: 'rgba(59, 130, 246, 0.8)',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              fill: true,
            }]
          }}
        />
        <ThreeDChart
          type="bar"
          title="Performance par catégorie 3D"
          data={{
            labels: ['Électronique', 'Vêtements', 'Livres', 'Sport', 'Maison'],
            datasets: [{
              label: 'Ventes',
              data: [65, 59, 80, 81, 56],
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
          }}
        />
      </motion.div>

      {/* Charts and Detailed Analytics */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Traffic Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-lg bg-white p-4 shadow-md sm:p-6"
        >
          <h3 className="mb-4 text-base font-medium text-gray-900 sm:text-lg">Trafic quotidien</h3>
          <div className="h-48 w-full sm:h-64">
            {dailyStats.length > 0 ? (
              <AnalyticsChart
                type="line"
                data={{
                  labels: dailyStats.slice(-7).map(stat => 
                    new Date(stat.date).toLocaleDateString('fr-FR', { 
                      day: 'numeric', 
                      month: 'short' 
                    })
                  ),
                  datasets: [
                    {
                      label: 'Visites de pages',
                      data: dailyStats.slice(-7).map(stat => stat.page_visits),
                      borderColor: 'rgb(59, 130, 246)',
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      tension: 0.4,
                    },
                    {
                      label: 'Vues de produits',
                      data: dailyStats.slice(-7).map(stat => stat.product_views),
                      borderColor: 'rgb(34, 197, 94)',
                      backgroundColor: 'rgba(34, 197, 94, 0.1)',
                      tension: 0.4,
                    },
                  ],
                }}
                options={{
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                    },
                  },
                  responsive: true,
                  maintainAspectRatio: false,
                }}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-gray-500">
                Aucune donnée disponible
              </div>
            )}
          </div>
        </motion.div>

        {/* Top Pages */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="rounded-lg bg-white p-4 shadow-md sm:p-6"
        >
          <h3 className="mb-4 text-base font-medium text-gray-900 sm:text-lg">Pages les plus visitées</h3>
          <div className="h-48 w-full sm:h-64">
            {topPages.length > 0 ? (
              <AnalyticsChart
                type="bar"
                data={{
                  labels: topPages.map(page => page.path === '/' ? 'Accueil' : page.path),
                  datasets: [
                    {
                      label: 'Visites',
                      data: topPages.map(page => page.count),
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
                    },
                  ],
                }}
                options={{
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                    },
                  },
                  responsive: true,
                  maintainAspectRatio: false,
                }}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-gray-500">
                Aucune donnée disponible
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Products and Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Most Viewed Products */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="rounded-lg bg-white p-4 shadow-md sm:p-6"
        >
          <h3 className="mb-4 text-base font-medium text-gray-900 sm:text-lg">Produits les plus vus</h3>
          <div className="space-y-3 sm:space-y-4">
            {mostViewedProducts.length > 0 ? (
              mostViewedProducts.map((item, index) => (
                <div key={item.product.id} className="flex items-center space-x-3">
                  <img
                    src={item.product.image_url}
                    alt={item.product.name}
                    className="h-10 w-10 rounded-lg object-cover sm:h-12 sm:w-12"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-gray-900 line-clamp-1 sm:text-sm">
                      {item.product.name}
                    </p>
                    <p className="text-xs text-gray-500">{item.views} vues</p>
                  </div>
                  <span className="text-xs font-medium text-gray-900 sm:text-sm">
                    {formatCurrency(item.product.price)}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500">Aucun produit vu</div>
            )}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="rounded-lg bg-white p-4 shadow-md sm:p-6"
        >
          <h3 className="mb-4 text-base font-medium text-gray-900 sm:text-lg">Activité récente</h3>
          <div className="space-y-3 sm:space-y-4">
            {recentActivity.orders.length > 0 || recentActivity.views.length > 0 ? (
              <>
                {recentActivity.orders.slice(0, 3).map((order) => (
                  <div key={order.id} className="flex items-center space-x-3">
                    <div className="rounded-full bg-green-100 p-2">
                      <Calendar className="h-3 w-3 text-green-600 sm:h-4 sm:w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-gray-900 sm:text-sm">
                        Nouvelle commande #{order.id.slice(0, 8)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatCurrency(order.total)} • {formatDate(order.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
                {recentActivity.views.slice(0, 2).map((view, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="rounded-full bg-blue-100 p-2">
                      <Eye className="h-3 w-3 text-blue-600 sm:h-4 sm:w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-gray-900 sm:text-sm">
                        Produit consulté
                      </p>
                      <p className="text-xs text-gray-500">
                        {view.products?.name} • {formatDate(view.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="text-center text-gray-500">Aucune activité récente</div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Analytics;