import { supabase } from '../lib/supabase';
import { sendWhatsAppMessage } from './whatsappService';

// Fonction pour récupérer les paniers abandonnés avec les informations de contact
export const getAbandonedCartsForNotification = async (hoursThreshold = 24) => {
  try {
    const { data, error } = await supabase
      .rpc('get_eligible_abandoned_carts', { hours_threshold: hoursThreshold });

    if (error) {
      console.error('Database error:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching abandoned carts for notification:', error);
    return [];
  }
};

// Fonction pour envoyer une notification WhatsApp de panier abandonné
export const sendAbandonedCartWhatsAppNotification = async (cart) => {
  try {
    const customerPhone = cart.phone;
    if (!customerPhone) {
      throw new Error('No phone number available for notification');
    }

    const customerName = cart.name || 'Cher client';
    const cartTotal = cart.total_value?.toFixed(2) || '0.00';
    const cartItems = cart.cart_items || [];
    
    // Créer la liste des produits
    const productsList = cartItems
      .slice(0, 3) // Limiter à 3 produits pour le message
      .map(item => `• ${item.products?.name || 'Produit'} x${item.quantity}`)
      .join('\n');

    const message = `🛒 *VOTRE PANIER VOUS ATTEND !*

Bonjour ${customerName},

Nous avons remarqué que vous avez laissé des articles dans votre panier d'une valeur de *${cartTotal} FCFA*.

📦 *Vos articles :*
${productsList}
${cartItems.length > 3 ? `... et ${cartItems.length - 3} autre(s) article(s)` : ''}

⏰ *Offre limitée :* 
-10% sur votre commande si vous finalisez dans les 24h !

🔗 *Finaliser votre commande :*
${window.location.origin}/cart

📞 *Besoin d'aide ?* +221 77 240 50 63

*Kapital Stores* - Votre satisfaction est notre priorité ! 🛍️`;

    // Créer l'enregistrement de notification dans la base de données
    const { data: notification, error: createError } = await supabase.rpc(
      'create_abandoned_cart_notification',
      {
        p_cart_id: cart.id,
        p_notification_type: 'whatsapp',
        p_message_content: message,
        p_recipient_phone: customerPhone
      }
    );

    if (createError) {
      console.error('Error creating notification record:', createError);
    }

    // Envoyer le message WhatsApp
    const result = await sendWhatsAppMessage(customerPhone, message);
    
    // Marquer la notification comme envoyée
    if (notification) {
      await supabase.rpc('mark_notification_sent', { p_notification_id: notification });
    }
    
    console.log('Notification WhatsApp envoyée avec succès:', result);
    
    return { success: true, result, notificationId: notification };
  } catch (error) {
    console.error('Error sending abandoned cart WhatsApp notification:', error);
    
    // Marquer la notification comme échouée si elle existe
    if (error.notificationId) {
      await supabase.rpc('mark_notification_failed', {
        p_notification_id: error.notificationId,
        p_error_message: error.message
      });
    }
    
    throw error;
  }
};

// Fonction pour envoyer une notification par email (optionnel)
export const sendAbandonedCartEmailNotification = async (cart) => {
  try {
    const customerEmail = cart.email;
    if (!customerEmail || !cart.has_real_email) {
      throw new Error('No valid email available for notification');
    }

    // Ici vous pouvez intégrer votre service d'email (SendGrid, Mailgun, etc.)
    // Pour l'instant, on simule l'envoi
    const emailData = {
      to: customerEmail,
      subject: 'Votre panier vous attend ! - Kapital Stores',
      template: 'abandoned_cart',
      data: {
        customerName: cart.name,
        cartTotal: cart.total_value,
        cartItems: cart.cart_items,
        recoveryUrl: `${window.location.origin}/cart`
      }
    };

    // Enregistrer la notification dans la base de données
    await supabase.from('abandoned_cart_notifications').insert([{
      cart_id: cart.id,
      customer_email: customerEmail,
      customer_name: cart.name,
      notification_type: 'email',
      message_content: JSON.stringify(emailData),
      sent_at: new Date().toISOString(),
      status: 'sent'
    }]);

    return { success: true, emailData };
  } catch (error) {
    console.error('Error sending abandoned cart email notification:', error);
    throw error;
  }
};

// Fonction pour envoyer des notifications en lot
export const sendBulkAbandonedCartNotifications = async (carts, notificationType = 'whatsapp') => {
  const results = [];
  
  for (const cart of carts) {
    try {
      let result;
      
      if (notificationType === 'whatsapp') {
        result = await sendAbandonedCartWhatsAppNotification(cart);
      } else if (notificationType === 'email') {
        result = await sendAbandonedCartEmailNotification(cart);
      }
      
      results.push({ cartId: cart.id, success: true, result });
      
      // Attendre 1 seconde entre chaque envoi pour éviter le spam
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      results.push({ cartId: cart.id, success: false, error: error.message });
    }
  }
  
  return results;
};

// Fonction pour récupérer l'historique des notifications
export const getAbandonedCartNotificationHistory = async (cartId = null) => {
  try {
    let query = supabase
      .from('abandoned_cart_notifications')
      .select('*')
      .order('sent_at', { ascending: false });
    
    if (cartId) {
      query = query.eq('cart_id', cartId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching notification history:', error);
    return [];
  }
};

// Fonction pour vérifier si une notification a déjà été envoyée récemment
export const checkRecentNotification = async (cartId, hoursThreshold = 24) => {
  try {
    const { data, error } = await supabase
      .from('abandoned_cart_notifications')
      .select('*')
      .eq('cart_id', cartId)
      .gte('sent_at', new Date(Date.now() - hoursThreshold * 60 * 60 * 1000).toISOString())
      .order('sent_at', { ascending: false })
      .limit(1);
    
    if (error) throw error;
    return data && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('Error checking recent notification:', error);
    return null;
  }
};

// Fonction pour obtenir les statistiques des notifications
export const getAbandonedCartNotificationStats = async () => {
  try {
    const { data, error } = await supabase.rpc('get_abandoned_cart_notification_stats');
    
    if (error) {
      console.error('Error fetching notification stats:', error);
      return {
        total: 0,
        sent: 0,
        failed: 0,
        whatsapp: 0,
        email: 0,
        today: 0,
        recovery_rate: 0
      };
    }
    
    return data || {
      total: 0,
      sent: 0,
      failed: 0,
      whatsapp: 0,
      email: 0,
      today: 0,
      recovery_rate: 0
    };
  } catch (error) {
    console.error('Error fetching notification stats:', error);
    return {
      total: 0,
      sent: 0,
      failed: 0,
      whatsapp: 0,
      email: 0,
      today: 0,
      recovery_rate: 0
    };
  }
};

// Fonction pour créer un lien de récupération unique
export const createRecoveryLink = async (cartId) => {
  try {
    const recoveryToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 heures
    
    const { data, error } = await supabase
      .from('cart_recovery_links')
      .insert([{
        cart_id: cartId,
        recovery_token: recoveryToken,
        expires_at: expiresAt.toISOString(),
        is_used: false
      }]);
    
    if (error) throw error;
    
    return {
      recoveryUrl: `${window.location.origin}/cart/recover/${recoveryToken}`,
      expiresAt
    };
  } catch (error) {
    console.error('Error creating recovery link:', error);
    throw error;
  }
}; 