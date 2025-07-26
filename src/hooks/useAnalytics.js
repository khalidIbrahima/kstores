import { useEffect, useCallback, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageVisit, trackProductView } from '../services/analyticsService';

// Hook pour tracker automatiquement les visites de pages
export const usePageAnalytics = () => {
  const location = useLocation();

  useEffect(() => {
    // Tracker la visite de page quand l'URL change
    trackPageVisit(location.pathname);
  }, [location.pathname]);
};

// Hook pour tracker les vues de produits
export const useProductAnalytics = (productId) => {
  const trackView = useCallback(() => {
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