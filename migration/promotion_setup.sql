-- Ajout des champs de promotion aux produits
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS old_price decimal DEFAULT NULL,
ADD COLUMN IF NOT EXISTS promotion_active boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS promotion_start_date timestamptz DEFAULT NULL,
ADD COLUMN IF NOT EXISTS promotion_end_date timestamptz DEFAULT NULL,
ADD COLUMN IF NOT EXISTS promotion_percentage integer DEFAULT NULL;

-- Suppression des contraintes existantes si elles existent (pour éviter les erreurs)
DO $$ 
BEGIN
    -- Supprimer les contraintes si elles existent
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'check_promotion_price') THEN
        ALTER TABLE products DROP CONSTRAINT check_promotion_price;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'check_promotion_percentage') THEN
        ALTER TABLE products DROP CONSTRAINT check_promotion_percentage;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'check_promotion_dates') THEN
        ALTER TABLE products DROP CONSTRAINT check_promotion_dates;
    END IF;
END $$;

-- Ajout des contraintes pour valider les données de promotion
ALTER TABLE products 
ADD CONSTRAINT check_promotion_price 
CHECK (
  (promotion_active = false) OR 
  (promotion_active = true AND old_price IS NOT NULL AND old_price > price)
);

ALTER TABLE products 
ADD CONSTRAINT check_promotion_percentage 
CHECK (
  promotion_percentage IS NULL OR 
  (promotion_percentage >= 0 AND promotion_percentage <= 100)
);

ALTER TABLE products 
ADD CONSTRAINT check_promotion_dates 
CHECK (
  (promotion_start_date IS NULL AND promotion_end_date IS NULL) OR
  (promotion_start_date IS NOT NULL AND promotion_end_date IS NOT NULL AND promotion_start_date < promotion_end_date)
);

-- Fonction pour calculer automatiquement le prix de promotion
CREATE OR REPLACE FUNCTION calculate_promotion_price()
RETURNS TRIGGER AS $$
BEGIN
  -- Si la promotion est activée et old_price n'est pas défini, le définir au prix actuel
  IF NEW.promotion_active = true AND NEW.old_price IS NULL THEN
    NEW.old_price := NEW.price;
  END IF;
  
  -- Si le pourcentage de promotion est défini, calculer le nouveau prix
  IF NEW.promotion_percentage IS NOT NULL AND NEW.old_price IS NOT NULL THEN
    NEW.price := NEW.old_price * (1 - NEW.promotion_percentage / 100.0);
  END IF;
  
  -- Si la promotion est désactivée, restaurer l'ancien prix
  IF NEW.promotion_active = false AND OLD.promotion_active = true THEN
    NEW.price := NEW.old_price;
    NEW.old_price := NULL;
    NEW.promotion_percentage := NULL;
    NEW.promotion_start_date := NULL;
    NEW.promotion_end_date := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour gérer automatiquement les calculs de prix de promotion
DROP TRIGGER IF EXISTS trigger_calculate_promotion_price ON products;
CREATE TRIGGER trigger_calculate_promotion_price
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION calculate_promotion_price();

-- Fonction pour vérifier si une promotion est actuellement active selon les dates
CREATE OR REPLACE FUNCTION is_promotion_active(p_product_id uuid)
RETURNS boolean AS $$
DECLARE
  v_promotion_active boolean;
  v_start_date timestamptz;
  v_end_date timestamptz;
BEGIN
  SELECT promotion_active, promotion_start_date, promotion_end_date
  INTO v_promotion_active, v_start_date, v_end_date
  FROM products
  WHERE id = p_product_id;
  
  -- Retourner false si aucun produit trouvé ou promotion non active
  IF v_promotion_active IS NULL OR v_promotion_active = false THEN
    RETURN false;
  END IF;
  
  -- Si aucune date définie, retourner la valeur promotion_active
  IF v_start_date IS NULL AND v_end_date IS NULL THEN
    RETURN v_promotion_active;
  END IF;
  
  -- Vérifier si l'heure actuelle est dans la période de promotion
  RETURN now() >= COALESCE(v_start_date, '1900-01-01'::timestamptz) 
         AND now() <= COALESCE(v_end_date, '2100-01-01'::timestamptz);
END;
$$ LANGUAGE plpgsql;

-- Vue pour les produits avec promotions actives
CREATE OR REPLACE VIEW products_with_promotions AS
SELECT 
  p.*,
  CASE 
    WHEN is_promotion_active(p.id) THEN true
    ELSE false
  END as is_currently_promoted,
  CASE 
    WHEN is_promotion_active(p.id) AND p.old_price IS NOT NULL THEN p.old_price
    ELSE NULL
  END as display_old_price
FROM products p;

-- Commentaires pour la documentation
COMMENT ON COLUMN products.old_price IS 'Prix original avant promotion';
COMMENT ON COLUMN products.promotion_active IS 'Si la promotion est activée';
COMMENT ON COLUMN products.promotion_start_date IS 'Quand la promotion commence (NULL = pas de date de début)';
COMMENT ON COLUMN products.promotion_end_date IS 'Quand la promotion se termine (NULL = pas de date de fin)';
COMMENT ON COLUMN products.promotion_percentage IS 'Pourcentage de réduction (0-100)';

-- Message de confirmation
SELECT 'Promotion system setup completed successfully!' as status;

-- Exemple d'insertion d'un produit avec promotion (à supprimer après test)
-- INSERT INTO products (name, description, price, inventory, category_id, promotion_active, promotion_percentage) 
-- VALUES ('Produit Test Promotion', 'Description du produit test', 1000.00, 10, 'category-id-here', true, 20); 