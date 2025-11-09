/*
  # Add Return Policy Field to Store Settings

  1. New Fields
    - `return_policy` (text) - Stores the return policy content
    - `return_policy_enabled` (boolean) - Whether return policy is enabled

  2. Update existing function
    - Update the update_store_settings function to include the new field
*/

-- Add return_policy field to store_settings table
ALTER TABLE store_settings 
ADD COLUMN IF NOT EXISTS return_policy text,
ADD COLUMN IF NOT EXISTS return_policy_enabled boolean DEFAULT true;

-- Update the update_store_settings function to include return_policy
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
  p_email_config jsonb DEFAULT NULL,
  p_return_policy text DEFAULT NULL,
  p_return_policy_enabled boolean DEFAULT NULL
) RETURNS store_settings AS $$
DECLARE
  v_settings store_settings;
  v_id uuid;
BEGIN
  -- Get the first (and should be only) settings record
  SELECT id INTO v_id FROM store_settings LIMIT 1;
  
  -- If no settings exist, create one
  IF v_id IS NULL THEN
    INSERT INTO store_settings (store_name) VALUES (COALESCE(p_store_name, 'Kapital Store'))
    RETURNING id INTO v_id;
  END IF;
  
  -- Update the settings
  UPDATE store_settings 
  SET 
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
    return_policy = COALESCE(p_return_policy, return_policy),
    return_policy_enabled = COALESCE(p_return_policy_enabled, return_policy_enabled),
    updated_at = now()
  WHERE id = v_id
  RETURNING * INTO v_settings;
  
  RETURN v_settings;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add default return policy content for existing records
UPDATE store_settings 
SET 
  return_policy = COALESCE(return_policy, 'Politique de retour par défaut. Veuillez la personnaliser dans les paramètres du store.'),
  return_policy_enabled = COALESCE(return_policy_enabled, true)
WHERE return_policy IS NULL OR return_policy_enabled IS NULL;
