import { useState, useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export const useUnifiedAuth = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authType, setAuthType] = useState(null); // 'supabase' | 'google'

     // Vérifier l'état d'authentification au chargement
   useEffect(() => {
     const checkAuth = async () => {
       try {
         // Vérifier le token Google
         const token = localStorage.getItem('google_token');
         if (token) {
           try {
             // Vérifier si le token est valide en appelant l'API Google
             const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
               headers: {
                 Authorization: `Bearer ${token}`,
               },
             });

             if (userInfoResponse.ok) {
               const userInfo = await userInfoResponse.json();
               
               // Récupérer le profil depuis Supabase
               const { data: profile, error: profileError } = await supabase
                 .from('profiles')
                 .select('*')
                 .eq('google_id', userInfo.id)
                 .single();

               if (profileError && profileError.code !== 'PGRST116') {
                 console.error('Error fetching profile:', profileError);
               }

               if (profile) {
                 setUser({
                   id: profile.id, // UUID Supabase
                   name: profile.full_name,
                   email: profile.email,
                   picture: profile.avatar_url,
                   is_admin: profile.is_admin || false
                 });
                 setAuthType('google');
                 setIsLoading(false);
                 return;
               }
             } else if (userInfoResponse.status === 401) {
               localStorage.removeItem('google_token');
             } else {
               // Autre erreur, supprimer le token
               console.error('Error checking Google token:', userInfoResponse.status, userInfoResponse.statusText);
               localStorage.removeItem('google_token');
             }
           } catch (error) {
             console.error('Error checking Google token:', error);
             localStorage.removeItem('google_token');
           }
         }

         // Aucune authentification trouvée
         setUser(null);
         setAuthType(null);
         setIsLoading(false);
       } catch (error) {
         console.error('Error checking auth:', error);
         setUser(null);
         setAuthType(null);
         setIsLoading(false);
       }
     };

     checkAuth();
   }, []);

  

  // Fonction de connexion Google
  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (response) => {
      console.log('✅ Google login success:', response);
      setIsLoading(true);
      try {
        // Utiliser l'API Google pour obtenir les informations utilisateur
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: {
            Authorization: `Bearer ${response.access_token}`,
          },
        });

        if (!userInfoResponse.ok) {
          if (userInfoResponse.status === 401) {
            throw new Error('Google access token is invalid or expired. Please try logging in again.');
          } else {
            throw new Error(`Failed to fetch user info from Google: ${userInfoResponse.status} ${userInfoResponse.statusText}`);
          }
        }

        const userInfo = await userInfoResponse.json();        
        // Sauvegarder le token
        localStorage.setItem('google_token', response.access_token);
        
        // Vérifier si un profil existe déjà avec cet ID Google
        const { data: existingProfile, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('google_id', userInfo.id)
          .single();

        let profileData;
        
        if (existingProfile) {
          // Mettre à jour le profil existant
          const { data: updatedProfile, error: updateError } = await supabase
            .from('profiles')
            .update({
              full_name: userInfo.name,
              email: userInfo.email,
              avatar_url: userInfo.picture,
              updated_at: new Date().toISOString()
            })
            .eq('google_id', userInfo.id)
            .select()
            .single();

          if (updateError) {
            console.error('❌ Error updating profile:', updateError);
          } else {
            profileData = updatedProfile;
          }
                 } else {
           // Aucun profil trouvé avec google_id, créer un nouveau profil           
           // Générer un UUID unique pour le profil
           const profileUUID = crypto.randomUUID();
           
           // Créer le profil directement sans créer d'utilisateur Supabase Auth
           const { data: newProfile, error: insertError } = await supabase
             .from('profiles')
             .insert({
               id: profileUUID,
               google_id: userInfo.id,
               full_name: userInfo.name,
               email: userInfo.email,
               avatar_url: userInfo.picture,
               is_admin: false,
               updated_at: new Date().toISOString()
             })
             .select()
             .single();

           if (insertError) {
             console.error('❌ Error creating profile:', insertError);
             throw new Error('Failed to create profile');
           } else {
             profileData = newProfile;
           }
         }

        if (!profileData) {
          throw new Error('Failed to create or update profile');
        }

        const userData = {
          id: profileData.id, // UUID Supabase
          name: profileData.full_name,
          email: profileData.email,
          picture: profileData.avatar_url,
          is_admin: profileData.is_admin || false
        };
        
        setUser(userData);
        setAuthType('google');

        toast.success('Connexion réussie !');
        
        if (userData.is_admin) {
          window.location.href = '/admin';
        } else {
          window.location.href = '/';
        }

      } catch (error) {
        console.error('❌ Google login error:', error);
        toast.error('Erreur lors de la connexion Google');
      } finally {
        setIsLoading(false);
      }
    },
    onError: (error) => {
      console.error('❌ Google login error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        type: error.type,
        code: error.code
      });
      toast.error('Erreur lors de la connexion Google');
      setIsLoading(false);
    }
  });

     // Fonction de déconnexion unifiée
   const logout = async () => {
     try {
       setIsLoading(true);
       
       // Nettoyer le token Google
       localStorage.removeItem('google_token');
       
       // Réinitialiser l'état
       setUser(null);
       setAuthType(null);
       
       toast.success('Déconnexion réussie');
       window.location.href = '/';
     } catch (error) {
       console.error('Logout error:', error);
       // Nettoyer quand même l'état local
       localStorage.removeItem('google_token');
       setUser(null);
       setAuthType(null);
       toast.success('Déconnexion réussie');
       window.location.href = '/';
     } finally {
       setIsLoading(false);
     }
   };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    authType,
    loginWithGoogle,
    logout
  };
}; 