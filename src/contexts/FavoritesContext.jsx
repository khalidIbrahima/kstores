import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const FavoritesContext = createContext();

export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchFavorites();
    } else {
      setFavorites([]);
      setIsLoading(false);
    }
  }, [user]);

  const fetchFavorites = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          *,
          products (*)
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      setFavorites(data || []);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      toast.error('Failed to fetch favorites');
    } finally {
      setIsLoading(false);
    }
  };

  const ensureUserProfile = async () => {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      // Create profile if it doesn't exist
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          full_name: user.email?.split('@')[0] || 'Anonymous', // Fallback name from email
          avatar_url: null,
        });

      if (insertError) {
        throw new Error('Failed to create user profile');
      }
    }
  };

  const addToFavorites = async (product) => {
    if (!user) {
      toast.error('Please sign in to add favorites');
      return;
    }

    try {
      // Ensure user profile exists before adding favorite
      await ensureUserProfile();

      const { data, error } = await supabase
        .from('favorites')
        .insert([{
          user_id: user.id,
          product_id: product.id
        }])
        .select(`
          *,
          products (*)
        `)
        .single();

      if (error) throw error;
      setFavorites([...favorites, data]);
      toast.success('Added to favorites');
    } catch (error) {
      if (error.code === '23505') { // Unique constraint violation
        toast.error('Already in favorites');
      } else {
        console.error('Error adding to favorites:', error);
        toast.error('Failed to add to favorites');
      }
    }
  };

  const removeFromFavorites = async (productId) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);

      if (error) throw error;
      setFavorites(favorites.filter(fav => fav.product_id !== productId));
      toast.success('Removed from favorites');
    } catch (error) {
      console.error('Error removing from favorites:', error);
      toast.error('Failed to remove from favorites');
    }
  };

  const isFavorite = (productId) => {
    return favorites.some(fav => fav.product_id === productId);
  };

  const value = {
    favorites,
    isLoading,
    addToFavorites,
    removeFromFavorites,
    isFavorite
  };

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}