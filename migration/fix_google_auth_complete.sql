-- Script complet pour corriger Google Auth
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Ajouter le champ google_id à la table profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS google_id TEXT UNIQUE;

-- 2. Créer un index pour de meilleures performances
CREATE INDEX IF NOT EXISTS idx_profiles_google_id ON profiles(google_id);

-- 3. Ajouter un commentaire pour la documentation
COMMENT ON COLUMN profiles.google_id IS 'Google OAuth user ID for linking Google accounts to Supabase profiles';

-- 4. Corriger les politiques RLS pour permettre la création de profils
-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Créer de nouvelles politiques plus permissives
CREATE POLICY "Enable read access for all users" ON profiles
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON profiles
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Enable update for users based on id" ON profiles
    FOR UPDATE USING (auth.uid() = id OR auth.role() = 'service_role');

CREATE POLICY "Enable delete for users based on id" ON profiles
    FOR DELETE USING (auth.uid() = id OR auth.role() = 'service_role');

-- 5. Vérifier que RLS est activé
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 6. Vérifier la structure de la table
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- 7. Vérifier les politiques RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- 8. Vérifier les contraintes
SELECT 
    constraint_name,
    constraint_type,
    table_name
FROM information_schema.table_constraints 
WHERE table_name = 'profiles'; 