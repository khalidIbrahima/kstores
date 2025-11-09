import React, { useState } from 'react';
import { testEmailConfiguration } from '../services/emailService';

const RESEND_EDGE_FUNCTION_URL = import.meta.env.VITE_RESEND_EDGE_FUNCTION_URL;
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'admin@yourdomain.com';

const EmailDiagnostic = () => {
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
    <div className="max-w-lg p-6 bg-white rounded shadow space-y-6">
      <h2 className="text-xl font-bold mb-2">Diagnostic Email (Resend)</h2>
      <div className="space-y-2">
        <div>
          <span className="font-semibold">Resend Edge Function URL:</span>
          <span className="ml-2 text-sm break-all">{RESEND_EDGE_FUNCTION_URL || <span className="text-red-600">Not configured</span>}</span>
        </div>
        <div>
          <span className="font-semibold">Admin Email:</span>
          <span className="ml-2 text-sm">{ADMIN_EMAIL || <span className="text-red-600">Not configured</span>}</span>
        </div>
      </div>
      {(!RESEND_EDGE_FUNCTION_URL || !ADMIN_EMAIL) && (
        <div className="p-3 bg-yellow-100 text-yellow-800 rounded">
          Please configure both the Resend Edge Function URL and Admin Email in your environment variables.
        </div>
      )}
      <button
        onClick={handleTest}
        disabled={isTesting || !RESEND_EDGE_FUNCTION_URL || !ADMIN_EMAIL}
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

export default EmailDiagnostic; 