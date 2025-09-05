import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  ShoppingBag, 
  Users, 
  DollarSign, 
  Package,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Activity,
  Zap,
  Clock,
  CheckCircle,
  XCircle,
  Truck
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { 
  getTotalViews, 
  getTotalVisits, 
  getDailyStats, 
  getDailyVisits, 
  getTopViewedProducts 
} from '../../services/analyticsService';
import SiteStats from '../../components/analytics/SiteStats';
import RealTimeChart from '../../components/analytics/RealTimeChart';
import AdvancedMetrics from '../../components/analytics/AdvancedMetrics';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, BarElement } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const Dashboard = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalCustomers: 0,
    totalRevenue: 0,
    totalProducts: 0,
    totalViews: 0,
    totalVisits: 0,
    recentOrders: [],
    topProducts: [],
    salesData: [],
    orderGrowth: 0,
    revenueGrowth: 0,
    viewsGrowth: 0,
    visitsGrowth: 0,
    ordersByStatus: {
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0
    }
  });
  const [analyticsData, setAnalyticsData] = useState({
    dailyViews: [],
    dailyVisits: [],
    topViewedProducts: [],
    recentActivity: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState(7); // 7, 30, 90

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch all orders for status breakdown
        const { data: allOrders, error: allOrdersError } = await supabase
          .from('orders')
          .select('status, created_at')
          .order('created_at', { ascending: false });

        if (allOrdersError) throw allOrdersError;

        // Calculate orders by status
        const ordersByStatus = {
          pending: 0,
          processing: 0,
          shipped: 0,
          delivered: 0,
          cancelled: 0
        };

        allOrders?.forEach(order => {
          const status = order.status?.toLowerCase();
          if (ordersByStatus.hasOwnProperty(status)) {
            ordersByStatus[status]++;
          }
        });

        // Fetch delivered orders count and data
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (
              quantity,
              price,
              products (
                name,
                image_url
              )
            )
          `)
          .eq('status', 'delivered')
          .order('created_at', { ascending: false });

        if (ordersError) throw ordersError;

        // Calculate total revenue and process orders data
        const totalRevenue = orders?.reduce((sum, order) => sum + order.total, 0) || 0;

        // Get current and previous month orders for growth calculation
        const now = new Date();
        const currentMonthOrders = orders?.filter(order => {
          const orderDate = new Date(order.created_at);
          return orderDate.getMonth() === now.getMonth();
        });

        const lastMonthOrders = orders?.filter(order => {
          const orderDate = new Date(order.created_at);
          return orderDate.getMonth() === now.getMonth() - 1;
        });

        // Calculate growth rates
        const orderGrowth = lastMonthOrders?.length 
          ? ((currentMonthOrders?.length - lastMonthOrders?.length) / lastMonthOrders?.length) * 100 
          : 0;

        const currentRevenue = currentMonthOrders?.reduce((sum, order) => sum + order.total, 0) || 0;
        const lastRevenue = lastMonthOrders?.reduce((sum, order) => sum + order.total, 0) || 0;
        const revenueGrowth = lastRevenue 
          ? ((currentRevenue - lastRevenue) / lastRevenue) * 100 
          : 0;

        // Fetch customers count (authenticated users)
        const { count: customersCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact' });

        // Fetch guest customers count
        const { data: guestOrders } = await supabase
          .from('orders')
          .select('shipping_address')
          .is('user_id', null);

        // Count unique guest customers by email
        const guestEmails = new Set();
        guestOrders?.forEach(order => {
          if (order.shipping_address?.email) {
            guestEmails.add(order.shipping_address.email);
          }
        });
        const guestCustomersCount = guestEmails.size;

        // Fetch products with inventory info
        const { data: products } = await supabase
          .from('products')
          .select('*')
          .order('inventory', { ascending: true });

        // Fetch analytics data
        const [totalViews, totalVisits, dailyViews, dailyVisits, topViewedProducts] = await Promise.all([
          getTotalViews(),
          getTotalVisits(),
          getDailyStats(period),
          getDailyVisits(period),
          getTopViewedProducts(10)
        ]);

        // Calculate analytics growth rates
        const currentMonthViews = dailyViews.filter(day => {
          const date = new Date(day.date);
          return date.getMonth() === now.getMonth();
        }).reduce((sum, day) => sum + day.views, 0);

        const lastMonthViews = dailyViews.filter(day => {
          const date = new Date(day.date);
          return date.getMonth() === now.getMonth() - 1;
        }).reduce((sum, day) => sum + day.views, 0);

        const viewsGrowth = lastMonthViews 
          ? ((currentMonthViews - lastMonthViews) / lastMonthViews) * 100 
          : 0;

        const currentMonthVisits = dailyVisits.filter(day => {
          const date = new Date(day.date);
          return date.getMonth() === now.getMonth();
        }).reduce((sum, day) => sum + day.visits, 0);

        const lastMonthVisits = dailyVisits.filter(day => {
          const date = new Date(day.date);
          return date.getMonth() === now.getMonth() - 1;
        }).reduce((sum, day) => sum + day.visits, 0);

        const visitsGrowth = lastMonthVisits 
          ? ((currentMonthVisits - lastMonthVisits) / lastMonthVisits) * 100 
          : 0;

        // Generate sales data for the selected period
        const salesData = Array.from({ length: period }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (period - 1 - i));
          const dayOrders = orders?.filter(order => {
            const orderDate = new Date(order.created_at);
            return orderDate.toDateString() === date.toDateString();
          });
          return {
            date: date.toLocaleDateString('en-US', { weekday: 'short' }),
            sales: dayOrders?.reduce((sum, order) => sum + order.total, 0) || 0
          };
        });

        setStats({
          totalOrders: allOrders?.length || 0,
          totalCustomers: (customersCount || 0) + guestCustomersCount,
          totalRevenue,
          totalProducts: products?.length || 0,
          totalViews,
          totalVisits,
          recentOrders: orders?.slice(0, 5) || [],
          topProducts: products || [],
          salesData,
          orderGrowth,
          revenueGrowth,
          viewsGrowth,
          visitsGrowth,
          ordersByStatus
        });

        setAnalyticsData({
          dailyViews,
          dailyVisits,
          topViewedProducts,
          recentActivity: []
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [period]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 py-8 sm:py-12">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">{t('dashboard.title')}</h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">{t('dashboard.welcome')}</p>
      </div>

      {/* Real-time Analytics - Moved to top for better visibility */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2"
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

      {/* Stats Grid */}
      <div className="mb-12 grid grid-cols-1 gap-3 sm:gap-4 lg:gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg bg-white dark:bg-gray-800 p-3 sm:p-4 lg:p-6 shadow-md min-w-0 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">{t('dashboard.total_orders')}</p>
              <h3 className="text-base sm:text-lg lg:text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">{stats.totalOrders}</h3>
            </div>
            <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-1 sm:p-1.5 lg:p-2 flex-shrink-0 overflow-hidden">
              <ShoppingBag className="h-2 w-2 sm:h-2.5 sm:w-2.5 lg:h-4 lg:w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className={`mt-2 flex items-center text-xs sm:text-sm ${stats.orderGrowth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {stats.orderGrowth >= 0 ? <ArrowUpRight className="h-2 w-2 sm:h-2.5 sm:w-2.5 flex-shrink-0" /> : <ArrowDownRight className="h-2 w-2 sm:h-2.5 sm:w-2.5 flex-shrink-0" />}
            <span className="truncate ml-1">{Math.abs(stats.orderGrowth).toFixed(1)}% {t('dashboard.from_last_month')}</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-lg bg-white dark:bg-gray-800 p-3 sm:p-4 lg:p-6 shadow-md min-w-0 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">{t('dashboard.total_revenue')}</p>
              <h3 className="text-base sm:text-lg lg:text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">{stats.totalRevenue.toFixed(2)} FCFA</h3>
            </div>
            <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-1 sm:p-1.5 lg:p-2 flex-shrink-0 overflow-hidden">
              <DollarSign className="h-2 w-2 sm:h-2.5 sm:w-2.5 lg:h-4 lg:w-4 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className={`mt-2 flex items-center text-xs sm:text-sm ${stats.revenueGrowth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {stats.revenueGrowth >= 0 ? <ArrowUpRight className="h-2 w-2 sm:h-2.5 sm:w-2.5 flex-shrink-0" /> : <ArrowDownRight className="h-2 w-2 sm:h-2.5 sm:w-2.5 flex-shrink-0" />}
            <span className="truncate ml-1">{Math.abs(stats.revenueGrowth).toFixed(1)}% {t('dashboard.from_last_month')}</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-lg bg-white dark:bg-gray-800 p-3 sm:p-4 lg:p-6 shadow-md min-w-0 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">{t('dashboard.total_views')}</p>
              <h3 className="text-base sm:text-lg lg:text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">{stats.totalViews}</h3>
            </div>
            <div className="rounded-full bg-purple-100 dark:bg-purple-900/30 p-1 sm:p-1.5 lg:p-2 flex-shrink-0 overflow-hidden">
              <Eye className="h-2 w-2 sm:h-2.5 sm:w-2.5 lg:h-4 lg:w-4 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className={`mt-2 flex items-center text-xs sm:text-sm ${stats.viewsGrowth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {stats.viewsGrowth >= 0 ? <ArrowUpRight className="h-2 w-2 sm:h-2.5 sm:w-2.5 flex-shrink-0" /> : <ArrowDownRight className="h-2 w-2 sm:h-2.5 sm:w-2.5 flex-shrink-0" />}
            <span className="truncate ml-1">{Math.abs(stats.viewsGrowth).toFixed(1)}% {t('dashboard.from_last_month')}</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-lg bg-white dark:bg-gray-800 p-3 sm:p-4 lg:p-6 shadow-md min-w-0 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">{t('dashboard.total_visits')}</p>
              <h3 className="text-base sm:text-lg lg:text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">{stats.totalVisits}</h3>
            </div>
            <div className="rounded-full bg-orange-100 dark:bg-orange-900/30 p-1 sm:p-1.5 lg:p-2 flex-shrink-0 overflow-hidden">
              <Activity className="h-2 w-2 sm:h-2.5 sm:w-2.5 lg:h-4 lg:w-4 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <div className={`mt-2 flex items-center text-xs sm:text-sm ${stats.visitsGrowth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {stats.visitsGrowth >= 0 ? <ArrowUpRight className="h-2 w-2 sm:h-2.5 sm:w-2.5 flex-shrink-0" /> : <ArrowDownRight className="h-2 w-2 sm:h-2.5 sm:w-2.5 flex-shrink-0" />}
            <span className="truncate ml-1">{Math.abs(stats.visitsGrowth).toFixed(1)}% {t('dashboard.from_last_month')}</span>
          </div>
        </motion.div>
      </div>

      {/* Analytics Overview */}
      <div className="mb-12">
        <h2 className="mb-6 text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{t('dashboard.analytics_overview')}</h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-lg bg-white dark:bg-gray-800 p-4 sm:p-6 shadow-md border border-gray-200 dark:border-gray-700">
            <h3 className="mb-4 text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">{t('dashboard.views_trend')}</h3>
            <div className="h-48 sm:h-64">
              <Line
                data={{
                  labels: analyticsData.dailyViews.map(d => d.date),
                  datasets: [{
                    label: t('dashboard.views'),
                    data: analyticsData.dailyViews.map(d => d.views),
                    borderColor: 'rgb(147, 51, 234)',
                    backgroundColor: 'rgba(147, 51, 234, 0.1)',
                    tension: 0.4,
                    fill: true
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                      }
                    },
                    x: {
                      grid: {
                        display: false
                      }
                    }
                  }
                }}
              />
            </div>
          </div>

          <div className="rounded-lg bg-white dark:bg-gray-800 p-4 sm:p-6 shadow-md border border-gray-200 dark:border-gray-700">
            <h3 className="mb-4 text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">{t('dashboard.visits_trend')}</h3>
            <div className="h-48 sm:h-64">
              <Bar
                data={{
                  labels: analyticsData.dailyVisits.map(d => d.date),
                  datasets: [{
                    label: t('dashboard.visits'),
                    data: analyticsData.dailyVisits.map(d => d.visits),
                    backgroundColor: 'rgba(251, 146, 60, 0.8)',
                    borderColor: 'rgb(251, 146, 60)',
                    borderWidth: 1
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                      }
                    },
                    x: {
                      grid: {
                        display: false
                      }
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sales Chart */}
      <div className="mb-12 rounded-lg bg-white dark:bg-gray-800 p-4 sm:p-6 shadow-md border border-gray-200 dark:border-gray-700">
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">{t('dashboard.sales_overview')}</h2>
          <select
            className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-1 text-sm w-full sm:w-auto"
            value={period}
            onChange={e => setPeriod(Number(e.target.value))}
          >
            <option value={7}>{t('dashboard.last_7_days')}</option>
            <option value={30}>{t('dashboard.last_30_days')}</option>
            <option value={90}>{t('dashboard.last_90_days')}</option>
          </select>
        </div>
        <div className="h-48 sm:h-64 overflow-x-auto">
          <div className="flex h-full items-end justify-between min-w-max px-2">
            {stats.salesData.map((data, index) => (
              <div key={index} className="flex flex-col items-center mx-1 min-w-0">
                <div 
                  className="w-6 sm:w-8 lg:w-12 bg-blue-500 transition-all duration-300 hover:bg-blue-600"
                  style={{ 
                    height: `${(data.sales / Math.max(...stats.salesData.map(d => d.sales), 1)) * 100}%`,
                    minHeight: '12px'
                  }}
                ></div>
                <span className="mt-2 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">{data.date}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{data.sales.toFixed(2)} FCFA</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Recent Orders */}
        <div className="rounded-lg bg-white dark:bg-gray-800 p-4 sm:p-6 shadow-md border border-gray-200 dark:border-gray-700">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">{t('dashboard.recent_orders')}</h2>
            <Link
              to="/admin/orders"
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              View all <ArrowRight className="ml-1 inline-block h-4 w-4" />
            </Link>
          </div>
          
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {stats.recentOrders.map((order) => (
              <div key={order.id} className="flex items-center py-3 sm:py-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{order.profiles?.full_name || 'Unknown User'}</p>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <p className="font-medium text-sm sm:text-base text-gray-900 dark:text-gray-100">{order.total.toFixed(2)} FCFA</p>
                  <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Most Viewed Products */}
        <div className="rounded-lg bg-white dark:bg-gray-800 p-4 sm:p-6 shadow-md border border-gray-200 dark:border-gray-700">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">{t('dashboard.most_viewed_products')}</h2>
            <Link
              to="/admin/products"
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              View all <ArrowRight className="ml-1 inline-block h-4 w-4" />
            </Link>
          </div>
          
          <div className="space-y-3 sm:space-y-4">
            {analyticsData.topViewedProducts.length > 0 ? (
              analyticsData.topViewedProducts.map((product, index) => (
                <motion.div
                  key={product.product.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex flex-col sm:flex-row sm:items-center p-3 sm:p-4 rounded-lg border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-600 hover:bg-blue-50/30 dark:hover:bg-blue-900/20 transition-all duration-200"
                >
                  {/* Top Row for Mobile */}
                  <div className="flex items-center justify-between sm:hidden mb-2">
                    {/* Rank Badge */}
                    <div className="flex-shrink-0">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === 0 ? 'bg-yellow-100 text-yellow-800' :
                        index === 1 ? 'bg-gray-100 text-gray-800' :
                        index === 2 ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        #{index + 1}
                      </div>
                    </div>
                    
                    {/* Mobile View Count */}
                    <div className="flex items-center text-purple-600">
                      <Eye className="mr-1 h-3 w-3" />
                      <span className="text-xs font-medium">{product.views} vues</span>
                    </div>
                  </div>

                  {/* Desktop Rank Badge */}
                  <div className="hidden sm:flex flex-shrink-0 mr-2 lg:mr-4">
                    <div className={`w-6 h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center text-xs lg:text-sm font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-800' :
                      index === 1 ? 'bg-gray-100 text-gray-800' :
                      index === 2 ? 'bg-orange-100 text-orange-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      #{index + 1}
                    </div>
                  </div>

                  {/* Product Image */}
                  <div className="h-10 w-10 sm:h-12 sm:w-12 lg:h-16 lg:w-16 flex-shrink-0 overflow-hidden rounded-lg border border-gray-200">
                    <img
                      src={product.product.image_url || '/placeholder-product.jpg'}
                      alt={product.product.name}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.target.src = '/placeholder-product.jpg';
                      }}
                    />
                  </div>

                  {/* Product Info */}
                  <div className="ml-2 sm:ml-3 lg:ml-4 flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate text-xs sm:text-sm lg:text-base">
                      {product.product.name}
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {product.product.price?.toFixed(2)} FCFA
                    </p>
                    <div className="flex flex-wrap items-center mt-1 gap-1 sm:gap-2">
                      {/* Desktop View Count */}
                      <div className="hidden sm:flex items-center text-purple-600">
                        <Eye className="mr-1 h-3 w-3" />
                        <span className="text-xs font-medium">{product.views} vues</span>
                      </div>
                      {product.trend === 'up' && (
                        <div className="flex items-center text-green-600">
                          <TrendingUp className="mr-1 h-3 w-3" />
                          <span className="text-xs font-medium">En hausse</span>
                        </div>
                      )}
                      {index < 3 && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          index === 0 ? 'bg-yellow-100 text-yellow-800' :
                          index === 1 ? 'bg-gray-100 text-gray-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {index === 0 ? '🔥 Top' : index === 1 ? '🥈 2ème' : '🥉 3ème'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* View Trend - Hidden on Mobile */}
                  <div className="hidden sm:block text-right">
                    <div className="flex items-center justify-end">
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                          style={{ 
                            width: `${Math.min((product.views / Math.max(...analyticsData.topViewedProducts.map(p => p.views), 1)) * 100, 100)}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {((product.views / Math.max(...analyticsData.topViewedProducts.map(p => p.views), 1)) * 100).toFixed(0)}% du total
                    </p>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-8">
                <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Aucun produit consulté pour le moment</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Les vues de produits apparaîtront ici</p>
              </div>
            )}
          </div>

          {/* Summary Stats */}
          {analyticsData.topViewedProducts.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 text-center">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Total vues</p>
                  <p className="text-sm sm:text-base lg:text-lg font-bold text-blue-600">
                    {analyticsData.topViewedProducts.reduce((sum, p) => sum + p.views, 0)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Produits populaires</p>
                  <p className="text-sm sm:text-base lg:text-lg font-bold text-purple-600">
                    {analyticsData.topViewedProducts.length}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Moyenne vues</p>
                  <p className="text-sm sm:text-base lg:text-lg font-bold text-green-600">
                    {Math.round(analyticsData.topViewedProducts.reduce((sum, p) => sum + p.views, 0) / analyticsData.topViewedProducts.length)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Orders by Status */}
      <div className="mt-12">
        <h2 className="mb-6 text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Commandes par statut</h2>
        <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <Link to="/admin/orders?status=pending" className="block group">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.03 }}
              className="rounded-lg bg-white dark:bg-gray-800 p-4 sm:p-6 shadow-md border-l-4 border-yellow-500 cursor-pointer transition-transform group-hover:shadow-lg min-w-0 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">En attente</p>
                  <h3 className="text-lg sm:text-2xl font-bold text-yellow-600 truncate">{stats.ordersByStatus.pending}</h3>
                </div>
                <div className="rounded-full bg-yellow-100 p-1.5 sm:p-2 lg:p-3 flex-shrink-0 overflow-hidden">
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4 lg:h-6 lg:w-6 text-yellow-600" />
                </div>
              </div>
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-500 h-2 rounded-full" 
                    style={{ width: `${stats.totalOrders > 0 ? (stats.ordersByStatus.pending / stats.totalOrders) * 100 : 0}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                  {stats.totalOrders > 0 ? ((stats.ordersByStatus.pending / stats.totalOrders) * 100).toFixed(1) : 0}% du total
                </p>
              </div>
            </motion.div>
          </Link>

          <Link to="/admin/orders?status=processing" className="block group">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              whileHover={{ scale: 1.03 }}
              className="rounded-lg bg-white dark:bg-gray-800 p-4 sm:p-6 shadow-md border-l-4 border-blue-500 cursor-pointer transition-transform group-hover:shadow-lg min-w-0 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">En traitement</p>
                  <h3 className="text-lg sm:text-2xl font-bold text-blue-600 truncate">{stats.ordersByStatus.processing}</h3>
                </div>
                <div className="rounded-full bg-blue-100 p-1.5 sm:p-2 lg:p-3 flex-shrink-0 overflow-hidden">
                  <Package className="h-3 w-3 sm:h-4 sm:w-4 lg:h-6 lg:w-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: `${stats.totalOrders > 0 ? (stats.ordersByStatus.processing / stats.totalOrders) * 100 : 0}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                  {stats.totalOrders > 0 ? ((stats.ordersByStatus.processing / stats.totalOrders) * 100).toFixed(1) : 0}% du total
                </p>
              </div>
            </motion.div>
          </Link>

          <Link to="/admin/orders?status=shipped" className="block group">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              whileHover={{ scale: 1.03 }}
              className="rounded-lg bg-white dark:bg-gray-800 p-4 sm:p-6 shadow-md border-l-4 border-purple-500 cursor-pointer transition-transform group-hover:shadow-lg min-w-0 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">Expédiées</p>
                  <h3 className="text-lg sm:text-2xl font-bold text-purple-600 truncate">{stats.ordersByStatus.shipped}</h3>
                </div>
                <div className="rounded-full bg-purple-100 p-1.5 sm:p-2 lg:p-3 flex-shrink-0 overflow-hidden">
                  <Truck className="h-3 w-3 sm:h-4 sm:w-4 lg:h-6 lg:w-6 text-purple-600" />
                </div>
              </div>
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-500 h-2 rounded-full" 
                    style={{ width: `${stats.totalOrders > 0 ? (stats.ordersByStatus.shipped / stats.totalOrders) * 100 : 0}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                  {stats.totalOrders > 0 ? ((stats.ordersByStatus.shipped / stats.totalOrders) * 100).toFixed(1) : 0}% du total
                </p>
              </div>
            </motion.div>
          </Link>

          <Link to="/admin/orders?status=delivered" className="block group">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.03 }}
              className="rounded-lg bg-white dark:bg-gray-800 p-4 sm:p-6 shadow-md border-l-4 border-green-500 cursor-pointer transition-transform group-hover:shadow-lg min-w-0 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">Livrées</p>
                  <h3 className="text-lg sm:text-2xl font-bold text-green-600 truncate">{stats.ordersByStatus.delivered}</h3>
                </div>
                <div className="rounded-full bg-green-100 p-1.5 sm:p-2 lg:p-3 flex-shrink-0 overflow-hidden">
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 lg:h-6 lg:w-6 text-green-600" />
                </div>
              </div>
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${stats.totalOrders > 0 ? (stats.ordersByStatus.delivered / stats.totalOrders) * 100 : 0}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                  {stats.totalOrders > 0 ? ((stats.ordersByStatus.delivered / stats.totalOrders) * 100).toFixed(1) : 0}% du total
                </p>
              </div>
            </motion.div>
          </Link>

          <Link to="/admin/orders?status=cancelled" className="block group">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              whileHover={{ scale: 1.03 }}
              className="rounded-lg bg-white dark:bg-gray-800 p-4 sm:p-6 shadow-md border-l-4 border-red-500 cursor-pointer transition-transform group-hover:shadow-lg min-w-0 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">Annulées</p>
                  <h3 className="text-lg sm:text-2xl font-bold text-red-600 truncate">{stats.ordersByStatus.cancelled}</h3>
                </div>
                <div className="rounded-full bg-red-100 p-1.5 sm:p-2 lg:p-3 flex-shrink-0 overflow-hidden">
                  <XCircle className="h-3 w-3 sm:h-4 sm:w-4 lg:h-6 lg:w-6 text-red-600" />
                </div>
              </div>
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full" 
                    style={{ width: `${stats.totalOrders > 0 ? (stats.ordersByStatus.cancelled / stats.totalOrders) * 100 : 0}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                  {stats.totalOrders > 0 ? ((stats.ordersByStatus.cancelled / stats.totalOrders) * 100).toFixed(1) : 0}% du total
                </p>
              </div>
            </motion.div>
          </Link>
        </div>
      </div>

      {/* Modern Analytics Components */}
      <div className="mt-12">
        <h2 className="mb-6 text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{t('dashboard.advanced_analytics')}</h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SiteStats />
          <div className="rounded-lg bg-white dark:bg-gray-800 p-4 sm:p-6 shadow-md border border-gray-200 dark:border-gray-700">
            <h3 className="mb-4 text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">Statistiques globales</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Produits actifs</p>
                <p className="text-lg sm:text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalProducts}</p>
              </div>
              <div className="text-center">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Clients totaux</p>
                <p className="text-lg sm:text-2xl font-bold text-green-600 dark:text-green-400">{stats.totalCustomers}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <AdvancedMetrics />
      </div>
    </div>
  );
};

export default Dashboard;