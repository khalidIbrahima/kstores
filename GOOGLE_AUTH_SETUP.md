# Configuration de l'Authentification Google avec Supabase

## Vue d'ensemble

Ce guide vous explique comment configurer l'authentification Google pour votre application KStores avec Supabase.

## Prérequis

1. Un projet Supabase configuré
2. Un projet Google Cloud Platform avec l'API Google+ activée
3. Les identifiants OAuth 2.0 de Google

## Configuration Google Cloud Platform

### 1. Créer un projet Google Cloud

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet ou sélectionnez un projet existant
3. Activez l'API Google+ API

### 2. Configurer les identifiants OAuth 2.0

1. Dans la console Google Cloud, allez dans **APIs & Services** > **Credentials**
2. Cliquez sur **Create Credentials** > **OAuth 2.0 Client IDs**
3. Configurez l'écran de consentement OAuth si nécessaire
4. Sélectionnez **Web application** comme type d'application
5. Ajoutez les URIs de redirection autorisés :

```
https://your-project-ref.supabase.co/auth/v1/callback
http://localhost:3000/auth/callback
```

6. Notez votre **Client ID** et **Client Secret**

## Configuration Supabase

### 1. Activer l'authentification Google

1. Allez dans votre dashboard Supabase
2. Naviguez vers **Authentication** > **Providers**
3. Trouvez **Google** et activez-le
4. Entrez vos identifiants Google :
   - **Client ID** : Votre Google Client ID
   - **Client Secret** : Votre Google Client Secret

### 2. Configurer les URLs de redirection

Dans Supabase, ajoutez ces URLs de redirection :

```
http://localhost:3000/auth/callback
https://your-domain.com/auth/callback
```

## Variables d'Environnement

Ajoutez ces variables dans votre fichier `.env` :

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Google OAuth (optionnel, pour référence)
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

## Test de l'Authentification

### 1. Test Local

1. Démarrez votre application : `npm run dev`
2. Allez sur `http://localhost:3000/login`
3. Cliquez sur "Continuer avec Google"
4. Vous devriez être redirigé vers Google pour l'authentification
5. Après authentification, vous serez redirigé vers votre application

### 2. Test en Production

1. Déployez votre application
2. Testez l'authentification avec votre domaine de production
3. Vérifiez que les redirections fonctionnent correctement

## Gestion des Erreurs

### Erreurs Courantes

1. **"redirect_uri_mismatch"**
   - Vérifiez que l'URI de redirection dans Google Cloud correspond à celle de Supabase

2. **"invalid_client"**
   - Vérifiez que votre Client ID et Client Secret sont corrects

3. **"access_denied"**
   - L'utilisateur a annulé l'authentification

### Debug

Activez les logs de débogage dans votre application :

```javascript
// Dans votre composant d'authentification
const handleGoogleSignIn = async () => {
  try {
    console.log('🔄 Starting Google authentication...');
    await signInWithGoogle();
    console.log('✅ Google authentication initiated');
  } catch (error) {
    console.error('❌ Google authentication error:', error);
    setError(error.message);
  }
};
```

## Sécurité

### Bonnes Pratiques

1. **Ne jamais exposer les secrets** dans le code client
2. **Utiliser HTTPS** en production
3. **Valider les tokens** côté serveur
4. **Limiter les scopes** OAuth au minimum nécessaire

### Configuration RLS

Assurez-vous que vos politiques RLS sont configurées correctement :

```sql
-- Exemple de politique pour les profils utilisateurs
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

## Fonctionnalités Avancées

### 1. Gestion des Rôles

L'authentification Google peut être utilisée avec des rôles personnalisés :

```javascript
// Dans AuthCallback.jsx
const isUserAdmin = session.user?.user_metadata?.is_admin || false;

// Créer un profil avec rôle
await supabase.from('profiles').upsert({
  id: session.user.id,
  full_name: session.user.user_metadata?.full_name,
  is_admin: isUserAdmin,
  avatar_url: session.user.user_metadata?.avatar_url
});
```

### 2. Intégration avec d'autres Services

L'authentification Google peut être combinée avec :
- Notifications WhatsApp
- Emails automatiques
- Analytics personnalisés

## Support

Si vous rencontrez des problèmes :

1. Vérifiez les logs de Supabase
2. Consultez la documentation Google OAuth
3. Testez avec l'outil de débogage OAuth de Google

## Ressources

- [Documentation Supabase Auth](https://supabase.com/docs/guides/auth)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers) 