import { useState, useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export const useUnifiedAuth = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authType, setAuthType] = useState(null); // 'supabase' | 'google'

     // Vérifier l'état d'authentification au chargement (une seule fois)
   useEffect(() => {
     let mounted = true;
     
     const checkAuth = async () => {
       try {
         // Vérifier d'abord la session Supabase (email/password)
         const { data: { session }, error: sessionError } = await supabase.auth.getSession();
         
         if (session && mounted) {
           console.log('✅ Session Supabase trouvée pour:', session.user.email);
           const { data: profile, error: profileError } = await supabase
             .from('profiles')
             .select('*')
             .eq('id', session.user.id)
             .single();
             
           if (profile && mounted) {
             setUser({
               id: profile.id,
               name: profile.full_name,
               email: profile.email,
               picture: profile.avatar_url,
               is_admin: profile.is_admin || false
             });
             setAuthType('supabase');
             setIsLoading(false);
             return;
           }
         }
         
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

             if (userInfoResponse.ok && mounted) {
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

               if (profile && mounted) {
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
               } else {
                 console.log('❌ Aucun profil trouvé avec google_id:', userInfo.id);
               }
             } else if (userInfoResponse.status === 401) {
               // Token expiré ou invalide
               localStorage.removeItem('google_token');
             } else if (!userInfoResponse.ok) {
               // Autre erreur HTTP
               console.error('Error checking Google token:', userInfoResponse.status, userInfoResponse.statusText);
               localStorage.removeItem('google_token');
             }
           } catch (error) {
             console.error('Error checking Google token:', error);
             localStorage.removeItem('google_token');
           }
         }

         // Aucune authentification trouvée
         if (mounted) {
           setUser(null);
           setAuthType(null);
           setIsLoading(false);
         }
       } catch (error) {
         console.error('Error checking auth:', error);
         if (mounted) {
           setUser(null);
           setAuthType(null);
           setIsLoading(false);
         }
       }
     };

     checkAuth();
     
     return () => {
       mounted = false;
     };
   }, []);

  

  // Fonction de connexion Google
  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (response) => {
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

     // Fonction de connexion par email/mot de passe
     const signIn = async (email, password) => {
       try {
         setIsLoading(true);
         
         const { data, error } = await supabase.auth.signInWithPassword({
           email,
           password
         });
         
         if (error) {
           throw error;
         }
         
         if (data.user) {
           // Récupérer le profil utilisateur
           const { data: profile, error: profileError } = await supabase
             .from('profiles')
             .select('*')
             .eq('id', data.user.id)
             .single();
             
           if (profile) {
             setUser({
               id: profile.id,
               name: profile.full_name,
               email: profile.email,
               picture: profile.avatar_url,
               is_admin: profile.is_admin || false
             });
             setAuthType('supabase');
             toast.success('Connexion réussie !');
           }
         }
         
         return { success: true };
       } catch (error) {
         console.error('Sign in error:', error);
         toast.error(error.message || 'Erreur lors de la connexion');
         throw error;
       } finally {
         setIsLoading(false);
       }
     };
     
     // Fonction d'inscription par email/mot de passe
     const signUp = async (email, password, fullName) => {
       try {
         setIsLoading(true);
         
         const { data, error } = await supabase.auth.signUp({
           email,
           password,
           options: {
             data: {
               full_name: fullName
             }
           }
         });
         
         if (error) {
           throw error;
         }
         
         if (data.user) {
           // Créer le profil utilisateur
           const { error: profileError } = await supabase
             .from('profiles')
             .insert({
               id: data.user.id,
               full_name: fullName,
               email: email,
               is_admin: false
             });
             
           if (profileError) {
             console.error('Error creating profile:', profileError);
           }
           
           toast.success('Inscription réussie ! Vérifiez votre email pour confirmer votre compte.');
         }
         
         return { success: true };
       } catch (error) {
         console.error('Sign up error:', error);
         toast.error(error.message || 'Erreur lors de l\'inscription');
         throw error;
       } finally {
         setIsLoading(false);
       }
     };
     
     // Fonction de déconnexion unifiée
     const logout = async () => {
       try {
         setIsLoading(true);
         
         // Déconnecter de Supabase si connecté par email
         if (authType === 'supabase') {
           await supabase.auth.signOut();
         }
         
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
    signIn,
    signUp,
    logout
  };
}; 