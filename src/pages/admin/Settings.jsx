import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  Store, 
  CreditCard, 
  Mail, 
  Bell, 
  Shield, 
  Users, 
  Palette,
  Save,
  AlertCircle,
  CheckCircle,
  Settings as SettingsIcon,
  Globe,
  Truck,
  Database
} from 'lucide-react';
import { storeSettingsService } from '../../services/storeSettingsService.js';
import EmailTest from '../../components/EmailTest';
import EmailDiagnostic from '../../components/EmailDiagnostic';

const Settings = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    store_name: '',
    store_url: '',
    contact_email: '',
    support_phone: '',
    store_description: '',
    business_hours: {
      monday: { open: '09:00', close: '18:00', closed: false },
      tuesday: { open: '09:00', close: '18:00', closed: false },
      wednesday: { open: '09:00', close: '18:00', closed: false },
      thursday: { open: '09:00', close: '18:00', closed: false },
      friday: { open: '09:00', close: '18:00', closed: false },
      saturday: { open: '10:00', close: '16:00', closed: false },
      sunday: { open: '10:00', close: '16:00', closed: true }
    },
    currency: 'USD',
    timezone: 'UTC',
    logo_url: '',
    favicon_url: 'https://prszfxibvgjeqxadzbfo.supabase.co/storage/v1/object/sign/imgs.bucket/favicon_io/favicon.ico?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8yOTcyYWZhYi1hYjE0LTRjOTAtODQ5NS1kMGUzOTU1NWNmZjYiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJpbWdzLmJ1Y2tldC9mYXZpY29uX2lvL2Zhdmljb24uaWNvIiwiaWF0IjoxNzUyOTYyNjA5LCJleHAiOjIxMzEzOTQ2MDl9.o0Iz4XjlNo9QmiuGJqxkoCLFmkSv6gARQfo4OEqfa3A',
    social_media: {
      facebook: '',
      twitter: '',
      instagram: '',
      linkedin: '',
      youtube: ''
    },
    payment_methods: {
      wave: true,
      credit_card: false,
      paypal: false,
      bank_transfer: false
    },
    shipping_options: {
      free_shipping_threshold: 50,
      standard_shipping_cost: 5.99,
      express_shipping_cost: 12.99,
      local_pickup: true
    },
    tax_rate: 0,
    maintenance_mode: false
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  // Charger les paramètres au montage du composant
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await storeSettingsService.getStoreSettings();
      if (data) {
        setSettings({
          ...settings,
          ...data,
          business_hours: data.business_hours || settings.business_hours,
          social_media: data.social_media || settings.social_media,
          payment_methods: data.payment_methods || settings.payment_methods,
          shipping_options: data.shipping_options || settings.shipping_options
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      setMessage({ type: 'error', text: t('settings.actions.loadError') });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleBusinessHoursChange = (day, field, value) => {
    setSettings(prev => ({
      ...prev,
      business_hours: {
        ...prev.business_hours,
        [day]: {
          ...prev.business_hours[day],
          [field]: value
        }
      }
    }));
  };

  const handleSocialMediaChange = (platform, value) => {
    setSettings(prev => ({
      ...prev,
      social_media: {
        ...prev.social_media,
        [platform]: value
      }
    }));
  };

  const handlePaymentMethodChange = (method, enabled) => {
    setSettings(prev => ({
      ...prev,
      payment_methods: {
        ...prev.payment_methods,
        [method]: enabled
      }
    }));
  };

  const handleShippingOptionChange = (option, value) => {
    setSettings(prev => ({
      ...prev,
      shipping_options: {
        ...prev.shipping_options,
        [option]: value
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    
    try {
      await storeSettingsService.updateStoreSettings(settings);
      setMessage({ type: 'success', text: t('settings.actions.success') });
      
      // Effacer le message après 3 secondes
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: t('settings.actions.error') });
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'general', label: t('settings.tabs.general'), icon: Store },
    { id: 'payments', label: t('settings.tabs.payments'), icon: CreditCard },
    { id: 'notifications', label: t('settings.tabs.notifications'), icon: Bell },
    { id: 'security', label: t('settings.tabs.security'), icon: Shield },
    { id: 'team', label: t('settings.tabs.team'), icon: Users },
    { id: 'appearance', label: t('settings.tabs.appearance'), icon: Palette },
    //{ id: 'email', label: t('settings.tabs.email'), icon: Mail },
    { id: 'emailDiagnostic', label: t('settings.tabs.emailDiagnostic'), icon: Database }
  ];

  const days = [
    { key: 'monday', label: t('settings.general.days.monday') },
    { key: 'tuesday', label: t('settings.general.days.tuesday') },
    { key: 'wednesday', label: t('settings.general.days.wednesday') },
    { key: 'thursday', label: t('settings.general.days.thursday') },
    { key: 'friday', label: t('settings.general.days.friday') },
    { key: 'saturday', label: t('settings.general.days.saturday') },
    { key: 'sunday', label: t('settings.general.days.sunday') }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'email':
        //return <EmailTest />;
      case 'emailDiagnostic':
        return <EmailDiagnostic />;
      default:
        return (
          <div className="space-y-6">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium">{t('settings.general.title')}</h3>
                  <p className="text-sm text-gray-500">{t('settings.general.subtitle')}</p>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t('settings.general.storeName')}
                    </label>
                    <input
                      type="text"
                      value={settings.store_name}
                      onChange={(e) => handleInputChange('store_name', e.target.value)}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t('settings.general.storeUrl')}
                    </label>
                    <input
                      type="text"
                      value={settings.store_url}
                      onChange={(e) => handleInputChange('store_url', e.target.value)}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t('settings.general.contactEmail')}
                    </label>
                    <input
                      type="email"
                      value={settings.contact_email}
                      onChange={(e) => handleInputChange('contact_email', e.target.value)}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t('settings.general.supportPhone')}
                    </label>
                    <input
                      type="tel"
                      value={settings.support_phone}
                      onChange={(e) => handleInputChange('support_phone', e.target.value)}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('settings.general.storeDescription')}
                  </label>
                  <textarea
                    rows={4}
                    value={settings.store_description}
                    onChange={(e) => handleInputChange('store_description', e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('settings.general.businessHours')}
                  </label>
                  <div className="mt-1 grid grid-cols-1 gap-4 md:grid-cols-2">
                    {days.map((day) => (
                      <div key={day.key} className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
                        <span className="text-sm font-medium text-gray-700">{day.label}</span>
                        <div className="flex items-center space-x-2">
                          <input
                            type="time"
                            value={settings.business_hours[day.key].open}
                            onChange={(e) => handleBusinessHoursChange(day.key, 'open', e.target.value)}
                            className="rounded-md border border-gray-300 px-2 py-1 text-sm"
                          />
                          <span>to</span>
                          <input
                            type="time"
                            value={settings.business_hours[day.key].close}
                            onChange={(e) => handleBusinessHoursChange(day.key, 'close', e.target.value)}
                            className="rounded-md border border-gray-300 px-2 py-1 text-sm"
                          />
                          <label className="flex items-center space-x-1">
                            <input
                              type="checkbox"
                              checked={settings.business_hours[day.key].closed}
                              onChange={(e) => handleBusinessHoursChange(day.key, 'closed', e.target.checked)}
                              className="rounded border-gray-300"
                            />
                            <span className="text-xs text-gray-500">{t('settings.general.closed')}</span>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'payments' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium">{t('settings.payments.title')}</h3>
                  <p className="text-sm text-gray-500">{t('settings.payments.subtitle')}</p>
                </div>

                <div className="space-y-4">
                  {Object.entries(settings.payment_methods).map(([method, enabled]) => (
                    <div key={method} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <h4 className="font-medium capitalize">{method.replace('_', ' ')}</h4>
                        <p className="text-sm text-gray-500">
                          {method === 'wave' && t('settings.payments.methods.wave')}
                          {method === 'credit_card' && t('settings.payments.methods.credit_card')}
                          {method === 'paypal' && t('settings.payments.methods.paypal')}
                          {method === 'bank_transfer' && t('settings.payments.methods.bank_transfer')}
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={enabled}
                          onChange={(e) => handlePaymentMethodChange(method, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  ))}
                </div>

                <div>
                  <h3 className="text-lg font-medium mt-8">{t('settings.payments.shipping.title')}</h3>
                  <p className="text-sm text-gray-500">{t('settings.payments.shipping.subtitle')}</p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t('settings.payments.shipping.freeShippingThreshold')}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={settings.shipping_options.free_shipping_threshold}
                      onChange={(e) => handleShippingOptionChange('free_shipping_threshold', parseFloat(e.target.value))}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t('settings.payments.shipping.standardShippingCost')}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={settings.shipping_options.standard_shipping_cost}
                      onChange={(e) => handleShippingOptionChange('standard_shipping_cost', parseFloat(e.target.value))}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t('settings.payments.shipping.expressShippingCost')}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={settings.shipping_options.express_shipping_cost}
                      onChange={(e) => handleShippingOptionChange('express_shipping_cost', parseFloat(e.target.value))}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings.shipping_options.local_pickup}
                      onChange={(e) => handleShippingOptionChange('local_pickup', e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <label className="text-sm font-medium text-gray-700">
                      {t('settings.payments.shipping.localPickup')}
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('settings.payments.shipping.taxRate')}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={settings.tax_rate}
                    onChange={(e) => handleInputChange('tax_rate', parseFloat(e.target.value))}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium">{t('settings.appearance.title')}</h3>
                  <p className="text-sm text-gray-500">{t('settings.appearance.subtitle')}</p>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t('settings.appearance.logoUrl')}
                    </label>
                    <input
                      type="url"
                      value={settings.logo_url}
                      onChange={(e) => handleInputChange('logo_url', e.target.value)}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                      placeholder="https://example.com/logo.png"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t('settings.appearance.faviconUrl')}
                    </label>
                    <input
                      type="url"
                      value={settings.favicon_url}
                      onChange={(e) => handleInputChange('favicon_url', e.target.value)}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                      placeholder="https://example.com/favicon.ico"
                    />
                    {settings.favicon_url && (
                      <div className="mt-2 flex items-center space-x-2">
                        <img 
                          src={settings.favicon_url} 
                          alt="Favicon preview" 
                          className="w-6 h-6 rounded"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                          }}
                        />
                        <span 
                          className="text-xs text-gray-500"
                          style={{ display: 'none' }}
                        >
                          Erreur de chargement
                        </span>
                        <span className="text-xs text-gray-500">
                          Prévisualisation du favicon
                        </span>
                      </div>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      URL de votre favicon (format .ico recommandé, 16x16, 32x32, ou 48x48 pixels)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t('settings.appearance.currency')}
                    </label>
                    <select
                      value={settings.currency}
                      onChange={(e) => handleInputChange('currency', e.target.value)}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                    >
                      <option value="USD">{t('settings.appearance.currencies.USD')}</option>
                      <option value="EUR">{t('settings.appearance.currencies.EUR')}</option>
                      <option value="GBP">{t('settings.appearance.currencies.GBP')}</option>
                      <option value="XOF">{t('settings.appearance.currencies.XOF')}</option>
                      <option value="XAF">{t('settings.appearance.currencies.XAF')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t('settings.appearance.timezone')}
                    </label>
                    <select
                      value={settings.timezone}
                      onChange={(e) => handleInputChange('timezone', e.target.value)}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                    >
                      <option value="UTC">{t('settings.appearance.timezones.UTC')}</option>
                      <option value="Africa/Dakar">{t('settings.appearance.timezones.Africa/Dakar')}</option>
                      <option value="Africa/Lagos">{t('settings.appearance.timezones.Africa/Lagos')}</option>
                      <option value="Europe/Paris">{t('settings.appearance.timezones.Europe/Paris')}</option>
                      <option value="America/New_York">{t('settings.appearance.timezones.America/New_York')}</option>
                    </select>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium">{t('settings.appearance.socialMedia.title')}</h3>
                  <p className="text-sm text-gray-500">{t('settings.appearance.socialMedia.subtitle')}</p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {Object.entries(settings.social_media).map(([platform, url]) => (
                    <div key={platform}>
                      <label className="block text-sm font-medium text-gray-700 capitalize">
                        {t(`settings.appearance.socialMedia.${platform}`)}
                      </label>
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => handleSocialMediaChange(platform, e.target.value)}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                        placeholder={`https://${platform}.com/yourprofile`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium">{t('settings.security.title')}</h3>
                  <p className="text-sm text-gray-500">{t('settings.security.subtitle')}</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium">{t('settings.security.maintenanceMode')}</h4>
                      <p className="text-sm text-gray-500">
                        {t('settings.security.maintenanceModeDesc')}
                      </p>
                      {settings.maintenance_mode && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                          <p className="text-sm text-red-700 font-medium">
                            ⚠️ Le site est actuellement en mode maintenance. Seuls les administrateurs peuvent y accéder.
                          </p>
                        </div>
                      )}
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.maintenance_mode}
                        onChange={(e) => handleInputChange('maintenance_mode', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('settings.title')}</h1>
        <p className="text-gray-600 dark:text-gray-400">{t('settings.subtitle')}</p>
      </div>

      {/* Message de notification */}
      {message.text && (
        <div className={`p-4 rounded-md flex items-center space-x-2 ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Settings Navigation */}
      <div className="flex space-x-1 rounded-lg bg-gray-100 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 rounded-md px-4 py-2 text-sm font-medium ${
              activeTab === tab.id
                ? 'bg-white text-blue-600 shadow'
                : 'text-gray-600 hover:bg-white/50 hover:text-gray-900'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Settings Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-lg bg-white p-6 shadow-md"
      >
        {renderTabContent()}
      </motion.div>

      {/* Save Button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {saving ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              {t('settings.actions.saving')}
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {t('settings.actions.save')}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Settings;