-- Script pour corriger les politiques RLS de la table favorites
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Vérifier les politiques existantes sur la table favorites
SELECT 
    policyname,
    cmd,
    permissive,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'favorites';

-- 2. Supprimer les anciennes politiques problématiques
DROP POLICY IF EXISTS "Users can manage their own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can view their own favorites" ON favorites;

-- 3. Créer de nouvelles politiques plus permissives
-- Politique pour permettre l'insertion de favoris
CREATE POLICY "Users can insert favorites"
ON favorites
FOR INSERT
TO public
WITH CHECK (true);

-- Politique pour permettre la sélection de favoris
CREATE POLICY "Users can view favorites"
ON favorites
FOR SELECT
TO public
USING (true);

-- Politique pour permettre la mise à jour de favoris
CREATE POLICY "Users can update favorites"
ON favorites
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- Politique pour permettre la suppression de favoris
CREATE POLICY "Users can delete favorites"
ON favorites
FOR DELETE
TO public
USING (true);

-- 4. Vérifier que les nouvelles politiques ont été créées
SELECT 
    policyname,
    cmd,
    permissive,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'favorites';

-- 5. Vérifier la structure de la table favorites
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'favorites' 
ORDER BY ordinal_position; 