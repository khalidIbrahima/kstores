# Instructions pour appliquer la migration

## Problème
L'erreur `relation "public.abandoned_cart_notifications" does not exist` indique que la table n'existe pas encore dans votre base de données.

## Solution

### Option 1: Via l'interface Supabase (Recommandé)

1. **Ouvrez votre dashboard Supabase**
   - Allez sur https://supabase.com/dashboard
   - Sélectionnez votre projet

2. **Accédez à l'éditeur SQL**
   - Cliquez sur "SQL Editor" dans le menu de gauche
   - Cliquez sur "New query"

3. **Copiez et collez le contenu de la migration**
   - Ouvrez le fichier `supabase/migrations/20250101000006_add_abandoned_cart_notifications_table.sql`
   - Copiez tout le contenu
   - Collez-le dans l'éditeur SQL de Supabase

4. **Exécutez la migration**
   - Cliquez sur "Run" pour exécuter le script
   - Vérifiez qu'il n'y a pas d'erreurs

### Option 2: Via la ligne de commande

Si vous avez Supabase CLI installé :

```bash
# Dans le répertoire de votre projet
supabase db push
```

### Option 3: Manuellement via psql

Si vous avez accès direct à la base de données :

```bash
# Connectez-vous à votre base de données
psql "postgresql://postgres:[password]@[host]:5432/postgres"

# Exécutez le contenu du fichier de migration
\i supabase/migrations/20250101000006_add_abandoned_cart_notifications_table.sql
```

## Vérification

Après avoir appliqué la migration, vous pouvez vérifier que la table a été créée :

1. Dans Supabase Dashboard → Table Editor
2. Vous devriez voir la table `abandoned_cart_notifications`
3. Elle devrait contenir les colonnes : id, cart_id, notification_type, status, etc.

## Test

Une fois la migration appliquée :

1. **Redémarrez votre application** si nécessaire
2. **Allez sur la page des paniers abandonnés** dans l'admin
3. **Vérifiez que les statistiques se chargent** sans erreur
4. **Testez l'envoi d'une notification** WhatsApp

## Structure de la table créée

La migration crée une table complète avec :

- **Colonnes principales** : id, cart_id, notification_type, status, message_content
- **Informations de contact** : recipient_phone, recipient_email
- **Horodatage** : sent_at, delivered_at, created_at, updated_at
- **Gestion d'erreurs** : error_message, retry_count, max_retries
- **Index** pour optimiser les performances
- **RLS** (Row Level Security) pour la sécurité
- **Fonctions** pour gérer les notifications

## Fonctions créées

- `create_abandoned_cart_notification()` - Créer une notification
- `mark_notification_sent()` - Marquer comme envoyée
- `mark_notification_failed()` - Marquer comme échouée
- `mark_notification_delivered()` - Marquer comme livrée
- `get_abandoned_cart_notification_stats()` - Obtenir les statistiques

## Support

Si vous rencontrez des problèmes :

1. Vérifiez les logs dans la console du navigateur
2. Vérifiez les logs dans Supabase Dashboard → Logs
3. Assurez-vous que toutes les migrations précédentes ont été appliquées 