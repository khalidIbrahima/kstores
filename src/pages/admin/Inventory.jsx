import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { AlertCircle, Package, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { useTranslation } from 'react-i18next';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

export default function AdminInventory() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalStockValue: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    averageStockLevel: 0
  });
  const [chartData, setChartData] = useState({
    stockLevels: [],
    categoryDistribution: []
  });

  useEffect(() => {
    fetchInventoryData();
  }, []);

  async function fetchInventoryData() {
    try {
      setLoading(true);
      
      // Fetch products with category information
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          id, 
          name, 
          inventory, 
          price,
          image_url,
          created_at,
          categories (
            name
          )
        `)
        .order('inventory', { ascending: true });

      if (productsError) throw productsError;

      // Calculate inventory statistics
      const totalProducts = productsData.length;
      const totalStockValue = productsData.reduce((sum, product) => sum + (product.inventory * product.price), 0);
      const lowStockItems = productsData.filter(product => product.inventory > 0 && product.inventory <= 10).length;
      const outOfStockItems = productsData.filter(product => product.inventory === 0).length;
      const averageStockLevel = totalProducts > 0 ? Math.round(productsData.reduce((sum, product) => sum + product.inventory, 0) / totalProducts) : 0;

      // Generate chart data for stock levels 
      const stockLevels = productsData.slice(0, 10).map(product => ({
        name: product.name,
        inventory: product.inventory,
        value: product.inventory * product.price
      }));

      // Generate category distribution data
      const categoryStats = {};
      productsData.forEach(product => {
        const categoryName = product.categories?.name || 'Uncategorized';
        if (!categoryStats[categoryName]) {
          categoryStats[categoryName] = { count: 0, totalStock: 0 };
        }
        categoryStats[categoryName].count++;
        categoryStats[categoryName].totalStock += product.inventory;
      });

      const categoryDistribution = Object.entries(categoryStats).map(([name, data]) => ({
        name,
        count: data.count,
        totalStock: data.totalStock
      }));

      setProducts(productsData);
      setStats({
        totalProducts,
        totalStockValue,
        lowStockItems,
        outOfStockItems,
        averageStockLevel
      });
      setChartData({
        stockLevels,
        categoryDistribution
      });

    } catch (err) {
      setError('Failed to fetch inventory data');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }

  const getStockStatus = (inventory) => {
    if (inventory === 0) return { status: 'Out of Stock', color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400', icon: XCircle };
    if (inventory <= 10) return { status: 'Low Stock', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400', icon: AlertTriangle };
    return { status: 'In Stock', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400', icon: CheckCircle };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 mr-2" />
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Package className="h-6 w-6" />
          Inventory Management
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Monitor and manage your product inventory levels
        </p>
      </div>

      {/* Inventory Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-lg p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Products</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalProducts}</h3>
            </div>
            <div className="rounded-full bg-blue-100 dark:bg-blue-900/20 p-3">
              <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-lg p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Stock Value</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalStockValue.toFixed(2)} {t('common.currency')}</h3>
            </div>
            <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-3">
              <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-lg p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Low Stock Items</p>
              <h3 className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.lowStockItems}</h3>
            </div>
            <div className="rounded-full bg-yellow-100 dark:bg-yellow-900/20 p-3">
              <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-lg p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Out of Stock</p>
              <h3 className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.outOfStockItems}</h3>
            </div>
            <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-3">
              <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-lg p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Stock Level</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.averageStockLevel}</h3>
            </div>
            <div className="rounded-full bg-purple-100 dark:bg-purple-900/20 p-3">
              <Package className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Stock Levels by Product</h3>
          <div className="h-64">
            <Bar
              data={{
                labels: chartData.stockLevels.map(item => item.name.substring(0, 15) + '...'),
                datasets: [{
                  label: 'Stock Level',
                  data: chartData.stockLevels.map(item => item.stock),
                  backgroundColor: chartData.stockLevels.map(item => 
                    item.stock === 0 ? 'rgba(239, 68, 68, 0.8)' :
                    item.stock <= 10 ? 'rgba(245, 158, 11, 0.8)' :
                    'rgba(34, 197, 94, 0.8)'
                  ),
                  borderColor: chartData.stockLevels.map(item => 
                    item.stock === 0 ? 'rgb(239, 68, 68)' :
                    item.stock <= 10 ? 'rgb(245, 158, 11)' :
                    'rgb(34, 197, 94)'
                  ),
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

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Category Distribution</h3>
          <div className="h-64">
            <Bar
              data={{
                labels: chartData.categoryDistribution.map(item => item.name),
                datasets: [{
                  label: 'Total Stock',
                  data: chartData.categoryDistribution.map(item => item.totalStock),
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
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Product Inventory</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Stock Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Unit Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Stock Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {products.map((product) => {
                const stockStatus = getStockStatus(product.inventory);
                const StockIcon = stockStatus.icon;
                const stockValue = product.inventory * product.price;
                
                return (
                  <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
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
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {product.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {product.categories?.name || 'Uncategorized'}
                      </div>
                    </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {product.inventory}
                    </div>
                  </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {product.price} {t('common.currency')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {stockValue} {t('common.currency')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${stockStatus.color}`}>
                        <StockIcon className="h-3 w-3 mr-1" />
                        {stockStatus.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}