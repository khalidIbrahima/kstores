import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Settings, TestTube, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { testWhatsAppConnection } from '../../services/whatsappService';
import { getWhatsAppSettings, saveWhatsAppSettings } from '../../services/whatsappSettingsService';
import toast from 'react-hot-toast';

const WhatsAppSettings = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [settings, setSettings] = useState({
    twilioAccountSid: '',
    twilioAuthToken: '',
    twilioWhatsAppNumber: '',
    adminWhatsAppNumber: '',
    enableOrderNotifications: true,
    enableStatusUpdates: true,
    enableLowStockAlerts: true,
    enablePaymentAlerts: true
  });

  // Charger les paramètres au montage
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const dbSettings = await getWhatsAppSettings();
        setSettings({
          twilioAccountSid: dbSettings.twilio_account_sid || '',
          twilioAuthToken: dbSettings.twilio_auth_token || '',
          twilioWhatsAppNumber: dbSettings.twilio_whatsapp_number || '',
          adminWhatsAppNumber: dbSettings.admin_whatsapp_number || '',
          enableOrderNotifications: dbSettings.enable_order_notifications ?? true,
          enableStatusUpdates: dbSettings.enable_status_updates ?? true,
          enableLowStockAlerts: dbSettings.enable_low_stock_alerts ?? true,
          enablePaymentAlerts: dbSettings.enable_payment_alerts ?? true
        });
      } catch (error) {
        toast.error('Erreur lors du chargement des paramètres WhatsApp');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      // Mapper les champs JS -> DB
      const dbSettings = {
        twilio_account_sid: settings.twilioAccountSid,
        twilio_auth_token: settings.twilioAuthToken,
        twilio_whatsapp_number: settings.twilioWhatsAppNumber,
        admin_whatsapp_number: settings.adminWhatsAppNumber,
        enable_order_notifications: settings.enableOrderNotifications,
        enable_status_updates: settings.enableStatusUpdates,
        enable_low_stock_alerts: settings.enableLowStockAlerts,
        enable_payment_alerts: settings.enablePaymentAlerts
      };
      await saveWhatsAppSettings(dbSettings);
      toast.success(t('whatsapp.settings.saved') || 'Paramètres sauvegardés avec succès');
    } catch (error) {
      toast.error(t('whatsapp.settings.save_error') || 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setTestLoading(true);
    setTestResult(null);
    
    try {
      const result = await testWhatsAppConnection();
      setTestResult(result);
      
      if (result.success) {
        toast.success(t('whatsapp.test.success') || 'Test de connexion réussi !');
      } else {
        toast.error(t('whatsapp.test.error') || 'Test de connexion échoué');
      }
    } catch (error) {
      setTestResult({ success: false, error: error.message });
      toast.error(t('whatsapp.test.error') || 'Erreur lors du test');
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <div className="space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen p-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <MessageCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
          Configuration WhatsApp
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Configurez les notifications WhatsApp pour recevoir des alertes en temps réel
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Twilio */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-lg p-6"
        >
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <Settings className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Configuration Twilio
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Account SID
              </label>
              <input
                type="text"
                name="twilioAccountSid"
                value={settings.twilioAccountSid}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Auth Token
              </label>
              <input
                type="password"
                name="twilioAuthToken"
                value={settings.twilioAuthToken}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Votre token d'authentification"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Numéro WhatsApp Twilio
              </label>
              <input
                type="text"
                name="twilioWhatsAppNumber"
                value={settings.twilioWhatsAppNumber}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="whatsapp:+1234567890"
              />
              <p className="text-xs text-gray-500 mt-1">
                Format: whatsapp:+[code pays][numéro]
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Numéro WhatsApp Admin
              </label>
              <input
                type="text"
                name="adminWhatsAppNumber"
                value={settings.adminWhatsAppNumber}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+221771234567"
              />
              <p className="text-xs text-gray-500 mt-1">
                Votre numéro WhatsApp pour recevoir les notifications
              </p>
            </div>
          </div>
        </motion.div>

        {/* Types de notifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-lg p-6"
        >
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-green-600" />
            Types de notifications
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Nouvelles commandes</h3>
                <p className="text-sm text-gray-500">
                  Recevoir une notification pour chaque nouvelle commande
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="enableOrderNotifications"
                  checked={settings.enableOrderNotifications}
                  onChange={handleInputChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Mises à jour de statut</h3>
                <p className="text-sm text-gray-500">
                  Notifier les clients des changements de statut
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="enableStatusUpdates"
                  checked={settings.enableStatusUpdates}
                  onChange={handleInputChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Alertes de stock bas</h3>
                <p className="text-sm text-gray-500">
                  Recevoir des alertes quand les produits sont en stock faible
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="enableLowStockAlerts"
                  checked={settings.enableLowStockAlerts}
                  onChange={handleInputChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Alertes de paiement</h3>
                <p className="text-sm text-gray-500">
                  Recevoir des alertes pour les paiements échoués
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="enablePaymentAlerts"
                  checked={settings.enablePaymentAlerts}
                  onChange={handleInputChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Test de connexion */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-lg shadow-md p-6"
      >
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TestTube className="h-5 w-5 text-purple-600" />
          Test de connexion
        </h2>
        
        <div className="flex items-center gap-4">
          <button
            onClick={handleTestConnection}
            disabled={testLoading || !settings.adminWhatsAppNumber}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {testLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <TestTube className="h-4 w-4" />
            )}
            {testLoading ? 'Test en cours...' : 'Tester la connexion'}
          </button>

          {testResult && (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-md ${
              testResult.success 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {testResult.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <span className="text-sm">
                {testResult.success 
                  ? 'Connexion réussie !' 
                  : `Erreur: ${testResult.error}`
                }
              </span>
            </div>
          )}
        </div>

        <p className="text-sm text-gray-500 mt-2">
          Envoyez un message de test à votre numéro WhatsApp pour vérifier la configuration
        </p>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex justify-end"
      >
        <button
          onClick={handleSaveSettings}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <Save className="h-4 w-4" />
          )}
          {loading ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
      </motion.div>

     
    </div>
  );
};

export default WhatsAppSettings; 