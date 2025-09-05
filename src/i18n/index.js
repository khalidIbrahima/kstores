import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import fr from './locales/fr.json';
import en from './locales/en.json';

// Configuration pour privilégier le français comme langue par défaut
const savedLanguage = localStorage.getItem('preferredLanguage') || 'fr';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      fr: {
        translation: fr
      },
      en: {
        translation: en
      }
    },
    lng: savedLanguage, // Français par défaut
    fallbackLng: 'fr', // Toujours retomber sur le français
    debug: false,
    // Configuration pour privilégier le français
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag', 'path', 'subdomain'],
      lookupLocalStorage: 'preferredLanguage',
      caches: ['localStorage'],
      // Toujours privilégier le français si aucune préférence n'est détectée
      checkWhitelist: true
    },
    // Langues supportées (français en premier)
    supportedLngs: ['fr', 'en'],
    nonExplicitSupportedLngs: true,
    interpolation: {
      escapeValue: false
    },
    // Configuration par défaut pour privilégier le français
    defaultNS: 'translation',
    ns: ['translation'],
    // Assure que le français est toujours disponible
    preload: ['fr']
  });

export default i18n;