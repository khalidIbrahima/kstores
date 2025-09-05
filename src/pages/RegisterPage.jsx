import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import GoogleLoginButton from '../components/GoogleLoginButton';

const RegisterPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { signUp, signInWithGoogle, user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Rediriger les utilisateurs connectés
  useEffect(() => {
    if (!authLoading && user) {
      // Si l'utilisateur est connecté, le rediriger
      if (user.user_metadata?.is_admin || user.is_admin) {
        navigate('/admin', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    if (!email || !password || !confirmPassword || !fullName) {
      setError(t('auth.errorEmptyFields'));
      return;
    }
    
    if (password !== confirmPassword) {
      setError(t('auth.passwordsDoNotMatch'));
      return;
    }
    
    if (password.length < 6) {
      setError(t('auth.passwordTooShort'));
      return;
    }
    
    try {
      setIsLoading(true);
      const result = await signUp(email, password, fullName);
      
      if (!result.success) {
        setError(result.message);
      }
    } catch (error) {
      setError(error.message || t('auth.registrationError'));
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
    <div className="flex min-h-[calc(100vh-80px)] items-center justify-center bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:py-12 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md space-y-6 sm:space-y-8 rounded-lg bg-white dark:bg-gray-800 p-6 sm:p-8 shadow-lg border border-gray-200 dark:border-gray-700"
      >
        <div className="text-center">
          <h2 className="mt-6 text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-gray-100">{t('auth.createAccount')}</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {t('auth.alreadyHaveAccount')}{' '}
            <Link to="/login" className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300">
              {t('auth.login')}
            </Link>
          </p>
        </div>
        


        {error && (
          <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-800">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400 dark:text-red-300" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">{error}</h3>
              </div>
            </div>
          </div>
        )}

        <GoogleLoginButton />

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-600" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white dark:bg-gray-800 px-2 text-gray-500 dark:text-gray-400">{t('auth.orContinueWith')}</span>
          </div>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="fullName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('auth.fullName')}
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="block w-full rounded-md border border-gray-300 dark:border-gray-600 py-3 pl-10 pr-3 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-blue-500 text-base"
                  placeholder={t('auth.fullName')}
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
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
                  className="block w-full rounded-md border border-gray-300 dark:border-gray-600 py-3 pl-10 pr-3 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-blue-500 text-base"
                  placeholder={t('auth.email')}
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
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
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-md border border-gray-300 dark:border-gray-600 py-3 pl-10 pr-3 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-blue-500 text-base"
                  placeholder={t('auth.password')}
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('auth.confirmPassword')}
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full rounded-md border border-gray-300 dark:border-gray-600 py-3 pl-10 pr-3 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-blue-500 text-base"
                  placeholder={t('auth.confirmPassword')}
                />
              </div>
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
                t('auth.createAccount')
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default RegisterPage;