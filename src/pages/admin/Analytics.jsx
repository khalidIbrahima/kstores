import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LineChart, BarChart, PieChart, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';

const Analytics = () => {
  const { t, i18n } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState({
    revenue: { current: 0, previous: 0 },
    orders: { current: 0, previous: 0 },
    customers: { current: 0, previous: 0 }
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setIsLoading(true);
        
        // Fetch analytics data from Supabase
        const { data: analyticsData, error } = await supabase
          .from('orders')
          .select('total, created_at');
        
        if (error) throw error;

        // Process data for metrics
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const currentMonthData = analyticsData?.filter(order => {
          const orderDate = new Date(order.created_at);
          return orderDate.getMonth() === currentMonth && 
                 orderDate.getFullYear() === currentYear;
        });

        const previousMonthData = analyticsData?.filter(order => {
          const orderDate = new Date(order.created_at);
          return orderDate.getMonth() === (currentMonth - 1) && 
                 orderDate.getFullYear() === currentYear;
        });

        setData({
          revenue: {
            current: currentMonthData?.reduce((sum, order) => sum + order.total, 0) || 0,
            previous: previousMonthData?.reduce((sum, order) => sum + order.total, 0) || 0
          },
          orders: {
            current: currentMonthData?.length || 0,
            previous: previousMonthData?.length || 0
          },
          customers: {
            current: 150, // Sample data
            previous: 120
          }
        });
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const calculateGrowth = (current, previous) => {
    if (previous === 0) return 100;
    return ((current - previous) / previous) * 100;
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
      <div>
        <h1 className="text-2xl font-bold">{t('admin.sidebar.analytics')}</h1>
        <p className="text-gray-600">{t('analytics.overview.description')}</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Revenue */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg bg-white p-6 shadow-md"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('analytics.revenue.label')}</p>
              <h3 className="text-2xl font-bold">${data.revenue.current.toFixed(2)}</h3>
            </div>
            <div className="rounded-full bg-blue-100 p-3">
              <LineChart className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            {calculateGrowth(data.revenue.current, data.revenue.previous) >= 0 ? (
              <ArrowUpRight className="h-4 w-4 text-green-500" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-red-500" />
            )}
            <span className={`ml-1 text-sm ${
              calculateGrowth(data.revenue.current, data.revenue.previous) >= 0 
                ? 'text-green-500' 
                : 'text-red-500'
            }`}>
              {Math.abs(calculateGrowth(data.revenue.current, data.revenue.previous)).toFixed(1)}%
            </span>
            <span className="ml-1 text-sm text-gray-500">{t('analytics.vsLastMonth')}</span>
          </div>
        </motion.div>

        {/* Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-lg bg-white p-6 shadow-md"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('analytics.orders.label')}</p>
              <h3 className="text-2xl font-bold">{data.orders.current}</h3>
            </div>
            <div className="rounded-full bg-purple-100 p-3">
              <BarChart className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            {calculateGrowth(data.orders.current, data.orders.previous) >= 0 ? (
              <ArrowUpRight className="h-4 w-4 text-green-500" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-red-500" />
            )}
            <span className={`ml-1 text-sm ${
              calculateGrowth(data.orders.current, data.orders.previous) >= 0 
                ? 'text-green-500' 
                : 'text-red-500'
            }`}>
              {Math.abs(calculateGrowth(data.orders.current, data.orders.previous)).toFixed(1)}%
            </span>
            <span className="ml-1 text-sm text-gray-500">{t('analytics.vsLastMonth')}</span>
          </div>
        </motion.div>

        {/* Customers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-lg bg-white p-6 shadow-md"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('analytics.customers.label')}</p>
              <h3 className="text-2xl font-bold">{data.customers.current}</h3>
            </div>
            <div className="rounded-full bg-green-100 p-3">
              <PieChart className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            {calculateGrowth(data.customers.current, data.customers.previous) >= 0 ? (
              <ArrowUpRight className="h-4 w-4 text-green-500" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-red-500" />
            )}
            <span className={`ml-1 text-sm ${
              calculateGrowth(data.customers.current, data.customers.previous) >= 0 
                ? 'text-green-500' 
                : 'text-red-500'
            }`}>
              {Math.abs(calculateGrowth(data.customers.current, data.customers.previous)).toFixed(1)}%
            </span>
            <span className="ml-1 text-sm text-gray-500">{t('analytics.vsLastMonth')}</span>
          </div>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-lg bg-white p-6 shadow-md"
        >
          <h3 className="mb-4 text-lg font-medium">{t('analytics.revenueTrend.title')}</h3>
          <div className="h-64 w-full">
            {/* Add chart component here */}
            <div className="flex h-full items-center justify-center text-gray-500">
              {t('analytics.revenueChart.placeholder')}
            </div>
          </div>
        </motion.div>

        {/* Orders Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-lg bg-white p-6 shadow-md"
        >
          <h3 className="mb-4 text-lg font-medium">{t('analytics.ordersOverview.title')}</h3>
          <div className="h-64 w-full">
            {/* Add chart component here */}
            <div className="flex h-full items-center justify-center text-gray-500">
              {t('analytics.ordersChart.placeholder')}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Analytics;