-- Migration: Extend variant stock management and refresh delivery triggers
-- Description: Adds stock column for variant options and ensures order delivery/cancellation
-- triggers keep product_variant_combinations and product_variant_options inventory in sync.

-- Add stock column to variant options (if it does not exist yet)
ALTER TABLE product_variant_options
ADD COLUMN IF NOT EXISTS stock integer CHECK (stock >= 0);

COMMENT ON COLUMN product_variant_options.stock IS 'Available stock for this specific variant option';

-- Update delivery trigger function to handle variant combinations & options
CREATE OR REPLACE FUNCTION update_inventory_on_delivery()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status <> 'delivered') THEN
    -- Update base product inventory
    WITH product_updates AS (
      SELECT product_id, SUM(quantity)::int AS total_qty
      FROM order_items
      WHERE order_id = NEW.id
      GROUP BY product_id
    )
    UPDATE products p
    SET inventory = GREATEST(0, COALESCE(p.inventory, 0) - product_updates.total_qty)
    FROM product_updates
    WHERE p.id = product_updates.product_id;

    -- Update variant combinations inventory
    WITH combo_updates AS (
      SELECT variant_combination_id, SUM(quantity)::int AS total_qty
      FROM order_items
      WHERE order_id = NEW.id
        AND variant_combination_id IS NOT NULL
      GROUP BY variant_combination_id
    )
    UPDATE product_variant_combinations pvc
    SET inventory = GREATEST(0, COALESCE(pvc.inventory, 0) - combo_updates.total_qty)
    FROM combo_updates
    WHERE pvc.id = combo_updates.variant_combination_id;

    -- Update variant options stock using selected_variant_options JSON
    WITH option_updates AS (
      SELECT
        (option_value->>'id')::uuid AS option_id,
        SUM(oi.quantity)::int AS total_qty
      FROM order_items oi
      CROSS JOIN LATERAL jsonb_each(oi.selected_variant_options) AS option_entry(option_key, option_value)
      WHERE oi.order_id = NEW.id
        AND jsonb_typeof(oi.selected_variant_options) = 'object'
        AND option_value ? 'id'
        AND (option_value->>'id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      GROUP BY (option_value->>'id')::uuid
    )
    UPDATE product_variant_options pvo
    SET stock = GREATEST(0, COALESCE(pvo.stock, 0) - option_updates.total_qty)
    FROM option_updates
    WHERE pvo.id = option_updates.option_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update cancellation trigger to restore variant inventory
CREATE OR REPLACE FUNCTION restore_inventory_on_cancellation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'cancelled' AND (OLD.status IS NULL OR OLD.status <> 'cancelled') THEN
    -- Restore base product inventory
    WITH product_updates AS (
      SELECT product_id, SUM(quantity)::int AS total_qty
      FROM order_items
      WHERE order_id = NEW.id
      GROUP BY product_id
    )
    UPDATE products p
    SET inventory = COALESCE(p.inventory, 0) + product_updates.total_qty
    FROM product_updates
    WHERE p.id = product_updates.product_id;

    -- Restore variant combination inventory
    WITH combo_updates AS (
      SELECT variant_combination_id, SUM(quantity)::int AS total_qty
      FROM order_items
      WHERE order_id = NEW.id
        AND variant_combination_id IS NOT NULL
      GROUP BY variant_combination_id
    )
    UPDATE product_variant_combinations pvc
    SET inventory = COALESCE(pvc.inventory, 0) + combo_updates.total_qty
    FROM combo_updates
    WHERE pvc.id = combo_updates.variant_combination_id;

    -- Restore variant option stock
    WITH option_updates AS (
      SELECT
        (option_value->>'id')::uuid AS option_id,
        SUM(oi.quantity)::int AS total_qty
      FROM order_items oi
      CROSS JOIN LATERAL jsonb_each(oi.selected_variant_options) AS option_entry(option_key, option_value)
      WHERE oi.order_id = NEW.id
        AND jsonb_typeof(oi.selected_variant_options) = 'object'
        AND option_value ? 'id'
        AND (option_value->>'id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      GROUP BY (option_value->>'id')::uuid
    )
    UPDATE product_variant_options pvo
    SET stock = COALESCE(pvo.stock, 0) + option_updates.total_qty
    FROM option_updates
    WHERE pvo.id = option_updates.option_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


