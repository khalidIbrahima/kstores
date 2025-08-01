import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import GoogleLoginButton from './GoogleLoginButton';

const GoogleAuthPopup = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasShown, setHasShown] = useState(false);
  const { user, isLoading } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    // Vérifier si l'utilisateur est déjà connecté
    if (user || isLoading) {
      return;
    }

    // Vérifier si le popup a déjà été affiché dans cette session
    const popupShown = sessionStorage.getItem('googleAuthPopupShown');
    if (popupShown) {
      return;
    }

    // Afficher le popup après 1 seconde (pour test)
    const timer = setTimeout(() => {
      setIsVisible(true);
      sessionStorage.setItem('googleAuthPopupShown', 'true');
    }, 1000);

    return () => clearTimeout(timer);
  }, [user, isLoading]);

  const handleClose = () => {
    setIsVisible(false);
    setHasShown(true);
  };

  const handleGoogleLogin = () => {
    setIsVisible(false);
    setHasShown(true);
  };

  // Ne pas afficher si l'utilisateur est connecté ou si le popup a déjà été fermé
  if (user || isLoading || hasShown) {
    return null;
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, x: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-20 right-4 bg-white rounded-2xl shadow-2xl p-4 sm:p-6 max-w-xs sm:max-w-sm w-full mx-2 sm:mx-4 z-50 border border-gray-200"
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors z-10 border border-gray-200"
            >
              <X size={16} />
            </button>

            {/* Content */}
            <div className="text-center">
              {/* Icon */}
              <div className="mx-auto w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-3">
                <Mail className="w-6 h-6 text-white" />
              </div>
  
              {/* Title */}
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {t('popup.welcome')}
              </h3>
  
              {/* Description */}
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                {t('popup.description')}
              </p>
  
              {/* Benefits */}
              <div className="space-y-1 mb-4 text-left">
                <div className="flex items-center text-xs text-gray-600">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></div>
                  {t('popup.benefit1')}
                </div>
                <div className="flex items-center text-xs text-gray-600">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></div>
                  {t('popup.benefit2')}
                </div>
                <div className="flex items-center text-xs text-gray-600">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></div>
                  {t('popup.benefit3')}
                </div>
              </div>

              {/* Google Login Button */}
              <div className="mb-3">
                <GoogleLoginButton 
                  variant="full" 
                  onSuccess={handleGoogleLogin}
                />
              </div>
  
              {/* Skip option */}
              <button
                onClick={handleClose}
                className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                {t('popup.skip')}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default GoogleAuthPopup; 