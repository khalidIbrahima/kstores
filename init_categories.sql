-- Script pour initialiser les catégories de produits de base
-- Exécuter dans l'éditeur SQL de Supabase

-- Supprimer les catégories existantes (optionnel)
-- DELETE FROM categories;

-- Insérer les catégories de base
INSERT INTO categories (id, name, slug, cover_image_url) VALUES
  (gen_random_uuid(), 'Électronique', 'electronique', null),
  (gen_random_uuid(), 'Vêtements', 'vetements', null),
  (gen_random_uuid(), 'Maison & Jardin', 'maison-jardin', null),
  (gen_random_uuid(), 'Sport & Loisirs', 'sport-loisirs', null),
  (gen_random_uuid(), 'Livres & Médias', 'livres-medias', null),
  (gen_random_uuid(), 'Beauté & Santé', 'beaute-sante', null),
  (gen_random_uuid(), 'Automobile', 'automobile', null),
  (gen_random_uuid(), 'Jouets & Jeux', 'jouets-jeux', null),
  (gen_random_uuid(), 'Alimentation', 'alimentation', null),
  (gen_random_uuid(), 'Bricolage', 'bricolage', null)
ON CONFLICT (slug) DO NOTHING;

-- Vérifier que les catégories ont été créées
SELECT * FROM categories ORDER BY name;
