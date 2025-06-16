import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, ShoppingCart, Users, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';

const Store = () => {
  const { t, i18n } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [storeData, setStoreData] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    lowStockProducts: [],
    recentOrders: [],
    topSellingProducts: []
  });

  useEffect(() => {
    const fetchStoreData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch products count
        const { count: productsCount } = await supabase
          .from('products')
          .select('*', { count: 'exact' });

        // Fetch low stock products
        const { data: lowStock } = await supabase
          .from('products')
          .select('*')
          .lt('inventory', 10)
          .order('inventory');

        // Fetch recent orders
        const { data: recentOrders } = await supabase
          .from('orders')
          .select(`
            *,
            profiles (full_name)
          `)
          .order('created_at', { ascending: false })
          .limit(5);

        // Calculate total revenue
        const { data: orders } = await supabase
          .from('orders')
          .select('total');

        const totalRevenue = orders?.reduce((sum, order) => sum + order.total, 0) || 0;

        setStoreData({
          totalProducts: productsCount || 0,
          totalOrders: orders?.length || 0,
          totalRevenue,
          lowStockProducts: lowStock || [],
          recentOrders: recentOrders || [],
          topSellingProducts: [] // To be implemented
        });
      } catch (error) {
        console.error('Error fetching store data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStoreData();
  }, []);

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
        <h1 className="text-2xl font-bold">{t('store.overview.title')}</h1>
        <p className="text-gray-600">{t('store.overview.description')}</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Products */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg bg-white p-6 shadow-md"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('store.overview.totalProducts.label')}</p>
              <h3 className="text-2xl font-bold">{storeData.totalProducts}</h3>
            </div>
            <div className="rounded-full bg-blue-100 p-3">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            {storeData.lowStockProducts.length} {t('store.overview.lowStockProducts.label')}
          </p>
        </motion.div>

        {/* Total Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-lg bg-white p-6 shadow-md"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('store.overview.totalOrders.label')}</p>
              <h3 className="text-2xl font-bold">{storeData.totalOrders}</h3>
            </div>
            <div className="rounded-full bg-green-100 p-3">
              <ShoppingCart className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            {storeData.recentOrders.length} {t('store.overview.newOrdersToday.label')}
          </p>
        </motion.div>

        {/* Total Revenue */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-lg bg-white p-6 shadow-md"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('store.overview.totalRevenue.label')}</p>
              <h3 className="text-2xl font-bold">${storeData.totalRevenue.toFixed(2)}</h3>
            </div>
            <div className="rounded-full bg-purple-100 p-3">
              <DollarSign className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center text-sm">
            <TrendingUp className="mr-1 h-4 w-4 text-green-500" />
            <span className="text-green-500">12%</span>
            <span className="ml-1 text-gray-500">{t('store.overview.vsLastMonth')}</span>
          </div>
        </motion.div>

        {/* Average Order Value */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-lg bg-white p-6 shadow-md"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('store.overview.avgOrderValue.label')}</p>
              <h3 className="text-2xl font-bold">
                ${storeData.totalOrders > 0 
                  ? (storeData.totalRevenue / storeData.totalOrders).toFixed(2)
                  : '0.00'
                }
              </h3>
            </div>
            <div className="rounded-full bg-yellow-100 p-3">
              <Users className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center text-sm">
            <TrendingDown className="mr-1 h-4 w-4 text-red-500" />
            <span className="text-red-500">3%</span>
            <span className="ml-1 text-gray-500">{t('store.overview.vsLastMonth')}</span>
          </div>
        </motion.div>
      </div>

      {/* Recent Orders */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-lg bg-white p-6 shadow-md"
      >
        <h2 className="mb-4 text-lg font-medium">{t('store.overview.recentOrders.title')}</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('store.overview.recentOrders.table.orderId')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('store.overview.recentOrders.table.customer')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('store.overview.recentOrders.table.amount')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('store.overview.recentOrders.table.status')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('store.overview.recentOrders.table.date')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {storeData.recentOrders.map((order) => (
                <tr key={order.id}>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {order.id}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {order.profiles?.full_name}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    ${order.total.toFixed(2)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                      order.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : order.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Low Stock Products */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="rounded-lg bg-white p-6 shadow-md"
      >
        <h2 className="mb-4 text-lg font-medium">{t('store.overview.lowStockProducts.title')}</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {storeData.lowStockProducts.map((product) => (
            <div
              key={product.id}
              className="flex items-center space-x-4 rounded-lg border border-gray-200 p-4"
            >
              <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg">
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{product.name}</h3>
                <p className="text-sm text-gray-500">Stock: {product.inventory}</p>
                <p className="text-sm font-medium text-red-600">
                  {t('store.overview.lowStockAlert')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default Store;