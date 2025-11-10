import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, ChevronRight, ShoppingBag } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import ReviewForm from '../components/ReviewForm';
import logoHorizontal from '../assets/logo_nav.jpg';
import { generateInvoiceHtml } from '../utils/invoiceTemplates';

const OrdersPage = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();

  // Redirect to login if user is not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (
              *,
              products (*)
            )
          `)
          .eq('user_id', user.id)
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

    if (user) {
      fetchOrders();
    }
  }, [user]);

  const handleViewInvoice = (order) => {
    const logoUrl = typeof window !== 'undefined'
      ? new URL(logoHorizontal, window.location.origin).href
      : logoHorizontal;
    const invoiceHtml = generateInvoiceHtml(order, { logoUrl });
    const invoiceWindow = window.open('', '_blank', 'width=1024,height=768');
    invoiceWindow.document.write(invoiceHtml);
    invoiceWindow.document.close();
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-t-2 border-blue-500 dark:border-blue-400"></div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="container mx-auto my-16 px-4 text-center">
        <div className="flex flex-col items-center">
          <ShoppingBag className="h-16 w-16 text-gray-400 dark:text-gray-500" />
          <h2 className="mt-6 mb-4 text-2xl font-bold text-gray-900 dark:text-gray-100">{t('orders.no_orders_yet')}</h2>
          <p className="mb-8 text-gray-600 dark:text-gray-400">{t('orders.start_shopping_to_see_your_order_history_here')}</p>
          <Link
            to="/products"
            className="inline-flex items-center rounded-md bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            Browse Products <ChevronRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <h1 className="mb-8 text-3xl font-bold text-gray-900 dark:text-gray-100">{t('orders.your_orders')}</h1>

      <div className="space-y-6">
        {orders.map((order) => (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow-md dark:shadow-lg"
          >
            <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('orders.order_placed')}</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('orders.total')}</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{order.total.toFixed(2)} {t('common.currency')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('orders.order_id')}</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{order.id}</p>
                </div>
                <div>
                  <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${
                    order.status === 'delivered'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : order.status === 'cancelled'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  }`}>
                    {t(`orders.${order.status}`)}
                  </span>
                </div>
              </div>
            </div>

            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {order.order_items.map((item) => (
                <div key={item.id} className="flex items-center p-4">
                  <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md">
                    <img
                      src={item.products?.image_url}
                      alt={item.products?.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="ml-4 flex flex-1 flex-col">
                    <div>
                      <div className="flex justify-between">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                          <Link to={`/product/${item.products?.id}`} className="hover:text-blue-600 dark:hover:text-blue-400">
                            {item.products?.name}
                          </Link>
                        </h3>
                        <p className="ml-4 text-lg font-medium text-gray-900 dark:text-gray-100">
                          {(item.price * item.quantity).toFixed(2)} {t('common.currency')}
                        </p>
                      </div>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('orders.quantity')}: {item.quantity}</p>
                    </div>
                    {order.status === 'delivered' && user && (
                      <div className="mt-2">
                        <ReviewForm productId={item.product_id || item.products?.id} userId={user.id} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 p-4">
              <div className="flex justify-between">
                <button className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
                  Track Package
                </button>
                <button
                  className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                  onClick={() => handleViewInvoice(order)}
                >
                  {t('orders.view_invoice')}
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default OrdersPage