import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Calendar, Search, Filter } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet';
import { format } from 'date-fns';
import { formatPrice } from '../../utils/currency';
import { fr, enUS } from 'date-fns/locale';
import OrderDetailsModal from '../../components/OrderDetailsModal';
import toast from 'react-hot-toast';


const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === 'fr' ? fr : enUS;
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchPayments();
  }, [dateFilter, statusFilter]);

  const fetchPayments = async () => {
    try {
      setIsLoading(true);
      let query = supabase
        .from('payments')
        .select(`
          *,
          orders (
            id,
            total,
            customer_name,
            customer_email
          )
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (dateFilter !== 'all') {
        const now = new Date();
        let startDate;
        switch (dateFilter) {
          case 'today':
            startDate = new Date(now.setHours(0, 0, 0, 0));
            break;
          case 'week':
            startDate = new Date(now.setDate(now.getDate() - 7));
            break;
          case 'month':
            startDate = new Date(now.setMonth(now.getMonth() - 1));
            break;
          default:
            break;
        }
        if (startDate) {
          query = query.gte('created_at', startDate.toISOString());
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date) => {
    return format(new Date(date), 'PPpp', { locale: dateLocale });
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const filteredPayments = payments.filter(payment => {
    const searchLower = searchQuery.toLowerCase();
    return (
      payment.provider_id?.toLowerCase().includes(searchLower) ||
      payment.orders?.customer_name?.toLowerCase().includes(searchLower) ||
      payment.orders?.customer_email?.toLowerCase().includes(searchLower)
    );
  });

  const fetchOrderDetails = async (orderId) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`*, order_items(*, products(*))`)
        .eq('id', orderId)
        .single();
      if (error) throw error;
      setSelectedOrder(data);
      setShowModal(true);
    } catch (error) {
      toast.error(t('admin.payments.fetch_order_error'));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{t('admin.payments.title')}</title>
      </Helmet>

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{t('admin.payments.title')}</h1>
          <p className="text-gray-600">{t('admin.payments.description')}</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder={t('admin.payments.search_placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          >
            <option value="all">{t('admin.payments.filters.all')}</option>
            <option value="completed">{t('admin.payments.filters.completed')}</option>
            <option value="pending">{t('admin.payments.filters.pending')}</option>
            <option value="failed">{t('admin.payments.filters.failed')}</option>
          </select>

          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          >
            <option value="all">{t('admin.payments.filters.all_time')}</option>
            <option value="today">{t('admin.payments.filters.today')}</option>
            <option value="week">{t('admin.payments.filters.this_week')}</option>
            <option value="month">{t('admin.payments.filters.this_month')}</option>
          </select>
        </div>

        {/* Payments Table */}
        <div className="overflow-x-auto rounded-lg bg-white shadow-md">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('admin.payments.table.id')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('admin.payments.table.order')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('admin.payments.table.amount')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('admin.payments.table.provider')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('admin.payments.table.status')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('admin.payments.table.date')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredPayments.map((payment) => (
                <motion.tr
                  key={payment.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-gray-50"
                >
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {payment.provider_id}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {payment.orders?.customer_name || t('admin.payments.table.unknown_customer')}
                    </div>
                    <div className="text-sm text-gray-500">
                      {payment.orders?.customer_email}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {formatPrice(payment.amount)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {payment.provider}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStatusColor(payment.status)}`}>
                      {t(`admin.payments.status.${payment.status}`)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {formatDate(payment.created_at)}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      className="text-blue-600 hover:underline font-mono"
                      onClick={() => fetchOrderDetails(payment.orders?.id)}
                      disabled={!payment.orders?.id}
                    >
                      {payment.orders?.id || '-'}
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>

          {filteredPayments.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {t('admin.payments.no_payments')}
            </div>
          )}
        </div>
      </div>
      {showModal && selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => {
            setShowModal(false);
            setSelectedOrder(null);
          }}
        />
      )}
    </>
  );
};

export default Payments;