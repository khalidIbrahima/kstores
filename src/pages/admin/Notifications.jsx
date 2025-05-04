import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Package, ShoppingCart, AlertTriangle, Check, X } from 'lucide-react';

const Notifications = () => {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'order',
      title: 'New Order Received',
      message: 'Order #12345 has been placed',
      time: '5 minutes ago',
      read: false
    },
    {
      id: 2,
      type: 'inventory',
      title: 'Low Stock Alert',
      message: 'Product "Wireless Headphones" is running low on stock',
      time: '1 hour ago',
      read: false
    },
    {
      id: 3,
      type: 'alert',
      title: 'Payment Failed',
      message: 'Payment for order #12340 has failed',
      time: '2 hours ago',
      read: true
    }
  ]);

  const markAsRead = (id) => {
    setNotifications(notifications.map(notification =>
      notification.id === id ? { ...notification, read: true } : notification
    ));
  };

  const deleteNotification = (id) => {
    setNotifications(notifications.filter(notification => notification.id !== id));
  };

  const getIcon = (type) => {
    switch (type) {
      case 'order':
        return <ShoppingCart className="h-5 w-5 text-blue-500" />;
      case 'inventory':
        return <Package className="h-5 w-5 text-yellow-500" />;
      case 'alert':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-gray-600">Manage your notifications and alerts</p>
        </div>
        <button
          onClick={() => setNotifications([])}
          className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200"
        >
          Clear All
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className={`flex items-start justify-between rounded-lg bg-white p-4 shadow-md ${
              !notification.read ? 'border-l-4 border-blue-500' : ''
            }`}
          >
            <div className="flex items-start space-x-4">
              <div className="rounded-full bg-gray-100 p-2">
                {getIcon(notification.type)}
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{notification.title}</h3>
                <p className="text-sm text-gray-600">{notification.message}</p>
                <span className="mt-1 text-xs text-gray-500">{notification.time}</span>
              </div>
            </div>
            <div className="flex space-x-2">
              {!notification.read && (
                <button
                  onClick={() => markAsRead(notification.id)}
                  className="rounded-full bg-gray-100 p-1 text-gray-600 hover:bg-gray-200"
                  title="Mark as read"
                >
                  <Check className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => deleteNotification(notification.id)}
                className="rounded-full bg-gray-100 p-1 text-gray-600 hover:bg-gray-200"
                title="Delete"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        ))}

        {notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-lg bg-white py-12 text-center">
            <Bell className="mb-4 h-12 w-12 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900">No notifications</h3>
            <p className="text-gray-500">You're all caught up!</p>
          </div>
        )}
      </div>

      {/* Notification Settings */}
      <div className="rounded-lg bg-white p-6 shadow-md">
        <h2 className="mb-4 text-lg font-medium">Notification Settings</h2>
        <div className="space-y-4">
          {[
            { label: 'Order notifications', description: 'Get notified when new orders are placed' },
            { label: 'Inventory alerts', description: 'Receive alerts for low stock items' },
            { label: 'Payment notifications', description: 'Get notified about payment status changes' },
            { label: 'System alerts', description: 'Receive important system notifications' }
          ].map((setting, index) => (
            <div key={index} className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
              <div>
                <h3 className="font-medium text-gray-900">{setting.label}</h3>
                <p className="text-sm text-gray-500">{setting.description}</p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input type="checkbox" className="peer sr-only" defaultChecked />
                <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300"></div>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Notifications;