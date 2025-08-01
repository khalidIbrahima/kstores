import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { useUnifiedAuth } from '../hooks/useUnifiedAuth';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Utiliser le nouveau système unifié
  const unifiedAuth = useUnifiedAuth();

  // Synchroniser l'état avec useUnifiedAuth
  useEffect(() => {
    if (unifiedAuth.user) {
      setUser({
        id: unifiedAuth.user.id,
        email: unifiedAuth.user.email,
        user_metadata: {
          full_name: unifiedAuth.user.name,
          avatar_url: unifiedAuth.user.picture,
          is_admin: unifiedAuth.user.is_admin
        }
      });
      setIsAdmin(unifiedAuth.user.is_admin);
      setSession({ user: unifiedAuth.user }); // Créer une session compatible
    } else {
      setUser(null);
      setSession(null);
      setIsAdmin(false);
    }
    setIsLoading(unifiedAuth.isLoading);
  }, [unifiedAuth.user, unifiedAuth.isLoading]);

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          if (error.message.includes('refresh_token_not_found') || 
              error.message.includes('Invalid Refresh Token')) {
            await supabase.auth.signOut();
            if (mounted) {
              setSession(null);
              setUser(null);
              toast.error('Your session has expired. Please sign in again.');
            }
            return;
          }
          throw error;
        }

        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (mounted) {
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            setSession(session);
            setUser(session?.user ?? null);
            setIsLoading(false);
            
            // Check if user is admin and redirect if they're on a non-admin page
            if (session?.user?.user_metadata?.is_admin) {
              const currentPath = window.location.pathname;
              if (!currentPath.startsWith('/admin') && currentPath !== '/auth/callback') {
                // Only redirect if not already on admin page or auth callback
                window.location.href = '/admin';
              }
            }
          } else if (event === 'SIGNED_OUT') {
            setSession(null);
            setUser(null);
            setIsLoading(false);
          } else if (event === 'TOKEN_REFRESHED') {
            if (!session) {
              // If token refresh failed, sign out the user
              await supabase.auth.signOut();
              setSession(null);
              setUser(null);
              toast.error('Your session has expired. Please sign in again.');
            }
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function signUp(email, password, fullName) {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            is_admin: false
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Create profile in profiles table
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: authData.user.id,
            full_name: fullName,
            email: email,
            is_admin: false,
            updated_at: new Date().toISOString()
          });

        if (profileError) {
          console.error('Error creating profile:', profileError);
        }
      }

      return { success: true, message: 'Check your email for the confirmation link!' };
    } catch (error) {
      console.error('Sign up error:', error);
      return { success: false, message: error.message };
    }
  }

  async function signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, message: error.message };
    }
  }

  async function signInWithGoogle() {
    try {
      // Utiliser le nouveau système Google
      await unifiedAuth.loginWithGoogle();
      return { success: true };
    } catch (error) {
      console.error('Google sign in error:', error);
      return { success: false, message: error.message };
    }
  }

  async function signOut() {
    try {
      // Utiliser le nouveau système de déconnexion
      await unifiedAuth.logout();
      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      return { success: false, message: error.message };
    }
  }

  async function updateProfile(updates) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      // Update local user state
      setUser(prev => ({
        ...prev,
        user_metadata: {
          ...prev.user_metadata,
          ...updates
        }
      }));

      return { success: true };
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, message: error.message };
    }
  }

  async function getProfile() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      return { success: true, profile: data };
    } catch (error) {
      console.error('Get profile error:', error);
      return { success: false, message: error.message };
    }
  }

  const value = {
    session,
    user,
    isLoading,
    isAdmin,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    updateProfile,
    getProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}