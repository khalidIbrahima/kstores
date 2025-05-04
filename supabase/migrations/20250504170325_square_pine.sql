/*
  # Add Multiple Images Support

  1. New Tables
    - `product_images`
      - `id` (uuid, primary key)
      - `product_id` (uuid, foreign key)
      - `url` (text, required)
      - `is_primary` (boolean)
      - `created_at` (timestamp)
    
    - `category_hero_images`
      - `id` (uuid, primary key)
      - `category_id` (uuid, foreign key)
      - `url` (text, required)
      - `is_active` (boolean)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on new tables
    - Add appropriate policies
*/

-- Create product_images table
CREATE TABLE IF NOT EXISTS product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  url text NOT NULL,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create category_hero_images table
CREATE TABLE IF NOT EXISTS category_hero_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  url text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_hero_images ENABLE ROW LEVEL SECURITY;

-- Add policies for product_images
CREATE POLICY "Product images are viewable by everyone"
ON product_images FOR SELECT
TO public
USING (true);

CREATE POLICY "Product images are manageable by admins"
ON product_images FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Add policies for category_hero_images
CREATE POLICY "Category hero images are viewable by everyone"
ON category_hero_images FOR SELECT
TO public
USING (true);

CREATE POLICY "Category hero images are manageable by admins"
ON category_hero_images FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Add sample hero images for gaming category
INSERT INTO category_hero_images (category_id, url) VALUES
  (
    (SELECT id FROM categories WHERE slug = 'gaming'),
    'https://images.pexels.com/photos/2047905/pexels-photo-2047905.jpeg'
  ),
  (
    (SELECT id FROM categories WHERE slug = 'gaming'),
    'https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg'
  ),
  (
    (SELECT id FROM categories WHERE slug = 'gaming'),
    'https://images.pexels.com/photos/7915357/pexels-photo-7915357.jpeg'
  );

-- Add sample product images
INSERT INTO product_images (product_id, url, is_primary) 
SELECT 
  p.id,
  p.image_url,
  true
FROM products p;

-- Add additional images for gaming products
INSERT INTO product_images (product_id, url, is_primary)
SELECT 
  p.id,
  'https://images.pexels.com/photos/5082567/pexels-photo-5082567.jpeg',
  false
FROM products p 
WHERE p.category_id = (SELECT id FROM categories WHERE slug = 'gaming')
LIMIT 1;