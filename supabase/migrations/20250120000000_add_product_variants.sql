/*
  # Product Variants System

  This migration creates tables for managing product variants:
  - Variants can be colors, sizes, patterns, etc.
  - Each variant type has multiple options
  - Variant combinations link specific options together with price, inventory, and images
*/

-- Create product_variants table (variant types: color, size, pattern, etc.)
CREATE TABLE IF NOT EXISTS product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL, -- e.g., "Color", "Size", "Pattern"
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(product_id, name)
);

-- Create product_variant_options table (specific options: "Red", "Blue", "S", "M", "L", etc.)
CREATE TABLE IF NOT EXISTS product_variant_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id uuid REFERENCES product_variants(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL, -- e.g., "Red", "Blue", "S", "M", "L"
  image_url text, -- Image for this specific option (e.g., pattern image, color swatch)
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(variant_id, name)
);

-- Create product_variant_combinations table (combines options with specific inventory and pricing)
CREATE TABLE IF NOT EXISTS product_variant_combinations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  variant_values jsonb NOT NULL, -- e.g., {"Color": "Red", "Size": "M"}
  sku text, -- Optional SKU for this combination
  price decimal CHECK (price >= 0), -- Optional: overrides product price
  inventory integer NOT NULL DEFAULT 0 CHECK (inventory >= 0),
  image_url text, -- Optional: specific image for this combination
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(product_id, variant_values)
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variant_options_variant_id ON product_variant_options(variant_id);
CREATE INDEX IF NOT EXISTS idx_product_variant_combinations_product_id ON product_variant_combinations(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variant_combinations_active ON product_variant_combinations(product_id, is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variant_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variant_combinations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product_variants
DROP POLICY IF EXISTS "Product variants are viewable by everyone" ON product_variants;
CREATE POLICY "Product variants are viewable by everyone"
ON product_variants FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "Product variants are manageable by admins only" ON product_variants;
CREATE POLICY "Product variants are manageable by admins only"
ON product_variants FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- RLS Policies for product_variant_options
DROP POLICY IF EXISTS "Variant options are viewable by everyone" ON product_variant_options;
CREATE POLICY "Variant options are viewable by everyone"
ON product_variant_options FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "Variant options are manageable by admins only" ON product_variant_options;
CREATE POLICY "Variant options are manageable by admins only"
ON product_variant_options FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- RLS Policies for product_variant_combinations
DROP POLICY IF EXISTS "Variant combinations are viewable by everyone" ON product_variant_combinations;
CREATE POLICY "Variant combinations are viewable by everyone"
ON product_variant_combinations FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "Variant combinations are manageable by admins only" ON product_variant_combinations;
CREATE POLICY "Variant combinations are manageable by admins only"
ON product_variant_combinations FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Add trigger to update updated_at timestamp
DROP TRIGGER IF EXISTS update_product_variant_combinations_updated_at ON product_variant_combinations;
CREATE OR REPLACE FUNCTION update_variant_combinations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_product_variant_combinations_updated_at
BEFORE UPDATE ON product_variant_combinations
FOR EACH ROW
EXECUTE FUNCTION update_variant_combinations_updated_at();

-- Add variant_values column to order_items to store selected variant combination
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS variant_combination_id uuid REFERENCES product_variant_combinations(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS selected_variant_options jsonb, -- Store full variant data including option IDs and images
ADD COLUMN IF NOT EXISTS variant_values jsonb; -- Store selected variant values as JSON for backwards compatibility

