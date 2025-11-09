import { supabase } from '../lib/supabase';

const WAVE_API_URL = 'https://api.wave.com/v1/checkout/sessions';
const WAVE_API_KEY = import.meta.env.VITE_WAVE_API_KEY;

export const createWaveCheckout = async (orderData) => {
  try {
    // Créer la session de paiement Wave
    const response = await fetch(WAVE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WAVE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: orderData.total.toString(),
        currency: 'XOF',
        error_url: `${window.location.origin}/checkout/error`,
        success_url: `${window.location.origin}/checkout/success`,
        client_reference: orderData.id
      })
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la création de la session de paiement Wave');
    }

    const checkoutSession = await response.json();

    // Créer l'enregistrement de paiement
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        orderId: orderData.id,
        status: 'pending',
        provider: 'wave',
        provider_id: checkoutSession.id,
        amount: orderData.total,
        currency: 'XOF'
      });

    if (paymentError) throw paymentError;

    return checkoutSession;
  } catch (error) {
    console.error('Erreur Wave:', error);
    throw error;
  }
};

export const checkWavePaymentStatus = async (checkoutId) => {
  try {
    const response = await fetch(`${WAVE_API_URL}/${checkoutId}`, {
      headers: {
        'Authorization': `Bearer ${WAVE_API_KEY}`
      }
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la vérification du statut de paiement');
    }

    const checkoutSession = await response.json();
    return checkoutSession;
  } catch (error) {
    console.error('Erreur lors de la vérification du statut Wave:', error);
    throw error;
  }
};

export const handleWaveWebhook = async (webhookData) => {
  try {
    const { checkout_id, payment_status } = webhookData;

    // Mettre à jour le statut du paiement
    const { error } = await supabase
      .from('payments')
      .update({ 
        status: payment_status === 'succeeded' ? 'completed' : 'failed'
      })
      .eq('provider_id', checkout_id);

    if (error) throw error;

    // Si le paiement est réussi, mettre à jour le statut de la commande
    if (payment_status === 'succeeded') {
      const { data: payment } = await supabase
        .from('payments')
        .select('orderId')
        .eq('provider_id', checkout_id)
        .single();

      if (payment) {
        const { error: orderError } = await supabase
          .from('orders')
          .update({ status: 'paid' })
          .eq('id', payment.orderId);

        if (orderError) throw orderError;
      }
    }

    return true;
  } catch (error) {
    console.error('Erreur lors du traitement du webhook Wave:', error);
    throw error;
  }
}; 