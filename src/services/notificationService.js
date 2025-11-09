import { supabase } from '../lib/supabase';
import { sendOrderStatusUpdateEmailToCustomer } from './emailService';
import { sendOrderWhatsappStatusUpdateToCustomer } from './whatsappService';
import { createNotification } from '../lib/notifications';

// Configuration des types de notifications
export const NOTIFICATION_TYPES = {
  STATUS_UPDATE: 'status_update',
  ORDER_CREATED: 'order_created',
  ORDER_CANCELLED: 'order_cancelled',
  PAYMENT_RECEIVED: 'payment_received',
  SHIPPING_UPDATE: 'shipping_update'
};

// Configuration des statuts de commande
export const ORDER_STATUS_CONFIG = {
  pending: {
    label: 'En attente',
    emoji: '⏳',
    description: 'Votre commande est en attente de traitement',
    color: 'text-yellow-600'
  },
  processing: {
    label: 'En cours de traitement',
    emoji: '⚙️',
    description: 'Votre commande est en cours de traitement',
    color: 'text-blue-600'
  },
  shipped: {
    label: 'Expédiée',
    emoji: '📦',
    description: 'Votre commande a été expédiée',
    color: 'text-purple-600'
  },
  delivered: {
    label: 'Livrée',
    emoji: '✅',
    description: 'Votre commande a été livrée',
    color: 'text-green-600'
  },
  cancelled: {
    label: 'Annulée',
    emoji: '❌',
    description: 'Votre commande a été annulée',
    color: 'text-red-600'
  }
};

// Fonction principale pour notifier le client du changement de statut
export const notifyCustomerOrderStatusChange = async (order, newStatus, previousStatus = null) => {
  try {
    console.log(`🔄 Notifying customer about order status change: ${previousStatus} → ${newStatus}`);
    
    const results = {
      email: null,
      whatsapp: null,
      internal: null,
      errors: []
    };

    // Récupérer les informations du client
    const customerEmail = order.shipping_address?.email;
    const customerPhone = order.shipping_address?.phone;
    const customerName = order.shipping_address?.name || 'Cher client';
    const orderId = order.id;
    
    // Vérifier si le client est connecté ou invité
    const isGuestCustomer = !order.user_id;
    console.log(`👤 Customer type: ${isGuestCustomer ? 'Guest' : 'Registered'}`);

    // Configuration du statut
    const statusConfig = ORDER_STATUS_CONFIG[newStatus] || {
      label: newStatus,
      emoji: '📋',
      description: `Votre commande est maintenant ${newStatus}`,
      color: 'text-gray-600'
    };

    // 1. Notification par Email
    if (customerEmail) {
      try {
        results.email = await sendOrderStatusUpdateEmailToCustomer(order, newStatus, isGuestCustomer);
        console.log('✅ Email notification sent successfully');
      } catch (emailError) {
        console.error('❌ Email notification failed:', emailError);
        results.errors.push({ type: 'email', error: emailError.message });
      }
    }

    // 2. Notification par WhatsApp
    if (customerPhone) {
      try {
        results.whatsapp = await sendOrderWhatsappStatusUpdateToCustomer(order, newStatus, isGuestCustomer);
        console.log('✅ WhatsApp notification sent successfully');
      } catch (whatsappError) {
        console.error('❌ WhatsApp notification failed:', whatsappError);
        results.errors.push({ type: 'whatsapp', error: whatsappError.message });
      }
    }

    // 3. Notification interne dans la base de données
    try {
      const notificationData = {
        orderId: orderId,
        customerName: customerName,
        customerEmail: customerEmail,
        customerPhone: customerPhone,
        previousStatus: previousStatus,
        newStatus: newStatus,
        statusConfig: statusConfig,
        emailSent: !!results.email,
        whatsappSent: !!results.whatsapp,
        sentAt: new Date().toISOString(),
        results: results
      };

      // Créer une notification pour l'admin
      await createNotification({
        user_id: null, // Notification admin
        type: NOTIFICATION_TYPES.STATUS_UPDATE,
        data: notificationData
      });

      // Créer une notification pour le client (si il a un compte)
      if (order.user_id) {
        await createNotification({
          user_id: order.user_id,
          type: NOTIFICATION_TYPES.STATUS_UPDATE,
          data: {
            ...notificationData,
            isCustomerNotification: true
          }
        });
      }

      results.internal = true;
      console.log('✅ Internal notification created successfully');
    } catch (internalError) {
      console.error('❌ Internal notification failed:', internalError);
      results.errors.push({ type: 'internal', error: internalError.message });
    }

    console.log('✅ Customer notification process completed');
    return results;

  } catch (error) {
    console.error('❌ Error in customer notification process:', error);
    throw error;
  }
};



// Fonction pour récupérer l'historique des notifications d'une commande
export const getOrderNotificationHistory = async (orderId) => {
  try {
    // Récupérer toutes les notifications de type status_update
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('type', NOTIFICATION_TYPES.STATUS_UPDATE)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Filtrer côté client pour les notifications de cette commande
    const orderNotifications = (data || []).filter(notification => 
      notification.data?.orderId === orderId || 
      notification.data?.orderId === orderId.toString()
    );

    return orderNotifications;
  } catch (error) {
    console.error('Error fetching notification history:', error);
    return [];
  }
};

// Fonction pour vérifier si les notifications sont activées
export const checkNotificationSettings = async () => {
  try {
    const { data, error } = await supabase
      .from('store_settings')
      .select('enable_email_notifications, enable_whatsapp_notifications')
      .single();

    if (error) throw error;
    return {
      email: data?.enable_email_notifications ?? true,
      whatsapp: data?.enable_whatsapp_notifications ?? true
    };
  } catch (error) {
    console.error('Error checking notification settings:', error);
    return { email: true, whatsapp: true }; // Par défaut activé
  }
};

// Fonction pour envoyer une notification de test
export const sendTestNotification = async (orderId, testType = 'email') => {
  try {
    // Récupérer la commande
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (error) throw error;

    if (testType === 'email') {
      return await sendOrderStatusUpdateEmailToCustomer(order, 'test');
    } else if (testType === 'whatsapp') {
      return await sendOrderWhatsappStatusUpdateToCustomer(order, 'test');
    }

    throw new Error(`Unknown test type: ${testType}`);
  } catch (error) {
    console.error('Error sending test notification:', error);
    throw error;
  }
};

// Fonction pour obtenir les statistiques des notifications
export const getNotificationStats = async (days = 30) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('type', NOTIFICATION_TYPES.STATUS_UPDATE)
      .gte('created_at', startDate.toISOString());

    if (error) throw error;

    const stats = {
      total: data.length,
      email: data.filter(n => n.data?.emailSent).length,
      whatsapp: data.filter(n => n.data?.whatsappSent).length,
      failed: data.filter(n => n.data?.errors && n.data.errors.length > 0).length,
      byStatus: {}
    };

    // Statistiques par statut
    data.forEach(notification => {
      const status = notification.data?.newStatus;
      if (status) {
        if (!stats.byStatus[status]) {
          stats.byStatus[status] = 0;
        }
        stats.byStatus[status]++;
      }
    });

    return stats;
  } catch (error) {
    console.error('Error fetching notification stats:', error);
    return null;
  }
}; 