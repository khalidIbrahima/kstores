import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CreditCard, Lock, Shield, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import MobileWalletSelector from '../components/MobileWalletSelector';
import { sendOrderWhatsappNotificationToAdmin, sendOrderWhatsappConfirmationToCustomer } from '../services/whatsappService';

const IPTVCheckoutPage = () => {
  const [searchParams] = useSearchParams();
  const planId = searchParams.get('plan');
  const [plan, setPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [formData, setFormData] = useState({
    name: '',
    email: user?.email || '',
    phone: '',
  });

  const [walletInfo, setWalletInfo] = useState({ wallet: '', phone: '' });

  useEffect(() => {
    const fetchPlan = async () => {
      if (!planId) {
        navigate('/iptv');
        return;
      }

      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('iptv_plans')
          .select('*')
          .eq('id', planId)
          .single();

        if (error) throw error;
        if (!data) {
          toast.error('Plan not found');
          navigate('/iptv');
          return;
        }

        setPlan(data);
      } catch (error) {
        console.error('Error fetching plan:', error);
        toast.error('Failed to load plan details');
        navigate('/iptv');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlan();
  }, [planId, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      // Here you would integrate with your payment processor
      // For demo purposes, we'll simulate a successful payment
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Create order record with optional user_id
      const orderData = {
        user_id: user?.id || null, // Allow null for guest users
        total: plan.price,
        status: 'processing',
        shipping_address: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
        }
      };

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single();

      if (orderError) throw orderError;

      // Envoyer les notifications WhatsApp
      try {
        // Notification à l'admin
        await sendOrderWhatsappNotificationToAdmin(order);
        
        // Confirmation au client (si numéro de téléphone disponible)
        if (formData.phone) {
          await sendOrderWhatsappConfirmationToCustomer(order);
        }
      } catch (error) {
        console.error('Error sending WhatsApp notifications:', error);
        // Ne pas bloquer le processus de commande si les notifications échouent
      }

      toast.success('Subscription activated successfully!');
      navigate(`/orders`);
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to process payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
      </div>
    );
  }

  if (!plan) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Checkout Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="rounded-lg bg-white p-6 shadow-md">
              <h2 className="mb-6 text-2xl font-bold">Complete Your Order</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Contact Information */}
                <div>
                  <h3 className="mb-4 text-lg font-medium">Contact Information</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        {t('orders.name')}
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Mobile Wallet Selector */}
                <MobileWalletSelector value={walletInfo} onChange={setWalletInfo} />

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="mt-8 w-full rounded-md bg-blue-600 py-3 font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400"
                >
                  {isProcessing ? (
                    <div className="flex items-center justify-center">
                      <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-white"></div>
                      <span className="ml-2">Processing...</span>
                    </div>
                  ) : (
                    `Pay  ${plan.price.toFixed(2)} ${t('common.currency')}`
                  )}
                </button>
              </form>
            </div>
          </motion.div>

          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="rounded-lg bg-white p-6 shadow-md">
              <h2 className="mb-6 text-xl font-bold">{t('orders.order_summary')}</h2>
              
              <div className="mb-6 rounded-lg bg-gray-50 p-4">
                <h3 className="mb-2 text-lg font-medium">{plan.name} {t('iptv.checkout.plan')}</h3>
                <div className="mb-4">
                  <span className="text-2xl font-bold">{plan.price} {t('common.currency')}</span>
                  <span className="text-gray-600">/{plan.duration}</span>
                </div>
                <div className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center text-sm">
                      <Check className="mr-2 h-4 w-4 text-green-500" />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="space-y-4 border-t border-gray-200 pt-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('iptv.checkout.subtotal')}</span>
                  <span className="font-medium"> {plan.price.toFixed(2)} {t('common.currency')}</span>
                </div>
                {/* <div className="flex justify-between">
                  <span className="text-gray-600">{t('iptv.checkout.tax')}</span>
                  <span className="font-medium">{(plan.price * 0.18).toFixed(2)} {t('common.currency')}</span>
                </div> */}
                <div className="flex justify-between border-t border-gray-200 pt-4">
                  <span className="text-lg font-bold">{t('orders.total')}</span>
                  <span className="text-lg font-bold">
                    {(plan.price).toFixed(2)} {t('common.currency')}
                  </span>
                </div>
              </div>

              <div className="mt-6 space-y-4 rounded-lg bg-blue-50 p-4">
                <div className="flex items-center text-sm text-blue-700">
                  <Shield className="mr-2 h-5 w-5" />
                  {t('iptv.checkout.secure_payment_processing')}
                </div>
                <div className="text-sm text-gray-600">
                  {t('iptv.checkout.your_payment_information_is_encrypted_and_secure')}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default IPTVCheckoutPage;