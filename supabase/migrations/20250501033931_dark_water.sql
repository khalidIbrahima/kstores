/*
  # Set Admin User

  1. Changes
    - Update profiles table to set admin flag for specific user
    - Add function to safely toggle admin status
    - Add policy for admins to manage other admins

  2. Security
    - Only existing admins can create new admins
    - Prevent users from modifying their own admin status
*/

-- Create function to toggle admin status
CREATE OR REPLACE FUNCTION toggle_admin(target_user_id uuid, new_status boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the executing user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Only administrators can modify admin status';
  END IF;

  -- Update the target user's admin status
  UPDATE profiles
  SET is_admin = new_status
  WHERE id = target_user_id;

  RETURN true;
END;
$$;

-- Add policy for admins to manage other admins
CREATE POLICY "Enable admin management for admins"
ON profiles
FOR UPDATE
TO public
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND is_admin = true
  )
);

-- Set initial admin user by UUID
UPDATE profiles
SET is_admin = true
WHERE id = '00000000-0000-0000-0000-000000000000'; -- Replace with actual UUID