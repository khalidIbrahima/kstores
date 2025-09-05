-- Script SQL à exécuter directement dans l'interface Supabase
-- Dashboard Supabase > SQL Editor > Nouvelle requête

-- 1. Ajouter la colonne slug si elle n'existe pas
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS slug text;

-- 2. Créer un index unique sur la colonne slug
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_slug 
ON products(slug) 
WHERE slug IS NOT NULL;

-- 3. Fonction pour générer un slug à partir d'un nom
CREATE OR REPLACE FUNCTION generate_slug(input_text text, product_id uuid DEFAULT NULL)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  base_slug text;
  final_slug text;
  short_id text;
BEGIN
  -- Nettoyer et normaliser le texte d'entrée
  base_slug := lower(trim(input_text));
  
  -- Remplacer les caractères spéciaux français
  base_slug := replace(base_slug, 'à', 'a');
  base_slug := replace(base_slug, 'á', 'a');
  base_slug := replace(base_slug, 'â', 'a');
  base_slug := replace(base_slug, 'ã', 'a');
  base_slug := replace(base_slug, 'ä', 'a');
  base_slug := replace(base_slug, 'å', 'a');
  base_slug := replace(base_slug, 'è', 'e');
  base_slug := replace(base_slug, 'é', 'e');
  base_slug := replace(base_slug, 'ê', 'e');
  base_slug := replace(base_slug, 'ë', 'e');
  base_slug := replace(base_slug, 'ì', 'i');
  base_slug := replace(base_slug, 'í', 'i');
  base_slug := replace(base_slug, 'î', 'i');
  base_slug := replace(base_slug, 'ï', 'i');
  base_slug := replace(base_slug, 'ò', 'o');
  base_slug := replace(base_slug, 'ó', 'o');
  base_slug := replace(base_slug, 'ô', 'o');
  base_slug := replace(base_slug, 'õ', 'o');
  base_slug := replace(base_slug, 'ö', 'o');
  base_slug := replace(base_slug, 'ù', 'u');
  base_slug := replace(base_slug, 'ú', 'u');
  base_slug := replace(base_slug, 'û', 'u');
  base_slug := replace(base_slug, 'ü', 'u');
  base_slug := replace(base_slug, 'ý', 'y');
  base_slug := replace(base_slug, 'ÿ', 'y');
  base_slug := replace(base_slug, 'ñ', 'n');
  base_slug := replace(base_slug, 'ç', 'c');
  base_slug := replace(base_slug, 'œ', 'oe');
  base_slug := replace(base_slug, 'æ', 'ae');
  
  -- Supprimer tous les caractères non alphanumériques et espaces
  base_slug := regexp_replace(base_slug, '[^a-z0-9 ]', '', 'g');
  
  -- Remplacer les espaces par des tirets
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  
  -- Supprimer les tirets multiples
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  
  -- Supprimer les tirets au début et à la fin
  base_slug := trim(base_slug, '-');
  
  -- Limiter la longueur à 50 caractères
  base_slug := left(base_slug, 50);
  base_slug := trim(base_slug, '-');
  
  -- Si le slug est vide, utiliser 'produit'
  IF base_slug = '' OR base_slug IS NULL THEN
    base_slug := 'produit';
  END IF;
  
  -- Ajouter un suffixe unique basé sur l'ID du produit si fourni
  IF product_id IS NOT NULL THEN
    short_id := right(replace(product_id::text, '-', ''), 8);
    final_slug := base_slug || '-' || short_id;
  ELSE
    final_slug := base_slug;
  END IF;
  
  RETURN final_slug;
END;
$$;

-- 4. Créer le trigger pour mettre à jour automatiquement les slugs
CREATE OR REPLACE FUNCTION update_product_slug()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Générer un slug uniquement si il n'existe pas déjà ou si le nom a changé
  IF NEW.slug IS NULL OR (TG_OP = 'UPDATE' AND OLD.name != NEW.name AND NEW.slug = OLD.slug) THEN
    NEW.slug := generate_slug(NEW.name, NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- 5. Appliquer le trigger
DROP TRIGGER IF EXISTS trigger_update_product_slug ON products;
CREATE TRIGGER trigger_update_product_slug
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_product_slug();

-- 6. Générer des slugs pour tous les produits existants
UPDATE products 
SET slug = generate_slug(name, id)
WHERE slug IS NULL;

-- 7. Vérifier les résultats
SELECT id, name, slug 
FROM products 
WHERE slug IS NOT NULL 
LIMIT 10;
