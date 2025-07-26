import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { storeSettingsService } from '../services/storeSettingsService.js';
import MaintenancePage from '../pages/MaintenancePage';

const MaintenanceGuard = ({ children }) => {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const checkMaintenanceMode = async () => {
    try {
      const settings = await storeSettingsService.getStoreSettings();
      if (settings && settings.maintenance_mode) {
        setIsMaintenanceMode(true);
      } else {
        setIsMaintenanceMode(false);
      }
    } catch (error) {
      console.error('Error checking maintenance mode:', error);
      // En cas d'erreur, on ne bloque pas l'accès
      setIsMaintenanceMode(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkMaintenanceMode();
    
    // Vérifier périodiquement le mode maintenance (toutes les 30 secondes)
    const interval = setInterval(checkMaintenanceMode, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Vérifier aussi quand l'utilisateur change
  useEffect(() => {
    if (!loading) {
      checkMaintenanceMode();
    }
  }, [user]);

  // Show loading while checking maintenance mode
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Si le mode maintenance est activé et que l'utilisateur n'est pas admin, afficher la page de maintenance
  if (isMaintenanceMode && (!user || !user.is_admin)) {
    return <MaintenancePage />;
  }

  // Sinon, afficher le contenu normal
  return children;
};

export default MaintenanceGuard; 