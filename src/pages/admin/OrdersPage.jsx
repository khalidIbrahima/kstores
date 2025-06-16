import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import OrderLocationMap from '../../components/OrderLocationMap';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';

const OrdersPage = () => {
  const { t, i18n } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          users:user_id (
            email,
            full_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError(t('admin.orders.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;
      
      // Update local state
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
    } catch (error) {
      console.error('Error updating order status:', error);
      setError(t('admin.orders.updateError'));
    }
  };

  const formatDate = (date) => {
    const locale = i18n.language === 'fr' ? fr : enUS;
    return format(new Date(date), 'PPpp', { locale });
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="rounded-md bg-red-100 p-4 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">{t('admin.orders.title')}</h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Orders List */}
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    {t('admin.orders.table.orderId')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    {t('admin.orders.table.customer')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    {t('admin.orders.table.date')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    {t('admin.orders.table.total')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    {t('admin.orders.table.status')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    {t('admin.orders.table.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm text-gray-900">#{order.id}</div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {order.users?.full_name || order.users?.email}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {formatDate(order.created_at)}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm text-gray-900">
                        ${order.total.toFixed(2)}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                        order.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : order.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {t(`admin.orders.status.${order.status}`)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className="rounded-md border border-gray-300 px-2 py-1 text-sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="pending">{t('admin.orders.status.pending')}</option>
                        <option value="processing">{t('admin.orders.status.processing')}</option>
                        <option value="completed">{t('admin.orders.status.completed')}</option>
                        <option value="cancelled">{t('admin.orders.status.cancelled')}</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Order Details Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-black/40">
            <div className="relative w-full max-w-4xl mx-4 bg-white rounded-2xl shadow-2xl p-8 overflow-y-auto max-h-[90vh]">
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none"
                onClick={() => setSelectedOrder(null)}
                aria-label="Close"
              >
                &times;
              </button>
              <h2 className="mb-6 text-2xl font-bold text-center text-gray-900">
                {t('admin.orders.details.title')} #{selectedOrder.id}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left: Infos */}
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">
                      {t('admin.orders.details.customer')}
                    </h3>
                    <div className="text-gray-700">
                      {selectedOrder.users?.full_name || selectedOrder.users?.email}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">
                      {t('admin.orders.details.shipping')}
                    </h3>
                    <div className="text-gray-700">
                      {selectedOrder.shipping_address.name}<br />
                      {selectedOrder.shipping_address.address}<br />
                      {selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state}<br />
                      {selectedOrder.shipping_address.zip_code}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">
                      {t('admin.orders.details.status')}
                    </h3>
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold leading-5 ${
                      selectedOrder.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : selectedOrder.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {t(`admin.orders.status.${selectedOrder.status}`)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">
                      {t('admin.orders.details.date')}
                    </h3>
                    <div className="text-gray-700">{formatDate(selectedOrder.created_at)}</div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">
                      {t('admin.orders.details.total')}
                    </h3>
                    <div className="text-gray-900 font-bold text-lg">
                      {selectedOrder.total ? `${selectedOrder.total.toLocaleString()} FCFA` : ''}
                    </div>
                  </div>
                </div>
                {/* Right: Carte + Produits */}
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                      <span>{t('admin.orders.details.location')}</span>
                      {selectedOrder.userGeolocation && (
                        <span className="text-xs text-gray-500">(
                          {selectedOrder.userGeolocation.lat?.toFixed(5)}, {selectedOrder.userGeolocation.lng?.toFixed(5)}
                        )</span>
                      )}
                    </h3>
                    <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm h-56">
                      <OrderLocationMap
                        userGeolocation={selectedOrder.userGeolocation}
                        userName={selectedOrder.shipping_address.name}
                      />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">
                      {t('admin.orders.details.items')}
                    </h3>
                    <div className="divide-y divide-gray-100 bg-gray-50 rounded-lg p-2">
                      {selectedOrder.order_items?.map((item) => (
                        <div key={item.id} className="flex justify-between py-2 text-sm">
                          <span>{item.product.name} x {item.quantity}</span>
                          <span>{(item.price * item.quantity).toLocaleString()} FCFA</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage; 