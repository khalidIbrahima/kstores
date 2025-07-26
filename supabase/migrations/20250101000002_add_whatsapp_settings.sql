-- Create WhatsApp settings table
CREATE TABLE IF NOT EXISTS whatsapp_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  twilio_account_sid text,
  twilio_auth_token text,
  twilio_whatsapp_number text,
  admin_whatsapp_number text,
  enable_order_notifications boolean DEFAULT true,
  enable_status_updates boolean DEFAULT true,
  enable_low_stock_alerts boolean DEFAULT true,
  enable_payment_alerts boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert default settings
INSERT INTO whatsapp_settings (
  twilio_account_sid,
  twilio_auth_token,
  twilio_whatsapp_number,
  admin_whatsapp_number,
  enable_order_notifications,
  enable_status_updates,
  enable_low_stock_alerts,
  enable_payment_alerts
) VALUES (
  NULL,
  NULL,
  NULL,
  NULL,
  true,
  true,
  true,
  true
) ON CONFLICT DO NOTHING;

-- Enable Row Level Security
ALTER TABLE whatsapp_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can manage WhatsApp settings
CREATE POLICY "Admins can manage WhatsApp settings" ON whatsapp_settings
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE is_admin = true
    )
  );

-- Create function to update settings
CREATE OR REPLACE FUNCTION update_whatsapp_settings(
  p_twilio_account_sid text,
  p_twilio_auth_token text,
  p_twilio_whatsapp_number text,
  p_admin_whatsapp_number text,
  p_enable_order_notifications boolean,
  p_enable_status_updates boolean,
  p_enable_low_stock_alerts boolean,
  p_enable_payment_alerts boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
BEGIN
  -- Update or insert settings
  INSERT INTO whatsapp_settings (
    twilio_account_sid,
    twilio_auth_token,
    twilio_whatsapp_number,
    admin_whatsapp_number,
    enable_order_notifications,
    enable_status_updates,
    enable_low_stock_alerts,
    enable_payment_alerts,
    updated_at
  ) VALUES (
    p_twilio_account_sid,
    p_twilio_auth_token,
    p_twilio_whatsapp_number,
    p_admin_whatsapp_number,
    p_enable_order_notifications,
    p_enable_status_updates,
    p_enable_low_stock_alerts,
    p_enable_payment_alerts,
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    twilio_account_sid = EXCLUDED.twilio_account_sid,
    twilio_auth_token = EXCLUDED.twilio_auth_token,
    twilio_whatsapp_number = EXCLUDED.twilio_whatsapp_number,
    admin_whatsapp_number = EXCLUDED.admin_whatsapp_number,
    enable_order_notifications = EXCLUDED.enable_order_notifications,
    enable_status_updates = EXCLUDED.enable_status_updates,
    enable_low_stock_alerts = EXCLUDED.enable_low_stock_alerts,
    enable_payment_alerts = EXCLUDED.enable_payment_alerts,
    updated_at = now();

  -- Return success
  v_result := jsonb_build_object(
    'success', true,
    'message', 'Settings updated successfully'
  );

  RETURN v_result;
END;
$$; 