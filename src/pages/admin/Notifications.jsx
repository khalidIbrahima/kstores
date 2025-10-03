import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { motion } from 'framer-motion';
import { Bell, Package, ShoppingCart, AlertTriangle, Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const NOTIF_ICONS = {
  order_received: <ShoppingCart className="h-5 w-5 text-blue-500" />,
  low_stock: <Package className="h-5 w-5 text-yellow-500" />,
  payment_failed: <AlertTriangle className="h-5 w-5 text-red-500" />,
};

const NOTIF_TYPES = [
  { type: 'order_received', title: 'order_received_title', body: 'order_received_body' },
  { type: 'low_stock', title: 'low_stock_title', body: 'low_stock_body' },
  { type: 'payment_failed', title: 'payment_failed_title', body: 'payment_failed_body' },
];

const NOTIF_SETTINGS = [
  { key: 'order', label: 'settings.order', desc: 'settings.order_desc' },
  { key: 'inventory', label: 'settings.inventory', desc: 'settings.inventory_desc' },
  { key: 'payment', label: 'settings.payment', desc: 'settings.payment_desc' },
  { key: 'system', label: 'settings.system', desc: 'settings.system_desc' },
];

const Notifications = () => {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [loadingIds, setLoadingIds] = useState([]); // ids en cours d'action
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function fetchNotifications() {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    if (!error) setNotifications(data);
  }

  const markAsRead = async (id) => {
    setLoadingIds(ids => [...ids, id]);
    const prev = notifications;
    setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setLoadingIds(ids => ids.filter(x => x !== id));
    if (error) {
      setNotifications(prev); // rollback
      toast.error(t('notifications.error_mark_read') || 'Erreur lors de la mise à jour');
    } else {
      toast.success(t('notifications.marked_read') || 'Notification marquée comme lue');
    }
  };

  const deleteNotification = async (id) => {
    setLoadingIds(ids => [...ids, id]);
    const prev = notifications;
    setNotifications(notifications.filter(n => n.id !== id));
    const { error } = await supabase.from('notifications').delete().eq('id', id);
    setLoadingIds(ids => ids.filter(x => x !== id));
    if (error) {
      setNotifications(prev); // rollback
      toast.error(t('notifications.error_delete') || 'Erreur lors de la suppression');
    } else {
      toast.success(t('notifications.deleted') || 'Notification supprimée');
    }
  };

  const clearAll = async () => {
    setLoadingIds(['all']);
    const prev = notifications;
    setNotifications([]);
    const { error } = await supabase.from('notifications').delete().neq('id', 0);
    setLoadingIds([]);
    if (error) {
      setNotifications(prev);
      toast.error(t('notifications.error_delete') || 'Erreur lors de la suppression');
    } else {
      toast.success(t('notifications.deleted') || 'Notifications supprimées');
    }
  };

  const getIcon = (type) => NOTIF_ICONS[type] || <Bell className="h-5 w-5 text-gray-500" />;

  return (
    <div className="space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('notifications.title')}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t('notifications.manage')}</p>
        </div>
        <button
          onClick={clearAll}
          className="rounded-md bg-gray-100 dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
          disabled={loadingIds.includes('all')}
        >
          {t('notifications.clear_all')}
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {notifications.map((notification) => {
          const notifType = NOTIF_TYPES.find(nt => nt.type === notification.type);
          const isLoading = loadingIds.includes(notification.id);
          return (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className={`flex items-start justify-between rounded-lg bg-white dark:bg-gray-800 p-4 shadow-md dark:shadow-lg ${
                !notification.is_read ? 'border-l-4 border-blue-500 dark:border-blue-400' : ''
              }`}
              onClick={() => {
                if (notification.type === 'order_received' && notification.data?.orderId) {
                  navigate(`/admin/orders/${notification.data.orderId}`);
                }
                // Ajoute d'autres types ici si besoin
              }}
            >
              <div className="flex items-start space-x-4">
                <div className="rounded-full bg-gray-100 dark:bg-gray-700 p-2">
                  {getIcon(notification.type)}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">
                    {notifType ? t(`notifications.${notifType.title}`) : notification.type}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {notifType ? t(`notifications.${notifType.body}`, notification.data || {}) : ''}
                  </p>
                  <span className="mt-1 text-xs text-gray-500 dark:text-gray-400">{new Date(notification.created_at).toLocaleString()}</span>
                </div>
              </div>
              <div className="flex space-x-2">
                {!notification.is_read && (
                  <button
                    onClick={e => { e.stopPropagation(); markAsRead(notification.id); }}
                    className="rounded-full bg-gray-100 dark:bg-gray-700 p-1 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
                    title="Mark as read"
                    disabled={isLoading}
                  >
                    <Check className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={e => { e.stopPropagation(); deleteNotification(notification.id); }}
                  className="rounded-full bg-gray-100 p-1 text-gray-600 hover:bg-gray-200 disabled:opacity-50"
                  title="Delete"
                  disabled={isLoading}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          );
        })}

        {notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-lg bg-white dark:bg-gray-800 py-12 text-center">
            <Bell className="mb-4 h-12 w-12 text-gray-400 dark:text-gray-500" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{t('notifications.no_notifications')}</h3>
            <p className="text-gray-500 dark:text-gray-400">{t('notifications.all_caught_up')}</p>
          </div>
        )}
      </div>

      {/* Notification Settings */}
      <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow-md dark:shadow-lg">
        <h2 className="mb-4 text-lg font-medium text-gray-900 dark:text-gray-100">{t('notifications.settings_title', 'Notification Settings')}</h2>
        <div className="space-y-4">
          {NOTIF_SETTINGS.map((setting, index) => (
            <div key={index} className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100">{t(`notifications.${setting.label}`)}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t(`notifications.${setting.desc}`)}</p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input type="checkbox" className="peer sr-only" defaultChecked />
                <div className="peer h-6 w-11 rounded-full bg-gray-200 dark:bg-gray-600 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 dark:after:border-gray-600 after:bg-white dark:after:bg-gray-300 after:transition-all after:content-[''] peer-checked:bg-blue-600 dark:peer-checked:bg-blue-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800"></div>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Notifications;