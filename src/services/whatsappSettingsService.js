import { supabase } from '../lib/supabase';

// Récupérer les paramètres WhatsApp
export const getWhatsAppSettings = async () => {
  try {
    const { data, error } = await supabase
      .from('whatsapp_settings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Aucun paramètre trouvé, retourner les valeurs par défaut
        return {
          twilio_account_sid: '',
          twilio_auth_token: '',
          twilio_whatsapp_number: '',
          admin_whatsapp_number: '',
          enable_order_notifications: true,
          enable_status_updates: true,
          enable_low_stock_alerts: true,
          enable_payment_alerts: true
        };
      }
      
      // Handle 406 Not Acceptable error (RLS policy issue)
      if (error.code === '406' || error.message?.includes('Not Acceptable')) {
        return {
          twilio_account_sid: '',
          twilio_auth_token: '',
          twilio_whatsapp_number: '',
          admin_whatsapp_number: '',
          enable_order_notifications: true,
          enable_status_updates: true,
          enable_low_stock_alerts: true,
          enable_payment_alerts: true
        };
      }
      
      throw error;
    }

    return data || {
      twilio_account_sid: '',
      twilio_auth_token: '',
      twilio_whatsapp_number: '',
      admin_whatsapp_number: '',
      enable_order_notifications: true,
      enable_status_updates: true,
      enable_low_stock_alerts: true,
      enable_payment_alerts: true
    };
  } catch (error) {
    console.error('Error fetching WhatsApp settings:', error);
    throw error;
  }
};

// Sauvegarder les paramètres WhatsApp
export const saveWhatsAppSettings = async (settings) => {
  try {
    const { data, error } = await supabase
      .rpc('update_whatsapp_settings', {
        p_twilio_account_sid: settings.twilio_account_sid,
        p_twilio_auth_token: settings.twilio_auth_token,
        p_twilio_whatsapp_number: settings.twilio_whatsapp_number,
        p_admin_whatsapp_number: settings.admin_whatsapp_number,
        p_enable_order_notifications: settings.enable_order_notifications,
        p_enable_status_updates: settings.enable_status_updates,
        p_enable_low_stock_alerts: settings.enable_low_stock_alerts,
        p_enable_payment_alerts: settings.enable_payment_alerts
      });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error saving WhatsApp settings:', error);
    throw error;
  }
};

// Vérifier si les paramètres WhatsApp sont configurés
export const isWhatsAppConfigured = async () => {
  try {
    const settings = await getWhatsAppSettings();
    return !!(
      settings.twilio_account_sid &&
      settings.twilio_auth_token &&
      settings.twilio_whatsapp_number &&
      settings.admin_whatsapp_number
    );
  } catch (error) {
    console.error('Error checking WhatsApp configuration:', error);
    return false;
  }
};

// Récupérer les paramètres pour l'envoi de messages
export const getWhatsAppConfig = async () => {
  try {
    const settings = await getWhatsAppSettings();
    
    const config = {
      accountSid: settings.twilio_account_sid,
      authToken: settings.twilio_auth_token,
      whatsappNumber: settings.twilio_whatsapp_number,
      adminNumber: settings.admin_whatsapp_number,
      notifications: {
        order: settings.enable_order_notifications,
        status: settings.enable_status_updates,
        lowStock: settings.enable_low_stock_alerts,
        payment: settings.enable_payment_alerts
      }
    };
    
    return config;
  } catch (error) {
    console.error('Error getting WhatsApp config:', error);
    return null;
  }
}; 