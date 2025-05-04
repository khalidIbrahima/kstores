import { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, LineChart, PieChart, Download } from 'lucide-react';

const SalesReports = () => {
  const [dateRange, setDateRange] = useState('week');
  const [reportType, setReportType] = useState('revenue');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sales Reports</h1>
          <p className="text-gray-600">Analyze your sales performance</p>
        </div>
        <button className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
        >
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
        </select>

        <select
          value={reportType}
          onChange={(e) => setReportType(e.target.value)}
          className="rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
        >
          <option value="revenue">Revenue</option>
          <option value="orders">Orders</option>
          <option value="products">Products</option>
        </select>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revenue Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg bg-white p-6 shadow-md"
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-medium">Revenue Trend</h3>
            <div className="rounded-full bg-blue-100 p-2">
              <LineChart className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <div className="h-64">
            {/* Chart will be implemented here */}
            <div className="flex h-full items-center justify-center text-gray-500">
              Revenue trend chart will be displayed here
            </div>
          </div>
        </motion.div>

        {/* Orders Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-lg bg-white p-6 shadow-md"
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-medium">Orders Overview</h3>
            <div className="rounded-full bg-purple-100 p-2">
              <BarChart className="h-5 w-5 text-purple-600" />
            </div>
          </div>
          <div className="h-64">
            {/* Chart will be implemented here */}
            <div className="flex h-full items-center justify-center text-gray-500">
              Orders overview chart will be displayed here
            </div>
          </div>
        </motion.div>

        {/* Sales by Category */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-lg bg-white p-6 shadow-md"
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-medium">Sales by Category</h3>
            <div className="rounded-full bg-green-100 p-2">
              <PieChart className="h-5 w-5 text-green-600" />
            </div>
          </div>
          <div className="h-64">
            {/* Chart will be implemented here */}
            <div className="flex h-full items-center justify-center text-gray-500">
              Category distribution chart will be displayed here
            </div>
          </div>
        </motion.div>

        {/* Top Products */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-lg bg-white p-6 shadow-md"
        >
          <h3 className="mb-4 text-lg font-medium">Top Products</h3>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm font-medium">
                    {index}
                  </span>
                  <span className="font-medium">Product {index}</span>
                </div>
                <span className="text-gray-600">${(Math.random() * 1000).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SalesReports;