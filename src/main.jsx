import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App';
import './i18n';
import './index.css';

// Vérifier que le Client ID Google est configuré
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

if (!googleClientId || googleClientId === 'your-google-client-id-here') {
  console.warn('⚠️ Google Client ID non configuré. Créez un fichier .env avec VITE_GOOGLE_CLIENT_ID');
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={googleClientId || 'placeholder'}>
      <HelmetProvider>
        <App />
      </HelmetProvider>
    </GoogleOAuthProvider>
  </StrictMode>
);