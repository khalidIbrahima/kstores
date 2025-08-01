import { createContext, useContext } from 'react';
import { useUnifiedAuth } from '../hooks/useUnifiedAuth';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  // Utiliser uniquement le nouveau système unifié
  const unifiedAuth = useUnifiedAuth();

  // Créer une interface compatible avec l'ancien AuthContext
  const user = unifiedAuth.user ? {
    id: unifiedAuth.user.id,
    email: unifiedAuth.user.email,
    user_metadata: {
      full_name: unifiedAuth.user.name,
      avatar_url: unifiedAuth.user.picture,
      is_admin: unifiedAuth.user.is_admin
    }
  } : null;

  const session = unifiedAuth.user ? { user: unifiedAuth.user } : null;
  const isAdmin = unifiedAuth.user?.is_admin || false;
  const isLoading = unifiedAuth.isLoading;





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

  async function signIn(email, password) {
    try {
      await unifiedAuth.signIn(email, password);
      return { success: true };
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, message: error.message };
    }
  }

  async function signUp(email, password, fullName) {
    try {
      await unifiedAuth.signUp(email, password, fullName);
      return { success: true };
    } catch (error) {
      console.error('Sign up error:', error);
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



  const value = {
    session,
    user,
    isLoading,
    isAdmin,
    signInWithGoogle,
    signIn,
    signUp,
    signOut
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