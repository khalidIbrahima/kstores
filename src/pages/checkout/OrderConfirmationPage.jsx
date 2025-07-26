import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet';
import { supabase } from '../../lib/supabase';
import { CheckCircle, Phone, Mail, Clock, MapPin, Package } from 'lucide-react';
import { motion } from 'framer-motion';

export default function OrderConfirmationPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [order, setOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        console.log('Fetching order details for orderId:', orderId);
        
        // Fetch order details
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single();

        console.log('Order data:', orderData);
        console.log('Order error:', orderError);

        if (orderError) throw orderError;
        setOrder(orderData);

        // Fetch order items
        const { data: itemsData, error: itemsError } = await supabase
          .from('order_items')
          .select(`
            *,
            products (
              name,
              image_url,
              price
            )
          `)
          .eq('order_id', orderId);

        console.log('Order items data:', itemsData);
        console.log('Order items error:', itemsError);

        if (itemsError) throw itemsError;
        setOrderItems(itemsData || []);

      } catch (error) {
        console.error('Error fetching order details:', error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  // Show success message even if order is not found (for testing)
  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-green-50 px-6 py-8 text-center border-b">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {t('checkout.order.success')}
              </h1>
              <p className="text-lg text-gray-600 mb-4">
                Order #{orderId}
              </p>
              
              {/* Contact Information */}
              <div className="bg-white rounded-lg p-6 max-w-md mx-auto">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-blue-600" />
                  {t('checkout.confirmation.whatHappensNext')}
                </h2>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <Phone className="h-5 w-5 mr-3 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">{t('checkout.confirmation.weWillCallYou')}</p>
                      <p className="text-sm text-gray-600">{t('checkout.confirmation.callDescription')}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Mail className="h-5 w-5 mr-3 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">{t('checkout.confirmation.emailConfirmation')}</p>
                      <p className="text-sm text-gray-600">{t('checkout.confirmation.emailDescription')}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Package className="h-5 w-5 mr-3 text-orange-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">{t('checkout.confirmation.fastDelivery')}</p>
                      <p className="text-sm text-gray-600">{t('checkout.confirmation.deliveryDescription')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-6 text-center">
              <p className="text-gray-600 mb-4">
                {t('checkout.confirmation.thankYouMessage')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  {t('checkout.confirmation.continueShopping')}
                </Link>
                <Link
                  to="/contact"
                  className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  {t('checkout.confirmation.contactSupport')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Order Confirmation - {orderId}</title>
      </Helmet>
      
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Test message */}
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
            <p>Page de confirmation chargée - Order ID: {orderId}</p>
            <p>Loading: {loading ? 'true' : 'false'}</p>
            <p>Order: {order ? 'found' : 'not found'}</p>
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-lg shadow-lg overflow-hidden"
          >
            {/* Header */}
            <div className="bg-green-50 px-6 py-8 text-center border-b">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {t('checkout.confirmation.title')}
              </h1>
              <p className="text-lg text-gray-600 mb-4">
                Order #{orderId}
              </p>
              
              {/* Contact Information */}
              <div className="bg-white rounded-lg p-6 max-w-md mx-auto">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-blue-600" />
                  {t('checkout.confirmation.whatHappensNext')}
                </h2>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <Phone className="h-5 w-5 mr-3 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">{t('checkout.confirmation.weWillCallYou')}</p>
                      <p className="text-sm text-gray-600">{t('checkout.confirmation.callDescription')}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Mail className="h-5 w-5 mr-3 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">{t('checkout.confirmation.emailConfirmation')}</p>
                      <p className="text-sm text-gray-600">{t('checkout.confirmation.emailDescription')}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Package className="h-5 w-5 mr-3 text-orange-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">{t('checkout.confirmation.fastDelivery')}</p>
                      <p className="text-sm text-gray-600">{t('checkout.confirmation.deliveryDescription')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Details */}
            <div className="px-6 py-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Order Items */}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('checkout.confirmation.orderItems')}</h2>
                  <div className="space-y-4">
                    {orderItems.map((item) => (
                      <div key={item.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                        <img
                          src={item.products?.image_url}
                          alt={item.products?.name}
                          className="h-16 w-16 object-cover rounded-md"
                        />
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{item.products?.name}</h3>
                          <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                          {item.selected_color && (
                            <div className="flex items-center mt-1">
                              <div
                                className="w-4 h-4 rounded-full border border-gray-300 mr-2"
                                style={{ backgroundColor: JSON.parse(item.selected_color).hex }}
                              />
                              <span className="text-xs text-gray-600">
                                {JSON.parse(item.selected_color).name}
                              </span>
                            </div>
                          )}
                          <p className="text-sm font-medium text-gray-900">
                            ${(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Customer Information */}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('checkout.confirmation.customerInformation')}</h2>
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-medium text-gray-900 mb-2">{t('checkout.confirmation.contactDetails')}</h3>
                      <p className="text-gray-600">{order.shipping_address?.name}</p>
                      <p className="text-gray-600">{order.shipping_address?.email}</p>
                      <p className="text-gray-600">{order.shipping_address?.phone}</p>
                    </div>
                    
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-medium text-gray-900 mb-2 flex items-center">
                        <MapPin className="h-4 w-4 mr-2" />
                        {t('checkout.confirmation.deliveryAddress')}
                      </h3>
                      <p className="text-gray-600">{order.shipping_address?.address}</p>
                      {order.shipping_address?.city && (
                        <p className="text-gray-600">
                          {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.zip_code}
                        </p>
                      )}
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-medium text-gray-900 mb-2">{t('checkout.confirmation.orderSummary')}</h3>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('checkout.confirmation.total')}:</span>
                        <span className="font-medium text-gray-900">${order.total.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('checkout.confirmation.status')}:</span>
                        <span className="font-medium text-green-600 capitalize">{order.status}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-6 text-center">
              <p className="text-gray-600 mb-4">
                {t('checkout.confirmation.thankYouMessage')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  {t('checkout.confirmation.continueShopping')}
                </Link>
                <Link
                  to="/contact"
                  className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  {t('checkout.confirmation.contactSupport')}
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
} 