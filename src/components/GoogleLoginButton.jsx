import { useUnifiedAuth } from '../hooks/useUnifiedAuth';

const GoogleLoginButton = ({ className = '', children, variant = 'default', onSuccess }) => {
  const { loginWithGoogle, isLoading } = useUnifiedAuth();
  
  // Vérifier si le Client ID Google est configuré
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const isGoogleConfigured = googleClientId && 
    googleClientId !== 'your-google-client-id-here' && 
    googleClientId !== 'placeholder' &&
    googleClientId.includes('.apps.googleusercontent.com');

  // Classes responsives selon la variante
  const getButtonClasses = () => {
    const baseClasses = "flex items-center justify-center space-x-2 sm:space-x-3 rounded-md border border-gray-300 bg-white shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200";
    
    if (variant === 'compact') {
      return `${baseClasses} px-3 py-2 text-xs font-medium text-gray-700 w-full max-w-xs sm:max-w-sm`;
    }
    
    if (variant === 'small') {
      return `${baseClasses} px-2 py-1.5 text-xs font-medium text-gray-700 w-auto`;
    }
    
    if (variant === 'full') {
      return `${baseClasses} px-4 py-3 text-sm font-medium text-gray-700 w-full`;
    }
    
    // default variant
    return `${baseClasses} px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm font-medium text-gray-700 w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl`;
  };

  const getIconClasses = () => {
    if (variant === 'small') {
      return "h-3 w-3";
    }
    if (variant === 'full') {
      return "h-5 w-5";
    }
    return "h-4 w-4 sm:h-5 sm:w-5";
  };

  const getTextClasses = () => {
    if (variant === 'small') {
      return "text-xs";
    }
    if (variant === 'compact') {
      return "text-xs sm:text-sm";
    }
    if (variant === 'full') {
      return "text-sm";
    }
    return "text-xs sm:text-sm md:text-base";
  };

  if (!isGoogleConfigured) {
    return (
      <div className="flex justify-center w-full">
        <button
          disabled
          className={`${getButtonClasses()} bg-gray-100 text-gray-500 cursor-not-allowed ${className}`}
          title="Google OAuth non configuré. Vérifiez le fichier .env et Google Cloud Console."
        >
          <svg className={getIconClasses()} viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span className={getTextClasses()}>Google OAuth non configuré</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex justify-center w-full">
      <button
        onClick={async () => {
          try {
            await loginWithGoogle();
            if (onSuccess) {
              onSuccess();
            }
          } catch (error) {
            console.error('Google login error:', error);
          }
        }}
        disabled={isLoading}
        className={`${getButtonClasses()} ${className}`}
      >
        {isLoading ? (
          <div className={`animate-spin rounded-full border-b-2 border-blue-600 ${variant === 'small' ? 'h-3 w-3' : 'h-3 w-3 sm:h-4 sm:w-4'}`}></div>
        ) : (
          <svg className={getIconClasses()} viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
        )}
        <span className={getTextClasses()}>
          {children || (isLoading ? 'Connexion...' : 'Continuer avec Google')}
        </span>
      </button>
    </div>
  );
};

export default GoogleLoginButton; 