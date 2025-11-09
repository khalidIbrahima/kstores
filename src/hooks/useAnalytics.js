import { useEffect, useCallback, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageVisit, trackProductView } from '../services/analyticsService';
import { isProduction, devLog } from '../utils/environment';

// Hook pour tracker automatiquement les visites de pages
export const usePageAnalytics = () => {
  const location = useLocation();

  useEffect(() => {
    // Ne tracker que si en production
    if (!isProduction()) {
      devLog(`[ANALYTICS] Page analytics tracking disabled (dev mode): ${location.pathname}`);
      return;
    }
    
    // Tracker la visite de page quand l'URL change
    trackPageVisit(location.pathname);
  }, [location.pathname]);
};

// Hook pour tracker les vues de produits
export const useProductAnalytics = (productId) => {
  const trackView = useCallback(() => {
    // Ne tracker que si en production
    if (!isProduction()) {
      devLog(`[ANALYTICS] Product analytics tracking disabled (dev mode): ${productId}`);
      return;
    }
    
    if (productId) {
      trackProductView(productId);
    }
  }, [productId]);

  useEffect(() => {
    // Tracker la vue quand le composant se monte
    trackView();
  }, [trackView]);

  return { trackView };
};

// Hook pour obtenir les statistiques d'un produit
export const useProductStats = (productId) => {
  const [viewsCount, setViewsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchViews = async () => {
      if (!productId) return;
      
      // Ne charger les statistiques qu'en production
      if (!isProduction()) {
        devLog(`[ANALYTICS] Product stats loading disabled (dev mode): ${productId}`);
        setViewsCount(0);
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        const { getProductViewsCount } = await import('../services/analyticsService');
        const count = await getProductViewsCount(productId);
        setViewsCount(count);
      } catch (error) {
        console.error('Erreur lors de la récupération des statistiques du produit:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchViews();
  }, [productId]);

  return { viewsCount, isLoading };
}; 