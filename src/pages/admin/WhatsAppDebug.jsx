import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bug, MessageCircle, TestTube, Send } from 'lucide-react';
import { testWhatsAppConnection, debugOrderNotification, sendWhatsAppMessage } from '../../services/whatsappService';
import { getWhatsAppConfig } from '../../services/whatsappSettingsService';
import toast from 'react-hot-toast';

const WhatsAppDebug = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [orderId, setOrderId] = useState('');
  const [testMessage, setTestMessage] = useState({
    phone: '',
    message: '🧪 Test message from WhatsApp Debug - ' + new Date().toLocaleString()
  });

  const loadConfig = async () => {
    setIsLoading(true);
    try {
      const configData = await getWhatsAppConfig();
      setConfig(configData);
      console.log('Loaded config:', configData);
    } catch (error) {
      console.error('Error loading config:', error);
      toast.error('Error loading WhatsApp configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const runConnectionTest = async () => {
    setIsLoading(true);
    try {
      const result = await testWhatsAppConnection();
      setTestResult(result);
      if (result.success) {
        toast.success('Connection test successful!');
      } else {
        toast.error(`Test failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Test error:', error);
      toast.error('Test failed');
    } finally {
      setIsLoading(false);
    }
  };

  const debugOrder = async () => {
    if (!orderId) {
      toast.error('Please enter an order ID');
      return;
    }
    
    setIsLoading(true);
    try {
      const result = await debugOrderNotification(orderId);
      setTestResult(result);
      if (result.success) {
        toast.success('Order notification test completed!');
      } else {
        toast.error(`Debug failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Debug error:', error);
      toast.error('Debug failed');
    } finally {
      setIsLoading(false);
    }
  };

  const testDirectMessage = async () => {
    if (!testMessage.phone || !testMessage.message) {
      toast.error('Please enter both phone number and message');
      return;
    }
    
    setIsLoading(true);
    try {
      const result = await sendWhatsAppMessage(testMessage.phone, testMessage.message);
      setTestResult({ success: true, result });
      toast.success('Direct message sent successfully!');
    } catch (error) {
      console.error('Direct message error:', error);
      setTestResult({ success: false, error: error.message });
      toast.error(`Message failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Bug className="h-8 w-8 text-orange-500" />
          WhatsApp Debug
        </h1>
        <p className="text-gray-600 mt-2">
          Debug and test WhatsApp notifications
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Configuration Display */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-blue-600" />
            Configuration
          </h2>
          
          <button
            onClick={loadConfig}
            disabled={isLoading}
            className="mb-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isLoading ? 'Loading...' : 'Load Configuration'}
          </button>

          {config && (
            <div className="space-y-3">
              <div>
                <strong>Account SID:</strong> 
                <span className="ml-2 text-sm">
                  {config.accountSid ? '***' + config.accountSid.slice(-4) : 'Not set'}
                </span>
              </div>
              <div>
                <strong>Auth Token:</strong> 
                <span className="ml-2 text-sm">
                  {config.authToken ? '***' + config.authToken.slice(-4) : 'Not set'}
                </span>
              </div>
              <div>
                <strong>WhatsApp Number:</strong> 
                <span className="ml-2 text-sm">
                  {config.whatsappNumber || 'Not set'}
                </span>
              </div>
              <div>
                <strong>Admin Number:</strong> 
                <span className="ml-2 text-sm">
                  {config.adminNumber || 'Not set'}
                </span>
              </div>
              <div>
                <strong>Order Notifications:</strong> 
                <span className="ml-2 text-sm">
                  {config.notifications?.order ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          )}
        </motion.div>

        {/* Test Functions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <TestTube className="h-5 w-5 text-green-600" />
            Test Functions
          </h2>
          
          <div className="space-y-4">
            <button
              onClick={runConnectionTest}
              disabled={isLoading}
              className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400"
            >
              {isLoading ? 'Testing...' : 'Test Connection'}
            </button>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order ID for Debug
              </label>
              <input
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="Enter order ID"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <button
              onClick={debugOrder}
              disabled={isLoading || !orderId}
              className="w-full bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 disabled:bg-gray-400"
            >
              {isLoading ? 'Debugging...' : 'Debug Order Notification'}
            </button>

            <div className="border-t pt-4 mt-4">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Send className="h-5 w-5 text-purple-600" />
                Direct Message Test
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={testMessage.phone}
                    onChange={(e) => setTestMessage(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+221771234567"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message
                  </label>
                  <textarea
                    value={testMessage.message}
                    onChange={(e) => setTestMessage(prev => ({ ...prev, message: e.target.value }))}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <button
                  onClick={testDirectMessage}
                  disabled={isLoading || !testMessage.phone || !testMessage.message}
                  className="w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:bg-gray-400"
                >
                  {isLoading ? 'Sending...' : 'Send Test Message'}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Test Results */}
      {testResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 bg-white rounded-lg shadow-md p-6"
        >
          <h3 className="text-lg font-semibold mb-4">Test Results</h3>
          <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto text-sm">
            {JSON.stringify(testResult, null, 2)}
          </pre>
        </motion.div>
      )}

      {/* Instructions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6 bg-blue-50 rounded-lg p-6"
      >
        <h3 className="text-lg font-semibold mb-3 text-blue-900">Debug Instructions</h3>
        <div className="space-y-2 text-sm text-blue-800">
          <p><strong>1.</strong> Click "Load Configuration" to see current WhatsApp settings</p>
          <p><strong>2.</strong> Click "Test Connection" to send a test message</p>
          <p><strong>3.</strong> Enter an order ID and click "Debug Order Notification" to test order notifications</p>
          <p><strong>4.</strong> Check the browser console for detailed logs</p>
          <p><strong>5.</strong> If tests fail, check your WhatsApp settings in the admin panel</p>
        </div>
      </motion.div>
    </div>
  );
};

export default WhatsAppDebug; 