-- Correction rapide Google Auth
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Ajouter le champ google_id
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS google_id TEXT;

-- 2. Créer l'index
CREATE INDEX IF NOT EXISTS idx_profiles_google_id ON profiles(google_id);

-- 3. Vérifier que le champ a été ajouté
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'google_id'; 