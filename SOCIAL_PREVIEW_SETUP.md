# Configuration des Prévisualisations Sociales - KStores

Ce document explique comment configurer et utiliser les prévisualisations d'images pour les liens partagés sur les réseaux sociaux.

## 🎯 Fonctionnalités

### Prévisualisations d'Images Dynamiques
- **Open Graph** : Prévisualisations optimisées pour Facebook, LinkedIn, WhatsApp
- **Twitter Cards** : Prévisualisations pour Twitter
- **Données structurées** : Rich snippets pour Google
- **Images automatiques** : Génération automatique selon le type de page

## 📱 Composants Disponibles

### 1. DynamicSocialMetaTags

Composant principal pour générer automatiquement les métadonnées sociales.

```jsx
import DynamicSocialMetaTags from '../components/DynamicSocialMetaTags';

// Page d'accueil
<DynamicSocialMetaTags pageType="home" />

// Page de produit
<DynamicSocialMetaTags 
  pageType="product"
  product={product}
  category={category}
/>

// Page de catégorie
<DynamicSocialMetaTags 
  pageType="category"
  category={category}
/>

// Page de produits
<DynamicSocialMetaTags 
  pageType="products"
  title="Tous nos produits"
  description="Découvrez notre catalogue"
/>
```

### 2. EnhancedShareButtons

Boutons de partage avancés avec plusieurs variantes.

```jsx
import EnhancedShareButtons from '../components/EnhancedShareButtons';

// Version par défaut
<EnhancedShareButtons 
  title="Titre du produit"
  description="Description du produit"
  image="/path/to/image.jpg"
  url="https://kstores.com/product/123"
/>

// Version compacte
<EnhancedShareButtons 
  variant="compact"
  title="Titre"
  description="Description"
/>

// Bouton flottant
<EnhancedShareButtons 
  variant="floating"
  title="Titre"
  description="Description"
/>
```

## 🔧 Configuration

### Types de Pages Supportés

1. **home** : Page d'accueil
   - Image : Logo du site
   - Titre : "KStores - Boutique en ligne"
   - Description : Description générale du site

2. **product** : Page de produit individuel
   - Image : Image du produit
   - Titre : Nom du produit + KStores
   - Description : Description du produit
   - Prix et disponibilité inclus

3. **category** : Page de catégorie
   - Image : Image de la catégorie ou logo par défaut
   - Titre : Nom de la catégorie + KStores
   - Description : Description de la catégorie

4. **products** : Page de tous les produits
   - Image : Logo du site
   - Titre : "Tous nos produits - KStores"
   - Description : Description du catalogue

### Métadonnées Générées

#### Open Graph (Facebook, LinkedIn, WhatsApp)
```html
<meta property="og:title" content="Titre de la page" />
<meta property="og:description" content="Description de la page" />
<meta property="og:image" content="URL de l'image" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="Description de l'image" />
<meta property="og:url" content="URL de la page" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="KStores" />
<meta property="og:locale" content="fr_FR" />
```

#### Twitter Cards
```html
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Titre de la page" />
<meta name="twitter:description" content="Description de la page" />
<meta name="twitter:image" content="URL de l'image" />
<meta name="twitter:image:alt" content="Description de l'image" />
<meta name="twitter:site" content="@kstores" />
<meta name="twitter:creator" content="@kstores" />
```

#### Données Structurées (Schema.org)
```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Nom du produit",
  "description": "Description du produit",
  "image": "URL de l'image",
  "offers": {
    "@type": "Offer",
    "price": "10000",
    "priceCurrency": "XOF",
    "availability": "https://schema.org/InStock"
  }
}
```

## 🎨 Personnalisation

### Images de Prévisualisation

#### Dimensions Recommandées
- **Large Image** : 1200x630px (ratio 1.91:1)
- **Square Image** : 1200x1200px (ratio 1:1)
- **Format** : JPG ou PNG
- **Taille** : < 8MB

#### Configuration des Images
```jsx
// Dans socialConfig.js
export const socialConfig = {
  defaultImage: '/src/assets/logo-transparent.png',
  defaultImageWidth: 1200,
  defaultImageHeight: 630,
  // ...
};
```

### Personnalisation des Métadonnées

```jsx
<DynamicSocialMetaTags 
  pageType="product"
  product={product}
  title="Titre personnalisé"
  description="Description personnalisée"
  image="/path/to/custom/image.jpg"
  keywords="mots, clés, personnalisés"
  structuredData={{
    "@type": "Product",
    "name": "Nom personnalisé",
    // ... autres données
  }}
/>
```

