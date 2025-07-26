/*
  # Add Favorites Table and Update Orders

  1. New Tables
    - `favorites`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `product_id` (uuid, foreign key)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on favorites table
    - Add policies for user access
*/

-- Create favorites table
CREATE TABLE IF NOT EXISTS favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Enable RLS
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Add policies for favorites
CREATE POLICY "Users can manage their own favorites"
ON favorites
FOR ALL
TO public
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own favorites"
ON favorites
FOR SELECT
TO public
USING (auth.uid() = user_id);

-- Allow guest users to create orders
-- This migration modifies the RLS policies to allow orders with null user_id

-- Drop existing policies for orders
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
DROP POLICY IF EXISTS "Users can create their own orders" ON orders;

-- Create new policies that allow guest orders
CREATE POLICY "Users can view their own orders" ON orders
  FOR SELECT USING (
    user_id IS NULL OR auth.uid() = user_id
  );

CREATE POLICY "Users can create orders" ON orders
  FOR INSERT WITH CHECK (
    user_id IS NULL OR auth.uid() = user_id
  );

-- Drop existing policies for order_items
DROP POLICY IF EXISTS "Users can view their own order items" ON order_items;
DROP POLICY IF EXISTS "Users can create order items for their orders" ON order_items;

-- Create new policies that allow guest order items
CREATE POLICY "Users can view their own order items" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND (orders.user_id IS NULL OR orders.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can create order items for their orders" ON order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND (orders.user_id IS NULL OR orders.user_id = auth.uid())
    )
  );

-- Also need to allow anonymous users to create orders
-- This is the key fix for guest checkout
CREATE POLICY "Anonymous users can create orders" ON orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anonymous users can create order items" ON order_items
  FOR INSERT WITH CHECK (true);

-- Create RPC function for creating guest orders
CREATE OR REPLACE FUNCTION create_guest_order(
  p_user_id UUID DEFAULT NULL,
  p_total DECIMAL,
  p_status TEXT DEFAULT 'pending',
  p_shipping_address JSONB,
  p_userGeolocation JSONB DEFAULT NULL,
  p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id UUID;
  v_item JSONB;
  v_result JSONB;
BEGIN
  -- Insert the order
  INSERT INTO orders (
    user_id,
    total,
    status,
    shipping_address,
    userGeolocation
  ) VALUES (
    p_user_id,
    p_total,
    p_status,
    p_shipping_address,
    p_userGeolocation
  ) RETURNING id INTO v_order_id;

  -- Insert order items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO order_items (
      order_id,
      product_id,
      quantity,
      price
    ) VALUES (
      v_order_id,
      (v_item->>'product_id')::UUID,
      (v_item->>'quantity')::INTEGER,
      (v_item->>'price')::DECIMAL
    );
  END LOOP;

  -- Return the order data
  SELECT jsonb_build_object(
    'id', v_order_id,
    'user_id', p_user_id,
    'total', p_total,
    'status', p_status,
    'shipping_address', p_shipping_address,
    'userGeolocation', p_userGeolocation
  ) INTO v_result;

  RETURN v_result;
END;
$$;