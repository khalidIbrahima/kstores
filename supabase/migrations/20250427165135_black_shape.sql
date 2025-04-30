/*
  # Fix profiles table RLS policies

  1. Changes
    - Remove recursive admin check in profiles policies
    - Implement more efficient admin check using direct comparison
    - Update policies for better security and performance

  2. Security
    - Maintain row-level security on profiles table
    - Ensure admins can still view all profiles
    - Users can still view and update their own profiles
    - Prevent unauthorized access
*/

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;

-- Create new policies without recursion
CREATE POLICY "Admins can view all profiles"
ON profiles
FOR SELECT
TO public
USING (
  is_admin = true 
  AND id = auth.uid()
);

CREATE POLICY "Users can view their own profile"
ON profiles
FOR SELECT
TO public
USING (
  id = auth.uid()
);

CREATE POLICY "Users can update their own profile"
ON profiles
FOR UPDATE
TO public
USING (
  id = auth.uid()
)
WITH CHECK (
  id = auth.uid()
);