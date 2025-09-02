import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Package, 
  ShoppingCart, 
  Users, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  BarChart3,
  Activity,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Star,
  Heart
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, BarElement, ArcElement } from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement);

const Store = () => {
  const { t, i18n } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [storeData, setStoreData] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    lowStockProducts: [],
    recentOrders: [],
    topSellingProducts: [],
    ordersByStatus: {
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0
    },
    salesData: [],
    categoryStats: [],
    customerStats: {
      newCustomers: 0,
      returningCustomers: 0,
      averageOrderValue: 0
    }
  });

  useEffect(() => {
    const fetchStoreData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch all orders for comprehensive stats
        const { data: allOrders, error: ordersError } = await supabase
          .from('orders')
          .select(`
            *
          `)
          .order('created_at', { ascending: false });

        if (ordersError) throw ordersError;

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

        // Calculate total revenue from delivered orders only
        const deliveredOrders = allOrders?.filter(order => order.status === 'delivered') || [];
        const totalRevenue = deliveredOrders.reduce((sum, order) => sum + order.total, 0);

        // Calculate customer stats
        const uniqueCustomers = new Set(allOrders?.map(order => order.user_id).filter(Boolean));
        const totalCustomers = uniqueCustomers.size;

        // Calculate anonymous customers
        const anonymousOrders = allOrders?.filter(order => !order.user_id) || [];
        const anonymousCustomers = anonymousOrders.length;

        // Calculate new customers (this month)
        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();
        
        // Get unique customers who made their first order this month
        const customerFirstOrders = new Map();
        allOrders?.forEach(order => {
          if (!order.user_id) return;
          const orderDate = new Date(order.created_at);
          if (!customerFirstOrders.has(order.user_id) || 
              orderDate < customerFirstOrders.get(order.user_id)) {
            customerFirstOrders.set(order.user_id, orderDate);
          }
        });
        
        const newCustomers = Array.from(customerFirstOrders.values()).filter(date => {
          return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
        }).length;

        // Calculate new anonymous customers this month
        const newAnonymousCustomers = anonymousOrders.filter(order => {
          const orderDate = new Date(order.created_at);
          return orderDate.getMonth() === thisMonth && orderDate.getFullYear() === thisYear;
        }).length;

        // Calculate average order value
        const averageOrderValue = deliveredOrders.length > 0 
          ? totalRevenue / deliveredOrders.length 
          : 0;

        // Fetch products data
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select('*')
          .order('inventory', { ascending: true });

        if (productsError) throw productsError;

        // Get low stock products and out of stock products
        const lowStockProducts = products?.filter(product => product.inventory < 10 && product.inventory > 0) || [];
        const outOfStockProducts = products?.filter(product => product.inventory === 0) || [];

        // Generate sales data for the last 7 days
        const salesData = Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (6 - i));
          const dayOrders = deliveredOrders.filter(order => {
            const orderDate = new Date(order.created_at);
            return orderDate.toDateString() === date.toDateString();
          });
          return {
            date: date.toLocaleDateString('en-US', { weekday: 'short' }),
            sales: dayOrders.reduce((sum, order) => sum + order.total, 0)
          };
        });

        // Calculate growth rates with better handling
        const lastMonthOrders = deliveredOrders.filter(order => {
          const orderDate = new Date(order.created_at);
          const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
          const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;
          return orderDate.getMonth() === lastMonth && orderDate.getFullYear() === lastMonthYear;
        });

        const currentMonthOrders = deliveredOrders.filter(order => {
          const orderDate = new Date(order.created_at);
          return orderDate.getMonth() === thisMonth && orderDate.getFullYear() === thisYear;
        });

        const orderGrowth = lastMonthOrders.length > 0
          ? ((currentMonthOrders.length - lastMonthOrders.length) / lastMonthOrders.length) * 100 
          : currentMonthOrders.length > 0 ? 100 : 0;

        const lastMonthRevenue = lastMonthOrders.reduce((sum, order) => sum + order.total, 0);
        const currentMonthRevenue = currentMonthOrders.reduce((sum, order) => sum + order.total, 0);
        const revenueGrowth = lastMonthRevenue > 0
          ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
          : currentMonthRevenue > 0 ? 100 : 0;

        setStoreData({
          totalProducts: products?.length || 0,
          totalOrders: allOrders?.length || 0,
          totalRevenue,
          totalCustomers,
          lowStockProducts,
          outOfStockProducts,
          recentOrders: allOrders?.slice(0, 5) || [],
          topSellingProducts: products?.slice(0, 5) || [],
          ordersByStatus,
          salesData,
          categoryStats: [],
          customerStats: {
            newCustomers,
            returningCustomers: totalCustomers - newCustomers,
            averageOrderValue,
            anonymousCustomers,
            newAnonymousCustomers
          },
          orderGrowth,
          revenueGrowth
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
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
      </div>
    );
  }

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800'
  };

  const statusIcons = {
    pending: Clock,
    processing: Package,
    shipped: Truck,
    delivered: CheckCircle,
    cancelled: XCircle
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Vue d'ensemble de la boutique</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Analyse complète de vos performances commerciales</p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {/* Total Revenue */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-gradient-to-br from-green-50 to-green-100 p-6 border border-green-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700">Revenus totaux</p>
              <h3 className="text-2xl font-bold text-green-900 dark:text-green-100">{storeData.totalRevenue.toFixed(2)} FCFA</h3>
            </div>
            <div className="rounded-full bg-green-500 p-3">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className={`mt-3 flex items-center text-sm ${storeData.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {storeData.revenueGrowth >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
            <span className="font-medium">
              {isNaN(storeData.revenueGrowth) ? '0.0' : Math.abs(storeData.revenueGrowth).toFixed(1)}%
            </span>
            <span className="ml-1 text-gray-600">vs mois dernier</span>
          </div>
        </motion.div>

        {/* Total Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 p-6 border border-blue-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">Commandes totales</p>
              <h3 className="text-2xl font-bold text-blue-900 dark:text-blue-100">{storeData.totalOrders}</h3>
            </div>
            <div className="rounded-full bg-blue-500 p-3">
              <ShoppingCart className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className={`mt-3 flex items-center text-sm ${storeData.orderGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {storeData.orderGrowth >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
            <span className="font-medium">
              {isNaN(storeData.orderGrowth) ? '0.0' : Math.abs(storeData.orderGrowth).toFixed(1)}%
            </span>
            <span className="ml-1 text-gray-600">vs mois dernier</span>
          </div>
        </motion.div>

        {/* Total Products */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 p-6 border border-purple-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-700">Produits en stock</p>
              <h3 className="text-2xl font-bold text-purple-900 dark:text-purple-100">{storeData.totalProducts}</h3>
            </div>
            <div className="rounded-full bg-purple-500 p-3">
              <Package className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="mt-3 space-y-1">
            <div className="flex items-center text-sm text-orange-600">
              <AlertTriangle className="h-4 w-4 mr-1" />
              <span className="font-medium">{storeData.lowStockProducts.length}</span>
              <span className="ml-1 text-gray-600">stock faible</span>
            </div>
            {storeData.outOfStockProducts.length > 0 && (
              <div className="flex items-center text-sm text-red-600">
                <XCircle className="h-4 w-4 mr-1" />
                <span className="font-medium">{storeData.outOfStockProducts.length}</span>
                <span className="ml-1 text-gray-600">écoulés</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Total Customers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 p-6 border border-orange-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-700">Clients connectés</p>
              <h3 className="text-2xl font-bold text-orange-900 dark:text-orange-100">{storeData.totalCustomers}</h3>
            </div>
            <div className="rounded-full bg-orange-500 p-3">
              <Users className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="mt-3 flex items-center text-sm text-green-600">
            <TrendingUp className="h-4 w-4 mr-1" />
            <span className="font-medium">{storeData.customerStats.newCustomers}</span>
            <span className="ml-1 text-gray-600">nouveaux ce mois</span>
          </div>
        </motion.div>
      </div>

      {/* Anonymous Customers Card */}
      <div className="mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 p-6 border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Clients anonymes</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{storeData.customerStats.anonymousCustomers}</h3>
              <p className="text-sm text-gray-600 mt-1">
                {((storeData.customerStats.anonymousCustomers / Math.max(storeData.totalOrders, 1)) * 100).toFixed(1)}% des commandes
              </p>
            </div>
            <div className="rounded-full bg-gray-500 p-3">
              <Users className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="mt-3 flex items-center text-sm text-blue-600">
            <Calendar className="h-4 w-4 mr-1" />
            <span className="font-medium">{storeData.customerStats.newAnonymousCustomers}</span>
            <span className="ml-1 text-gray-600">nouveaux ce mois</span>
          </div>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Sales Trend */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-xl bg-white p-6 shadow-lg border border-gray-200"
        >
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Tendance des ventes (7 derniers jours)</h3>
          <div className="h-64">
            <Line
              data={{
                labels: storeData.salesData.map(d => d.date),
                datasets: [{
                  label: 'Ventes (FCFA)',
                  data: storeData.salesData.map(d => d.sales),
                  borderColor: 'rgb(59, 130, 246)',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
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
        </motion.div>

        {/* Orders by Status */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-xl bg-white p-6 shadow-lg border border-gray-200"
        >
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Commandes par statut</h3>
          <div className="h-64">
            <Doughnut
              data={{
                labels: ['En attente', 'En traitement', 'Expédiées', 'Livrées', 'Annulées'],
                datasets: [{
                  data: [
                    storeData.ordersByStatus.pending,
                    storeData.ordersByStatus.processing,
                    storeData.ordersByStatus.shipped,
                    storeData.ordersByStatus.delivered,
                    storeData.ordersByStatus.cancelled
                  ],
                  backgroundColor: [
                    '#fbbf24',
                    '#3b82f6',
                    '#8b5cf6',
                    '#10b981',
                    '#ef4444'
                  ],
                  borderWidth: 2,
                  borderColor: '#ffffff'
                }]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom'
                  }
                }
              }}
            />
          </div>
        </motion.div>
      </div>

      {/* Orders by Status Cards */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-gray-100">Répartition des commandes</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Object.entries(storeData.ordersByStatus).map(([status, count], index) => {
            const Icon = statusIcons[status];
            const colorClass = statusColors[status];
            const percentage = storeData.totalOrders > 0 ? (count / storeData.totalOrders) * 100 : 0;
            
            return (
              <Link key={status} to={`/admin/orders?status=${status}`} className="block group">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="rounded-lg bg-white p-4 shadow-md border border-gray-200 hover:shadow-lg transition-all duration-200 group-hover:scale-105"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2 rounded-full ${colorClass.replace('text-', 'bg-').replace('bg-', 'bg-').replace('text-', 'text-')}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-2xl font-bold">{count}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-700 capitalize">{status}</p>
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${colorClass.replace('text-', 'bg-').replace('bg-', 'bg-').replace('text-', 'bg-')}`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{percentage.toFixed(1)}% du total</p>
                  </div>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Activity & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-white p-6 shadow-lg border border-gray-200"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Commandes récentes</h3>
            <Link to="/admin/orders" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              Voir toutes →
            </Link>
          </div>
          <div className="space-y-3">
            {storeData.recentOrders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${statusColors[order.status]?.replace('bg-', 'bg-').replace('text-', 'bg-')}`}></div>
                  <div>
                    <p className="font-medium text-sm">#{order.id.slice(-8)}</p>
                    <p className="text-xs text-gray-500">{order.profiles?.full_name || 'Client invité'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-sm">{order.total.toFixed(2)} FCFA</p>
                  <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString()}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Stock Alerts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-white p-6 shadow-lg border border-gray-200"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Alertes de stock</h3>
            <Link to="/admin/products" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              Gérer les produits →
            </Link>
          </div>
          
          {/* Out of Stock Products */}
          {storeData.outOfStockProducts.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                <XCircle className="h-4 w-4 mr-2 text-red-500" />
                Produits écoulés ({storeData.outOfStockProducts.length})
              </h4>
              <div className="space-y-2">
                {storeData.outOfStockProducts.slice(0, 3).map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center space-x-3 p-3 rounded-lg border border-red-200 bg-red-50"
                  >
                    <div className="w-10 h-10 rounded-lg overflow-hidden">
                      <img
                        src={product.image_url || '/placeholder-product.jpg'}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{product.name}</p>
                      <div className="flex items-center mt-1">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Écoulé
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{product.price?.toFixed(2)} FCFA</p>
                    </div>
                  </motion.div>
                ))}
                {storeData.outOfStockProducts.length > 3 && (
                  <p className="text-xs text-gray-500 text-center">
                    +{storeData.outOfStockProducts.length - 3} autres produits écoulés
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Low Stock Products */}
          {storeData.lowStockProducts.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2 text-orange-500" />
                Stock faible ({storeData.lowStockProducts.length})
              </h4>
              <div className="space-y-2">
                {storeData.lowStockProducts.slice(0, 3).map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center space-x-3 p-3 rounded-lg border border-orange-200 bg-orange-50"
                  >
                    <div className="w-10 h-10 rounded-lg overflow-hidden">
                      <img
                        src={product.image_url || '/placeholder-product.jpg'}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{product.name}</p>
                      <p className="text-xs text-orange-600">Stock: {product.inventory} unités</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{product.price?.toFixed(2)} FCFA</p>
                    </div>
                  </motion.div>
                ))}
                {storeData.lowStockProducts.length > 3 && (
                  <p className="text-xs text-gray-500 text-center">
                    +{storeData.lowStockProducts.length - 3} autres produits en stock faible
                  </p>
                )}
              </div>
            </div>
          )}

          {/* No Alerts */}
          {storeData.lowStockProducts.length === 0 && storeData.outOfStockProducts.length === 0 && (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <p className="text-gray-600">Aucune alerte de stock</p>
              <p className="text-sm text-gray-500">Tous vos produits ont un stock suffisant</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Customer Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 p-6 border border-blue-200"
      >
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Insights clients</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-blue-900">{storeData.customerStats.newCustomers}</p>
            <p className="text-sm text-blue-700">Nouveaux clients connectés</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Heart className="h-8 w-8 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-purple-900">{storeData.customerStats.returningCustomers}</p>
            <p className="text-sm text-purple-700">Clients fidèles</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="h-8 w-8 text-gray-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{storeData.customerStats.newAnonymousCustomers}</p>
            <p className="text-sm text-gray-700">Nouveaux clients anonymes</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-900">{storeData.customerStats.averageOrderValue.toFixed(2)} FCFA</p>
            <p className="text-sm text-green-700">Panier moyen</p>
          </div>
        </div>
      </motion.div>

      {/* Demo Data Notice */}
      {storeData.totalOrders === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-gradient-to-r from-yellow-50 to-orange-50 p-6 border border-yellow-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Bienvenue dans votre tableau de bord !</h3>
              <p className="text-yellow-700 mb-4">
                Votre boutique est prête ! Pour voir des données réelles, commencez par :
              </p>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-yellow-700">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></span>
                  Ajouter des produits dans la section "Produits"
                </div>
                <div className="flex items-center text-sm text-yellow-700">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></span>
                  Créer des commandes de test dans "Commandes"
                </div>
                <div className="flex items-center text-sm text-yellow-700">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></span>
                  Inviter des clients à passer des commandes
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                <Zap className="h-8 w-8 text-yellow-600" />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Store;