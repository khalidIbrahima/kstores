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
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    return <XCircle className="h-4 w-4 text-red-500" />;
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
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="text-center p-4 text-gray-500">
        <Bell className="h-8 w-8 mx-auto mb-2 text-gray-400" />
        <p>Aucune notification envoyée pour cette commande</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center">
          <Bell className="h-5 w-5 mr-2" />
          Historique des notifications
        </h3>
        <button
          onClick={fetchNotificationHistory}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          Actualiser
        </button>
      </div>

      <div className="space-y-3">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className="bg-gray-50 rounded-lg p-4 border border-gray-200"
          >
                         <div className="flex items-start justify-between">
               <div className="flex items-center space-x-3">
                 <div className="flex items-center space-x-2">
                   {getStatusIcon(notification.data?.emailSent, 'email')}
                   <Mail className="h-4 w-4 text-blue-500" />
                   <span className="text-sm font-medium">Email</span>
                 </div>
                 <div className="flex items-center space-x-2">
                   {getStatusIcon(notification.data?.whatsappSent, 'whatsapp')}
                   <MessageSquare className="h-4 w-4 text-green-500" />
                   <span className="text-sm font-medium">WhatsApp</span>
                 </div>
                 <div className="flex items-center space-x-2">
                   {getStatusIcon(notification.data?.internalSent, 'internal')}
                   <Bell className="h-4 w-4 text-purple-500" />
                   <span className="text-sm font-medium">Interne</span>
                 </div>
               </div>
               <div className="flex items-center space-x-2 text-sm text-gray-500">
                 <Clock className="h-4 w-4" />
                 <span>{formatDate(notification.created_at)}</span>
               </div>
             </div>

                         <div className="mt-3">
               <div className="flex items-center space-x-2">
                 <span className="text-sm font-medium">Statut:</span>
                 <span className="text-sm text-gray-600">{notification.data?.newStatus}</span>
               </div>
               
               <div className="flex items-center space-x-2 mt-1">
                 <span className="text-sm font-medium">Type client:</span>
                 <span className={`text-xs px-2 py-1 rounded-full ${
                   notification.data?.isGuestCustomer 
                     ? 'bg-orange-100 text-orange-700' 
                     : 'bg-green-100 text-green-700'
                 }`}>
                   {notification.data?.isGuestCustomer ? 'Invité' : 'Connecté'}
                 </span>
               </div>
               
               {notification.data?.errors && notification.data.errors.length > 0 && (
                 <div className="mt-2">
                   <div className="flex items-center space-x-2 text-red-600">
                     <AlertCircle className="h-4 w-4" />
                     <span className="text-sm font-medium">Erreurs:</span>
                   </div>
                   <div className="ml-6 mt-1 space-y-1">
                     {notification.data.errors.map((error, index) => (
                       <div key={index} className="text-xs text-red-600">
                         {error.type}: {error.error}
                       </div>
                     ))}
                   </div>
                 </div>
               )}
             </div>
          </div>
        ))}
      </div>

      <div className="text-xs text-gray-500 text-center">
        {notifications.length} notification(s) envoyée(s)
      </div>
    </div>
  );
};

export default OrderNotificationHistory; 