## 📊 Plateformes Supportées

### Boutons de Partage
- ✅ Facebook
- ✅ Twitter
- ✅ WhatsApp
- ✅ Telegram
- ✅ Email
- ✅ LinkedIn
- ✅ Pinterest
- ✅ Reddit
- ✅ Copier le lien

### Prévisualisations
- ✅ Facebook
- ✅ Twitter
- ✅ LinkedIn
- ✅ WhatsApp
- ✅ Telegram
- ✅ Discord
- ✅ Slack

## 🧪 Test et Validation

### Outils de Test

1. **Facebook Sharing Debugger**
   - URL : https://developers.facebook.com/tools/debug/
   - Teste les métadonnées Open Graph

2. **Twitter Card Validator**
   - URL : https://cards-dev.twitter.com/validator
   - Teste les Twitter Cards

3. **LinkedIn Post Inspector**
   - URL : https://www.linkedin.com/post-inspector/
   - Teste les prévisualisations LinkedIn

4. **Google Rich Results Test**
   - URL : https://search.google.com/test/rich-results
   - Teste les données structurées

### Validation des Métadonnées

```bash
# Vérifier les métadonnées Open Graph
curl -I https://kstores.com/product/123

# Tester avec un outil en ligne
# Utiliser les outils mentionnés ci-dessus
```

## 🚀 Optimisation

### Bonnes Pratiques

1. **Images**
   - Utilisez des images de haute qualité
   - Respectez les dimensions recommandées
   - Optimisez la taille des fichiers
   - Ajoutez des attributs alt

2. **Titres**
   - Gardez-les courts (50-60 caractères)
   - Incluez des mots-clés pertinents
   - Évitez les caractères spéciaux

3. **Descriptions**
   - Limitez à 160 caractères
   - Incluez un appel à l'action
   - Utilisez des mots-clés naturels

4. **URLs**
   - Utilisez des URLs canoniques
   - Évitez les paramètres inutiles
   - Assurez-vous qu'elles sont accessibles

### Performance

```jsx
// Chargement différé des images
const imageUrl = metaData.image.startsWith('http') 
  ? metaData.image 
  : `${window.location.origin}${metaData.image}`;

// Préchargement des images importantes
<link rel="preload" as="image" href={imageUrl} />
```

## 🔍 Dépannage

### Problèmes Courants

1. **Images non affichées**
   - Vérifiez que l'URL est accessible
   - Assurez-vous que l'image respecte les dimensions
   - Vérifiez les permissions CORS

2. **Métadonnées non mises à jour**
   - Videz le cache des réseaux sociaux
   - Utilisez les outils de debug
   - Vérifiez la syntaxe des balises

3. **Prévisualisations incorrectes**
   - Vérifiez les données structurées
   - Testez avec les outils de validation
   - Assurez-vous que les URLs sont canoniques

### Debug

```javascript
// Vérifier les métadonnées dans la console
console.log(document.querySelector('meta[property="og:title"]')?.content);
console.log(document.querySelector('meta[property="og:image"]')?.content);

// Tester les données structurées
const structuredData = document.querySelector('script[type="application/ld+json"]');
console.log(JSON.parse(structuredData?.textContent || '{}'));
```

## 📈 Analytics

### Suivi des Partages

```javascript
// Événements de partage
const trackShare = (platform, url) => {
  gtag('event', 'share', {
    method: platform,
    content_type: 'product',
    item_id: productId
  });
};

// Utilisation dans les boutons de partage
onClick={() => {
  trackShare('facebook', window.location.href);
  // Action de partage
}}
```

## 🔄 Mise à Jour

### Ajout de Nouvelles Plateformes

1. Ajouter dans `EnhancedShareButtons.jsx`
2. Mettre à jour `socialConfig.js`
3. Tester avec les outils de validation
4. Documenter les nouvelles fonctionnalités

### Maintenance

- Vérifier régulièrement les outils de test
- Mettre à jour les URLs des réseaux sociaux
- Optimiser les images selon les nouvelles recommandations
- Surveiller les performances de chargement

## 📞 Support

Pour toute question ou problème :
- Consultez les outils de validation mentionnés
- Vérifiez la console du navigateur pour les erreurs
- Testez avec différents réseaux sociaux
- Contactez l'équipe de développement 