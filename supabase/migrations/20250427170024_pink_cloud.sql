/*
  # Update RLS policies for profiles table

  1. Security Changes
    - Drop existing policies to avoid conflicts
    - Enable RLS on profiles table
    - Add policies for:
      - Users can insert their own profile
      - Users can view their own profile
      - Users can update their own profile
      - Admins can view all profiles
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can create their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to insert their own profile
CREATE POLICY "Users can create their own profile"
ON profiles
FOR INSERT
TO public
WITH CHECK (auth.uid() = id);

-- Allow users to view their own profile
CREATE POLICY "Users can view their own profile"
ON profiles
FOR SELECT
TO public
USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
ON profiles
FOR UPDATE
TO public
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles"
ON profiles
FOR SELECT
TO public
USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE is_admin = true
  )
);