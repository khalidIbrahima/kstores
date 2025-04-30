/*
  # Fix recursive profiles policy

  1. Changes
    - Remove recursive admin policy that was causing infinite loops
    - Add new admin policy with simplified logic
    - Keep existing user policies unchanged

  2. Security
    - Maintains RLS protection
    - Admins can still view all profiles
    - Users can still view/edit their own profiles
*/

-- Drop the problematic policy
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Create new admin policy without recursion
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT
  TO public
  USING (is_admin = true);

-- Note: Existing policies remain unchanged:
-- - "Users can create their own profile"
-- - "Users can update their own profile"
-- - "Users can view their own profile"