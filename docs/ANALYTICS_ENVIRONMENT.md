# Configuration des Analytics par Environnement

## Vue d'ensemble

Les compteurs de vues de pages et de produits sont maintenant configurés pour ne fonctionner **qu'en environnement de production** afin d'éviter de polluer les données d'analytics pendant le développement.

## Fonctionnement

### Environnements détectés

**Production :**
- `NODE_ENV === 'production'`
- `VITE_NODE_ENV === 'production'`
- Domaines configurés : `kstores.netlify.app`, `kstores.com`

**Développement :**
- `localhost`, `127.0.0.1`
- Ports `3000`, `3001`, `3002`
- Tout environnement non-production

### Fonctionnalités affectées

**En PRODUCTION ✅ :**
- ✅ Comptage des vues de produits
- ✅ Comptage des visites de pages
- ✅ Tracking analytics complet
- ✅ Statistiques en temps réel

**En DÉVELOPPEMENT 🚫 :**
- 🚫 Aucun tracking d'analytics
- 🚫 Pas d'insertion en base de données
- 🚫 Compteurs à zéro
- ✅ Messages de debug dans la console

## Fichiers modifiés

### 1. `src/utils/environment.js` (NOUVEAU)
Utilitaires pour détecter l'environnement :
- `isProduction()` - Vérifie si en production
- `isDevelopment()` - Vérifie si en développement  
- `getEnvironment()` - Retourne l'environnement actuel
- `devLog()` - Logs conditionnels pour le développement

### 2. `src/services/analyticsService.js`
- ✅ `trackProductView()` - Désactivé en développement
- ✅ `trackPageVisit()` - Désactivé en développement
- ✅ Messages de debug ajoutés

### 3. `src/hooks/useAnalytics.js`
- ✅ `usePageAnalytics()` - Désactivé en développement
- ✅ `useProductAnalytics()` - Désactivé en développement
- ✅ `useProductStats()` - Retourne 0 en développement

### 4. `src/components/AnalyticsTracker.jsx`
- ✅ Tracker global désactivé en développement

### 5. `src/utils/environmentTest.js` (NOUVEAU)
Fichier de test qui affiche l'état de l'environnement dans la console en développement.

## Configuration personnalisée

### Ajouter des domaines de production

Éditer `src/utils/environment.js` :

\`\`\`javascript
const productionDomains = [
  'kstores.netlify.app',
  'kstores.com',
  'mon-domaine-prod.com' // Ajouter ici
];
\`\`\`

### Forcer le mode production en développement

Créer un fichier `.env.local` :

\`\`\`
VITE_NODE_ENV=production
\`\`\`

## Vérification

### Console de développement

En mode développement, vous verrez des messages comme :
\`\`\`
[DEV] [ANALYTICS] Product view tracking skipped (dev mode): 123
[DEV] [ANALYTICS] Page visit tracking skipped (dev mode): /products
\`\`\`

### Test d'environnement

Le fichier `environmentTest.js` affiche automatiquement l'état dans la console :
\`\`\`
=== TEST DES UTILITAIRES D'ENVIRONNEMENT ===
Environment actuel: development
Est en production: false
Est en développement: true
✅ Analytics activés (Production) / 🚫 Analytics désactivés (Développement)
=== FIN DU TEST ===
\`\`\`

## Avantages

1. **🧹 Données propres** : Pas de pollution des analytics en développement
2. **⚡ Performance** : Pas d'appels API inutiles en développement  
3. **🔧 Debug facile** : Messages clairs dans la console
4. **🎯 Production uniquement** : Analytics précis pour les vrais utilisateurs
5. **🔄 Rétrocompatible** : Aucun changement pour l'utilisateur final

## Notes importantes

- Les statistics d'admin continuent de fonctionner en tous environnements
- Les données existantes ne sont pas affectées
- Le changement est transparent pour les utilisateurs finaux
- Les tests peuvent toujours être effectués en forçant le mode production
