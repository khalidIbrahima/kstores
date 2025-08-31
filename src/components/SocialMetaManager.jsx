import { useEffect } from 'react';
import useSocialMeta from '../hooks/useSocialMeta';
import { metaPreloadService } from '../services/metaPreloadService';

/**
 * Composant qui gère les métadonnées sociales dynamiques
 * À utiliser au niveau racine de l'application pour surveiller les changements de route
 */
const SocialMetaManager = () => {
  // Le hook fait tout le travail
  useSocialMeta();
  
  // Démarrer le service de préchargement au montage du composant
  useEffect(() => {
    metaPreloadService.start();
    
    // Nettoyer au démontage
    return () => {
      metaPreloadService.stop();
    };
  }, []);
  
  // Ce composant ne rend rien visuellement
  return null;
};

export default SocialMetaManager;
