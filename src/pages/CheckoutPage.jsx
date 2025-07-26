import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CreditCard, Lock } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import LocationPicker from '../components/LocationPicker';
import { formatPrice } from '../utils/currency';
import { sendOrderWhatsappNotificationToAdmin, sendOrderWhatsappConfirmationToCustomer } from '../services/whatsappService';
import { sendOrderEmailNotificationToAdmin as sendOrderEmailToAdmin, sendOrderEmailConfirmationToCustomer as sendOrderEmailToCustomer } from '../services/emailService';
//import { createNotification } from '../lib/notifications';

const CheckoutPage = () => {
  const { t } = useTranslation();
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [location, setLocation] = useState(null);
  const [formData, setFormData] = useState({
    email: user?.email || '',
    name: '',
    phone: '',
    address: '',
  });

  // Redirect to cart if no items
  useEffect(() => {
    if (items.length === 0) {
      navigate('/cart');
    }
  }, [items.length, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLocationSelect = (selectedLocation) => {
    setLocation(selectedLocation);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!location) {
      toast.error(t('checkout.location.required'));
      return;
    }
    setIsProcessing(true);

    try {
      // Create order in database with optional user_id
      const orderData = {
        user_id: user?.id || null, // Allow null for guest users
        total: total,
        status: 'pending',
        shipping_address: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address
        },
        userGeolocation: {
          latitude: location.lat,
          longitude: location.lng
        }
      };

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single();

      //log error
      console.log('Order created:', order);
      console.log('Order error:', orderError);
      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        price: item.price,
        selected_color: item.selectedColor ? JSON.stringify(item.selectedColor) : null
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      console.log('Order items created, error:', itemsError);
      if (itemsError) throw itemsError;

      // Fetch order items with product info for email
      const { data: orderItemsFull, error: orderItemsFullError } = await supabase
        .from('order_items')
        .select('quantity, price, products(name, image_url)')
        .eq('order_id', order.id);
      if (orderItemsFullError) throw orderItemsFullError;

      // Map to structure expected by email template
      const orderWithItems = {
        ...order,
        order_items: orderItemsFull?.map(item => ({
          name: item.products?.name,
          image_url: item.products?.image_url,
          quantity: item.quantity,
          price: item.price
        })) || []
      };

      // Send notifications (only with enriched order)
      try {
        console.log('🔄 Starting notifications for order:', order.id);
        // Admin email
        await sendOrderEmailToAdmin(orderWithItems);
        await sendOrderWhatsappNotificationToAdmin(order);
        // Customer email (if phone/email present)
        if (formData.phone) {
          await sendOrderWhatsappConfirmationToCustomer(order);
        }
        if (formData.email) {
          await sendOrderEmailToCustomer(orderWithItems);
        }
      } catch (error) {
        console.error('❌ Error sending notifications:', error);
      }

      // Clear cart and show success message
      clearCart();
      toast.success(t('checkout.order.success'));
      
      navigate(`/orders`);
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(t('checkout.order.error'));
    } finally {
      setIsProcessing(false);
    }
  };

  // Don't render if cart is empty (useEffect will handle redirect)
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Checkout Form */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="order-2 lg:order-1"
        >
          <div className="rounded-lg bg-white p-6 shadow-md">
            <h2 className="mb-6 text-2xl font-bold">{t('checkout.title')}</h2>
            
            {!user && (
              <div className="mb-6 rounded-lg bg-blue-50 p-4">
                <p className="text-sm text-blue-700">
                  {t('checkout.guest.message')}
                </p>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Contact Information */}
              <div>
                <h3 className="mb-4 text-lg font-medium">{t('checkout.contact.title')}</h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      {t('checkout.shipping.fullName')}
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                      {t('checkout.contact.phone')}
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      {t('checkout.contact.email')}
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              {<div>
                <h3 className="mb-4 text-lg font-medium">{t('checkout.shipping.title')}</h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                      {t('checkout.shipping.streetAddress')}
                    </label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  {/* <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                        {t('checkout.shipping.city')}
                      </label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                        {t('checkout.shipping.state')}
                      </label>
                      <input
                        type="text"
                        id="state"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700">
                        {t('checkout.shipping.zipCode')}
                      </label>
                      <input
                        type="text"
                        id="zipCode"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div> */}
                </div>
              </div>}
              {/* Location Picker */}
              <div>
                <h3 className="mb-4 text-lg font-medium">{t('checkout.location.title')}</h3>
                <div className="h-[300px] rounded-lg overflow-hidden">
                  <LocationPicker onLocationSelect={handleLocationSelect} />
                </div>
              </div>

              {/* Payment Information */}
              {/* <div>
                <h3 className="mb-4 text-lg font-medium">{t('checkout.payment.title')}</h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700">
                      {t('checkout.payment.cardNumber')}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="cardNumber"
                        name="cardNumber"
                        value={formData.cardNumber}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border border-gray-300 pl-10 pr-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                        placeholder={t('checkout.payment.cardPlaceholder')}
                        required
                      />
                      <CreditCard className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700">
                        {t('checkout.payment.expiryDate')}
                      </label>
                      <input
                        type="text"
                        id="expiryDate"
                        name="expiryDate"
                        value={formData.expiryDate}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                        placeholder="MM/YY"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="cvv" className="block text-sm font-medium text-gray-700">
                        {t('checkout.payment.cvv')}
                      </label>
                      <input
                        type="text"
                        id="cvv"
                        name="cvv"
                        value={formData.cvv}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                        placeholder="123"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div> */}

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full rounded-full bg-primary px-6 py-3 text-base font-semibold text-white hover:bg-accent focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                {isProcessing ? t('checkout.order.processing') : t('checkout.order.placeOrder')}
              </button>
            </form>
          </div>
        </motion.div>

        {/* Order Summary */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="order-1 lg:order-2"
        >
          <div className="rounded-lg bg-white p-6 shadow-md">
            <h2 className="mb-6 text-2xl font-bold">{t('checkout.order.title')}</h2>
            
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{item.name}</h3>
                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-medium">{formatPrice(item.price * item.quantity)}</p>
                </div>
              ))}
              
              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <p className="text-gray-600">{t('checkout.order.subtotal')}</p>
                  <p className="font-medium">{formatPrice(total)}</p>
                </div>
                
                <div className="mt-4 flex items-center justify-between border-t pt-4">
                  <p className="text-lg font-bold">{t('checkout.order.total')}</p>
                  <p className="text-lg font-bold">{formatPrice(total)}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CheckoutPage;