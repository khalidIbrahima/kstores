import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, TrendingUp, ShoppingBag, DollarSign } from 'lucide-react';

const CustomerAnalytics = () => {
  const [timeframe, setTimeframe] = useState('month');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Customer Analytics</h1>
        <p className="text-gray-600">Analyze customer behavior and trends</p>
      </div>

      {/* Timeframe Filter */}
      <div className="flex items-center space-x-4">
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

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Customer Growth */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg bg-white p-6 shadow-md"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">New Customers</p>
              <h3 className="text-2xl font-bold">127</h3>
            </div>
            <div className="rounded-full bg-blue-100 p-3">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="mr-1 h-4 w-4 text-green-500" />
            <span className="text-green-500">12%</span>
            <span className="ml-1 text-gray-500">vs last period</span>
          </div>
        </motion.div>

        {/* Average Order Value */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-lg bg-white p-6 shadow-md"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg. Order Value</p>
              <h3 className="text-2xl font-bold">$85.50</h3>
            </div>
            <div className="rounded-full bg-green-100 p-3">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="mr-1 h-4 w-4 text-green-500" />
            <span className="text-green-500">8%</span>
            <span className="ml-1 text-gray-500">vs last period</span>
          </div>
        </motion.div>

        {/* Purchase Frequency */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-lg bg-white p-6 shadow-md"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Purchase Frequency</p>
              <h3 className="text-2xl font-bold">2.3</h3>
            </div>
            <div className="rounded-full bg-purple-100 p-3">
              <ShoppingBag className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="mr-1 h-4 w-4 text-green-500" />
            <span className="text-green-500">5%</span>
            <span className="ml-1 text-gray-500">vs last period</span>
          </div>
        </motion.div>

        {/* Customer Lifetime Value */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-lg bg-white p-6 shadow-md"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg. Lifetime Value</p>
              <h3 className="text-2xl font-bold">$420.75</h3>
            </div>
            <div className="rounded-full bg-yellow-100 p-3">
              <Users className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="mr-1 h-4 w-4 text-green-500" />
            <span className="text-green-500">15%</span>
            <span className="ml-1 text-gray-500">vs last period</span>
          </div>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Customer Growth Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-lg bg-white p-6 shadow-md"
        >
          <h3 className="mb-4 text-lg font-medium">Customer Growth</h3>
          <div className="h-64">
            <div className="flex h-full items-center justify-center text-gray-500">
              Customer growth chart will be displayed here
            </div>
          </div>
        </motion.div>

        {/* Purchase Behavior */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-lg bg-white p-6 shadow-md"
        >
          <h3 className="mb-4 text-lg font-medium">Purchase Behavior</h3>
          <div className="h-64">
            <div className="flex h-full items-center justify-center text-gray-500">
              Purchase behavior chart will be displayed here
            </div>
          </div>
        </motion.div>
      </div>

      {/* Customer Segments */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="rounded-lg bg-white p-6 shadow-md"
      >
        <h3 className="mb-4 text-lg font-medium">Customer Segments</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { name: 'New Customers', count: 127, color: 'bg-blue-100 text-blue-600' },
            { name: 'Regular Customers', count: 843, color: 'bg-green-100 text-green-600' },
            { name: 'VIP Customers', count: 156, color: 'bg-purple-100 text-purple-600' },
            { name: 'Inactive Customers', count: 234, color: 'bg-gray-100 text-gray-600' }
          ].map((segment) => (
            <div key={segment.name} className="rounded-lg border border-gray-200 p-4">
              <div className={`mb-2 inline-block rounded-full ${segment.color} p-2`}>
                <Users className="h-5 w-5" />
              </div>
              <h4 className="font-medium">{segment.name}</h4>
              <p className="text-2xl font-bold">{segment.count}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default CustomerAnalytics;