import { useState, useEffect, createContext, useContext } from 'react';
import { storeSettingsService } from '../services/storeSettingsService';

// Contexte pour les paramètres du store
const StoreSettingsContext = createContext();

// Hook personnalisé pour utiliser les paramètres du store
export const useStoreSettings = () => {
  const context = useContext(StoreSettingsContext);
  if (!context) {
    throw new Error('useStoreSettings must be used within a StoreSettingsProvider');
  }
  return context;
};

// Provider pour les paramètres du store
export const StoreSettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger les paramètres au montage
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await storeSettingsService.getStoreSettings();
      setSettings(data);
    } catch (err) {
      console.error('Error loading store settings:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings) => {
    try {
      setLoading(true);
      setError(null);
      const updatedData = await storeSettingsService.updateStoreSettings(newSettings);
      setSettings(updatedData);
      return updatedData;
    } catch (err) {
      console.error('Error updating store settings:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const refreshSettings = () => {
    loadSettings();
  };

  const value = {
    settings,
    loading,
    error,
    updateSettings,
    refreshSettings
  };

  return (
    <StoreSettingsContext.Provider value={value}>
      {children}
    </StoreSettingsContext.Provider>
  );
}; 