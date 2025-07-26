import { useState } from 'react';
import { createWaveCheckout } from '../services/waveService';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

export default function WavePaymentButton({ orderData, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const handleWavePayment = async () => {
    try {
      setLoading(true);
      const checkoutSession = await createWaveCheckout(orderData);
      
      // Rediriger vers la page de paiement Wave
      window.location.href = checkoutSession.wave_launch_url;
    } catch (error) {
      console.error('Erreur de paiement Wave:', error);
      toast.error(t('payment.wave_error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleWavePayment}
      disabled={loading}
      className="btn-primary w-full flex items-center justify-center gap-2"
    >
      <img 
        src="/wave-logo.png" 
        alt="Wave" 
        className="w-6 h-6"
      />
      {loading ? t('common.loading') : t('payment.pay_with_wave')}
    </button>
  );
} 