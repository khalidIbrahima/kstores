-- Add google_id column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS google_id TEXT UNIQUE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_google_id ON profiles(google_id);

-- Add comment for documentation
COMMENT ON COLUMN profiles.google_id IS 'Google OAuth user ID for linking Google accounts to Supabase profiles'; 