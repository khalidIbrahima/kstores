import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const AuthCallback = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        setIsLoading(true);
        
        // Get the current session after OAuth redirect
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          setError('Authentication failed. Please try again.');
          setTimeout(() => {
            navigate('/login', { replace: true });
          }, 3000);
          return;
        }

        if (!session) {
          setError('No session found. Please try logging in again.');
          setTimeout(() => {
            navigate('/login', { replace: true });
          }, 3000);
          return;
        }

        // Check if user is admin
        const isUserAdmin = session.user?.user_metadata?.is_admin || false;
        
<<<<<<< HEAD
        // Create or update user profile
        try {
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: session.user.id,
              full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'User',
              avatar_url: session.user.user_metadata?.avatar_url,
              is_admin: isUserAdmin,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'id'
            });

          if (profileError) {
            console.error('Profile creation error:', profileError);
          }
        } catch (profileError) {
          console.error('Profile creation error:', profileError);
        }
        
=======
>>>>>>> 5450a43 (Merge branch 'main' of https://github.com/khalidIbrahima/kstores)
        // Redirect based on user role
        if (isUserAdmin) {
          // Redirect admin users to admin panel
          navigate('/admin', { replace: true });
        } else {
          // Redirect regular users to home page
          navigate('/', { replace: true });
        }
        
      } catch (error) {
        console.error('Auth callback error:', error);
        setError('An error occurred during authentication. Please try again.');
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 3000);
      } finally {
        setIsLoading(false);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
          <p className="text-gray-600">Completing authentication...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">Redirecting to login page...</p>
        </div>
      </div>
    );
  }

  return null;
};

export default AuthCallback; 