-- Add hero images for other categories
INSERT INTO category_hero_images (category_id, url, is_active) VALUES
  -- Electronics
  (
    (SELECT id FROM categories WHERE slug = 'electronics'),
    'https://images.pexels.com/photos/325153/pexels-photo-325153.jpeg',
    true
  ),
  (
    (SELECT id FROM categories WHERE slug = 'electronics'),
    'https://images.pexels.com/photos/1029757/pexels-photo-1029757.jpeg',
    true
  ),
  -- Fashion
  (
    (SELECT id FROM categories WHERE slug = 'fashion'),
    'https://images.pexels.com/photos/934070/pexels-photo-934070.jpeg',
    true
  ),
  (
    (SELECT id FROM categories WHERE slug = 'fashion'),
    'https://images.pexels.com/photos/1488463/pexels-photo-1488463.jpeg',
    true
  ),
  -- Home & Living
  (
    (SELECT id FROM categories WHERE slug = 'home-living'),
    'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg',
    true
  ),
  (
    (SELECT id FROM categories WHERE slug = 'home-living'),
    'https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg',
    true
  ),
  -- Books
  (
    (SELECT id FROM categories WHERE slug = 'books'),
    'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg',
    true
  ),
  (
    (SELECT id FROM categories WHERE slug = 'books'),
    'https://images.pexels.com/photos/590493/pexels-photo-590493.jpeg',
    true
  ),
  -- Sports
  (
    (SELECT id FROM categories WHERE slug = 'sports'),
    'https://images.pexels.com/photos/248547/pexels-photo-248547.jpeg',
    true
  ),
  (
    (SELECT id FROM categories WHERE slug = 'sports'),
    'https://images.pexels.com/photos/260352/pexels-photo-260352.jpeg',
    true
  );