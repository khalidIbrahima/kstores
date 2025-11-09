/*
  # Ajouter le support des slugs pour les produits

  1. Modifications
    - Ajouter la colonne `slug` à la table `products`
    - Créer un index unique sur le slug
    - Générer des slugs pour les produits existants
    - Créer une fonction pour générer automatiquement des slugs

  2. Sécurité
    - Maintenir les politiques RLS existantes
*/

-- Ajouter la colonne slug à la table products
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS slug text;

-- Créer un index unique sur la colonne slug
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_slug 
ON products(slug) 
WHERE slug IS NOT NULL;

-- Fonction pour générer un slug à partir d'un nom
CREATE OR REPLACE FUNCTION generate_slug(input_text text, product_id uuid DEFAULT NULL)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 0;
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

-- Fonction pour mettre à jour automatiquement le slug lors de l'insertion/mise à jour
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

-- Créer le trigger pour mettre à jour automatiquement les slugs
DROP TRIGGER IF EXISTS trigger_update_product_slug ON products;
CREATE TRIGGER trigger_update_product_slug
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_product_slug();

-- Générer des slugs pour tous les produits existants qui n'en ont pas
UPDATE products 
SET slug = generate_slug(name, id)
WHERE slug IS NULL;

-- Fonction utilitaire pour trouver un produit par slug
CREATE OR REPLACE FUNCTION get_product_by_slug(input_slug text)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  product_uuid uuid;
  short_id text;
BEGIN
  -- Essayer de trouver directement par slug
  SELECT id INTO product_uuid
  FROM products 
  WHERE slug = input_slug;
  
  -- Si trouvé, retourner l'ID
  IF product_uuid IS NOT NULL THEN
    RETURN product_uuid;
  END IF;
  
  -- Si pas trouvé, essayer d'extraire l'ID court du slug
  short_id := substring(input_slug from '.*-([a-f0-9]{8})$');
  
  IF short_id IS NOT NULL THEN
    -- Chercher un produit dont l'ID se termine par ce short_id
    SELECT id INTO product_uuid
    FROM products 
    WHERE right(replace(id::text, '-', ''), 8) = short_id;
  END IF;
  
  RETURN product_uuid;
END;
$$;

-- Commentaires pour la documentation
COMMENT ON COLUMN products.slug IS 'URL-friendly identifier for the product, generated from the product name';
COMMENT ON FUNCTION generate_slug(text, uuid) IS 'Generates a URL-friendly slug from text with optional unique suffix';
COMMENT ON FUNCTION get_product_by_slug(text) IS 'Finds a product ID by its slug, with fallback to short ID extraction';
