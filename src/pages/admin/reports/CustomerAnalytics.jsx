import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, TrendingUp, ShoppingBag, DollarSign, UserPlus, UserCheck, UserX } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { useTranslation } from 'react-i18next';
import { getGuestCustomerStats, getNewGuestCustomers, getActiveGuestCustomers } from '../../../services/guestCustomerService';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement);

const CustomerAnalytics = () => {
  const [timeframe, setTimeframe] = useState('month');
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();
  const [data, setData] = useState({
    customers: [],
    orders: [],
    stats: {
      totalCustomers: 0,
      newCustomers: 0,
      activeCustomers: 0,
      averageOrderValue: 0,
      purchaseFrequency: 0,
      customerLifetimeValue: 0
    },
    trends: {
      customerGrowth: [],
      purchaseBehavior: [],
      customerSegments: []
    }
  });

  useEffect(() => {
    fetchCustomerData();
  }, [timeframe]);

  const fetchCustomerData = async () => {
    try {
      setLoading(true);

      // Fetch customers (authenticated users)
      const { data: customers, error: customersError } = await supabase
        .from('profiles')
        .select('id, full_name, created_at, avatar_url')
        .eq('is_admin', false)
        .order('created_at', { ascending: false });

      if (customersError) throw customersError;

      // Fetch orders with customer information (including guest orders)
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          total,
          status,
          created_at,
          user_id,
          shipping_address,
          profiles (
            id,
            full_name
          )

        `)
        .eq('profiles.is_admin', false)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Get guest customer statistics using the service
      const guestStats = await getGuestCustomerStats();
      const newGuestCustomers = await getNewGuestCustomers(30);
      const activeGuestCustomers = await getActiveGuestCustomers(30);

      // Calculate statistics
      const totalCustomers = customers.length + guestStats.totalGuests;
      const now = new Date();
      const timeframeDays = timeframe === 'week' ? 7 : timeframe === 'month' ? 30 : timeframe === 'quarter' ? 90 : 365;
      const timeframeDate = new Date(now.getTime() - (timeframeDays * 24 * 60 * 60 * 1000));

      // Separate authenticated and guest customers
      const authenticatedOrders = orders.filter(order => order.user_id);
      const guestOrders = orders.filter(order => !order.user_id);
      
      // Get unique guest customers from shipping addresses
      const guestCustomers = guestOrders.map(order => {
        const phone = order.shipping_address?.phone;
        const email = order.shipping_address?.email || `guest_${phone ? phone.replace(/\D/g, '') : order.id}@kapitalstores.shop`;
        return {
          id: `guest_${phone || email}`,
          full_name: order.shipping_address?.name || 'Guest Customer',
          created_at: order.created_at,
          is_guest: true,
          email: email,
          phone: phone || '',
          has_real_email: !!order.shipping_address?.email
        };
      });

      const newCustomers = customers.filter(customer => 
        new Date(customer.created_at) >= timeframeDate
      ).length;

      const newGuestCustomersCount = newGuestCustomers;

      const activeCustomers = orders
        .filter(order => new Date(order.created_at) >= timeframeDate)
        .map(order => order.user_id)
        .filter((value, index, self) => self.indexOf(value) === index).length;

      const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
      const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

      // Calculate purchase frequency (orders per customer)
      const customerOrderCounts = {};
      orders.forEach(order => {
        if (order.user_id) {
          customerOrderCounts[order.user_id] = (customerOrderCounts[order.user_id] || 0) + 1;
        }
      });
      const purchaseFrequency = Object.keys(customerOrderCounts).length > 0 
        ? Object.values(customerOrderCounts).reduce((sum, count) => sum + count, 0) / Object.keys(customerOrderCounts).length 
        : 0;

      // Calculate customer lifetime value (simplified)
      const totalCustomerCount = totalCustomers;
      const customerLifetimeValue = totalCustomerCount > 0 ? totalRevenue / totalCustomerCount : 0;

      // Generate customer growth trend
      const customerGrowth = Array.from({ length: timeframeDays }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (timeframeDays - 1 - i));
        const customersBeforeDate = customers.filter(customer => 
          new Date(customer.created_at) <= date
        ).length;
        return {
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          customers: customersBeforeDate
        };
      });

      // Generate purchase behavior data
      const purchaseBehavior = Array.from({ length: timeframeDays }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (timeframeDays - 1 - i));
        const dayOrders = orders.filter(order => {
          const orderDate = new Date(order.created_at);
          return orderDate.toDateString() === date.toDateString();
        });
        return {
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          orders: dayOrders.length,
          revenue: dayOrders.reduce((sum, order) => sum + order.total, 0)
        };
      });

      // Generate customer segments with guest customer data
      const customerSegments = [
        {
          name: 'Nouveaux Clients',
          count: newCustomers + newGuestCustomersCount,
          color: 'bg-blue-100 text-blue-600',
          description: 'Inscrits dans les ' + timeframeDays + ' derniers jours'
        },
        {
          name: 'Clients Invités',
          count: guestStats.totalGuests,
          color: 'bg-orange-100 text-orange-600',
          description: 'Achats sans compte'
        },
        {
          name: 'Clients Actifs',
          count: activeCustomers + activeGuestCustomers,
          color: 'bg-green-100 text-green-600',
          description: 'Achats dans les ' + timeframeDays + ' derniers jours'
        },
        {
          name: 'Clients Inactifs',
          count: totalCustomers - (activeCustomers + activeGuestCustomers),
          color: 'bg-gray-100 text-gray-600',
          description: 'Aucun achat dans les ' + timeframeDays + ' derniers jours'
        }
      ];

      setData({
        customers: [...customers, ...guestCustomers],
        orders,
        stats: {
          totalCustomers: totalCustomerCount,
          newCustomers: newCustomers + newGuestCustomersCount,
          activeCustomers: activeCustomers + activeGuestCustomers,
          averageOrderValue,
          purchaseFrequency,
          customerLifetimeValue
        },
        trends: {
          customerGrowth,
          purchaseBehavior,
          customerSegments
        }
      });

    } catch (error) {
      console.error('Error fetching customer data:', error);
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
              <h3 className="text-2xl font-bold">{data.stats.newCustomers}</h3>
            </div>
            <div className="rounded-full bg-blue-100 p-3">
              <UserPlus className="h-6 w-6 text-blue-600" />
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
              <h3 className="text-2xl font-bold">${data.stats.averageOrderValue.toFixed(2)}</h3>
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
              <h3 className="text-2xl font-bold">{data.stats.purchaseFrequency.toFixed(1)}</h3>
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
              <h3 className="text-2xl font-bold">{data.stats.customerLifetimeValue.toFixed(2)} {t('common.currency')}</h3>
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
            <Line
              data={{
                labels: data.trends.customerGrowth.map(d => d.date),
                datasets: [{
                  label: 'Total Customers',
                  data: data.trends.customerGrowth.map(d => d.customers),
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

        {/* Purchase Behavior */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-lg bg-white p-6 shadow-md"
        >
          <h3 className="mb-4 text-lg font-medium">Purchase Behavior</h3>
          <div className="h-64">
            <Bar
              data={{
                labels: data.trends.purchaseBehavior.map(d => d.date),
                datasets: [{
                  label: 'Orders',
                  data: data.trends.purchaseBehavior.map(d => d.orders),
                  backgroundColor: 'rgba(16, 185, 129, 0.8)',
                  borderColor: 'rgb(16, 185, 129)',
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

      {/* Customer Segments */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="rounded-lg bg-white p-6 shadow-md"
      >
        <h3 className="mb-4 text-lg font-medium">Customer Segments</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {data.trends.customerSegments.map((segment) => (
            <div key={segment.name} className="rounded-lg border border-gray-200 p-4">
              <div className={`mb-2 inline-block rounded-full ${segment.color} p-2`}>
                {segment.name === 'Nouveaux Clients' && <UserPlus className="h-5 w-5" />}
                {segment.name === 'Clients Actifs' && <UserCheck className="h-5 w-5" />}
                {segment.name === 'Clients Inactifs' && <UserX className="h-5 w-5" />}
              </div>
              <h4 className="font-medium">{segment.name}</h4>
              <p className="text-2xl font-bold">{segment.count}</p>
              <p className="text-sm text-gray-500 mt-1">{segment.description}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Recent Customers Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="rounded-lg bg-white p-6 shadow-md"
      >
        <h3 className="mb-4 text-lg font-medium">Recent Customers</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Joined Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Orders
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Total Spent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {data.customers.slice(0, 10).map((customer) => {
                const customerOrders = data.orders.filter(order => order.user_id === customer.id);
                const totalSpent = customerOrders.reduce((sum, order) => sum + order.total, 0);
                const isActive = customerOrders.some(order => {
                  const orderDate = new Date(order.created_at);
                  const thirtyDaysAgo = new Date();
                  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                  return orderDate >= thirtyDaysAgo;
                });

                return (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <img
                            className="h-10 w-10 rounded-full object-cover"
                            src={customer.avatar_url || (customer.is_guest ? 'https://via.placeholder.com/40x40?text=G' : 'https://via.placeholder.com/40x40?text=U')}
                            alt={customer.full_name}
                            onError={(e) => {
                              e.target.src = customer.is_guest ? 'https://via.placeholder.com/40x40?text=G' : 'https://via.placeholder.com/40x40?text=U';
                            }}
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {customer.full_name}
                            {customer.is_guest && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                                Guest
                              </span>
                            )}
                          </div>
                          {customer.is_guest && customer.email && (
                            <div className="text-xs text-gray-500">
                              {customer.email}
                              {!customer.has_real_email && (
                                <span className="ml-1 text-orange-600">(généré)</span>
                              )}
                            </div>
                          )}
                          {customer.is_guest && customer.phone && (
                            <div className="text-xs text-gray-500">
                              📞 {customer.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {new Date(customer.created_at).toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {customerOrders.length}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {totalSpent.toFixed(2)} {t('common.currency')}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                        isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default CustomerAnalytics;