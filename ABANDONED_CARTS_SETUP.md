# Guide d'Installation - Système de Paniers Abandonnés

## 🚨 Résolution de l'Erreur

Si vous rencontrez l'erreur `relation "abandoned_carts" does not exist`, suivez ces étapes :

### 1. Appliquer les Migrations dans l'Ordre

```bash
# 1. D'abord, créer la table abandoned_carts
supabase db push --include-all

# 2. Vérifier que la table existe
supabase db reset
```

### 2. Ordre des Migrations

Les migrations doivent être appliquées dans cet ordre :

1. **`20250101000004_add_abandoned_carts_table.sql`** - Table principale
2. **`20250101000005_add_abandoned_cart_notifications.sql`** - Système de notifications

### 3. Vérification de l'Installation

```sql
-- Vérifier que les tables existent
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%abandoned%';

-- Vérifier les fonctions
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%abandoned%';
```

## 📋 Configuration Complète

### 1. Variables d'Environnement

Ajoutez ces variables dans votre fichier `.env` :

```env
# WhatsApp Configuration
VITE_TWILIO_ACCOUNT_SID=your_account_sid
VITE_TWILIO_AUTH_TOKEN=your_auth_token
VITE_TWILIO_WHATSAPP_NUMBER=whatsapp:+1234567890
VITE_ADMIN_WHATSAPP_NUMBER=whatsapp:+1234567890
```

### 2. Services à Importer

Assurez-vous d'importer les services dans vos composants :

```javascript
// Dans AbandonedCarts.jsx
import { getAbandonedCarts, getAbandonedCartStats } from '../../services/guestCustomerService';
import { 
  sendAbandonedCartWhatsAppNotification, 
  getAbandonedCartNotificationHistory,
  getAbandonedCartNotificationStats,
  checkRecentNotification
} from '../../services/abandonedCartService';
```

### 3. Test du Système

#### Test Manuel

1. **Créer un panier abandonné de test** :
```sql
INSERT INTO abandoned_carts (name, email, phone, total_value, has_real_email) 
VALUES ('Test Client', 'test@example.com', '+221123456789', 15000, true);
```

2. **Tester la notification** :
```javascript
// Dans la console du navigateur
const testCart = {
  id: 'cart-id-from-db',
  name: 'Test Client',
  phone: '+221123456789',
  total_value: 15000
};

await sendAbandonedCartWhatsAppNotification(testCart);
```

#### Test Automatique

1. **Créer une campagne de test** :
```sql
INSERT INTO cart_recovery_campaigns (name, description, target_hours, notification_type) 
VALUES ('Test Campaign', 'Campagne de test', 1, 'whatsapp');
```

2. **Exécuter la campagne** :
```javascript
// Dans l'interface admin
await handleRunCampaign(campaign);
```

## 🔧 Dépannage

### Erreur : "relation does not exist"

**Solution** :
```bash
# Réinitialiser complètement la base de données
supabase db reset

# Ou appliquer les migrations manuellement
supabase db push --include-all
```

### Erreur : "function does not exist"

**Solution** :
```bash
# Recréer les fonctions
supabase db reset
```

### Erreur : "RLS policy does not exist"

**Solution** :
```sql
-- Vérifier que l'utilisateur est admin
SELECT is_admin FROM profiles WHERE id = auth.uid();

-- Si nécessaire, créer l'utilisateur admin
INSERT INTO profiles (id, full_name, is_admin) 
VALUES (auth.uid(), 'Admin User', true);
```

## 📊 Vérification du Fonctionnement

### 1. Interface Admin

- Aller sur `/admin/abandoned-carts`
- Vérifier que la page se charge sans erreur
- Tester le bouton "Rappel" sur un panier

### 2. Notifications WhatsApp

- Vérifier que les messages sont envoyés
- Contrôler l'historique des notifications
- Vérifier les statistiques

### 3. Base de Données

```sql
-- Vérifier les données
SELECT COUNT(*) FROM abandoned_carts;
SELECT COUNT(*) FROM abandoned_cart_notifications;
SELECT COUNT(*) FROM cart_recovery_campaigns;

-- Vérifier les fonctions
SELECT get_abandoned_cart_stats();
SELECT get_notification_stats();
```

## 🚀 Optimisations

### 1. Performance

```sql
-- Index pour améliorer les performances
CREATE INDEX CONCURRENTLY idx_abandoned_carts_last_abandoned 
ON abandoned_carts(last_abandoned);

CREATE INDEX CONCURRENTLY idx_notifications_sent_at 
ON abandoned_cart_notifications(sent_at);
```

### 2. Nettoyage Automatique

```sql
-- Nettoyer les anciens paniers (optionnel)
SELECT cleanup_old_abandoned_carts(90); -- 90 jours
```

### 3. Monitoring

```sql
-- Surveiller les performances
SELECT 
  COUNT(*) as total_carts,
  COUNT(*) FILTER (WHERE last_abandoned > now() - interval '7 days') as recent_carts,
  AVG(total_value) as avg_value
FROM abandoned_carts;
```

## 📞 Support

Si vous rencontrez des problèmes :

1. **Vérifiez les logs** : Console du navigateur et logs Supabase
2. **Testez les fonctions** : Utilisez les requêtes SQL de test
3. **Vérifiez les permissions** : Assurez-vous d'être connecté en tant qu'admin

## ✅ Checklist d'Installation

- [ ] Migrations appliquées dans l'ordre
- [ ] Variables d'environnement configurées
- [ ] Services importés correctement
- [ ] Interface admin accessible
- [ ] Notifications WhatsApp fonctionnelles
- [ ] Statistiques affichées
- [ ] Tests effectués

Le système est maintenant prêt à récupérer automatiquement les paniers abandonnés ! 🎉 