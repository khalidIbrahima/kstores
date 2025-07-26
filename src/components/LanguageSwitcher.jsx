import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'fr' ? 'en' : 'fr';
    i18n.changeLanguage(newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center space-x-1 rounded-full bg-background-light px-3 py-1 text-sm text-text-dark hover:bg-background-dark transition-colors"
    >
      <Globe className="h-4 w-4" />
      <span>{i18n.language.toUpperCase()}</span>
    </button>
  );
};

export default LanguageSwitcher