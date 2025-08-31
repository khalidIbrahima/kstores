import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { scrollToTop } from '../utils/scrollUtils';

/**
 * Composant qui fait automatiquement défiler vers le haut
 * quand l'utilisateur navigue vers une nouvelle page
 */
const ScrollToTopOnRouteChange = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll immédiat
    scrollToTop({ behavior: 'instant' });
    
    // Scroll avec délai pour s'assurer que le DOM est mis à jour
    const timeoutId1 = setTimeout(() => {
      scrollToTop({ behavior: 'instant' });
    }, 50);
    
    // Scroll avec délai plus long pour les chargements lents
    const timeoutId2 = setTimeout(() => {
      scrollToTop({ behavior: 'instant' });
    }, 200);
    
    return () => {
      clearTimeout(timeoutId1);
      clearTimeout(timeoutId2);
    };
  }, [pathname]); // Se déclenche à chaque changement de route

  // Ce composant ne rend rien visuellement
  return null;
};

export default ScrollToTopOnRouteChange;
