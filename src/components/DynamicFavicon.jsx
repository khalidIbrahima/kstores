import { useEffect } from 'react';
import { useStoreSettings } from '../hooks/useStoreSettings';

const DynamicFavicon = () => {
  const { settings, loading } = useStoreSettings();

  useEffect(() => {
    if (!loading && settings?.favicon_url) {
      // Supprimer l'ancien favicon s'il existe
      const existingFavicon = document.querySelector('link[rel="icon"]');
      if (existingFavicon) {
        existingFavicon.remove();
      }

      // Créer et ajouter le nouveau favicon
      const favicon = document.createElement('link');
      favicon.rel = 'icon';
      favicon.type = 'image/x-icon';
      favicon.href = settings.favicon_url;
      document.head.appendChild(favicon);
    }
  }, [settings?.favicon_url, loading]);

  // Ce composant ne rend rien visuellement
  return null;
};

export default DynamicFavicon; 