/*
  # Set Admin User by Email

  1. Changes
    - Set admin flag in user metadata for specific email
*/

BEGIN;

-- Update user metadata to set admin flag
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object('is_admin', true)
WHERE email = 'khalidou.sowba@outlook.com';

COMMIT;