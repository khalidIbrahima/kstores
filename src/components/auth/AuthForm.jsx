import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';



const AuthForm = ({
  title,
  subtitle,
  error,
  isLoading,
  onSubmit,
  children,
  submitLabel,
}) => {
  return (
    <div className="flex min-h-[calc(100vh-80px)] items-center justify-center bg-background-light py-12 px-4 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md space-y-8 rounded-lg bg-background p-8 shadow-lg"
      >
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-text-dark">{title}</h2>
          <p className="mt-2 text-sm text-text-light">
            {subtitle}
          </p>
        </div>
        
        {error && (
          <div className="rounded-md bg-accent-light p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-accent" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-accent">{error}</h3>
              </div>
            </div>
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={onSubmit}>
          <div className="space-y-4">
            {children}
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full"
            >
              {isLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-white"></div>
              ) : (
                submitLabel
              )}
            </button>
          </div>
        </form>
        {/* <div className="mt-4">
          <button
            type="button"
            className="btn-secondary w-full flex items-center justify-center gap-2"
            onClick={async () => {
              const redirectTo = import.meta.env.VITE_GOOGLE_REDIRECT_URL || window.location.origin;
              await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo }
              });
            }}
          >
            <img src="/google-icon.svg" alt="Google" className="h-5 w-5" />
            Se connecter avec Google
          </button>
        </div> */}
      </motion.div>
    </div>
  );
};

export default AuthForm;