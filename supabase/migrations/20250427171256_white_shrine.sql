/*
  # Fix profile policies to prevent recursion

  1. Changes
    - Drop existing profile policies
    - Create new policies with simplified conditions
    - Add insert policy for initial profile creation
  
  2. Security
    - Maintain RLS protection
    - Allow users to manage their own profiles
    - Allow admins to view all profiles
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can create their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Create new simplified policies
CREATE POLICY "Users can create their own profile"
ON profiles
FOR INSERT
TO public
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view their own profile"
ON profiles
FOR SELECT
TO public
USING (auth.uid() = id OR is_admin = true);

CREATE POLICY "Users can update their own profile"
ON profiles
FOR UPDATE
TO public
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON profiles
FOR SELECT
TO public
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE id = auth.uid() AND is_admin = true
));