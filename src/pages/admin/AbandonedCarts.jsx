import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, DollarSign, UserX, Mail, Phone, MapPin, AlertTriangle, Clock, TrendingDown, MessageCircle, Send, History, Bell, X } from 'lucide-react';
import { getAbandonedCarts, getAbandonedCartStats } from '../../services/guestCustomerService';
import { 
  sendAbandonedCartWhatsAppNotification, 
  getAbandonedCartNotificationHistory,
  getAbandonedCartNotificationStats,
  checkRecentNotification
} from '../../services/abandonedCartService';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import ErrorBoundary from '../../components/ErrorBoundary';

const AbandonedCarts = () => {
  const [loading, setLoading] = useState(true);
  const [abandonedCarts, setAbandonedCarts] = useState([]);
  const [stats, setStats] = useState({
    totalAbandonedCustomers: 0,
    totalAbandonedOrders: 0,
    totalAbandonedValue: 0,
    averageAbandonedValue: 0
  });
  const [notificationStats, setNotificationStats] = useState({
    total: 0,
    sent: 0,
    failed: 0,
    whatsapp: 0,
    email: 0,
    today: 0,
    recovery_rate: 0
  });
  const [filter, setFilter] = useState('all'); // all, recent, old
  const [selectedCart, setSelectedCart] = useState(null);
  const [showNotificationHistory, setShowNotificationHistory] = useState(false);
  const [notificationHistory, setNotificationHistory] = useState([]);
  const [sendingNotifications, setSendingNotifications] = useState({});
  const { t } = useTranslation();

  useEffect(() => {
    fetchAbandonedCarts();
    fetchNotificationStats();
  }, []);

  const fetchAbandonedCarts = async () => {
    try {
      setLoading(true);

      // Fetch abandoned carts and stats using the service
      const [carts, cartStats] = await Promise.all([
        getAbandonedCarts(),
        getAbandonedCartStats()
      ]);

      setAbandonedCarts(carts);
      setStats(cartStats);

    } catch (error) {
      console.error('Error fetching abandoned carts:', error);
      toast.error('Erreur lors du chargement des paniers abandonnés');
    } finally {
      setLoading(false);
    }
  };

  const fetchNotificationStats = async () => {
    try {
      const stats = await getAbandonedCartNotificationStats();
      setNotificationStats(stats);
    } catch (error) {
      console.error('Error fetching notification stats:', error);
      // Définir des valeurs par défaut en cas d'erreur
      setNotificationStats({
        total: 0,
        sent: 0,
        failed: 0,
        whatsapp: 0,
        email: 0,
        today: 0,
        recovery_rate: 0
      });
    }
  };

  const handleSendNotification = async (cart) => {
    try {
      setSendingNotifications(prev => ({ ...prev, [cart.id]: true }));
      
      // Vérifier si une notification a déjà été envoyée récemment
      const recentNotification = await checkRecentNotification(cart.id, 24);
      if (recentNotification) {
        toast.error('Une notification a déjà été envoyée récemment à ce client');
        return;
      }

      await sendAbandonedCartWhatsAppNotification(cart);
      
      toast.success(`Notification WhatsApp envoyée à ${cart.name}`);
      
      // Rafraîchir les statistiques
      fetchNotificationStats();
      
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Erreur lors de l\'envoi de la notification');
    } finally {
      setSendingNotifications(prev => ({ ...prev, [cart.id]: false }));
    }
  };

  const handleViewNotificationHistory = async (cart) => {
    try {
      setSelectedCart(cart);
      const history = await getAbandonedCartNotificationHistory(cart.id);
      setNotificationHistory(history);
      setShowNotificationHistory(true);
    } catch (error) {
      console.error('Error fetching notification history:', error);
      toast.error('Erreur lors du chargement de l\'historique');
    }
  };

  const getFilteredCarts = () => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    switch (filter) {
      case 'recent':
        return abandonedCarts.filter(cart => 
          new Date(cart.last_abandoned) >= oneWeekAgo
        );
      case 'old':
        return abandonedCarts.filter(cart => 
          new Date(cart.last_abandoned) < oneMonthAgo
        );
      default:
        return abandonedCarts;
    }
  };

  const getAbandonedTime = (date) => {
    if (!date) return 'Date inconnue';
    
    try {
      const now = new Date();
      const abandonedDate = new Date(date);
      
      // Vérifier si la date est valide
      if (isNaN(abandonedDate.getTime())) {
        return 'Date invalide';
      }
      
      const diffTime = Math.abs(now - abandonedDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) return 'Hier';
      if (diffDays < 7) return `Il y a ${diffDays} jours`;
      if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaines`;
      return `Il y a ${Math.floor(diffDays / 30)} mois`;
    } catch (error) {
      console.error('Error calculating abandoned time:', error);
      return 'Date invalide';
    }
  };

  const getRecoveryPotential = (value) => {
    const numValue = value || 0;
    if (numValue > 1000) return { label: 'Élevé', color: 'text-green-600', bg: 'bg-green-100' };
    if (numValue > 500) return { label: 'Moyen', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { label: 'Faible', color: 'text-red-600', bg: 'bg-red-100' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const filteredCarts = getFilteredCarts();

  return (
    <ErrorBoundary>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <ShoppingCart className="h-6 w-6" />
            Paniers Abandonnés
          </h1>
          <p className="mt-2 text-gray-600">
            Suivi des clients invités qui ont abandonné leur panier
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Clients avec Panier Abandonné</p>
                <h3 className="text-2xl font-bold text-red-600">{stats.totalAbandonedCustomers}</h3>
              </div>
              <div className="rounded-full bg-red-100 p-3">
                <UserX className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Paniers Abandonnés</p>
                <h3 className="text-2xl font-bold text-orange-600">{stats.totalAbandonedOrders}</h3>
              </div>
              <div className="rounded-full bg-orange-100 p-3">
                <ShoppingCart className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Valeur Perdue</p>
                <h3 className="text-2xl font-bold text-red-600">{(stats.totalAbandonedValue || 0).toFixed(2)} {t('common.currency')}</h3>
              </div>
              <div className="rounded-full bg-red-100 p-3">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Notifications Aujourd'hui</p>
                <h3 className="text-2xl font-bold text-blue-600">{notificationStats.today}</h3>
              </div>
              <div className="rounded-full bg-blue-100 p-3">
                <Bell className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Notification Stats */}
        <div className="mb-6 bg-blue-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Statistiques des Notifications
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Total envoyées:</span>
              <span className="ml-2 font-semibold">{notificationStats.total}</span>
            </div>
            <div>
              <span className="text-gray-600">Réussies:</span>
              <span className="ml-2 font-semibold text-green-600">{notificationStats.sent}</span>
            </div>
            <div>
              <span className="text-gray-600">Échouées:</span>
              <span className="ml-2 font-semibold text-red-600">{notificationStats.failed}</span>
            </div>
            <div>
              <span className="text-gray-600">Taux de succès:</span>
              <span className="ml-2 font-semibold text-blue-600">
                {typeof notificationStats.recovery_rate === 'number' 
                  ? notificationStats.recovery_rate.toFixed(1) 
                  : '0.0'}%
              </span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          >
            <option value="all">Tous les paniers abandonnés</option>
            <option value="recent">Abandonnés récemment (7 jours)</option>
            <option value="old">Anciens abandons (30+ jours)</option>
          </select>
        </div>

        {/* Abandoned Carts Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Liste des Paniers Abandonnés</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Adresse
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paniers Abandonnés
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valeur Perdue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dernier Abandon
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Potentiel de Récupération
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCarts.map((cart) => {
                  const recoveryPotential = getRecoveryPotential(cart.total_abandoned_value);
                  const hasContact = cart.phone || (cart.email && cart.has_real_email);
                  
                  return (
                    <tr key={cart.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                              <ShoppingCart className="h-5 w-5 text-red-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {cart.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                Panier Abandonné
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {cart.email && (
                            <div className="flex items-center mb-1">
                              <Mail className="h-3 w-3 mr-1 text-gray-400" />
                              <span className={`text-xs ${cart.has_real_email ? 'text-gray-900' : 'text-gray-500 italic'}`}>
                                {cart.email}
                                {!cart.has_real_email && (
                                  <span className="ml-1 text-xs text-orange-600">(généré)</span>
                                )}
                              </span>
                            </div>
                          )}
                          {cart.phone && (
                            <div className="flex items-center">
                              <Phone className="h-3 w-3 mr-1 text-gray-400" />
                              <span className="text-xs font-medium text-gray-900">{cart.phone}</span>
                            </div>
                          )}
                          {!hasContact && (
                            <div className="text-xs text-red-500 italic">
                              Aucun contact disponible
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {cart.address && (
                            <div className="flex items-start mb-1">
                              <MapPin className="h-3 w-3 mr-1 text-gray-400 mt-0.5" />
                              <span className="text-xs">{cart.address}</span>
                            </div>
                          )}
                          {(cart.city || cart.state || cart.zip_code) && (
                            <div className="text-xs text-gray-500">
                              {[cart.city, cart.state, cart.zip_code].filter(Boolean).join(', ')}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {cart.total_abandoned} panier{cart.total_abandoned > 1 ? 's' : ''}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-red-600">
                          {(cart.total_abandoned_value || 0).toFixed(2)} {t('common.currency')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {getAbandonedTime(cart.last_abandoned)}
                        </div>
                        <div className="text-xs text-gray-400">
                          {cart.last_abandoned ? new Date(cart.last_abandoned).toLocaleDateString() : 'Date inconnue'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${recoveryPotential.bg} ${recoveryPotential.color}`}>
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          {recoveryPotential.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {hasContact && (
                            <button
                              onClick={() => handleSendNotification(cart)}
                              disabled={sendingNotifications[cart.id]}
                              className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                                sendingNotifications[cart.id]
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'bg-green-100 text-green-700 hover:bg-green-200'
                              }`}
                              title="Envoyer un rappel WhatsApp"
                            >
                              {sendingNotifications[cart.id] ? (
                                <div className="h-3 w-3 animate-spin rounded-full border-b border-gray-400"></div>
                              ) : (
                                <Send className="h-3 w-3 mr-1" />
                              )}
                              Rappel
                            </button>
                          )}
                          <button
                            onClick={() => handleViewNotificationHistory(cart)}
                            className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                            title="Voir l'historique des notifications"
                          >
                            <History className="h-3 w-3 mr-1" />
                            Historique
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {filteredCarts.length === 0 && (
            <div className="text-center py-12">
              <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Aucun panier abandonné trouvé</p>
              <p className="text-sm text-gray-400 mt-1">
                {filter === 'recent' ? 'Aucun abandon récent' : 
                 filter === 'old' ? 'Aucun ancien abandon' : 
                 'Aucun panier abandonné pour le moment'}
              </p>
            </div>
          )}
        </div>

        {/* Notification History Modal */}
        {showNotificationHistory && selectedCart && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  Historique des Notifications - {selectedCart.name}
                </h3>
                <button
                  onClick={() => setShowNotificationHistory(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              {notificationHistory.length > 0 ? (
                <div className="space-y-3">
                  {notificationHistory.map((notification) => (
                    <div key={notification.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          notification.status === 'sent' || notification.status === 'delivered'
                            ? 'bg-green-100 text-green-800'
                            : notification.status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {notification.status === 'sent' && 'Envoyée'}
                          {notification.status === 'delivered' && 'Livrée'}
                          {notification.status === 'failed' && 'Échouée'}
                          {notification.status === 'pending' && 'En attente'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(notification.sent_at).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        <strong>Type:</strong> {notification.notification_type}
                      </div>
                      {notification.error_message && (
                        <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                          <strong>Erreur:</strong> {notification.error_message}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  Aucun historique de notification disponible
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default AbandonedCarts; 