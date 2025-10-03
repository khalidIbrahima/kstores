import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import OrderLocationMap from '../../components/OrderLocationMap';
import { useParams, useNavigate } from 'react-router-dom';
import { notifyCustomerOrderStatusChange, ORDER_STATUS_CONFIG } from '../../services/notificationService';
import toast from 'react-hot-toast';
import OrderNotificationHistory from '../../components/OrderNotificationHistory';
import { ArrowLeft, Edit, Trash2, Bell, Mail, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import QRCode from 'react-qr-code';
import { useStoreSettings } from '../../hooks/useStoreSettings';

const OrderDetailPage = () => {
  const { t, i18n } = useTranslation();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { id: orderId } = useParams();
  const navigate = useNavigate();
  const { settings } = useStoreSettings();

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

  const handleDelete = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette commande ?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);
      
      if (error) throw error;
      
      toast.success('Commande supprimée avec succès');
      navigate('/admin/orders');
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error('Erreur lors de la suppression de la commande');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString(i18n.language === 'fr' ? 'fr-FR' : 'en-US');
  };

  const formatPrice = (amount) => `${Number(amount).toLocaleString()} FCFA`;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm sm:text-base text-gray-600">Chargement de la commande...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="bg-red-100 p-4 rounded-lg">
            <p className="text-sm sm:text-base text-red-700">{error}</p>
            <button
              onClick={() => navigate('/admin/orders')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm sm:text-base w-full sm:w-auto"
            >
              Retour aux commandes
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="bg-yellow-100 p-4 rounded-lg">
            <p className="text-sm sm:text-base text-yellow-700">Commande non trouvée</p>
            <button
              onClick={() => navigate('/admin/orders')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm sm:text-base w-full sm:w-auto"
            >
              Retour aux commandes
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Mobile Friendly */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 sm:h-16 space-y-4 sm:space-y-0">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <button
                onClick={() => navigate('/admin/orders')}
                className="flex items-center text-gray-600 hover:text-gray-900 w-fit"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                <span className="hidden sm:inline">Retour aux commandes</span>
                <span className="sm:hidden">Retour</span>
              </button>
              <div>
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
                  Commande #{order.id}
                </h1>
                <p className="text-xs sm:text-sm text-gray-500">
                  {formatDate(order.created_at)}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleDelete}
                className="flex items-center px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md text-sm"
              >
                <Trash2 className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Supprimer</span>
                <span className="sm:hidden">Supp.</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Informations principales */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Statut de la commande */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-sm border p-4 sm:p-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-3 sm:space-y-0">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">Statut de la commande</h2>
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                  <div className={`flex items-center space-x-1 ${ORDER_STATUS_CONFIG[order.status]?.color || 'text-gray-600'}`}>
                    <span className="text-base sm:text-lg">{ORDER_STATUS_CONFIG[order.status]?.emoji || '📋'}</span>
                    <span className="text-xs sm:text-sm font-medium">{ORDER_STATUS_CONFIG[order.status]?.label || order.status}</span>
                  </div>
                  <select
                    value={order.status}
                    onChange={e => handleStatusChange(e.target.value)}
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none w-full sm:w-auto"
                  >
                    <option value="pending">{t('admin.orders.status.pending')}</option>
                    <option value="processing">{t('admin.orders.status.processing')}</option>
                    <option value="shipped">Expédiée</option>
                    <option value="delivered">Livrée</option>
                    <option value="cancelled">{t('admin.orders.status.cancelled')}</option>
                  </select>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                {ORDER_STATUS_CONFIG[order.status]?.description || `Statut: ${order.status}`}
              </p>
            </motion.div>

            {/* Informations client */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-lg shadow-sm border p-4 sm:p-6"
            >
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Informations client</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700">Nom</label>
                  <p className="mt-1 text-xs sm:text-sm text-gray-900 break-words">
                    {order.shipping_address?.name || 'Non spécifié'}
                  </p>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1 text-xs sm:text-sm text-gray-900 break-all">
                    {order.shipping_address?.email || 'Non spécifié'}
                  </p>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700">Téléphone</label>
                  <p className="mt-1 text-xs sm:text-sm text-gray-900">
                    {order.shipping_address?.phone || 'Non spécifié'}
                  </p>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700">Type de client</label>
                  <p className="mt-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      order.user_id 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-orange-100 text-orange-800'
                    }`}>
                      {order.user_id ? 'Compte connecté' : 'Client invité'}
                    </span>
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Adresse de livraison */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg shadow-sm border p-4 sm:p-6"
            >
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Adresse de livraison</h2>
              <div className="text-xs sm:text-sm text-gray-900 space-y-1">
                <p className="break-words">{order.shipping_address?.name}</p>
                <p className="break-words">{order.shipping_address?.address}</p>
                <p className="break-words">{order.shipping_address?.city}, {order.shipping_address?.state}</p>
                <p>{order.shipping_address?.zip_code}</p>
              </div>
            </motion.div>

            {/* Produits commandés */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-lg shadow-sm border p-4 sm:p-6"
            >
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Produits commandés</h2>
              <div className="space-y-3">
                {order.order_items?.length > 0 ? (
                  order.order_items.map((item) => (
                    <div key={item.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-gray-100 last:border-b-0 space-y-2 sm:space-y-0">
                      <div className="flex items-center space-x-3">
                        {settings?.display_order_images && item.products?.image_url && (
                          <img
                            src={item.products.image_url}
                            alt={item.products.name}
                            className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded-md flex-shrink-0"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 text-sm sm:text-base truncate">
                            {item.products?.name || 'Produit inconnu'}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <p className="text-xs sm:text-sm text-gray-500">
                              Quantité: {item.quantity}
                            </p>
                            {item.selected_color && (() => {
                              try {
                                const colorData = JSON.parse(item.selected_color);
                                return (
                                  <div className="flex items-center space-x-1">
                                    <div
                                      className="w-3 h-3 rounded-full border border-gray-300"
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
                        </div>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="font-medium text-gray-900 text-sm sm:text-base">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500">
                          {formatPrice(item.price)} / unité
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 italic text-sm">Aucun produit dans cette commande</p>
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-base sm:text-lg font-semibold text-gray-900">Total</span>
                  <span className="text-xl sm:text-2xl font-bold text-gray-900">{formatPrice(order.total)}</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            {/* Localisation */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-lg shadow-sm border p-4 sm:p-6"
            >
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Localisation client</h2>
              <div className="rounded-lg overflow-hidden border border-gray-200 h-48 sm:h-64">
                <OrderLocationMap
                  userGeolocation={order.userGeolocation}
                  userName={order.shipping_address?.name}
                />
              </div>
              {order.userGeolocation && (
                <>
                  <p className="mt-2 text-xs text-gray-500 text-center break-all">
                    Coordonnées: {order.userGeolocation.latitude?.toFixed(5)}, {order.userGeolocation.longitude?.toFixed(5)}
                  </p>
                  <div className="mt-4 flex flex-col items-center gap-2">
                    <span className="text-xs text-gray-600 text-center">
                      {t('orders.scan_to_open_in_google_maps')}
                    </span>
                    <QRCode 
                      value={`https://www.google.com/maps/search/?api=1&query=${order.userGeolocation.latitude},${order.userGeolocation.longitude}`} 
                      size={96} 
                    />
                  </div>
                </>
              )}
            </motion.div>

            {/* Historique des notifications */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-lg shadow-sm border p-4 sm:p-6"
            >
              <OrderNotificationHistory orderId={orderId} />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage; 