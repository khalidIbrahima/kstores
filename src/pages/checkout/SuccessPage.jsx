import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { checkWavePaymentStatus } from '../../services/waveService';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet';
import { supabase } from '../../lib/supabase';
import { CheckCircle, Phone, Mail, Clock } from 'lucide-react';

export default function SuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState(null);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const checkoutId = searchParams.get('checkout_id');
        if (!checkoutId) {
          navigate('/');
          return;
        }

        // Vérifier le statut du paiement dans la table Payments
        const { data: payment, error } = await supabase
          .from('payments')
          .select('*')
          .eq('provider_id', checkoutId)
          .single();

        if (error) throw error;

        if (payment.status === 'completed') {
          // Récupérer les détails de la commande
          const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('*')
            .eq('id', payment.orderId)
            .single();

          if (!orderError) {
            setOrderData(order);
          }

          // Rediriger vers la page de confirmation de commande
          navigate(`/orders/${payment.orderId}`);
        } else {
          // Vérifier le statut avec l'API Wave
          const checkoutSession = await checkWavePaymentStatus(checkoutId);
          
          if (checkoutSession.payment_status === 'succeeded') {
            // Mettre à jour le statut du paiement
            const { error: updateError } = await supabase
              .from('payments')
              .update({ status: 'completed' })
              .eq('provider_id', checkoutId);

            if (updateError) throw updateError;

            // Mettre à jour le statut de la commande
            const { error: orderError } = await supabase
              .from('orders')
              .update({ status: 'paid' })
              .eq('id', payment.orderId);

            if (orderError) throw orderError;

            navigate(`/orders/${payment.orderId}`);
          } else {
            navigate('/checkout/error');
          }
        }
      } catch (error) {
        console.error('Erreur de vérification du paiement:', error);
        navigate('/checkout/error');
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [searchParams, navigate]);

  return (
    <>
      <Helmet>
        <title>{t('payment.processing')}</title>
      </Helmet>
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h1 className="text-xl font-semibold text-gray-800 mb-2">
            {t('payment.processing')}
          </h1>
          <p className="text-gray-600">
            {t('payment.redirecting')}
          </p>
        </div>
      </div>
    </>
  );
} 