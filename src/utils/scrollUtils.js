/**
 * Utilitaires pour gérer le défilement des pages
 * Assure un défilement vers le haut lors des changements de navigation
 */

/**
 * Fait défiler vers le haut de manière robuste
 * Fonctionne avec différents types de layouts et navigateurs
 */
export const scrollToTop = (options = {}) => {
  const {
    behavior = 'instant',
    delay = 0,
    forceMultipleMethods = true
  } = options;

  const performScroll = () => {
    try {
      // Méthode 1: Window scroll (la plus standard)
      if (window && window.scrollTo) {
        window.scrollTo({ 
          top: 0, 
          left: 0, 
          behavior: behavior 
        });
      }

      // Méthode 2: Document element (pour certains navigateurs)
      if (document.documentElement) {
        document.documentElement.scrollTop = 0;
      }

      // Méthode 3: Body scroll (fallback pour anciens navigateurs)
      if (document.body) {
        document.body.scrollTop = 0;
      }

      if (forceMultipleMethods) {
        // Méthode 4: Chercher et défiler le conteneur principal
        const mainContainers = [
          document.querySelector('main'),
          document.querySelector('[role="main"]'),
          document.querySelector('.main-content'),
          document.querySelector('#main'),
          document.querySelector('.app-content')
        ].filter(Boolean);

        mainContainers.forEach(container => {
          if (container && typeof container.scrollTo === 'function') {
            container.scrollTo({ top: 0, behavior: behavior });
          } else if (container) {
            container.scrollTop = 0;
          }
        });

        // Méthode 5: Tous les éléments avec scroll personnalisé
        const customScrollElements = document.querySelectorAll('[data-scroll-container], .scroll-container, .overflow-y-auto, .overflow-auto');
        customScrollElements.forEach(element => {
          if (element.scrollTop > 0) {
            element.scrollTop = 0;
          }
        });
      }

    } catch (error) {
      console.warn('Erreur lors du scroll vers le haut:', error);
      
      // Fallback ultime
      try {
        window.location.hash = '';
        window.scrollTo(0, 0);
      } catch (fallbackError) {
        console.error('Impossible de faire défiler vers le haut:', fallbackError);
      }
    }
  };

  if (delay > 0) {
    setTimeout(performScroll, delay);
  } else {
    performScroll();
  }
};

/**
 * Hook-like function pour scroll automatique sur changement de route
 * À utiliser dans les composants React
 */
export const useScrollToTopOnRoute = (pathname) => {
  // Scroll immédiat
  scrollToTop({ behavior: 'instant' });
  
  // Scroll avec délai pour s'assurer que le DOM est mis à jour
  setTimeout(() => {
    scrollToTop({ behavior: 'instant' });
  }, 50);
  
  // Scroll avec délai plus long pour les navigations lentes
  setTimeout(() => {
    scrollToTop({ behavior: 'instant' });
  }, 200);
};

/**
 * Vérifie la position de scroll actuelle
 */
export const getCurrentScrollPosition = () => {
  return window.pageYOffset || 
         document.documentElement.scrollTop || 
         document.body.scrollTop || 
         0;
};

/**
 * Défile vers un élément spécifique
 */
export const scrollToElement = (elementOrSelector, options = {}) => {
  const {
    behavior = 'smooth',
    block = 'start',
    inline = 'nearest',
    offset = 0
  } = options;

  let element;
  
  if (typeof elementOrSelector === 'string') {
    element = document.querySelector(elementOrSelector);
  } else {
    element = elementOrSelector;
  }

  if (!element) {
    console.warn('Élément non trouvé pour le scroll:', elementOrSelector);
    return false;
  }

  try {
    // Calculer la position avec offset
    const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
    const finalPosition = Math.max(0, elementPosition - offset);

    window.scrollTo({
      top: finalPosition,
      behavior: behavior
    });

    return true;
  } catch (error) {
    console.error('Erreur lors du scroll vers l\'élément:', error);
    
    // Fallback avec scrollIntoView
    try {
      element.scrollIntoView({ behavior, block, inline });
      return true;
    } catch (fallbackError) {
      console.error('Fallback scroll failed:', fallbackError);
      return false;
    }
  }
};

/**
 * Défile vers le haut de manière fluide avec animation
 */
export const smoothScrollToTop = (duration = 300) => {
  const startPosition = getCurrentScrollPosition();
  const startTime = performance.now();

  const animateScroll = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Fonction d'easing (ease-out)
    const easeOut = 1 - Math.pow(1 - progress, 3);
    
    const currentPosition = startPosition * (1 - easeOut);
    window.scrollTo(0, currentPosition);

    if (progress < 1) {
      requestAnimationFrame(animateScroll);
    }
  };

  requestAnimationFrame(animateScroll);
};

// Export par défaut pour compatibilité
export default {
  scrollToTop,
  useScrollToTopOnRoute,
  getCurrentScrollPosition,
  scrollToElement,
  smoothScrollToTop
};
