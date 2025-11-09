# Intégration Réseaux Sociaux - KStores

Ce document explique comment utiliser les composants d'intégration sociale développés pour KStores.

## Composants Disponibles

### 1. SocialMetaTags

Composant pour gérer les métadonnées Open Graph et Twitter Card.

```jsx
import SocialMetaTags from '../components/SocialMetaTags';

<SocialMetaTags 
  title="Titre de la page"
  description="Description de la page"
  image="/path/to/image.jpg"
  url="https://kstores.com/page"
  keywords="mots, clés, séparés, par, des, virgules"
  structuredData={{
    "@context": "https://schema.org",
    "@type": "Product",
    // ... autres données structurées
  }}
/>
```

### 2. SocialShareButtons

Composant pour les boutons de partage social.

```jsx
import SocialShareButtons from '../components/SocialShareButtons';

<SocialShareButtons 
  title="Titre à partager"
  description="Description à partager"
  url="https://kstores.com/page"
  image="/path/to/image.jpg"
  showTitle={true}
  className="custom-class"
/>
```

### 3. SocialMediaSection

Composant pour afficher les liens vers les réseaux sociaux.

```jsx
import SocialMediaSection from '../components/SocialMediaSection';

// Version complète
<SocialMediaSection 
  showTitle={true}
  showDescription={true}
  variant="default"
/>

// Version compacte
<SocialMediaSection 
  variant="compact"
  className="mt-4"
/>

// Version footer
<SocialMediaSection 
  variant="footer"
/>
```

## Configuration

La configuration est centralisée dans `src/config/socialConfig.js` :

```javascript
export const socialConfig = {
  siteName: 'KStores',
  siteUrl: 'https://kstores.com',
  siteDescription: 'Description du site...',
  
  socialMedia: {
    facebook: { url: 'https://facebook.com/kstores' },
    twitter: { url: 'https://twitter.com/kstores' },
    // ...
  },
  
  contact: {
    email: 'contact@kstores.com',
    phone: '+1-555-123-4567',
    // ...
  }
};
```

## Utilisation dans les Pages

### Page de Produits

```jsx
import SocialMetaTags from '../components/SocialMetaTags';
import SocialShareButtons from '../components/SocialShareButtons';
import SocialMediaSection from '../components/SocialMediaSection';

const ProductsPage = () => {
  return (
    <div>
      <SocialMetaTags 
        title="Tous nos produits"
        description="Découvrez notre sélection de produits"
        structuredData={{
          "@type": "CollectionPage",
          "mainEntity": {
            "@type": "ItemList",
            "itemListElement": products.map(product => ({
              "@type": "Product",
              "name": product.name,
              // ...
            }))
          }
        }}
      />
      
      <SocialShareButtons 
        title="Tous nos produits - KStores"
        description="Découvrez notre sélection"
      />
      
      <SocialMediaSection variant="compact" />
    </div>
  );
};
```

### Page de Produit Individuel

```jsx
const ProductPage = ({ product }) => {
  return (
    <div>
      <SocialMetaTags 
        title={product.name}
        description={product.description}
        image={product.image_url}
        structuredData={{
          "@type": "Product",
          "name": product.name,
          "description": product.description,
          "image": product.image_url,
          "offers": {
            "@type": "Offer",
            "price": product.price,
            "priceCurrency": "XOF"
          }
        }}
      />
      
      <SocialShareButtons 
        title={product.name}
        description={product.description}
        image={product.image_url}
      />
    </div>
  );
};
```

## Métadonnées Supportées

### Open Graph (Facebook)
- `og:title` - Titre de la page
- `og:description` - Description
- `og:image` - Image de partage
- `og:url` - URL de la page
- `og:type` - Type de contenu
- `og:site_name` - Nom du site
- `og:locale` - Langue

### Twitter Card
- `twitter:card` - Type de carte
- `twitter:title` - Titre
- `twitter:description` - Description
- `twitter:image` - Image
- `twitter:site` - Compte Twitter du site
- `twitter:creator` - Compte Twitter du créateur

### Données Structurées (Schema.org)
- `Product` - Pour les produits
- `Organization` - Pour l'entreprise
- `WebSite` - Pour le site web
- `CollectionPage` - Pour les pages de collection

## Réseaux Sociaux Supportés

### Boutons de Partage
- Facebook
- Twitter
- WhatsApp
- Telegram
- Copier le lien

### Liens de Suivi
- Facebook
- Twitter
- Instagram
- YouTube

## Bonnes Pratiques

1. **Images** : Utilisez des images de 1200x630px pour un affichage optimal
2. **Descriptions** : Limitez à 160 caractères pour Twitter
3. **Titres** : Gardez-les courts et accrocheurs
4. **URLs** : Utilisez des URLs canoniques
5. **Données structurées** : Validez avec Google Rich Results Test

## Test et Validation

### Outils de Test
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)
- [Google Rich Results Test](https://search.google.com/test/rich-results)

### Validation des Métadonnées
```bash
# Vérifier les métadonnées Open Graph
curl -I https://kstores.com/page

# Tester les données structurées
# Utiliser l'outil Google Rich Results Test
```

## Maintenance

### Mise à Jour des URLs
Modifiez `src/config/socialConfig.js` pour changer :
- URLs des réseaux sociaux
- Informations de contact
- Métadonnées par défaut

### Ajout de Nouveaux Réseaux
1. Ajouter dans `socialConfig.js`
2. Mettre à jour `SocialMediaSection.jsx`
3. Mettre à jour `SocialShareButtons.jsx`

## Support

Pour toute question ou problème avec l'intégration sociale, consultez :
- La documentation des APIs sociales
- Les outils de validation mentionnés ci-dessus
- Les logs de la console pour les erreurs JavaScript 