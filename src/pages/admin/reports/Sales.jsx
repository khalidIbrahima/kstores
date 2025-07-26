import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, ShoppingBag, BarChart3, Calendar, Filter } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement);

const SalesReports = () => {
  const [timeframe, setTimeframe] = useState('month');
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    orders: [],
    products: [],
    stats: {
      totalSales: 0,
      totalOrders: 0,
      averageOrderValue: 0,
      conversionRate: 0,
      topSellingProduct: null,
      bestPerformingCategory: null
    },
    trends: {
      dailySales: [],
      salesByStatus: [],
      topProducts: [],
      salesByCategory: []
    }
  });

  useEffect(() => {
    fetchSalesData();
  }, [timeframe, status]);

  const fetchSalesData = async () => {
    try {
      setLoading(true);

      // Fetch orders with customer and product information
      let query = supabase
        .from('orders')
        .select(`
          id,
          total,
          status,
          created_at,
          user_id,
          
          order_items (
            quantity,
            price,
            products (
              id,
              name,
              image_url,
              categories (
                name
              )
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (status !== 'all') {
        query = query.eq('status', status);
      }

      const { data: orders, error: ordersError } = await query;

      if (ordersError) throw ordersError;

      // Fetch all products for comparison
      const { data: products } = await supabase
        .from('products')
        .select(`
          id,
          name,
          price,
          image_url,
          categories (
            name
          )
        `);

      // Calculate statistics
      const totalSales = orders.reduce((sum, order) => sum + order.total, 0);
      const totalOrders = orders.length;
      const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

      // Calculate conversion rate (simplified - would need page visits data)
      const conversionRate = 2.5; // Simulated conversion rate

      // Find top selling product
      const productSales = {};
      orders.forEach(order => {
        order.order_items?.forEach(item => {
          if (item.products) {
            const productId = item.products.id;
            if (!productSales[productId]) {
              productSales[productId] = {
                product: item.products,
                quantity: 0,
                revenue: 0
              };
            }
            productSales[productId].quantity += item.quantity;
            productSales[productId].revenue += item.quantity * item.price;
          }
        });
      });

      const topSellingProduct = Object.values(productSales)
        .sort((a, b) => b.revenue - a.revenue)[0];

      // Find best performing category
      const categorySales = {};
      orders.forEach(order => {
        order.order_items?.forEach(item => {
          if (item.products?.categories) {
            const categoryName = item.products.categories.name;
            if (!categorySales[categoryName]) {
              categorySales[categoryName] = { revenue: 0, orders: 0 };
            }
            categorySales[categoryName].revenue += item.quantity * item.price;
            categorySales[categoryName].orders += 1;
          }
        });
      });

      const bestPerformingCategory = Object.entries(categorySales)
        .sort(([, a], [, b]) => b.revenue - a.revenue)[0];

      // Generate daily sales trend
      const days = timeframe === 'week' ? 7 : timeframe === 'month' ? 30 : timeframe === 'quarter' ? 90 : 365;
      const dailySales = Array.from({ length: days }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (days - 1 - i));
        const dayOrders = orders.filter(order => {
          const orderDate = new Date(order.created_at);
          return orderDate.toDateString() === date.toDateString();
        });
        return {
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          sales: dayOrders.reduce((sum, order) => sum + order.total, 0),
          orders: dayOrders.length
        };
      });

      // Generate sales by status
      const salesByStatus = Object.entries(
        orders.reduce((acc, order) => {
          acc[order.status] = (acc[order.status] || 0) + order.total;
          return acc;
        }, {})
      ).map(([status, sales]) => ({ status, sales }));

      // Generate top products
      const topProducts = Object.values(productSales)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      // Generate sales by category
      const salesByCategory = Object.entries(categorySales).map(([category, data]) => ({
        category,
        revenue: data.revenue,
        orders: data.orders
      }));

      setData({
        orders,
        products: products || [],
        stats: {
          totalSales,
          totalOrders,
          averageOrderValue,
          conversionRate,
          topSellingProduct,
          bestPerformingCategory: bestPerformingCategory ? {
            name: bestPerformingCategory[0],
            revenue: bestPerformingCategory[1].revenue,
            orders: bestPerformingCategory[1].orders
          } : null
        },
        trends: {
          dailySales,
          salesByStatus,
          topProducts,
          salesByCategory
        }
      });

    } catch (error) {
      console.error('Error fetching sales data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Sales Reports</h1>
        <p className="text-gray-600">Analyze sales performance and trends</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-gray-500" />
        <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
          className="rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
        >
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="quarter">Last 90 Days</option>
            <option value="year">Last Year</option>
        </select>
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-500" />
        <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
        >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
        </select>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Sales */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg bg-white p-6 shadow-md"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Sales</p>
              <h3 className="text-2xl font-bold">${data.stats.totalSales.toFixed(2)}</h3>
            </div>
            <div className="rounded-full bg-green-100 p-3">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="mr-1 h-4 w-4 text-green-500" />
            <span className="text-green-500">12%</span>
            <span className="ml-1 text-gray-500">vs last period</span>
          </div>
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
              <p className="text-sm text-gray-600">Total Orders</p>
              <h3 className="text-2xl font-bold">{data.stats.totalOrders}</h3>
            </div>
            <div className="rounded-full bg-blue-100 p-3">
              <ShoppingBag className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="mr-1 h-4 w-4 text-green-500" />
            <span className="text-green-500">8%</span>
            <span className="ml-1 text-gray-500">vs last period</span>
          </div>
        </motion.div>

        {/* Average Order Value */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-lg bg-white p-6 shadow-md"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg. Order Value</p>
              <h3 className="text-2xl font-bold">${data.stats.averageOrderValue.toFixed(2)}</h3>
            </div>
            <div className="rounded-full bg-purple-100 p-3">
              <BarChart3 className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="mr-1 h-4 w-4 text-green-500" />
            <span className="text-green-500">5%</span>
            <span className="ml-1 text-gray-500">vs last period</span>
          </div>
        </motion.div>

        {/* Conversion Rate */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-lg bg-white p-6 shadow-md"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Conversion Rate</p>
              <h3 className="text-2xl font-bold">{data.stats.conversionRate}%</h3>
            </div>
            <div className="rounded-full bg-orange-100 p-3">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="mr-1 h-4 w-4 text-green-500" />
            <span className="text-green-500">2%</span>
            <span className="ml-1 text-gray-500">vs last period</span>
          </div>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Daily Sales Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-lg bg-white p-6 shadow-md"
        >
          <h3 className="mb-4 text-lg font-medium">Daily Sales Trend</h3>
          <div className="h-64">
            <Line
              data={{
                labels: data.trends.dailySales.map(d => d.date),
                datasets: [{
                  label: 'Sales',
                  data: data.trends.dailySales.map(d => d.sales),
                  borderColor: 'rgb(34, 197, 94)',
                  backgroundColor: 'rgba(34, 197, 94, 0.1)',
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

        {/* Sales by Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-lg bg-white p-6 shadow-md"
        >
          <h3 className="mb-4 text-lg font-medium">Sales by Status</h3>
          <div className="h-64">
            <Doughnut
              data={{
                labels: data.trends.salesByStatus.map(d => d.status),
                datasets: [{
                  data: data.trends.salesByStatus.map(d => d.sales),
                  backgroundColor: [
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(245, 158, 11, 0.8)',
                    'rgba(239, 68, 68, 0.8)',
                    'rgba(139, 92, 246, 0.8)'
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
                    position: 'bottom',
                    labels: {
                      padding: 20,
                      usePointStyle: true
                    }
                  }
                }
              }}
            />
          </div>
        </motion.div>
      </div>

      {/* Top Products and Categories */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Selling Products */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="rounded-lg bg-white p-6 shadow-md"
        >
          <h3 className="mb-4 text-lg font-medium">Top Selling Products</h3>
          <div className="space-y-4">
            {data.trends.topProducts.slice(0, 5).map((item, index) => (
              <div key={item.product.id} className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0 ? 'bg-yellow-100 text-yellow-800' :
                    index === 1 ? 'bg-gray-100 text-gray-800' :
                    index === 2 ? 'bg-orange-100 text-orange-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    #{index + 1}
                  </div>
                </div>
                <div className="h-10 w-10 flex-shrink-0">
                  <img
                    className="h-10 w-10 rounded-lg object-cover"
                    src={item.product.image_url}
                    alt={item.product.name}
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/40x40?text=No+Image';
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {item.product.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {item.quantity} units sold
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    ${item.revenue.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Sales by Category */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="rounded-lg bg-white p-6 shadow-md"
        >
          <h3 className="mb-4 text-lg font-medium">Sales by Category</h3>
          <div className="h-64">
            <Bar
              data={{
                labels: data.trends.salesByCategory.map(d => d.category),
                datasets: [{
                  label: 'Revenue',
                  data: data.trends.salesByCategory.map(d => d.revenue),
                  backgroundColor: 'rgba(59, 130, 246, 0.8)',
                  borderColor: 'rgb(59, 130, 246)',
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
        </motion.div>
      </div>

      {/* Recent Orders */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="rounded-lg bg-white p-6 shadow-md"
      >
        <h3 className="mb-4 text-lg font-medium">Recent Orders</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Items
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {data.orders.slice(0, 10).map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    #{order.id.substring(0, 8)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {order.profiles?.full_name || 'Guest'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    ${order.total.toFixed(2)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                      order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                      order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {order.order_items?.length || 0} items
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default SalesReports;