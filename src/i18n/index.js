import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import fr from './locales/fr.json';
import en from './locales/en.json';

// Récupérer la langue préférée du localStorage ou utiliser le français par défaut
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
    lng: savedLanguage,
    fallbackLng: 'fr',
    debug: false,
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;