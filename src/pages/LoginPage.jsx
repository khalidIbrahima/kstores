import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useStoreSettings } from '../hooks/useStoreSettings';
import { supabase } from '../lib/supabase';
import GoogleLoginButton from '../components/GoogleLoginButton';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { signIn, signInWithGoogle, isAdmin, user, isLoading: authLoading } = useAuth();
  const { settings } = useStoreSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  
  const from = location.state?.from?.pathname || '/';

  // Rediriger les utilisateurs connectés
  useEffect(() => {
    if (!authLoading && user) {
      // Si l'utilisateur est connecté, le rediriger
      if (isAdmin) {
        navigate('/admin', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    }
  }, [user, authLoading, isAdmin, navigate, from]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    if (!email || !password) {
      setError(t('auth.errorEmptyFields'));
      return;
    }
    
    try {
      setIsLoading(true);
      await signIn(email, password);
      
      // Check if user is admin and redirect accordingly
      const { data: { user } } = await supabase.auth.getUser();
      const isUserAdmin = user?.user_metadata?.is_admin || false;
      
      if (isUserAdmin) {
        // Redirect admin users to admin panel
        navigate('/admin', { replace: true });
      } else {
        // Redirect regular users to their intended destination
        navigate(from, { replace: true });
      }
    } catch (error) {
      setError(error.message || t('auth.loginError'));
    } finally {
      setIsLoading(false);
    }
  };

  // Afficher un loader pendant la vérification de l'authentification
  if (authLoading) {
    return (
      <div className="flex min-h-[calc(100vh-80px)] items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  // Si l'utilisateur est connecté, ne pas afficher la page
  if (user) {
    return null;
  }

  return (
    <div className="flex min-h-[calc(100vh-80px)] items-center justify-center bg-gray-50 py-8 px-4 sm:py-12 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md space-y-6 sm:space-y-8 rounded-lg bg-white p-6 sm:p-8 shadow-lg"
      >
        <div className="text-center">
          {settings?.logo_url ? (
            <div className="flex justify-center mb-6">
              <img 
                src={settings.logo_url} 
                alt="Store Logo" 
                className="h-20 w-auto max-w-64 object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          ) : null}
          <h2 className="mt-6 text-2xl sm:text-3xl font-extrabold text-gray-900">
            {t('auth.login')}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {t('auth.noAccount')}{' '}
            <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
              {t('auth.register')}
            </Link>
          </p>
        </div>
        
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            </div>
          </div>
        )}

        <GoogleLoginButton />

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-gray-500">{t('auth.orContinueWith')}</span>
          </div>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="text-sm font-medium text-gray-700">
                {t('auth.email')}
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-md border border-gray-300 py-3 pl-10 pr-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500 text-base"
                  placeholder={t('auth.email')}
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                {t('auth.password')}
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-md border border-gray-300 py-3 pl-10 pr-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500 text-base"
                  placeholder={t('auth.password')}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                {t('auth.rememberMe')}
              </label>
            </div>

            <div className="text-sm">
              <Link to="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                {t('auth.forgotPassword')}
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative flex w-full justify-center rounded-full bg-primary px-6 py-3 text-base font-semibold text-white hover:bg-accent focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {isLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-white"></div>
              ) : (
                t('auth.login')
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default LoginPage;