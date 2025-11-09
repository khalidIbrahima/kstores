# Store Settings - Configuration du Store

## Vue d'ensemble

Le système de paramètres du store permet de configurer dynamiquement tous les aspects de l'application e-commerce depuis l'interface d'administration. Toutes les données sont stockées dans la base de données et accessibles globalement dans l'application.

## Structure de la base de données

### Table `store_settings`

La table `store_settings` contient tous les paramètres configurables du store :

```sql
CREATE TABLE store_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_name text NOT NULL DEFAULT 'Kapital Store',
  store_url text,
  contact_email text,
  support_phone text,
  store_description text,
  business_hours jsonb DEFAULT '{
    "monday": {"open": "09:00", "close": "18:00", "closed": false},
    "tuesday": {"open": "09:00", "close": "18:00", "closed": false},
    "wednesday": {"open": "09:00", "close": "18:00", "closed": false},
    "thursday": {"open": "09:00", "close": "18:00", "closed": false},
    "friday": {"open": "09:00", "close": "18:00", "closed": false},
    "saturday": {"open": "10:00", "close": "16:00", "closed": false},
    "sunday": {"open": "10:00", "close": "16:00", "closed": true}
  }',
  currency text DEFAULT 'USD',
  timezone text DEFAULT 'UTC',
  logo_url text,
  favicon_url text,
  social_media jsonb DEFAULT '{
    "facebook": "",
    "twitter": "",
    "instagram": "",
    "linkedin": "",
    "youtube": ""
  }',
  payment_methods jsonb DEFAULT '{
    "wave": true,
    "credit_card": false,
    "paypal": false,
    "bank_transfer": false
  }',
  shipping_options jsonb DEFAULT '{
    "free_shipping_threshold": 50,
    "standard_shipping_cost": 5.99,
    "express_shipping_cost": 12.99,
    "local_pickup": true
  }',
  tax_rate decimal DEFAULT 0 CHECK (tax_rate >= 0),
  maintenance_mode boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

## Champs disponibles

### Informations générales
- **store_name** : Nom du store (affiché dans le header, footer, etc.)
- **store_url** : URL du site web
- **contact_email** : Email de contact
- **support_phone** : Numéro de téléphone de support
- **store_description** : Description du store

### Heures d'ouverture
- **business_hours** : Configuration des heures d'ouverture pour chaque jour de la semaine
  - Format JSON avec les clés : monday, tuesday, wednesday, thursday, friday, saturday, sunday
  - Chaque jour contient : open, close, closed

### Apparence
- **currency** : Devise par défaut (USD, EUR, GBP, XOF, XAF)
- **timezone** : Fuseau horaire (UTC, Africa/Dakar, etc.)
- **logo_url** : URL du logo du store
- **favicon_url** : URL du favicon

### Réseaux sociaux
- **social_media** : Liens vers les réseaux sociaux
  - facebook, twitter, instagram, linkedin, youtube

### Méthodes de paiement
- **payment_methods** : Configuration des méthodes de paiement disponibles
  - wave, credit_card, paypal, bank_transfer

### Options de livraison
- **shipping_options** : Configuration des options de livraison
  - free_shipping_threshold : Seuil pour la livraison gratuite
  - standard_shipping_cost : Coût de la livraison standard
  - express_shipping_cost : Coût de la livraison express
  - local_pickup : Activation du retrait en magasin

### Autres
- **tax_rate** : Taux de taxe en pourcentage
- **maintenance_mode** : Mode maintenance (désactive le store pour les visiteurs)

## Architecture

### Service (`src/services/storeSettingsService.js`)
Service pour interagir avec la base de données :
- `getStoreSettings()` : Récupère les paramètres
- `updateStoreSettings(settings)` : Met à jour les paramètres
- `updateBusinessHours(hours)` : Met à jour les heures d'ouverture
- `updatePaymentMethods(methods)` : Met à jour les méthodes de paiement
- `updateShippingOptions(options)` : Met à jour les options de livraison
- `updateSocialMedia(media)` : Met à jour les réseaux sociaux

### Hook (`src/hooks/useStoreSettings.js`)
Hook React pour utiliser les paramètres globalement :
- `useStoreSettings()` : Hook pour accéder aux paramètres
- `StoreSettingsProvider` : Provider pour le contexte

### Page d'administration (`src/pages/admin/Settings.jsx`)
Interface d'administration avec onglets :
- **General** : Informations générales et heures d'ouverture
- **Payments** : Méthodes de paiement et options de livraison
- **Appearance** : Apparence, devise, fuseau horaire, réseaux sociaux
- **Security** : Mode maintenance

## Utilisation dans l'application

### Dans un composant React
```javascript
import { useStoreSettings } from '../hooks/useStoreSettings';

const MyComponent = () => {
  const { settings, loading, error } = useStoreSettings();
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      <h1>{settings.store_name}</h1>
      <p>{settings.store_description}</p>
    </div>
  );
};
```

### Exemple d'utilisation dans le Header
Le Header utilise automatiquement le nom du store et l'URL du logo depuis les paramètres :
```javascript
const { settings } = useStoreSettings();
const storeName = settings?.store_name || 'Kapital Store';

<img 
  src={settings?.logo_url || logoHorizontal} 
  alt={`${storeName} Logo`} 
/>
```

## Sécurité

- **RLS (Row Level Security)** activé sur la table
- Seuls les administrateurs peuvent modifier les paramètres
- Lecture publique autorisée pour l'affichage
- Fonction `update_store_settings` avec vérification des permissions

## Migration

Pour appliquer les changements de base de données :
```bash
npx supabase db push
```

## Fonctionnalités futures

- [ ] Mode maintenance avec page personnalisée
- [ ] Configuration des emails de notification
- [ ] Paramètres de SEO (meta tags, etc.)
- [ ] Configuration des notifications push
- [ ] Gestion des équipes et permissions
- [ ] Historique des modifications
- [ ] Import/export des paramètres 