/*
  # Add IPTV Plans Management

  1. New Tables
    - `iptv_plans`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `price` (decimal, required)
      - `duration` (text, required)
      - `connections` (integer, required)
      - `features` (jsonb, required)
      - `color` (text)
      - `is_popular` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS
    - Add policies for public read and admin management
*/

-- Create IPTV plans table
CREATE TABLE IF NOT EXISTS iptv_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price decimal NOT NULL CHECK (price >= 0),
  duration text NOT NULL,
  connections integer NOT NULL CHECK (connections > 0),
  features jsonb NOT NULL,
  color text,
  is_popular boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE iptv_plans ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "IPTV plans are viewable by everyone"
ON iptv_plans FOR SELECT
TO public
USING (true);

CREATE POLICY "IPTV plans are manageable by admins"
ON iptv_plans FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Insert initial plans
INSERT INTO iptv_plans (name, price, duration, connections, features, color, is_popular) VALUES
  (
    'Basic',
    9.99,
    '1 month',
    1,
    '["HD Quality", "5000+ Channels", "Movies & Series", "24/7 Support"]',
    'blue',
    false
  ),
  (
    'Premium',
    19.99,
    '1 month',
    2,
    '["Full HD Quality", "8000+ Channels", "Movies & Series", "Video on Demand", "Premium Sports", "24/7 Support"]',
    'purple',
    true
  ),
  (
    'Ultimate',
    29.99,
    '1 month',
    4,
    '["4K Ultra HD Quality", "10000+ Channels", "Movies & Series", "Video on Demand", "Premium Sports", "PPV Events", "Adult Content (Optional)", "Priority Support"]',
    'gold',
    false
  );