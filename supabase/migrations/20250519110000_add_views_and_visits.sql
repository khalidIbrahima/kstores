/*
  # Add Product Views and Page Visits Tracking

  1. New Tables
    - `product_views`
      - `id` (uuid, primary key)
      - `product_id` (uuid, foreign key)
      - `user_id` (uuid, foreign key, nullable for anonymous users)
      - `session_id` (text, for anonymous tracking)
      - `ip_address` (text, for analytics)
      - `user_agent` (text, for analytics)
      - `created_at` (timestamp)

    - `page_visits`
      - `id` (uuid, primary key)
      - `page_path` (text, the page visited)
      - `user_id` (uuid, foreign key, nullable for anonymous users)
      - `session_id` (text, for anonymous tracking)
      - `ip_address` (text, for analytics)
      - `user_agent` (text, for analytics)
      - `referrer` (text, where the user came from)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for tracking
    - Allow anonymous tracking for analytics
*/

-- Create product_views table
CREATE TABLE IF NOT EXISTS product_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  session_id text,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Create page_visits table
CREATE TABLE IF NOT EXISTS page_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_path text NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  session_id text,
  ip_address text,
  user_agent text,
  referrer text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE product_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_visits ENABLE ROW LEVEL SECURITY;

-- Add policies for product_views
CREATE POLICY "Allow tracking product views" ON product_views
  FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "Users can view their own product views" ON product_views
  FOR SELECT TO public
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Add policies for page_visits
CREATE POLICY "Allow tracking page visits" ON page_visits
  FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "Users can view their own page visits" ON page_visits
  FOR SELECT TO public
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_product_views_product_id ON product_views(product_id);
CREATE INDEX IF NOT EXISTS idx_product_views_created_at ON product_views(created_at);
CREATE INDEX IF NOT EXISTS idx_page_visits_page_path ON page_visits(page_path);
CREATE INDEX IF NOT EXISTS idx_page_visits_created_at ON page_visits(created_at);

-- Create RPC functions for analytics
CREATE OR REPLACE FUNCTION get_product_views_count(p_product_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT COUNT(*) 
    FROM product_views 
    WHERE product_id = p_product_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION get_page_visits_count(p_page_path TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT COUNT(*) 
    FROM page_visits 
    WHERE page_path = p_page_path
  );
END;
$$;

CREATE OR REPLACE FUNCTION get_daily_visits_stats(p_days INTEGER DEFAULT 7)
RETURNS TABLE (
  date DATE,
  page_visits INTEGER,
  product_views INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.date,
    COALESCE(pv.count, 0) as page_visits,
    COALESCE(prv.count, 0) as product_views
  FROM (
    SELECT generate_series(
      CURRENT_DATE - (p_days - 1),
      CURRENT_DATE,
      '1 day'::interval
    )::date as date
  ) d
  LEFT JOIN (
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as count
    FROM page_visits
    WHERE created_at >= CURRENT_DATE - (p_days - 1)
    GROUP BY DATE(created_at)
  ) pv ON d.date = pv.date
  LEFT JOIN (
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as count
    FROM product_views
    WHERE created_at >= CURRENT_DATE - (p_days - 1)
    GROUP BY DATE(created_at)
  ) prv ON d.date = prv.date
  ORDER BY d.date;
END;
$$; 