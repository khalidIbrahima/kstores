-- Migration: Add inventory update trigger when order is delivered
-- Description: This trigger automatically updates product inventory when an order status changes to 'delivered'

-- Create a function to update inventory when order is delivered
CREATE OR REPLACE FUNCTION update_inventory_on_delivery()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update inventory when status changes to 'delivered'
  IF NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status != 'delivered') THEN
    -- Update inventory for all products in this order
    UPDATE products 
    SET inventory = inventory - order_items.quantity
    FROM order_items 
    WHERE order_items.order_id = NEW.id 
    AND order_items.product_id = products.id;
    
    -- Log the inventory update (optional)
    RAISE NOTICE 'Inventory updated for order %: status changed to delivered', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger on the orders table
CREATE TRIGGER trigger_update_inventory_on_delivery
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_on_delivery();

-- Add a comment to document the trigger
COMMENT ON TRIGGER trigger_update_inventory_on_delivery ON orders IS 
'Automatically updates product inventory when order status changes to delivered';

-- Create a function to handle inventory updates for new orders (optional)
-- This function can be used if you want to reserve inventory when order is created
CREATE OR REPLACE FUNCTION reserve_inventory_on_order_creation()
RETURNS TRIGGER AS $$
BEGIN
  -- Reserve inventory when order is created (optional feature)
  -- Uncomment the following lines if you want to reserve inventory on order creation
  
  -- UPDATE products 
  -- SET inventory = inventory - order_items.quantity
  -- FROM order_items 
  -- WHERE order_items.order_id = NEW.id 
  -- AND order_items.product_id = products.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger for new orders (commented out by default)
-- Uncomment if you want to reserve inventory on order creation
-- CREATE TRIGGER trigger_reserve_inventory_on_order_creation
--   AFTER INSERT ON orders
--   FOR EACH ROW
--   EXECUTE FUNCTION reserve_inventory_on_order_creation();

-- Add a function to restore inventory if order is cancelled
CREATE OR REPLACE FUNCTION restore_inventory_on_cancellation()
RETURNS TRIGGER AS $$
BEGIN
  -- Restore inventory when order is cancelled
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    -- Restore inventory for all products in this order
    UPDATE products 
    SET inventory = inventory + order_items.quantity
    FROM order_items 
    WHERE order_items.order_id = NEW.id 
    AND order_items.product_id = products.id;
    
    -- Log the inventory restoration
    RAISE NOTICE 'Inventory restored for order %: status changed to cancelled', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger for order cancellation
CREATE TRIGGER trigger_restore_inventory_on_cancellation
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION restore_inventory_on_cancellation();

-- Add a comment to document the cancellation trigger
COMMENT ON TRIGGER trigger_restore_inventory_on_cancellation ON orders IS 
'Automatically restores product inventory when order status changes to cancelled';

-- Create a function to check inventory before order creation (optional safety feature)
CREATE OR REPLACE FUNCTION check_inventory_before_order()
RETURNS TRIGGER AS $$
DECLARE
  insufficient_products TEXT[];
  product_name TEXT;
BEGIN
  -- Check if there's sufficient inventory for all products in the order
  SELECT ARRAY_AGG(p.name) INTO insufficient_products
  FROM order_items oi
  JOIN products p ON oi.product_id = p.id
  WHERE oi.order_id = NEW.id
  AND p.inventory < oi.quantity;
  
  -- If there are insufficient products, raise an error
  IF array_length(insufficient_products, 1) > 0 THEN
    SELECT string_agg(name, ', ') INTO product_name
    FROM unnest(insufficient_products) AS name;
    
    RAISE EXCEPTION 'Insufficient inventory for products: %', product_name;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger for inventory checking (optional - uncomment if needed)
-- CREATE TRIGGER trigger_check_inventory_before_order
--   BEFORE INSERT ON orders
--   FOR EACH ROW
--   EXECUTE FUNCTION check_inventory_before_order();

-- Add comments for documentation
COMMENT ON FUNCTION update_inventory_on_delivery() IS 
'Updates product inventory when order status changes to delivered';

COMMENT ON FUNCTION restore_inventory_on_cancellation() IS 
'Restores product inventory when order status changes to cancelled';

COMMENT ON FUNCTION check_inventory_before_order() IS 
'Checks if there is sufficient inventory before creating an order (optional safety feature)'; 