-- Script pour corriger le problème d'UUID avec Google Auth
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Ajouter le champ google_id à la table profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS google_id TEXT UNIQUE;

-- 2. Créer un index pour de meilleures performances
CREATE INDEX IF NOT EXISTS idx_profiles_google_id ON profiles(google_id);

-- 3. Ajouter un commentaire pour la documentation
COMMENT ON COLUMN profiles.google_id IS 'Google OAuth user ID for linking Google accounts to Supabase profiles';

-- 4. Vérifier la structure de la table
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- 5. Vérifier les contraintes
SELECT 
    constraint_name,
    constraint_type,
    table_name
FROM information_schema.table_constraints 
WHERE table_name = 'profiles'; 