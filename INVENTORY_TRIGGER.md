# Inventory Management Triggers

Ce document explique le système de triggers Supabase pour la gestion automatique de l'inventaire.

## 🎯 Objectif

Automatiser la mise à jour de l'inventaire des produits basée sur le statut des commandes.

## 📋 Fonctionnalités

### 1. **Mise à jour automatique lors de la livraison**
- **Déclencheur** : Quand une commande passe au statut `'delivered'`
- **Action** : Réduit l'inventaire des produits de la quantité commandée
- **Trigger** : `trigger_update_inventory_on_delivery`

### 2. **Restauration lors de l'annulation**
- **Déclencheur** : Quand une commande passe au statut `'cancelled'`
- **Action** : Restaure l'inventaire des produits de la quantité commandée
- **Trigger** : `trigger_restore_inventory_on_cancellation`

### 3. **Vérification d'inventaire (optionnel)**
- **Déclencheur** : Avant la création d'une commande
- **Action** : Vérifie si l'inventaire est suffisant
- **Trigger** : `trigger_check_inventory_before_order` (commenté par défaut)

## 🔧 Installation

### 1. Appliquer la migration
```bash
supabase db push
```

### 2. Vérifier l'installation
```sql
-- Vérifier que les triggers existent
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name LIKE '%inventory%';
```

## 📊 Fonctionnement

### Exemple de mise à jour lors de la livraison

```sql
-- 1. Commande avec statut 'pending'
INSERT INTO orders (id, user_id, status, total, shipping_address)
VALUES ('order-123', 'user-456', 'pending', 100.00, '{"address": "..."}');

-- 2. Ajouter des articles à la commande
INSERT INTO order_items (order_id, product_id, quantity, price)
VALUES 
  ('order-123', 'product-1', 2, 50.00),
  ('order-123', 'product-2', 1, 50.00);

-- 3. Mettre à jour le statut à 'delivered' (déclenche le trigger)
UPDATE orders 
SET status = 'delivered' 
WHERE id = 'order-123';

-- 4. L'inventaire est automatiquement mis à jour :
-- product-1.inventory = product-1.inventory - 2
-- product-2.inventory = product-2.inventory - 1
```

### Exemple de restauration lors de l'annulation

```sql
-- 1. Annuler une commande livrée
UPDATE orders 
SET status = 'cancelled' 
WHERE id = 'order-123';

-- 2. L'inventaire est automatiquement restauré :
-- product-1.inventaire = product-1.inventaire + 2
-- product-2.inventaire = product-2.inventaire + 1
```

## ⚙️ Configuration

### Activer la vérification d'inventaire (optionnel)

Si vous voulez empêcher la création de commandes avec un inventaire insuffisant :

```sql
-- Décommenter dans la migration
CREATE TRIGGER trigger_check_inventory_before_order
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION check_inventory_before_order();
```

### Activer la réservation d'inventaire (optionnel)

Si vous voulez réserver l'inventaire dès la création de la commande :

```sql
-- Décommenter dans la migration
CREATE TRIGGER trigger_reserve_inventory_on_order_creation
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION reserve_inventory_on_order_creation();
```

## 🔍 Monitoring

### Vérifier les logs des triggers

```sql
-- Voir les notifications des triggers
SELECT * FROM pg_stat_activity 
WHERE application_name = 'supabase' 
AND query LIKE '%Inventory updated%';
```

### Vérifier l'historique des mises à jour

```sql
-- Créer une table de logs (optionnel)
CREATE TABLE inventory_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id),
  product_id uuid REFERENCES products(id),
  quantity_change integer,
  action text,
  created_at timestamptz DEFAULT now()
);
```

## 🚨 Points d'attention

### 1. **Cohérence des données**
- Les triggers ne s'exécutent que lors des changements de statut
- L'inventaire n'est pas mis à jour lors de la création de commande (par défaut)

### 2. **Performance**
- Les triggers s'exécutent pour chaque ligne mise à jour
- Pour de gros volumes, considérez des mises à jour par lots

### 3. **Gestion d'erreurs**
- Les triggers peuvent échouer si l'inventaire devient négatif
- Ajoutez des contraintes CHECK si nécessaire

### 4. **Sécurité**
- Les triggers respectent les politiques RLS
- Seuls les utilisateurs autorisés peuvent déclencher les mises à jour

## 🧪 Tests

### Test de mise à jour d'inventaire

```sql
-- 1. Créer un produit de test
INSERT INTO products (name, price, inventory, image_url)
VALUES ('Test Product', 10.00, 100, 'test.jpg');

-- 2. Créer une commande
INSERT INTO orders (user_id, status, total, shipping_address)
VALUES ('user-123', 'pending', 20.00, '{"address": "test"}');

-- 3. Ajouter des articles
INSERT INTO order_items (order_id, product_id, quantity, price)
VALUES (lastval(), (SELECT id FROM products WHERE name = 'Test Product'), 2, 10.00);

-- 4. Livrer la commande
UPDATE orders SET status = 'delivered' WHERE id = lastval();

-- 5. Vérifier l'inventaire
SELECT name, inventory FROM products WHERE name = 'Test Product';
-- Résultat attendu : inventory = 98
```

## 📝 Maintenance

### Mettre à jour les triggers

```sql
-- Recréer une fonction
CREATE OR REPLACE FUNCTION update_inventory_on_delivery()
RETURNS TRIGGER AS $$
BEGIN
  -- Nouvelle logique ici
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Supprimer les triggers

```sql
-- Supprimer un trigger
DROP TRIGGER IF EXISTS trigger_update_inventory_on_delivery ON orders;

-- Supprimer une fonction
DROP FUNCTION IF EXISTS update_inventory_on_delivery();
```

## 🔗 Liens utiles

- [Documentation Supabase Triggers](https://supabase.com/docs/guides/database/database-functions)
- [PostgreSQL Triggers](https://www.postgresql.org/docs/current/triggers.html)
- [PL/pgSQL Documentation](https://www.postgresql.org/docs/current/plpgsql.html) 