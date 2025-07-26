import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageVisit } from '../services/analyticsService';

const AnalyticsTracker = () => {
  const location = useLocation();

  useEffect(() => {
    // Tracker la visite de page quand l'URL change
    // Exclure les pages admin pour éviter le bruit dans les analytics
    if (!location.pathname.startsWith('/admin')) {
      trackPageVisit(location.pathname);
    }
  }, [location.pathname]);

  // Ce composant ne rend rien visuellement
  return null;
};

export default AnalyticsTracker; 