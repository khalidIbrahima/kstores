/*
  # Add Product Data and Management Features

  1. Changes
    - Create product categories and products tables if they don't exist
    - Add RLS policies for proper access control
    - Insert sample data for categories and products only if they don't exist
*/

-- Create product categories table first
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create products table with reference to categories
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric NOT NULL CHECK (price >= 0),
  image_url text NOT NULL,
  inventory integer NOT NULL DEFAULT 0 CHECK (inventory >= 0),
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Products are viewable by everyone" ON products;
DROP POLICY IF EXISTS "Products are manageable by admins only" ON products;
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON categories;
DROP POLICY IF EXISTS "Categories are manageable by admins only" ON categories;

-- Create policies
CREATE POLICY "Products are viewable by everyone"
ON products FOR SELECT
TO public
USING (true);

CREATE POLICY "Products are manageable by admins only"
ON products FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

CREATE POLICY "Categories are viewable by everyone"
ON categories FOR SELECT
TO public
USING (true);

CREATE POLICY "Categories are manageable by admins only"
ON categories FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Insert sample categories if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'electronics') THEN
    INSERT INTO categories (name, slug) VALUES ('Electronics', 'electronics');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'fashion') THEN
    INSERT INTO categories (name, slug) VALUES ('Fashion', 'fashion');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'home-living') THEN
    INSERT INTO categories (name, slug) VALUES ('Home & Living', 'home-living');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'books') THEN
    INSERT INTO categories (name, slug) VALUES ('Books', 'books');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'sports') THEN
    INSERT INTO categories (name, slug) VALUES ('Sports', 'sports');
  END IF;
END $$;

-- Insert sample products
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE name = 'Wireless Headphones') THEN
    INSERT INTO products (name, description, price, image_url, inventory, category_id) VALUES
    (
      'Wireless Headphones',
      'High-quality wireless headphones with noise cancellation',
      129.99,
      'https://images.pexels.com/photos/3945667/pexels-photo-3945667.jpeg',
      50,
      (SELECT id FROM categories WHERE slug = 'electronics')
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM products WHERE name = 'Smart Watch') THEN
    INSERT INTO products (name, description, price, image_url, inventory, category_id) VALUES
    (
      'Smart Watch',
      'Feature-rich smartwatch with health tracking',
      199.99,
      'https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg',
      30,
      (SELECT id FROM categories WHERE slug = 'electronics')
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM products WHERE name = 'Cotton T-Shirt') THEN
    INSERT INTO products (name, description, price, image_url, inventory, category_id) VALUES
    (
      'Cotton T-Shirt',
      'Comfortable 100% cotton t-shirt',
      24.99,
      'https://images.pexels.com/photos/5698851/pexels-photo-5698851.jpeg',
      100,
      (SELECT id FROM categories WHERE slug = 'fashion')
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM products WHERE name = 'Denim Jeans') THEN
    INSERT INTO products (name, description, price, image_url, inventory, category_id) VALUES
    (
      'Denim Jeans',
      'Classic fit denim jeans',
      59.99,
      'https://images.pexels.com/photos/1082529/pexels-photo-1082529.jpeg',
      75,
      (SELECT id FROM categories WHERE slug = 'fashion')
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM products WHERE name = 'Coffee Table') THEN
    INSERT INTO products (name, description, price, image_url, inventory, category_id) VALUES
    (
      'Coffee Table',
      'Modern wooden coffee table',
      149.99,
      'https://images.pexels.com/photos/447592/pexels-photo-447592.jpeg',
      25,
      (SELECT id FROM categories WHERE slug = 'home-living')
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM products WHERE name = 'Table Lamp') THEN
    INSERT INTO products (name, description, price, image_url, inventory, category_id) VALUES
    (
      'Table Lamp',
      'Contemporary table lamp with LED bulb',
      39.99,
      'https://images.pexels.com/photos/1112598/pexels-photo-1112598.jpeg',
      40,
      (SELECT id FROM categories WHERE slug = 'home-living')
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM products WHERE name = 'Programming Guide') THEN
    INSERT INTO products (name, description, price, image_url, inventory, category_id) VALUES
    (
      'Programming Guide',
      'Comprehensive programming guide for beginners',
      34.99,
      'https://images.pexels.com/photos/2465877/pexels-photo-2465877.jpeg',
      60,
      (SELECT id FROM categories WHERE slug = 'books')
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM products WHERE name = 'Novel Collection') THEN
    INSERT INTO products (name, description, price, image_url, inventory, category_id) VALUES
    (
      'Novel Collection',
      'Collection of bestselling novels',
      49.99,
      'https://images.pexels.com/photos/1130980/pexels-photo-1130980.jpeg',
      45,
      (SELECT id FROM categories WHERE slug = 'books')
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM products WHERE name = 'Yoga Mat') THEN
    INSERT INTO products (name, description, price, image_url, inventory, category_id) VALUES
    (
      'Yoga Mat',
      'Non-slip yoga mat with carrying strap',
      29.99,
      'https://images.pexels.com/photos/4056535/pexels-photo-4056535.jpeg',
      80,
      (SELECT id FROM categories WHERE slug = 'sports')
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM products WHERE name = 'Dumbbells Set') THEN
    INSERT INTO products (name, description, price, image_url, inventory, category_id) VALUES
    (
      'Dumbbells Set',
      'Set of adjustable dumbbells',
      89.99,
      'https://images.pexels.com/photos/4397840/pexels-photo-4397840.jpeg',
      35,
      (SELECT id FROM categories WHERE slug = 'sports')
    );
  END IF;
END $$;