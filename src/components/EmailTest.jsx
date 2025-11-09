import React, { useState } from 'react';
import { testEmailConfiguration } from '../services/emailService';

const EmailTest = () => {
  const [isTesting, setIsTesting] = useState(false);
  const [result, setResult] = useState(null);

  const handleTest = async () => {
    setIsTesting(true);
    setResult(null);
    try {
      const res = await testEmailConfiguration();
      setResult(res.success ? '✅ Test email sent successfully!' : `❌ Error: ${res.error}`);
    } catch (error) {
      setResult(`❌ Error: ${error.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Test Email (Resend)</h2>
      <button
        onClick={handleTest}
        disabled={isTesting}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {isTesting ? 'Sending...' : 'Send Test Email'}
      </button>
      {result && (
        <div className="mt-4 text-center text-lg">
          {result}
        </div>
      )}
    </div>
  );
};

export default EmailTest; 