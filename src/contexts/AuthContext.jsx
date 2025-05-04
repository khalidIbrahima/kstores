import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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
      toast.success('Account created successfully!');
    } catch (error) {
      toast.error(error.message || 'An error occurred during sign up');
      throw error;
    }
  }

  async function signIn(email, password) {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      toast.success('Signed in successfully!');
    } catch (error) {
      toast.error(error.message || 'An error occurred during sign in');
      throw error;
    }
  }

  async function signOut() {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      
      // If we get a session_not_found error, just clear the local state
      if (error?.message?.includes('session_not_found') || 
          error?.message?.includes('refresh_token_not_found')) {
        setSession(null);
        setUser(null);
        toast.success('Signed out successfully');
        return;
      }
      
      if (error) throw error;
      
      setSession(null);
      setUser(null);
      toast.success('Signed out successfully');
    } catch (error) {
      // Clear local state even if there's an error
      setSession(null);
      setUser(null);
      toast.error(error.message || 'An error occurred during sign out');
    } finally {
      setIsLoading(false);
    }
  }

  const value = {
    session,
    user,
    isAdmin: user?.user_metadata?.is_admin || false,
    isLoading,
    signUp,
    signIn,
    signOut
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}