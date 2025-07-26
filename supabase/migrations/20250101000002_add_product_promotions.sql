/*
  # Add Product Promotions

  This migration adds promotion fields to the products table:
  - `old_price` (decimal): Original price before promotion
  - `promotion_active` (boolean): Whether promotion is active
  - `promotion_start_date` (timestamp): When promotion starts
  - `promotion_end_date` (timestamp): When promotion ends
  - `promotion_percentage` (integer): Discount percentage
*/

-- Add promotion fields to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS old_price decimal DEFAULT NULL,
ADD COLUMN IF NOT EXISTS promotion_active boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS promotion_start_date timestamptz DEFAULT NULL,
ADD COLUMN IF NOT EXISTS promotion_end_date timestamptz DEFAULT NULL,
ADD COLUMN IF NOT EXISTS promotion_percentage integer DEFAULT NULL;

-- Add check constraint to ensure old_price is greater than current price when promotion is active
ALTER TABLE products 
ADD CONSTRAINT IF NOT EXISTS check_promotion_price 
CHECK (
  (promotion_active = false) OR 
  (promotion_active = true AND old_price IS NOT NULL AND old_price > price)
);

-- Add check constraint to ensure promotion percentage is between 0 and 100
ALTER TABLE products 
ADD CONSTRAINT IF NOT EXISTS check_promotion_percentage 
CHECK (
  promotion_percentage IS NULL OR 
  (promotion_percentage >= 0 AND promotion_percentage <= 100)
);

-- Add check constraint to ensure promotion dates are valid
ALTER TABLE products 
ADD CONSTRAINT IF NOT EXISTS check_promotion_dates 
CHECK (
  (promotion_start_date IS NULL AND promotion_end_date IS NULL) OR
  (promotion_start_date IS NOT NULL AND promotion_end_date IS NOT NULL AND promotion_start_date < promotion_end_date)
);

-- Create function to automatically calculate promotion price
CREATE OR REPLACE FUNCTION calculate_promotion_price()
RETURNS TRIGGER AS $$
BEGIN
  -- If promotion is being activated and old_price is not set, set it to current price
  IF NEW.promotion_active = true AND NEW.old_price IS NULL THEN
    NEW.old_price := NEW.price;
  END IF;
  
  -- If promotion percentage is set, calculate new price
  IF NEW.promotion_percentage IS NOT NULL AND NEW.old_price IS NOT NULL THEN
    NEW.price := NEW.old_price * (1 - NEW.promotion_percentage / 100.0);
  END IF;
  
  -- If promotion is being deactivated, restore old price
  IF NEW.promotion_active = false AND OLD.promotion_active = true THEN
    NEW.price := NEW.old_price;
    NEW.old_price := NULL;
    NEW.promotion_percentage := NULL;
    NEW.promotion_start_date := NULL;
    NEW.promotion_end_date := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically handle promotion price calculations
DROP TRIGGER IF EXISTS trigger_calculate_promotion_price ON products;
CREATE TRIGGER trigger_calculate_promotion_price
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION calculate_promotion_price();

-- Create function to check if promotion is currently active based on dates
CREATE OR REPLACE FUNCTION is_promotion_active(p_product_id uuid)
RETURNS boolean AS $$
DECLARE
  v_promotion_active boolean;
  v_start_date timestamptz;
  v_end_date timestamptz;
BEGIN
  SELECT promotion_active, promotion_start_date, promotion_end_date
  INTO v_promotion_active, v_start_date, v_end_date
  FROM products
  WHERE id = p_product_id;
  
  -- Return false if no product found or promotion not active
  IF v_promotion_active IS NULL OR v_promotion_active = false THEN
    RETURN false;
  END IF;
  
  -- If no dates set, return promotion_active value
  IF v_start_date IS NULL AND v_end_date IS NULL THEN
    RETURN v_promotion_active;
  END IF;
  
  -- Check if current time is within promotion period
  RETURN now() >= COALESCE(v_start_date, '1900-01-01'::timestamptz) 
         AND now() <= COALESCE(v_end_date, '2100-01-01'::timestamptz);
END;
$$ LANGUAGE plpgsql;

-- Create view for products with active promotions
CREATE OR REPLACE VIEW products_with_promotions AS
SELECT 
  p.*,
  CASE 
    WHEN is_promotion_active(p.id) THEN true
    ELSE false
  END as is_currently_promoted,
  CASE 
    WHEN is_promotion_active(p.id) AND p.old_price IS NOT NULL THEN p.old_price
    ELSE NULL
  END as display_old_price
FROM products p;

-- Add comments for documentation
COMMENT ON COLUMN products.old_price IS 'Original price before promotion';
COMMENT ON COLUMN products.promotion_active IS 'Whether promotion is enabled';
COMMENT ON COLUMN products.promotion_start_date IS 'When promotion starts (NULL = no start date)';
COMMENT ON COLUMN products.promotion_end_date IS 'When promotion ends (NULL = no end date)';
COMMENT ON COLUMN products.promotion_percentage IS 'Discount percentage (0-100)'; 