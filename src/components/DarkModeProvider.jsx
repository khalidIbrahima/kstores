import { useEffect } from 'react';

/**
 * Composant qui gère automatiquement le mode sombre basé sur les préférences système
 */
const DarkModeProvider = ({ children }) => {
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e) => {
      if (e.matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    // Appliquer le mode initial
    handleChange(mediaQuery);

    // Écouter les changements
    mediaQuery.addEventListener('change', handleChange);

    // Nettoyage
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return children;
};

export default DarkModeProvider;
