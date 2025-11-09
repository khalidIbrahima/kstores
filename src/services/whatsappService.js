import { supabase } from '../lib/supabase';
// Configuration Twilio WhatsApp Business (uniquement depuis les variables d'environnement)
const TWILIO_ACCOUNT_SID = import.meta.env.VITE_TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = import.meta.env.VITE_TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_NUMBER = import.meta.env.VITE_TWILIO_WHATSAPP_NUMBER;
const ADMIN_WHATSAPP_NUMBER = import.meta.env.VITE_ADMIN_WHATSAPP_NUMBER;

// Configuration WhatsApp depuis les variables d'environnement
const WHATSAPP_CONFIG = {
  accountSid: TWILIO_ACCOUNT_SID,
  authToken: TWILIO_AUTH_TOKEN,
  whatsappNumber: TWILIO_WHATSAPP_NUMBER,
  adminNumber: ADMIN_WHATSAPP_NUMBER,
  notifications: {
    order: true, // Par défaut activé
    status: true,
    lowStock: true,
    payment: true
  }
};

// Fonction pour envoyer un message WhatsApp via Twilio
export const sendWhatsAppMessage = async (to, message) => {
  try {
    // Validation des paramètres (comme dans le test qui fonctionne)
    if (!to) {
      throw new Error('Phone number is required');
    }
    
    if (!message) {
      throw new Error('Message is required');
    }
    
    // Utiliser uniquement la configuration depuis les variables d'environnement
    const accountSid = WHATSAPP_CONFIG.accountSid;
    const authToken = WHATSAPP_CONFIG.authToken;
    const whatsappNumber = WHATSAPP_CONFIG.whatsappNumber;
    
    if (!accountSid || !authToken || !whatsappNumber) {
      throw new Error('Missing required configuration (Account SID, Auth Token, or WhatsApp Number)');
    }
    
    // Vérifier que le numéro est au bon format
    const formattedNumber = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
    
    const requestBody = new URLSearchParams({
      From: whatsappNumber,
      To: formattedNumber,
      Body: message,
    });
    
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${accountSid}:${authToken}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: requestBody,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Twilio API error: ${errorData.message || response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    throw error;
  }
};

// Fonction pour envoyer une notification de nouvelle commande à l'admin (WhatsApp + Email)
export const sendOrderWhatsappNotificationToAdmin = async (order) => {
  try {
    console.log('🔄 Starting admin notifications for order:', order.id);
    
    const results = {
      whatsapp: null,
      email: null
    };

    // 1. Envoyer notification WhatsApp
    try {
      // Utiliser uniquement la configuration depuis les variables d'environnement
      const config = WHATSAPP_CONFIG;
      
      // Validation complète de la configuration
      if (config.accountSid && config.authToken && config.whatsappNumber && config.notifications.order) {
        const adminNumber = config.adminNumber;
        
        if (adminNumber) {
          const customerName = order.shipping_address?.name || 'Client invité';
          const customerPhone = order.shipping_address?.phone || 'Non fourni';
          const orderTotal = order.total.toLocaleString('fr-FR');
          const orderId = order.id;
          const orderDate = new Date(order.created_at).toLocaleString('fr-FR');

          const message = `🛒 *NOUVELLE COMMANDE REÇUE*

📋 *Commande #${orderId}*
👤 *Client:* ${customerName}
📞 *Téléphone:* ${customerPhone}
💰 *Montant:* ${orderTotal} FCFA
📅 *Date:* ${orderDate}

🔗 Voir les détails: ${window.location.origin}/admin/orders-page/${orderId}

Répondez rapidement pour confirmer la commande !`;

          results.whatsapp = await sendWhatsAppMessage(adminNumber, message);
          console.log('✅ WhatsApp notification sent successfully');
        }
      }
    } catch (whatsappError) {
      console.error('❌ Error sending WhatsApp notification:', whatsappError);
    }
    
    // Enregistrer les notifications dans la base de données
    await supabase.from('notifications').insert([{
      user_id: null, // Notification admin
      type: 'order_received',
      data: { 
        orderId: order.id,
        whatsappSent: !!results.whatsapp,
        emailSent: !!results.email,
        sentAt: new Date().toISOString(),
        results: results
      },
      is_read: false
    }]);

    console.log('✅ All admin notifications completed');
    return results;

  } catch (error) {
    console.error('❌ Error sending admin notifications:', error);
    
    // Enregistrer l'erreur dans la base de données
    try {
      await supabase.from('notifications').insert([{
        user_id: null,
        type: 'order_received',
        data: { 
          orderId: order.id,
          whatsappSent: false,
          emailSent: false,
          error: error.message,
          sentAt: new Date().toISOString()
        },
        is_read: false
      }]);
    } catch (dbError) {
      console.error('Error saving notification to database:', dbError);
    }
    
    throw error;
  }
};

// Fonction pour envoyer une confirmation de commande au client (WhatsApp)
export const sendOrderWhatsappConfirmationToCustomer = async (order) => {
  try {
    console.log('🔄 Starting customer confirmation for order:', order.id);
    
    const results = {
      whatsapp: null,
      email: null
    };

    // 1. Envoyer confirmation WhatsApp
    try {
      const customerPhone = order.shipping_address?.phone;
      if (customerPhone) {
        const customerName = order.shipping_address?.name || 'Cher client';
        const orderTotal = order.total.toLocaleString('fr-FR');
        const orderId = order.id;

        const message = `✅ *CONFIRMATION DE COMMANDE*

Bonjour ${customerName},

Nous avons bien reçu votre commande #${orderId} d'un montant de ${orderTotal} FCFA.

📦 *Prochaines étapes:*
1. Nous vous contacterons pour confirmer les détails
2. Préparation et expédition de votre commande

📞 *Contact:* +221 76 180 06 49
📧 *Email:* support@kapital-stores.shop

Merci pour votre confiance ! 🛍️

*Kapital Stores*`;

        results.whatsapp = await sendWhatsAppMessage(customerPhone, message);
        console.log('✅ WhatsApp confirmation sent to customer');
      }
    } catch (whatsappError) {
      console.error('❌ Error sending WhatsApp confirmation:', whatsappError);
    }

    return results;

  } catch (error) {
    console.error('❌ Error sending customer confirmation:', error);
    throw error;
  }
};

// Fonction pour envoyer une notification de statut de commande
export const sendOrderWhatsappStatusUpdateToCustomer = async (order, newStatus, isGuestCustomer = false) => {
  try {
    const customerPhone = order.shipping_address?.phone;
    if (!customerPhone) {
      return;
    }

    const customerName = order.shipping_address?.name || 'Cher client';
    const orderId = order.id;
    
    let statusMessage = '';
    let emoji = '';

    switch (newStatus) {
      case 'processing':
        statusMessage = 'en cours de traitement';
        emoji = '⚙️';
        break;
      case 'shipped':
        statusMessage = 'expédiée';
        emoji = '📦';
        break;
      case 'delivered':
        statusMessage = 'livrée';
        emoji = '✅';
        break;
      case 'cancelled':
        statusMessage = 'annulée';
        emoji = '❌';
        break;
      default:
        statusMessage = newStatus;
        emoji = '📋';
    }

    // Adapter le message selon le type de client
    let trackingInfo = '';
    if (!isGuestCustomer) {
      trackingInfo = `🔗 Suivre votre commande: ${window.location.origin}/orders/${orderId}`;
    } else {
      trackingInfo = `💬 Pour toute question, contactez-nous`;
    }

    const message = `${emoji} *MISE À JOUR DE COMMANDE*

Bonjour ${customerName},

Votre commande #${orderId} est maintenant *${statusMessage}*.

${trackingInfo}

📞 *Information:* +221 77 240 50 63

*Kapital Stores*`;

    await sendWhatsAppMessage(customerPhone, message);

  } catch (error) {
    console.error('Error sending order status update:', error);
  }
};

// Fonction pour envoyer une notification de stock bas
export const sendLowStockAlertWhatsappToAdmin = async (product) => {
  try {
    // Utiliser uniquement la configuration depuis les variables d'environnement
    const config = WHATSAPP_CONFIG;
    
    // Vérifier si les alertes de stock sont activées
    if (!config.notifications.lowStock) {
      return;
    }
    
    const adminNumber = config.adminNumber;
    if (!adminNumber) {
      return;
    }

    const message = `⚠️ *ALERTE STOCK BAS*

📦 *Produit:* ${product.name}
📊 *Stock actuel:* ${product.inventory} unités
💰 *Prix:* ${product.price} FCFA

🔗 Gérer l'inventaire: ${window.location.origin}/admin/inventory

Pensez à réapprovisionner !`;

    await sendWhatsAppMessage(adminNumber, message);

  } catch (error) {
    console.error('Error sending low stock alert:', error);
  }
};

// Fonction pour envoyer une notification de paiement échoué
export const sendPaymentFailedAlertWhatsappToAdmin = async (order) => {
  try {
    // Utiliser uniquement la configuration depuis les variables d'environnement
    const config = WHATSAPP_CONFIG;
    
    if (!config.notifications.payment) {
      return;
    }
    const adminNumber = config.adminNumber;
    if (!adminNumber) {
      return;
    }

    const customerName = order.shipping_address?.name || 'Client invité';
    const orderTotal = order.total.toLocaleString('fr-FR');
    const orderId = order.id;

    const message = `❌ *PAIEMENT ÉCHOUÉ*

📋 *Commande #${orderId}*
👤 *Client:* ${customerName}
💰 *Montant:* ${orderTotal} FCFA

🔗 Voir les détails: ${window.location.origin}/admin/orders-page/${orderId}

Contactez le client pour résoudre le problème.`;

    await sendWhatsAppMessage(adminNumber, message);

  } catch (error) {
    console.error('Error sending payment failed alert:', error);
  }
};

// Fonction pour tester la connexion WhatsApp
export const testWhatsAppConnection = async () => {
  try {
    // Utiliser uniquement la configuration depuis les variables d'environnement
    const config = WHATSAPP_CONFIG;
    
    const adminNumber = config.adminNumber;
    if (!adminNumber) {
      throw new Error('Admin WhatsApp number not configured');
    }

    const testMessage = `🧪 *TEST DE CONNEXION WHATSAPP*

Ceci est un message de test pour vérifier la configuration WhatsApp de Kapital Stores.

✅ Si vous recevez ce message, la configuration est correcte !

*Timestamp:* ${new Date().toLocaleString('fr-FR')}`;

    await sendWhatsAppMessage(adminNumber, testMessage);
    return { success: true, message: 'Test message sent successfully' };

  } catch (error) {
    console.error('WhatsApp connection test failed:', error);
    return { success: false, error: error.message };
  }
};

// Fonction de test pour déboguer les notifications de commande
export const debugOrderNotification = async (orderId) => {
  try {
    // Récupérer la commande depuis la base de données
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();
    
    if (error) {
      console.error('Error fetching order:', error);
      return { success: false, error: 'Order not found' };
    }
    
    // Tester la notification
    await sendOrderWhatsappNotificationToAdmin(order);
    
    return { success: true, message: 'Order notification test completed' };
  } catch (error) {
    console.error('Debug error:', error);
    return { success: false, error: error.message };
  }
}; 