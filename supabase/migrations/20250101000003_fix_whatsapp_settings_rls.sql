-- Fix WhatsApp settings RLS policies to allow public read access
-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Admins can manage WhatsApp settings" ON whatsapp_settings;

-- Create separate policies for read and write access
-- Allow public read access (needed for WhatsApp notifications)
CREATE POLICY "Public can read WhatsApp settings" ON whatsapp_settings
  FOR SELECT USING (true);

-- Only admins can insert/update/delete settings
CREATE POLICY "Admins can manage WhatsApp settings" ON whatsapp_settings
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE is_admin = true
    )
  );

-- Alternative: If you want to be more restrictive, you can use this instead:
-- CREATE POLICY "Admins can manage WhatsApp settings" ON whatsapp_settings
--   FOR INSERT WITH CHECK (
--     auth.uid() IN (
--       SELECT id FROM profiles WHERE is_admin = true
--     )
--   );
-- 
-- CREATE POLICY "Admins can update WhatsApp settings" ON whatsapp_settings
--   FOR UPDATE USING (
--     auth.uid() IN (
--       SELECT id FROM profiles WHERE is_admin = true
--     )
--   );
-- 
-- CREATE POLICY "Admins can delete WhatsApp settings" ON whatsapp_settings
--   FOR DELETE USING (
--     auth.uid() IN (
--       SELECT id FROM profiles WHERE is_admin = true
--     )
--   ); 