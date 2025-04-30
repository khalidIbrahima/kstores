/*
  # Insert Initial Data

  1. Categories
    - Electronics
    - Clothing
    - Home & Kitchen
    - Beauty

  2. Sample Products
    - 3 products per category
    - Realistic prices and descriptions
*/

-- Insert Categories
INSERT INTO categories (name, slug) VALUES
  ('Electronics', 'electronics'),
  ('Clothing', 'clothing'),
  ('Home & Kitchen', 'home'),
  ('Beauty', 'beauty');

-- Insert Products
-- Electronics
INSERT INTO products (name, description, price, image_url, inventory, category_id) VALUES
  (
    'Wireless Noise-Cancelling Headphones',
    'Premium wireless headphones with active noise cancellation, 30-hour battery life, and crystal-clear sound quality.',
    299.99,
    'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg',
    50,
    (SELECT id FROM categories WHERE slug = 'electronics')
  ),
  (
    'Smart Fitness Watch',
    'Track your health and fitness with this advanced smartwatch featuring heart rate monitoring, GPS, and sleep tracking.',
    199.99,
    'https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg',
    75,
    (SELECT id FROM categories WHERE slug = 'electronics')
  ),
  (
    'Portable Bluetooth Speaker',
    'Waterproof portable speaker with 360° sound, 20-hour battery life, and built-in microphone for hands-free calls.',
    79.99,
    'https://images.pexels.com/photos/1279107/pexels-photo-1279107.jpeg',
    100,
    (SELECT id FROM categories WHERE slug = 'electronics')
  );

-- Clothing
INSERT INTO products (name, description, price, image_url, inventory, category_id) VALUES
  (
    'Classic Denim Jacket',
    'Timeless denim jacket made from premium cotton with a comfortable fit and stylish wash.',
    89.99,
    'https://images.pexels.com/photos/1082529/pexels-photo-1082529.jpeg',
    60,
    (SELECT id FROM categories WHERE slug = 'clothing')
  ),
  (
    'Cotton Crew Neck T-Shirt',
    'Essential crew neck t-shirt made from soft, breathable cotton. Available in multiple colors.',
    24.99,
    'https://images.pexels.com/photos/5698851/pexels-photo-5698851.jpeg',
    200,
    (SELECT id FROM categories WHERE slug = 'clothing')
  ),
  (
    'High-Waisted Yoga Leggings',
    'Moisture-wicking, four-way stretch leggings perfect for yoga, running, or everyday wear.',
    59.99,
    'https://images.pexels.com/photos/4662356/pexels-photo-4662356.jpeg',
    80,
    (SELECT id FROM categories WHERE slug = 'clothing')
  );

-- Home & Kitchen
INSERT INTO products (name, description, price, image_url, inventory, category_id) VALUES
  (
    'Smart Coffee Maker',
    'WiFi-enabled coffee maker with programmable brewing schedule and temperature control.',
    149.99,
    'https://images.pexels.com/photos/2374794/pexels-photo-2374794.jpeg',
    40,
    (SELECT id FROM categories WHERE slug = 'home')
  ),
  (
    'Bamboo Cutting Board Set',
    'Set of 3 eco-friendly bamboo cutting boards with juice grooves and different sizes.',
    34.99,
    'https://images.pexels.com/photos/4226896/pexels-photo-4226896.jpeg',
    120,
    (SELECT id FROM categories WHERE slug = 'home')
  ),
  (
    'Luxury Bed Sheet Set',
    '100% Egyptian cotton 400 thread count sheet set including flat sheet, fitted sheet, and pillowcases.',
    89.99,
    'https://images.pexels.com/photos/1034584/pexels-photo-1034584.jpeg',
    65,
    (SELECT id FROM categories WHERE slug = 'home')
  );

-- Beauty
INSERT INTO products (name, description, price, image_url, inventory, category_id) VALUES
  (
    'Vitamin C Serum',
    'Brightening serum with 20% Vitamin C, hyaluronic acid, and vitamin E for radiant skin.',
    45.99,
    'https://images.pexels.com/photos/4465124/pexels-photo-4465124.jpeg',
    90,
    (SELECT id FROM categories WHERE slug = 'beauty')
  ),
  (
    'Natural Hair Care Set',
    'Complete hair care set with shampoo, conditioner, and leave-in treatment made from organic ingredients.',
    69.99,
    'https://images.pexels.com/photos/3735641/pexels-photo-3735641.jpeg',
    70,
    (SELECT id FROM categories WHERE slug = 'beauty')
  ),
  (
    'Luxury Face Cream',
    'Rich moisturizing cream with retinol, peptides, and antioxidants for all skin types.',
    79.99,
    'https://images.pexels.com/photos/3785147/pexels-photo-3785147.jpeg',
    55,
    (SELECT id FROM categories WHERE slug = 'beauty')
  );