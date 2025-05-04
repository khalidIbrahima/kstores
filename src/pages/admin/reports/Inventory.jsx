import { useState } from 'react';
import { motion } from 'framer-motion';
import { Package, AlertTriangle, ArrowDown, ArrowUp } from 'lucide-react';

const InventoryReports = () => {
  const [timeframe, setTimeframe] = useState('month');
  const [category, setCategory] = useState('all');

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
          <option value="electronics">Electronics</option>
          <option value="clothing">Clothing</option>
          <option value="home">Home & Living</option>
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
              <h3 className="text-2xl font-bold">$124,500</h3>
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
              <h3 className="text-2xl font-bold">12</h3>
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
              <h3 className="text-2xl font-bold">4.2x</h3>
            </div>
            <div className="rounded-full bg-green-100 p-3">
              <ArrowUp className="h-6 w-6 text-green-600" />
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
              <h3 className="text-2xl font-bold">5</h3>
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
            <div className="flex h-full items-center justify-center text-gray-500">
              Stock level trends chart will be displayed here
            </div>
          </div>
        </motion.div>

        {/* Inventory Turnover */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-lg bg-white p-6 shadow-md"
        >
          <h3 className="mb-4 text-lg font-medium">Inventory Turnover</h3>
          <div className="h-64">
            <div className="flex h-full items-center justify-center text-gray-500">
              Inventory turnover chart will be displayed here
            </div>
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
                  Reorder Point
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {[1, 2, 3, 4, 5].map((index) => (
                <tr key={index}>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        <div className="h-full w-full rounded-full bg-gray-200"></div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          Product {index}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    Category {index}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {Math.floor(Math.random() * 10)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    10
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <span className="inline-flex rounded-full bg-red-100 px-2 text-xs font-semibold leading-5 text-red-800">
                      Low Stock
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