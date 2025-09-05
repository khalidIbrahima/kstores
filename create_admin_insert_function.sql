-- Function to insert products with admin privileges
-- This bypasses RLS policies for initial data setup

CREATE OR REPLACE FUNCTION insert_product_admin(
  p_name TEXT,
  p_description TEXT DEFAULT NULL,
  p_price NUMERIC,
  p_image_url TEXT,
  p_stock INTEGER,
  p_category_id UUID DEFAULT NULL
) RETURNS UUID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  product_id UUID;
BEGIN
  INSERT INTO products (name, description, price, image_url, stock, category_id)
  VALUES (p_name, p_description, p_price, p_image_url, p_stock, p_category_id)
  RETURNING id INTO product_id;
  
  RETURN product_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION insert_product_admin TO authenticated;
GRANT EXECUTE ON FUNCTION insert_product_admin TO anon;
