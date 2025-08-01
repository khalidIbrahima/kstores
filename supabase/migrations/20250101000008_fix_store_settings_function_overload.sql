/*
  # Fix Store Settings Function Overload
  
  Problem: Two update_store_settings functions exist with similar signatures
  Solution: Drop the old function and keep only the one with email_config parameter
*/

-- Drop the old function (15 parameters)
DROP FUNCTION IF EXISTS update_store_settings(
  p_store_name text,
  p_store_url text,
  p_contact_email text,
  p_support_phone text,
  p_store_description text,
  p_business_hours jsonb,
  p_currency text,
  p_timezone text,
  p_logo_url text,
  p_favicon_url text,
  p_social_media jsonb,
  p_payment_methods jsonb,
  p_shipping_options jsonb,
  p_tax_rate decimal,
  p_maintenance_mode boolean
);

-- Ensure the new function (16 parameters) exists
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
  p_maintenance_mode boolean DEFAULT NULL,
  p_email_config jsonb DEFAULT NULL
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
    email_config = COALESCE(p_email_config, email_config),
    updated_at = now()
  WHERE id = v_settings_id;

  -- Return updated settings
  SELECT to_jsonb(store_settings.*) INTO v_result
  FROM store_settings
  WHERE id = v_settings_id;

  RETURN v_result;
END;
$$; 