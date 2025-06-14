import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
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
  ArrowDownRight
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalCustomers: 0,
    totalRevenue: 0,
    totalProducts: 0,
    recentOrders: [],
    topProducts: [],
    salesData: [],
    orderGrowth: 0,
    revenueGrowth: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch orders count and data
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select(`
            *,
            profiles (
              full_name
            ),
            order_items (
              quantity,
              price,
              products (
                name,
                image_url
              )
            )
          `)
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

        // Fetch customers count
        const { count: customersCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact' });

        // Fetch products with inventory info
        const { data: products } = await supabase
          .from('products')
          .select('*')
          .order('inventory', { ascending: true })
          .limit(5);

        // Generate sales data for the last 7 days
        const salesData = Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dayOrders = orders?.filter(order => {
            const orderDate = new Date(order.created_at);
            return orderDate.toDateString() === date.toDateString();
          });
          return {
            date: date.toLocaleDateString('en-US', { weekday: 'short' }),
            sales: dayOrders?.reduce((sum, order) => sum + order.total, 0) || 0
          };
        }).reverse();

        setStats({
          totalOrders: orders?.length || 0,
          totalCustomers: customersCount || 0,
          totalRevenue,
          totalProducts: products?.length || 0,
          recentOrders: orders?.slice(0, 5) || [],
          topProducts: products || [],
          salesData,
          orderGrowth,
          revenueGrowth
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Kapital Store Dashboard</h1>
        <p className="text-gray-600">Welcome to your admin dashboard</p>
      </div>

      {/* Stats Grid */}
      <div className="mb-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg bg-white p-6 shadow-md"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Orders</p>
              <h3 className="text-2xl font-bold">{stats.totalOrders}</h3>
            </div>
            <div className="rounded-full bg-blue-100 p-3">
              <ShoppingBag className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className={`mt-2 flex items-center text-sm ${stats.orderGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {stats.orderGrowth >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
            <span>{Math.abs(stats.orderGrowth).toFixed(1)}% from last month</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-lg bg-white p-6 shadow-md"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <h3 className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</h3>
            </div>
            <div className="rounded-full bg-green-100 p-3">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className={`mt-2 flex items-center text-sm ${stats.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {stats.revenueGrowth >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
            <span>{Math.abs(stats.revenueGrowth).toFixed(1)}% from last month</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-lg bg-white p-6 shadow-md"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Customers</p>
              <h3 className="text-2xl font-bold">{stats.totalCustomers}</h3>
            </div>
            <div className="rounded-full bg-purple-100 p-3">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center text-sm text-green-600">
            <ArrowUpRight className="h-4 w-4" />
            <span>12.5% from last month</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-lg bg-white p-6 shadow-md"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Products</p>
              <h3 className="text-2xl font-bold">{stats.totalProducts}</h3>
            </div>
            <div className="rounded-full bg-yellow-100 p-3">
              <Package className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center text-sm text-blue-600">
            <Package className="mr-1 h-4 w-4" />
            <span>{stats.topProducts.filter(p => p.inventory < 10).length} low stock</span>
          </div>
        </motion.div>
      </div>

      {/* Sales Chart */}
      <div className="mb-12 rounded-lg bg-white p-6 shadow-md">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Sales Overview</h2>
          <select className="rounded-md border border-gray-300 px-3 py-1 text-sm">
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>Last 90 days</option>
          </select>
        </div>
        <div className="h-64">
          <div className="flex h-full items-end justify-between">
            {stats.salesData.map((data, index) => (
              <div key={index} className="flex flex-col items-center">
                <div 
                  className="w-12 bg-blue-500 transition-all duration-300 hover:bg-blue-600"
                  style={{ 
                    height: `${(data.sales / Math.max(...stats.salesData.map(d => d.sales))) * 100}%`,
                    minHeight: '20px'
                  }}
                ></div>
                <span className="mt-2 text-sm text-gray-600">{data.date}</span>
                <span className="text-xs text-gray-500">${data.sales.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Recent Orders */}
        <div className="rounded-lg bg-white p-6 shadow-md">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold">Recent Orders</h2>
            <Link
              to="/admin/orders"
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              View all <ArrowRight className="ml-1 inline-block h-4 w-4" />
            </Link>
          </div>
          
          <div className="divide-y divide-gray-200">
            {stats.recentOrders.map((order) => (
              <div key={order.id} className="flex items-center py-4">
                <div className="flex-1">
                  <p className="font-medium">{order.profiles?.full_name || 'Unknown User'}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">${order.total.toFixed(2)}</p>
                  <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Products */}
        <div className="rounded-lg bg-white p-6 shadow-md">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold">Low Stock Products</h2>
            <Link
              to="/admin/products"
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              View all <ArrowRight className="ml-1 inline-block h-4 w-4" />
            </Link>
          </div>
          
          <div className="divide-y divide-gray-200">
            {stats.topProducts.map((product) => (
              <div key={product.id} className="flex items-center py-4">
                <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-md">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="ml-4 flex-1">
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-gray-600">${product.price.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">Stock: {product.inventory}</p>
                  {product.inventory < 10 ? (
                    <div className="flex items-center text-red-600">
                      <TrendingDown className="mr-1 h-4 w-4" />
                      <span className="text-sm">Low stock</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-green-600">
                      <TrendingUp className="mr-1 h-4 w-4" />
                      <span className="text-sm">In stock</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;