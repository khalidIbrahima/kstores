import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, AlertTriangle, ArrowDown, ArrowUp, TrendingUp, TrendingDown } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { useTranslation } from 'react-i18next';


ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement);

const InventoryReports = () => {
  const [timeframe, setTimeframe] = useState('month');
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();
  const [data, setData] = useState({
    products: [],
    categories: [],
    stats: {
      totalStockValue: 0,
      lowStockItems: 0,
      stockTurnover: 0,
      outOfStockItems: 0
    },
    trends: {
      stockLevels: [],
      categoryDistribution: [],
      stockValueByCategory: []
    }
  });

  useEffect(() => {
    fetchInventoryData();
  }, [timeframe, category]);

  const fetchInventoryData = async () => {
    try {
      setLoading(true);

      // Fetch products with category information
      let query = supabase
        .from('products')
        .select(`
          id,
          name,
          inventory,
          price,
          image_url,
          created_at,
          categories (
            id,
            name
          )
        `);

      if (category !== 'all') {
        query = query.eq('categories.name', category);
      }

      const { data: products, error: productsError } = await query;

      if (productsError) throw productsError;

      // Fetch categories for filter
      const { data: categories } = await supabase
        .from('categories')
        .select('id, name')
        .order('name');

      // Calculate statistics
      const totalStockValue = products.reduce((sum, product) => sum + (product.inventory * product.price), 0);
      const lowStockItems = products.filter(product => product.inventory > 0 && product.inventory <= 10).length;
      const outOfStockItems = products.filter(product => product.inventory === 0).length;
      
      // Calculate stock turnover (simplified - would need order history for real calculation)
      const stockTurnover = products.length > 0 ? 
        Math.round((products.reduce((sum, product) => sum + product.inventory, 0) / products.length) * 0.3) : 0;

      // Generate trend data for the selected timeframe
      const days = timeframe === 'week' ? 7 : timeframe === 'month' ? 30 : timeframe === 'quarter' ? 90 : 365;
      const stockLevels = Array.from({ length: days }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (days - 1 - i));
        return {
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          stock: Math.floor(Math.random() * 100) + 50 // Simulated data
        };
      });

      // Generate category distribution
      const categoryStats = {};
      products.forEach(product => {
        const categoryName = product.categories?.name || 'Uncategorized';
        if (!categoryStats[categoryName]) {
          categoryStats[categoryName] = { count: 0, totalStock: 0, totalValue: 0 };
        }
        categoryStats[categoryName].count++;
        categoryStats[categoryName].totalStock += product.inventory;
        categoryStats[categoryName].totalValue += product.inventory * product.price;
      });

      const categoryDistribution = Object.entries(categoryStats).map(([name, stats]) => ({
        name,
        count: stats.count,
        totalStock: stats.totalStock,
        totalValue: stats.totalValue
      }));

      // Generate stock value by category
      const stockValueByCategory = categoryDistribution.map(cat => ({
        name: cat.name,
        value: cat.totalValue
      }));

      setData({
        products,
        categories: categories || [],
        stats: {
          totalStockValue,
          lowStockItems,
          stockTurnover,
          outOfStockItems
        },
        trends: {
          stockLevels,
          categoryDistribution,
          stockValueByCategory
        }
      });

    } catch (error) {
      console.error('Error fetching inventory data:', error);
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
        <h1 className="text-2xl font-bold">Inventory Reports</h1>
        <p className="text-gray-600">Track inventory levels and movements</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
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

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
        >
          <option value="all">All Categories</option>
          {data.categories.map((cat) => (
            <option key={cat.id} value={cat.name}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Stock Value */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg bg-white p-6 shadow-md"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Stock Value</p>
              <h3 className="text-2xl font-bold">{data.stats.totalStockValue.toFixed(2)} {t('common.currency')}</h3>
            </div>
            <div className="rounded-full bg-blue-100 p-3">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <ArrowUp className="mr-1 h-4 w-4 text-green-500" />
            <span className="text-green-500">8%</span>
            <span className="ml-1 text-gray-500">vs last month</span>
          </div>
        </motion.div>

        {/* Low Stock Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-lg bg-white p-6 shadow-md"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Low Stock Items</p>
              <h3 className="text-2xl font-bold">{data.stats.lowStockItems}</h3>
            </div>
            <div className="rounded-full bg-yellow-100 p-3">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <ArrowDown className="mr-1 h-4 w-4 text-red-500" />
            <span className="text-red-500">3</span>
            <span className="ml-1 text-gray-500">since yesterday</span>
          </div>
        </motion.div>

        {/* Stock Turnover */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-lg bg-white p-6 shadow-md"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Stock Turnover Rate</p>
              <h3 className="text-2xl font-bold">{data.stats.stockTurnover}x</h3>
            </div>
            <div className="rounded-full bg-green-100 p-3">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <ArrowUp className="mr-1 h-4 w-4 text-green-500" />
            <span className="text-green-500">0.3x</span>
            <span className="ml-1 text-gray-500">vs last month</span>
          </div>
        </motion.div>

        {/* Out of Stock */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-lg bg-white p-6 shadow-md"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Out of Stock Items</p>
              <h3 className="text-2xl font-bold">{data.stats.outOfStockItems}</h3>
            </div>
            <div className="rounded-full bg-red-100 p-3">
              <Package className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <ArrowDown className="mr-1 h-4 w-4 text-green-500" />
            <span className="text-green-500">2</span>
            <span className="ml-1 text-gray-500">vs last week</span>
          </div>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Stock Level Trends */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-lg bg-white p-6 shadow-md"
        >
          <h3 className="mb-4 text-lg font-medium">Stock Level Trends</h3>
          <div className="h-64">
            <Line
              data={{
                labels: data.trends.stockLevels.map(d => d.date),
                datasets: [{
                  label: 'Stock Level',
                  data: data.trends.stockLevels.map(d => d.inventory),
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

        {/* Inventory Turnover */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-lg bg-white p-6 shadow-md"
        >
          <h3 className="mb-4 text-lg font-medium">Stock Value by Category</h3>
          <div className="h-64">
            <Doughnut
              data={{
                labels: data.trends.stockValueByCategory.map(d => d.name),
                datasets: [{
                  data: data.trends.stockValueByCategory.map(d => d.value ),
                  backgroundColor: [
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(245, 158, 11, 0.8)',
                    'rgba(239, 68, 68, 0.8)',
                    'rgba(139, 92, 246, 0.8)',
                    'rgba(236, 72, 153, 0.8)'
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

      {/* Low Stock Items Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="rounded-lg bg-white p-6 shadow-md"
      >
        <h3 className="mb-4 text-lg font-medium">Low Stock Items</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Current Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Unit Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Stock Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {data.products
                .filter(product => product.inventory <= 10)
                .slice(0, 10)
                .map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        <img
                          className="h-10 w-10 rounded-lg object-cover"
                          src={product.image_url}
                          alt={product.name}
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/40x40?text=No+Image';
                          }}
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {product.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {product.categories?.name || 'Uncategorized'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {product.inventory}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {product.price} {t('common.currency')}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {(product.inventory * product.price)} {t('common.currency')}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                                         <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                       product.inventory === 0 
                         ? 'bg-red-100 text-red-800' 
                         : 'bg-yellow-100 text-yellow-800'
                     }`}>
                       {product.inventory === 0 ? 'Out of Stock' : 'Low Stock'}
                     </span>
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

export default InventoryReports;