-- Script de rollback pour annuler la migration des totaux des commandes fournisseurs
-- Ce script supprime les éléments ajoutés par la migration 20250121000000_add_supplier_order_totals.sql

-- 1. Supprimer le trigger
DROP TRIGGER IF EXISTS trigger_calculate_supplier_order_item_total_cfa ON supplier_order_items;

-- 2. Supprimer la fonction de calcul des totaux CFA
DROP FUNCTION IF EXISTS calculate_supplier_order_item_total_cfa();

-- 3. Supprimer la fonction de recalcul des totaux
DROP FUNCTION IF EXISTS recalculate_supplier_order_totals(UUID);

-- 4. Supprimer les index de performance
DROP INDEX IF EXISTS idx_supplier_order_items_total_usd;
DROP INDEX IF EXISTS idx_supplier_order_items_total_cfa;

-- 5. Supprimer les colonnes ajoutées
ALTER TABLE supplier_order_items 
DROP COLUMN IF EXISTS total_usd,
DROP COLUMN IF EXISTS total_cfa;

-- 6. Vérification que le rollback est complet
-- Les colonnes total_usd et total_cfa ont été supprimées
-- Les fonctions et triggers ont été supprimés
-- Les index ont été supprimés
-- La table est revenue à son état d'origine
