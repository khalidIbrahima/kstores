import { supabase } from '../lib/supabase';

export const storeSettingsService = {
  // Récupérer les paramètres du store
  async getStoreSettings() {
    try {
      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .limit(1)
        .single();

      if (error) {
        console.error('Error fetching store settings:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getStoreSettings:', error);
      return null;
    }
  },

  // Mettre à jour les paramètres du store
  async updateStoreSettings(settings) {
    try {
      const { data, error } = await supabase
        .rpc('update_store_settings', {
          p_store_name: settings.store_name,
          p_store_url: settings.store_url,
          p_contact_email: settings.contact_email,
          p_support_phone: settings.support_phone,
          p_store_description: settings.store_description,
          p_business_hours: settings.business_hours,
          p_currency: settings.currency,
          p_timezone: settings.timezone,
          p_logo_url: settings.logo_url,
          p_favicon_url: settings.favicon_url,
          p_social_media: settings.social_media,
          p_payment_methods: settings.payment_methods,
          p_shipping_options: settings.shipping_options,
          p_tax_rate: settings.tax_rate,
          p_maintenance_mode: settings.maintenance_mode
        });

      if (error) {
        console.error('Error updating store settings:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in updateStoreSettings:', error);
      throw error;
    }
  },

  // Récupérer la configuration email
  async getEmailConfig() {
    try {
      const settings = await this.getStoreSettings();
      return settings?.email_config || null;
    } catch (error) {
      console.error('Error in getEmailConfig:', error);
      return null;
    }
  },

  // Sauvegarder la configuration email
  async saveEmailConfig(emailConfig) {
    try {
      // Utiliser la fonction RPC update_store_settings avec email_config
      const { data, error } = await supabase
        .rpc('update_store_settings', {
          p_email_config: emailConfig
        });

      if (error) {
        console.error('Error saving email config:', error);
        throw error;
      }

      console.log('✅ Email configuration saved to database');
      return { success: true, data };
    } catch (error) {
      console.error('Error in saveEmailConfig:', error);
      throw error;
    }
  },

  // Mettre à jour les heures d'ouverture
  async updateBusinessHours(businessHours) {
    try {
      const { data, error } = await supabase
        .rpc('update_store_settings', {
          p_business_hours: businessHours
        });

      if (error) {
        console.error('Error updating business hours:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in updateBusinessHours:', error);
      throw error;
    }
  },

  // Mettre à jour les méthodes de paiement
  async updatePaymentMethods(paymentMethods) {
    try {
      const { data, error } = await supabase
        .rpc('update_store_settings', {
          p_payment_methods: paymentMethods
        });

      if (error) {
        console.error('Error updating payment methods:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in updatePaymentMethods:', error);
      throw error;
    }
  },

  // Mettre à jour les options de livraison
  async updateShippingOptions(shippingOptions) {
    try {
      const { data, error } = await supabase
        .rpc('update_store_settings', {
          p_shipping_options: shippingOptions
        });

      if (error) {
        console.error('Error updating shipping options:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in updateShippingOptions:', error);
      throw error;
    }
  },

  // Mettre à jour les réseaux sociaux
  async updateSocialMedia(socialMedia) {
    try {
      const { data, error } = await supabase
        .rpc('update_store_settings', {
          p_social_media: socialMedia
        });

      if (error) {
        console.error('Error updating social media:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in updateSocialMedia:', error);
      throw error;
    }
  }
}; 