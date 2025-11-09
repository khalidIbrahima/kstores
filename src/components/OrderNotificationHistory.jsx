import { useState, useEffect } from 'react';
import { Bell, Mail, MessageSquare, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { getOrderNotificationHistory } from '../services/notificationService';
import { useTranslation } from 'react-i18next';

const OrderNotificationHistory = ({ orderId }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    if (orderId) {
      fetchNotificationHistory();
    }
  }, [orderId]);

  const fetchNotificationHistory = async () => {
    try {
      setLoading(true);
      const history = await getOrderNotificationHistory(orderId);
      setNotifications(history);
    } catch (error) {
      console.error('Error fetching notification history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (sent, type) => {
    if (sent) {
      return <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400" />;
    }
    return <XCircle className="h-4 w-4 text-red-500 dark:text-red-400" />;
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'email':
        return <Mail className="h-4 w-4 text-blue-500" />;
      case 'whatsapp':
        return <MessageSquare className="h-4 w-4 text-green-500" />;
      case 'internal':
        return <Bell className="h-4 w-4 text-purple-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 dark:border-blue-400"></div>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="text-center p-4 text-gray-500 dark:text-gray-400">
        <Bell className="h-8 w-8 mx-auto mb-2 text-gray-400 dark:text-gray-500" />
        <p>Aucune notification envoyée pour cette commande</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h3 className="text-lg font-semibold flex items-center text-gray-900 dark:text-gray-100">
          <Bell className="h-5 w-5 mr-2" />
          Historique des notifications
        </h3>
        <button
          onClick={fetchNotificationHistory}
          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
        >
          Actualiser
        </button>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
          >
            {/* Header avec date */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <Clock className="h-4 w-4" />
                <span>{formatDate(notification.created_at)}</span>
              </div>
            </div>

            {/* Types de notifications */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              <div className="flex items-center space-x-2">
                {getStatusIcon(notification.data?.emailSent, 'email')}
                <Mail className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Email</span>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusIcon(notification.data?.whatsappSent, 'whatsapp')}
                <MessageSquare className="h-4 w-4 text-green-500 dark:text-green-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">WhatsApp</span>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusIcon(notification.data?.internalSent, 'internal')}
                <Bell className="h-4 w-4 text-purple-500 dark:text-purple-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Interne</span>
              </div>
            </div>

            {/* Détails de la notification */}
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Statut:</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">{notification.data?.newStatus}</span>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Type client:</span>
                <span className={`text-xs px-2 py-1 rounded-full w-fit ${
                  notification.data?.isGuestCustomer 
                    ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400' 
                    : 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                }`}>
                  {notification.data?.isGuestCustomer ? 'Invité' : 'Connecté'}
                </span>
              </div>
              
              {notification.data?.errors && notification.data.errors.length > 0 && (
                <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="flex items-center space-x-2 text-red-600 dark:text-red-400 mb-2">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Erreurs:</span>
                  </div>
                  <div className="space-y-1">
                    {notification.data.errors.map((error, index) => (
                      <div key={index} className="text-xs text-red-600 dark:text-red-400 break-words">
                        <span className="font-medium">{error.type}:</span> {error.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
        {notifications.length} notification(s) envoyée(s)
      </div>
    </div>
  );
};

export default OrderNotificationHistory; 