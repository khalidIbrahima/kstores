/*
  # Add Product Data and Management Features

  1. New Tables
    - `product_categories`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `slug` (text, unique)
      - `created_at` (timestamp)
    
    - `products`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `description` (text)
      - `price` (numeric, required)
      - `image_url` (text, required)
      - `stock` (integer, required)
      - `category_id` (uuid, foreign key)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Products viewable by everyone
    - Products manageable only by admins
*/

-- Create product categories table
CREATE TABLE IF NOT EXISTS product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric NOT NULL CHECK (price >= 0),
  image_url text NOT NULL,
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  category_id uuid REFERENCES product_categories(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

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
ON product_categories FOR SELECT
TO public
USING (true);

CREATE POLICY "Categories are manageable by admins only"
ON product_categories FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Insert sample categories
INSERT INTO product_categories (name, slug) VALUES
  ('Electronics', 'electronics'),
  ('Fashion', 'fashion'),
  ('Home & Living', 'home-living'),
  ('Books', 'books'),
  ('Sports', 'sports');

-- Insert sample products
INSERT INTO products (name, description, price, image_url, stock, category_id) VALUES
  (
    'Wireless Headphones',
    'High-quality wireless headphones with noise cancellation',
    129.99,
    'https://images.pexels.com/photos/3945667/pexels-photo-3945667.jpeg',
    50,
    (SELECT id FROM product_categories WHERE slug = 'electronics')
  ),
  (
    'Smart Watch',
    'Feature-rich smartwatch with health tracking',
    199.99,
    'https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg',
    30,
    (SELECT id FROM product_categories WHERE slug = 'electronics')
  ),
  (
    'Cotton T-Shirt',
    'Comfortable 100% cotton t-shirt',
    24.99,
    'https://images.pexels.com/photos/5698851/pexels-photo-5698851.jpeg',
    100,
    (SELECT id FROM product_categories WHERE slug = 'fashion')
  ),
  (
    'Denim Jeans',
    'Classic fit denim jeans',
    59.99,
    'https://images.pexels.com/photos/1082529/pexels-photo-1082529.jpeg',
    75,
    (SELECT id FROM product_categories WHERE slug = 'fashion')
  ),
  (
    'Coffee Table',
    'Modern wooden coffee table',
    149.99,
    'https://images.pexels.com/photos/447592/pexels-photo-447592.jpeg',
    25,
    (SELECT id FROM product_categories WHERE slug = 'home-living')
  ),
  (
    'Table Lamp',
    'Contemporary table lamp with LED bulb',
    39.99,
    'https://images.pexels.com/photos/1112598/pexels-photo-1112598.jpeg',
    40,
    (SELECT id FROM product_categories WHERE slug = 'home-living')
  ),
  (
    'Programming Guide',
    'Comprehensive programming guide for beginners',
    34.99,
    'https://images.pexels.com/photos/2465877/pexels-photo-2465877.jpeg',
    60,
    (SELECT id FROM product_categories WHERE slug = 'books')
  ),
  (
    'Novel Collection',
    'Collection of bestselling novels',
    49.99,
    'https://images.pexels.com/photos/1130980/pexels-photo-1130980.jpeg',
    45,
    (SELECT id FROM product_categories WHERE slug = 'books')
  ),
  (
    'Yoga Mat',
    'Non-slip yoga mat with carrying strap',
    29.99,
    'https://images.pexels.com/photos/4056535/pexels-photo-4056535.jpeg',
    80,
    (SELECT id FROM product_categories WHERE slug = 'sports')
  ),
  (
    'Dumbbells Set',
    'Set of adjustable dumbbells',
    89.99,
    'https://images.pexels.com/photos/4397840/pexels-photo-4397840.jpeg',
    35,
    (SELECT id FROM product_categories WHERE slug = 'sports')
  );