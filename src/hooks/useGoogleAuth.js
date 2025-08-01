import { useState, useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export const useGoogleAuth = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Vérifier si l'utilisateur est déjà connecté (Google ou Supabase)
  useEffect(() => {
    const checkAuth = async () => {
      // Vérifier d'abord Supabase Auth
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser({
          id: session.user.id,
          name: session.user.user_metadata?.full_name || session.user.email,
          email: session.user.email,
          picture: session.user.user_metadata?.avatar_url,
          is_admin: session.user.user_metadata?.is_admin || false
        });
        return;
      }

      // Sinon, vérifier le token Google
      const token = localStorage.getItem('google_token');
      if (token) {
        try {
          const decoded = jwtDecode(token);
          if (decoded.exp * 1000 > Date.now()) {
            setUser({
              id: decoded.sub,
              name: decoded.name,
              email: decoded.email,
              picture: decoded.picture,
              is_admin: false
            });
          } else {
            localStorage.removeItem('google_token');
          }
        } catch (error) {
          localStorage.removeItem('google_token');
        }
      }
    };

    checkAuth();
  }, []);

  // Fonction de connexion Google
  const login = useGoogleLogin({
    onSuccess: async (response) => {
      setIsLoading(true);
      try {
        // Décoder le token pour obtenir les informations utilisateur
        const decoded = jwtDecode(response.access_token);
        
        // Sauvegarder le token
        localStorage.setItem('google_token', response.access_token);
        
        // Créer ou mettre à jour le profil utilisateur dans Supabase
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: decoded.sub, // Google user ID
            full_name: decoded.name,
            email: decoded.email,
            avatar_url: decoded.picture,
            is_admin: false, // Par défaut, pas admin
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'id'
          });

        if (profileError) {
          console.error('Error creating profile:', profileError);
        }

        // Définir l'utilisateur
        const userData = {
          id: decoded.sub,
          name: decoded.name,
          email: decoded.email,
          picture: decoded.picture,
          is_admin: profile?.is_admin || false
        };
        
        setUser(userData);

        toast.success('Connexion réussie !');
        
        // Rediriger vers la page appropriée
        if (userData.is_admin) {
          window.location.href = '/admin';
        } else {
          window.location.href = '/';
        }

      } catch (error) {
        console.error('Google login error:', error);
        toast.error('Erreur lors de la connexion Google');
      } finally {
        setIsLoading(false);
      }
    },
    onError: (error) => {
      console.error('Google login error:', error);
      toast.error('Erreur lors de la connexion Google');
      setIsLoading(false);
    }
  });

  // Fonction de déconnexion
  const logout = async () => {
    try {
      setIsLoading(true);
      
      // Déconnexion de Supabase Auth
      await supabase.auth.signOut();
      
      // Nettoyer le token Google
      localStorage.removeItem('google_token');
      
      // Réinitialiser l'état utilisateur
      setUser(null);
      
      toast.success('Déconnexion réussie');
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      // Nettoyer quand même l'état local
      localStorage.removeItem('google_token');
      setUser(null);
      toast.success('Déconnexion réussie');
      window.location.href = '/';
    } finally {
      setIsLoading(false);
    }
  };

  return {
    user,
    isLoading,
    login,
    logout,
    isAuthenticated: !!user
  };
}; 