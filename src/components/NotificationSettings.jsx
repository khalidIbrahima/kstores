import { useState, useEffect } from 'react';
import { Bell, Mail, MessageSquare, Save, TestTube } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { checkNotificationSettings } from '../services/notificationService';
import { sendOrderStatusUpdateEmailToCustomer } from '../services/emailService';
import { sendOrderWhatsappStatusUpdateToCustomer } from '../services/whatsappService';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const NotificationSettings = () => {
  const [settings, setSettings] = useState({
    enable_email_notifications: true,
    enable_whatsapp_notifications: true,
    enable_order_status_notifications: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('store_settings')
        .select('enable_email_notifications, enable_whatsapp_notifications, enable_order_status_notifications')
        .single();

      if (error) throw error;

      setSettings({
        enable_email_notifications: data?.enable_email_notifications ?? true,
        enable_whatsapp_notifications: data?.enable_whatsapp_notifications ?? true,
        enable_order_status_notifications: data?.enable_order_status_notifications ?? true
      });
    } catch (error) {
      console.error('Error fetching notification settings:', error);
      toast.error('Erreur lors du chargement des paramètres');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('store_settings')
        .upsert({
          enable_email_notifications: settings.enable_email_notifications,
          enable_whatsapp_notifications: settings.enable_whatsapp_notifications,
          enable_order_status_notifications: settings.enable_order_status_notifications
        });

      if (error) throw error;

      toast.success('Paramètres de notifications sauvegardés');
    } catch (error) {
      console.error('Error saving notification settings:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const sendTestNotification = async (type) => {
    try {
      setTestLoading(true);
      
      // Récupérer une commande récente pour le test
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .limit(1)
        .order('created_at', { ascending: false });

      if (error || !orders.length) {
        toast.error('Aucune commande trouvée pour le test');
        return;
      }

      const order = orders[0];
      
      if (type === 'email') {
        await sendOrderStatusUpdateEmailToCustomer(order, 'test');
        toast.success('Email de test envoyé');
      } else if (type === 'whatsapp') {
        await sendOrderWhatsappStatusUpdateToCustomer(order, 'test');
        toast.success('WhatsApp de test envoyé');
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast.error('Erreur lors de l\'envoi du test');
    } finally {
      setTestLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center">
          <Bell className="h-5 w-5 mr-2" />
          Paramètres de notifications
        </h2>
        <button
          onClick={saveSettings}
          disabled={saving}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Notifications par Email */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Mail className="h-5 w-5 text-blue-500 mr-2" />
              <h3 className="font-medium">Notifications par Email</h3>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enable_email_notifications}
                onChange={(e) => handleSettingChange('enable_email_notifications', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Envoyer des notifications par email quand le statut d'une commande change
          </p>
          <button
            onClick={() => sendTestNotification('email')}
            disabled={testLoading || !settings.enable_email_notifications}
            className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <TestTube className="h-4 w-4 mr-2" />
            {testLoading ? 'Envoi...' : 'Tester Email'}
          </button>
        </div>

        {/* Notifications par WhatsApp */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <MessageSquare className="h-5 w-5 text-green-500 mr-2" />
              <h3 className="font-medium">Notifications par WhatsApp</h3>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enable_whatsapp_notifications}
                onChange={(e) => handleSettingChange('enable_whatsapp_notifications', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Envoyer des notifications par WhatsApp quand le statut d'une commande change
          </p>
          <button
            onClick={() => sendTestNotification('whatsapp')}
            disabled={testLoading || !settings.enable_whatsapp_notifications}
            className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <TestTube className="h-4 w-4 mr-2" />
            {testLoading ? 'Envoi...' : 'Tester WhatsApp'}
          </button>
        </div>
      </div>

      {/* Notifications de statut de commande */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Bell className="h-5 w-5 text-purple-500 mr-2" />
            <h3 className="font-medium">Notifications de statut de commande</h3>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.enable_order_status_notifications}
              onChange={(e) => handleSettingChange('enable_order_status_notifications', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
        <p className="text-sm text-gray-600">
          Activer les notifications automatiques quand l'admin change le statut d'une commande
        </p>
      </div>

      {/* Informations */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h4 className="font-medium text-blue-800 mb-2">Informations</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Les notifications sont envoyées automatiquement quand le statut d'une commande change</li>
          <li>• Les clients reçoivent des notifications par email et/ou WhatsApp selon leurs informations</li>
          <li>• Toutes les notifications sont enregistrées dans l'historique</li>
          <li>• Utilisez les boutons de test pour vérifier la configuration</li>
        </ul>
      </div>
    </div>
  );
};

export default NotificationSettings; 