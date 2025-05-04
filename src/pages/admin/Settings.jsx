import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Store, 
  CreditCard, 
  Mail, 
  Bell, 
  Shield, 
  Users, 
  Palette,
  Save
} from 'lucide-react';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Store },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'email', label: 'Email', icon: Mail }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-gray-600">Manage your store settings and preferences</p>
      </div>

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
        {activeTab === 'general' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Store Information</h3>
              <p className="text-sm text-gray-500">Update your store details and preferences</p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Store Name
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  defaultValue="Kapital Store"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Store URL
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  defaultValue="https://kapitalstore.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Contact Email
                </label>
                <input
                  type="email"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  defaultValue="contact@kapitalstore.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Support Phone
                </label>
                <input
                  type="tel"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  defaultValue="+1 (555) 123-4567"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Store Description
              </label>
              <textarea
                rows={4}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                defaultValue="Your one-stop shop for quality products..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Business Hours
              </label>
              <div className="mt-1 grid grid-cols-1 gap-4 md:grid-cols-2">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => (
                  <div key={day} className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
                    <span className="text-sm font-medium text-gray-700">{day}</span>
                    <div className="flex items-center space-x-2">
                      <input
                        type="time"
                        className="rounded-md border border-gray-300 px-2 py-1 text-sm"
                        defaultValue="09:00"
                      />
                      <span>to</span>
                      <input
                        type="time"
                        className="rounded-md border border-gray-300 px-2 py-1 text-sm"
                        defaultValue="18:00"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            disabled={loading}
            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {loading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Settings;