import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import OrderLocationMap from '../../components/OrderLocationMap';
import { useParams, useNavigate } from 'react-router-dom';
import QRCode from 'react-qr-code';
import { notifyCustomerOrderStatusChange, ORDER_STATUS_CONFIG } from '../../services/notificationService';
import toast from 'react-hot-toast';
import OrderNotificationHistory from '../../components/OrderNotificationHistory';

const OrdersPage = () => {
  const { t, i18n } = useTranslation();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { id: orderId } = useParams();
  const navigate = useNavigate();

  const fetchOrder = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`*,
          order_items(*, products(name, image_url))
        `)
        .eq('id', orderId)
        .single();
      if (error) throw error;
      setOrder(data);
    } catch (err) {
      setError(t('admin.orders.fetchError'));
    } finally {
      setLoading(false);
    }
  }, [orderId, t]);

  useEffect(() => {
    fetchOrder();
    // Fermer le modal avec ESC
    const handleEsc = (e) => {
      if (e.key === 'Escape') setOrder(null);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [fetchOrder]);

  const handleStatusChange = async (newStatus) => {
    try {
      const previousStatus = order?.status;
      
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);
      if (error) throw error;
      setOrder((prev) => ({ ...prev, status: newStatus }));

      // Notifier le client du changement de statut
      if (order && previousStatus !== newStatus) {
        try {
          const notificationResults = await notifyCustomerOrderStatusChange(order, newStatus, previousStatus);
          
          // Afficher un message de succès avec les détails des notifications
          const successMessages = [];
          if (notificationResults.email) successMessages.push('Email envoyé');
          if (notificationResults.whatsapp) successMessages.push('WhatsApp envoyé');
          if (notificationResults.internal) successMessages.push('Notification interne créée');
          
          if (successMessages.length > 0) {
            toast.success(`Statut mis à jour et ${successMessages.join(', ')}`);
          } else {
            toast.success('Statut mis à jour');
          }

          // Afficher les erreurs s'il y en a
          if (notificationResults.errors.length > 0) {
            notificationResults.errors.forEach(error => {
              toast.error(`Erreur ${error.type}: ${error.error}`);
            });
          }
        } catch (notificationError) {
          console.error('Error sending notifications:', notificationError);
          toast.error('Statut mis à jour mais erreur lors de l\'envoi des notifications');
        }
      }
    } catch (err) {
      setError(t('admin.orders.updateError'));
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString(i18n.language === 'fr' ? 'fr-FR' : 'en-US');
  };

  const formatPrice = (amount) => `${Number(amount).toLocaleString()} FCFA`;

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

  if (!order) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="rounded-md bg-yellow-100 p-4 text-yellow-700">
          {t('admin.orders.noOrder')}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">{t('admin.orders.title')}</h1>
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
          <div>
            <div className="text-gray-700 font-semibold mb-1">{t('admin.orders.details.customer')}</div>
            <div>{order.profiles?.full_name || order.profiles?.email || t('admin.orders.details.unknownCustomer')}</div>
          </div>
          <div>
            <div className="text-gray-700 font-semibold mb-1">{t('admin.orders.details.status')}</div>
            <div className="flex items-center space-x-2">
              <div className={`flex items-center space-x-1 ${ORDER_STATUS_CONFIG[order.status]?.color || 'text-gray-600'}`}>
                <span className="text-lg">{ORDER_STATUS_CONFIG[order.status]?.emoji || '📋'}</span>
                <span className="text-sm font-medium">{ORDER_STATUS_CONFIG[order.status]?.label || order.status}</span>
              </div>
              <select
                value={order.status}
                onChange={e => handleStatusChange(e.target.value)}
                className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-2 py-1 text-sm focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none"
              >
                <option value="pending">{t('admin.orders.status.pending')}</option>
                <option value="processing">{t('admin.orders.status.processing')}</option>
                <option value="shipped">{t('admin.orders.status.shipped')}</option>
                <option value="delivered">{t('admin.orders.status.delivered')}</option>
                <option value="cancelled">{t('admin.orders.status.cancelled')}</option>
              </select>
            </div>
          </div>
          <div>
            <div className="text-gray-700 font-semibold mb-1">{t('admin.orders.details.date')}</div>
            <div>{formatDate(order.created_at)}</div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <div className="font-semibold text-gray-800 mb-1">{t('admin.orders.details.shipping')}</div>
              <div className="text-gray-700">
                {order.shipping_address?.name}<br />
                {order.shipping_address?.address}<br />
                {order.shipping_address?.city}, {order.shipping_address?.state}<br />
                {order.shipping_address?.zip_code}
              </div>
            </div>
            <div>
              <div className="font-semibold text-gray-800 mb-1">{t('admin.orders.details.total')}</div>
              <div className="text-gray-900 font-bold text-lg">{formatPrice(order.total)}</div>
            </div>
            <div>
              <div className="font-semibold text-gray-800 mb-1">{t('admin.orders.details.items')}</div>
              <div className="divide-y divide-gray-100 bg-gray-50 rounded-lg p-2">
                {order.order_items?.length > 0 ? order.order_items.map((item) => (
                  <div key={item.id} className="flex justify-between py-2 text-sm items-center">
                    <div className="flex flex-col">
                      <span>
                        {item.products?.name || t('admin.orders.details.unknownProduct')} x {item.quantity}
                      </span>
                      {item.selected_color && (() => {
                        try {
                          const colorData = JSON.parse(item.selected_color);
                          return (
                            <div className="flex items-center mt-1">
                              <div
                                className="w-3 h-3 rounded-full border border-gray-300 mr-1"
                                style={{ backgroundColor: colorData.hex }}
                              />
                              <span className="text-xs text-gray-500">
                                {colorData.name}
                              </span>
                            </div>
                          );
                        } catch (error) {
                          console.error('Error parsing selected_color:', error);
                          return null;
                        }
                      })()}
                    </div>
                    <span>{formatPrice(item.price * item.quantity)}</span>
                  </div>
                )) : (
                  <div className="text-gray-400 italic">{t('admin.orders.details.noItems')}</div>
                )}
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div>
              <div className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <span>{t('admin.orders.details.location')}</span>
                {order.userGeolocation && (
                  <span className="text-xs text-gray-500">(
                    {order.userGeolocation.lat?.toFixed(5)}, {order.userGeolocation.lng?.toFixed(5)}
                  )</span>
                )}
              </div>
              <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm h-56">
                <OrderLocationMap
                  userGeolocation={order.userGeolocation}
                  userName={order.shipping_address?.name}
                />
              </div>
              {order.userGeolocation && order.userGeolocation.lat && order.userGeolocation.lng && (
                <div className="mt-4 flex flex-col items-center gap-2">
                  <span className="text-xs text-gray-600 text-center">
                    {t('orders.scan_to_open_in_google_maps')}
                  </span>
                  <QRCode 
                    value={`https://www.google.com/maps/@${order.userGeolocation.lat},${order.userGeolocation.lng},15z`} 
                    size={96} 
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Historique des notifications */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg p-8">
          <OrderNotificationHistory orderId={orderId} />
        </div>
      </div>

    </div>
  );
};

export default OrdersPage; 