-- Script pour corriger les politiques RLS de la table profiles
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON profiles;
DROP POLICY IF EXISTS "Enable delete for users based on id" ON profiles;

-- 2. Créer de nouvelles politiques plus permissives pour Google Auth
-- Politique de lecture : permettre la lecture pour tous
CREATE POLICY "Enable read access for all users" ON profiles
    FOR SELECT USING (true);

-- Politique d'insertion : permettre l'insertion pour tous (nécessaire pour Google Auth)
CREATE POLICY "Enable insert for all users" ON profiles
    FOR INSERT WITH CHECK (true);

-- Politique de mise à jour : permettre la mise à jour pour l'utilisateur lui-même ou service_role
CREATE POLICY "Enable update for users based on id" ON profiles
    FOR UPDATE USING (true);

-- Politique de suppression : permettre la suppression pour l'utilisateur lui-même ou service_role
CREATE POLICY "Enable delete for users based on id" ON profiles
    FOR DELETE USING (true);

-- 3. Vérifier que RLS est activé
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 4. Vérifier les politiques créées
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

-- 5. Vérifier la structure de la table
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position; 