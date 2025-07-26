/*
  # Add Store Settings Table

  1. New Tables
    - `store_settings`
      - `id` (uuid, primary key)
      - `store_name` (text, required)
      - `store_url` (text)
      - `contact_email` (text)
      - `support_phone` (text)
      - `store_description` (text)
      - `business_hours` (jsonb, for storing hours for each day)
      - `currency` (text, default 'USD')
      - `timezone` (text, default 'UTC')
      - `logo_url` (text)
      - `favicon_url` (text)
      - `social_media` (jsonb, for storing social media links)
      - `payment_methods` (jsonb, for storing enabled payment methods)
      - `shipping_options` (jsonb, for storing shipping configurations)
      - `tax_rate` (decimal, default 0)
      - `maintenance_mode` (boolean, default false)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on store_settings table
    - Add policies for admin access only
    - Ensure only one settings record exists
*/

-- Create store_settings table
CREATE TABLE IF NOT EXISTS store_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_name text NOT NULL DEFAULT 'Kapital Store',
  store_url text,
  contact_email text,
  support_phone text,
  store_description text,
  business_hours jsonb DEFAULT '{
    "monday": {"open": "09:00", "close": "18:00", "closed": false},
    "tuesday": {"open": "09:00", "close": "18:00", "closed": false},
    "wednesday": {"open": "09:00", "close": "18:00", "closed": false},
    "thursday": {"open": "09:00", "close": "18:00", "closed": false},
    "friday": {"open": "09:00", "close": "18:00", "closed": false},
    "saturday": {"open": "10:00", "close": "16:00", "closed": false},
    "sunday": {"open": "10:00", "close": "16:00", "closed": true}
  }',
  currency text DEFAULT 'USD',
  timezone text DEFAULT 'UTC',
  logo_url text,
  favicon_url text,
  social_media jsonb DEFAULT '{
    "facebook": "",
    "twitter": "",
    "instagram": "",
    "linkedin": "",
    "youtube": ""
  }',
  payment_methods jsonb DEFAULT '{
    "wave": true,
    "credit_card": false,
    "paypal": false,
    "bank_transfer": false
  }',
  shipping_options jsonb DEFAULT '{
    "free_shipping_threshold": 50,
    "standard_shipping_cost": 5.99,
    "express_shipping_cost": 12.99,
    "local_pickup": true
  }',
  tax_rate decimal DEFAULT 0 CHECK (tax_rate >= 0),
  maintenance_mode boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

-- Add policies for store_settings
CREATE POLICY "Store settings are viewable by everyone"
ON store_settings FOR SELECT
TO public
USING (true);

CREATE POLICY "Store settings are manageable by admins only"
ON store_settings FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Insert default settings if none exist
INSERT INTO store_settings (store_name, store_url, contact_email, support_phone, store_description)
VALUES (
  'Kapital Store',
  'https://kapitalstore.com',
  'contact@kapitalstore.com',
  '+1 (555) 123-4567',
  'Your one-stop shop for quality products...'
) ON CONFLICT DO NOTHING;

-- Create function to update settings
CREATE OR REPLACE FUNCTION update_store_settings(
  p_store_name text DEFAULT NULL,
  p_store_url text DEFAULT NULL,
  p_contact_email text DEFAULT NULL,
  p_support_phone text DEFAULT NULL,
  p_store_description text DEFAULT NULL,
  p_business_hours jsonb DEFAULT NULL,
  p_currency text DEFAULT NULL,
  p_timezone text DEFAULT NULL,
  p_logo_url text DEFAULT NULL,
  p_favicon_url text DEFAULT NULL,
  p_social_media jsonb DEFAULT NULL,
  p_payment_methods jsonb DEFAULT NULL,
  p_shipping_options jsonb DEFAULT NULL,
  p_tax_rate decimal DEFAULT NULL,
  p_maintenance_mode boolean DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_settings_id uuid;
  v_result jsonb;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Only administrators can update store settings';
  END IF;

  -- Get the settings ID (should be only one record)
  SELECT id INTO v_settings_id FROM store_settings LIMIT 1;
  
  -- If no settings exist, create one
  IF v_settings_id IS NULL THEN
    INSERT INTO store_settings (store_name) VALUES ('Kapital Store')
    RETURNING id INTO v_settings_id;
  END IF;

  -- Update settings
  UPDATE store_settings SET
    store_name = COALESCE(p_store_name, store_name),
    store_url = COALESCE(p_store_url, store_url),
    contact_email = COALESCE(p_contact_email, contact_email),
    support_phone = COALESCE(p_support_phone, support_phone),
    store_description = COALESCE(p_store_description, store_description),
    business_hours = COALESCE(p_business_hours, business_hours),
    currency = COALESCE(p_currency, currency),
    timezone = COALESCE(p_timezone, timezone),
    logo_url = COALESCE(p_logo_url, logo_url),
    favicon_url = COALESCE(p_favicon_url, favicon_url),
    social_media = COALESCE(p_social_media, social_media),
    payment_methods = COALESCE(p_payment_methods, payment_methods),
    shipping_options = COALESCE(p_shipping_options, shipping_options),
    tax_rate = COALESCE(p_tax_rate, tax_rate),
    maintenance_mode = COALESCE(p_maintenance_mode, maintenance_mode),
    updated_at = now()
  WHERE id = v_settings_id;

  -- Return updated settings
  SELECT to_jsonb(store_settings.*) INTO v_result
  FROM store_settings
  WHERE id = v_settings_id;

  RETURN v_result;
END;
$$; 