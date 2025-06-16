import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Eye, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import OrderLocationMap from '../../components/OrderLocationMap';
import QRCode from 'react-qr-code';
import { useTranslation } from 'react-i18next';

const Orders = () => {
  const { t, i18n } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          profiles (
            full_name
          ),
          order_items (
            *,
            products (
              name,
              image_url
            )
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to fetch orders');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);
      
      if (error) throw error;

      setOrders(orders.map(order =>
        order.id === orderId ? { ...order, status: newStatus } : order
      ));

      toast.success('Order status updated successfully');
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  };

  const filteredOrders = orders.filter(order =>
    order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (order.profiles?.full_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t('orders.title')}</h1>
          <p className="text-gray-600">{t('orders.manage_customer_orders')}</p>
        </div>
        
        <div className="relative">
          <input
            type="text"
            placeholder={t('search_orders')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64 rounded-md border border-gray-300 pl-10 pr-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          />
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg bg-white shadow-md">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('order_id')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('customer')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('date')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('total')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('status')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredOrders.map((order) => (
                <motion.tr
                  key={order.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {order.id}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {order.shipping_address?.name || 'Unknown Customer'}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {order.total.toFixed(2) } FCFA
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                    >
                      <option value="pending">{t('pending')}</option>
                      <option value="processing">{t('processing')}</option>
                      <option value="shipped">{t('shipped')}</option>
                      <option value="delivered">{t('delivered')}</option>
                      <option value="cancelled">{t('cancelled')}</option>
                    </select>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                    <button
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Eye className="h-5 w-5" />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Order Details Modal */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-black/40 overflow-y-auto p-4">
          <div className="relative w-full max-w-4xl rounded-2xl bg-white p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
            <button
              onClick={() => {
                setShowModal(false);
                setSelectedOrder(null);
              }}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none"
              aria-label="Close"
            >
              &times;
            </button>
            <h2 className="mb-6 text-2xl font-bold text-center text-gray-900">{t('order_details')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Infos client & commande */}
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-800 mb-1">{t('customer_information')}</h3>
                  <div className="rounded-lg bg-gray-50 p-4 space-y-1">
                    <p><strong>{t('name')}:</strong> {selectedOrder.profiles?.full_name || 'Unknown Customer'}</p>
                    {selectedOrder.shipping_address?.email && (
                      <p><strong>{t('email')}:</strong> {selectedOrder.shipping_address.email}</p>
                    )}
                    {selectedOrder.shipping_address?.phone && (
                      <p><strong>{t('phone')}:</strong> {selectedOrder.shipping_address.phone}</p>
                    )}
                    {selectedOrder.shipping_address?.address && (
                      <p><strong>{t('address')}:</strong> {selectedOrder.shipping_address.address}</p>
                    )}
                    {selectedOrder.shipping_address?.city && (
                      <p><strong>{t('city')}:</strong> {selectedOrder.shipping_address.city}</p>
                    )}
                    {selectedOrder.shipping_address?.state && (
                      <p><strong>{t('state')}:</strong> {selectedOrder.shipping_address.state}</p>
                    )}
                    {selectedOrder.shipping_address?.zip_code && (
                      <p><strong>{t('zip_code')}:</strong> {selectedOrder.shipping_address.zip_code}</p>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-1">{t('order_information')}</h3>
                  <div className="rounded-lg bg-gray-50 p-4 space-y-1">
                    <p><strong>{t('order_id')}:</strong> {selectedOrder.id}</p>
                    <p><strong>{t('date')}:</strong> {new Date(selectedOrder.created_at).toLocaleString()}</p>
                    <p><strong>{t('status')}:</strong> {selectedOrder.status}</p>
                    <p><strong>{t('total')}:</strong> {selectedOrder.total ? `${selectedOrder.total.toLocaleString()} FCFA` : ''}</p>
                  </div>
                </div>
              </div>
              {/* Carte de localisation */}
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">{t('customer_location')}</h3>
                  {(() => {
                    let geo = selectedOrder.userGeolocation;
                    if (typeof geo === 'string') {
                      try {
                        geo = JSON.parse(geo);
                      } catch (e) {
                        geo = null;
                      }
                    }
                    if (geo && geo.latitude && geo.longitude) {
                      return <>
                        <OrderLocationMap
                          userGeolocation={geo}
                          userName={selectedOrder.profiles?.full_name || 'Unknown Customer'}
                        />
                        <div className="mt-2 text-xs text-gray-500">
                          <span>{t('lat')}: {geo.latitude}, {t('lng')}: {geo.longitude}</span>
                        </div>
                        <div className="mt-4 flex flex-col items-center gap-2">
                          <span className="text-xs text-gray-600">{t('scan_to_open_in_google_maps')}</span>
                          <QRCode value={`https://www.google.com/maps/search/?api=1&query=${geo.latitude},${geo.longitude}`} size={96} />
                        </div>
                      </>;
                    } else {
                      return <div className="text-sm text-gray-400">{t('no_geolocation_data_available')}</div>;
                    }
                  })()}
                </div>
              </div>
            </div>
            {/* Items de la commande */}
            <div className="mt-8">
              <h3 className="mb-2 text-lg font-medium">{t('order_items')}</h3>
              <div className="overflow-x-auto rounded-lg bg-gray-50 p-2">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('product')}</th>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('price')}</th>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('quantity')}</th>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('total')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {selectedOrder.order_items?.map((item) => (
                      <tr key={item.id}>
                        <td className="flex items-center gap-2 px-4 py-2">
                          {item.products?.image_url && (
                            <img src={item.products.image_url} alt={item.products.name} className="h-8 w-8 rounded object-cover" />
                          )}
                          <span>{item.products?.name}</span>
                        </td>
                        <td className="px-4 py-2">{item.price ? `${item.price.toLocaleString()} FCFA` : ''}</td>
                        <td className="px-4 py-2">{item.quantity}</td>
                        <td className="px-4 py-2 font-semibold">{item.price && item.quantity ? `${(item.price * item.quantity).toLocaleString()} FCFA` : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;