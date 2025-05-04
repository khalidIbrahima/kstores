/*
  # Add Gaming Category and Products

  1. New Data
    - Add Gaming category
    - Add gaming-related products with descriptions and images
    - Set appropriate prices and inventory

  2. Changes
    - Insert new category if it doesn't exist
    - Insert new gaming products
*/

-- Add Gaming category if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'gaming') THEN
    INSERT INTO categories (name, slug) VALUES ('Gaming', 'gaming');
  END IF;
END $$;

-- Add gaming products
INSERT INTO products (
  name,
  description,
  price,
  image_url,
  inventory,
  category_id
) VALUES
  (
    'PlayStation 5 Console',
    'Next-gen gaming console featuring ultra-high speed SSD, ray tracing, 4K-TV gaming, and haptic feedback controller.',
    499.99,
    'https://images.pexels.com/photos/12719133/pexels-photo-12719133.jpeg',
    25,
    (SELECT id FROM categories WHERE slug = 'gaming')
  ),
  (
    'Gaming Mechanical Keyboard',
    'RGB mechanical gaming keyboard with Cherry MX switches, customizable backlighting, and multimedia controls.',
    129.99,
    'https://images.pexels.com/photos/2115257/pexels-photo-2115257.jpeg',
    50,
    (SELECT id FROM categories WHERE slug = 'gaming')
  ),
  (
    'Pro Gaming Mouse',
    'High-precision gaming mouse with 16000 DPI optical sensor, programmable buttons, and ergonomic design.',
    79.99,
    'https://images.pexels.com/photos/5082566/pexels-photo-5082566.jpeg',
    75,
    (SELECT id FROM categories WHERE slug = 'gaming')
  ),
  (
    'Gaming Chair',
    'Ergonomic gaming chair with lumbar support, adjustable armrests, and premium PU leather upholstery.',
    249.99,
    'https://images.pexels.com/photos/7915357/pexels-photo-7915357.jpeg',
    30,
    (SELECT id FROM categories WHERE slug = 'gaming')
  ),
  (
    'Gaming Headset',
    '7.1 surround sound gaming headset with noise-cancelling microphone and memory foam ear cushions.',
    99.99,
    'https://images.pexels.com/photos/5499701/pexels-photo-5499701.jpeg',
    60,
    (SELECT id FROM categories WHERE slug = 'gaming')
  ),
  (
    'Gaming Monitor',
    '27-inch 1440p gaming monitor with 165Hz refresh rate, 1ms response time, and G-Sync compatibility.',
    399.99,
    'https://images.pexels.com/photos/1038916/pexels-photo-1038916.jpeg',
    20,
    (SELECT id FROM categories WHERE slug = 'gaming')
  );