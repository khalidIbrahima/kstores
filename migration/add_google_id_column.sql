-- Script pour ajouter la colonne google_id à la table profiles
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Ajouter le champ google_id à la table profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS google_id TEXT UNIQUE;

-- 2. Créer un index pour de meilleures performances
CREATE INDEX IF NOT EXISTS idx_profiles_google_id ON profiles(google_id);

-- 3. Ajouter un commentaire pour la documentation
COMMENT ON COLUMN profiles.google_id IS 'Google OAuth user ID for linking Google accounts to Supabase profiles';

-- 4. Vérifier que le champ a été ajouté
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'google_id';

-- 5. Vérifier l'index créé
SELECT indexname, indexdef
FROM pg_indexes 
WHERE tablename = 'profiles' AND indexname = 'idx_profiles_google_id'; 