-- Migration: Add abandoned carts table
-- Description: Table to track abandoned shopping carts from guest customers

-- Table pour stocker les paniers abandonnés des clients invités
CREATE TABLE IF NOT EXISTS abandoned_carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  address text,
  city text,
  state text,
  zip_code text,
  has_real_email boolean DEFAULT false,
  total_value decimal DEFAULT 0,
  total_abandoned integer DEFAULT 1,
  last_abandoned timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table pour stocker les articles des paniers abandonnés
CREATE TABLE IF NOT EXISTS abandoned_cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id uuid REFERENCES abandoned_carts(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  product_name text,
  product_price decimal,
  quantity integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_email ON abandoned_carts(email);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_phone ON abandoned_carts(phone);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_last_abandoned ON abandoned_carts(last_abandoned);
CREATE INDEX IF NOT EXISTS idx_abandoned_cart_items_cart_id ON abandoned_cart_items(cart_id);

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_abandoned_carts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at automatiquement
CREATE TRIGGER trigger_update_abandoned_carts_updated_at
  BEFORE UPDATE ON abandoned_carts
  FOR EACH ROW
  EXECUTE FUNCTION update_abandoned_carts_updated_at();

-- Fonction pour ajouter ou mettre à jour un panier abandonné
CREATE OR REPLACE FUNCTION add_or_update_abandoned_cart(
  p_name text,
  p_email text DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_address text DEFAULT NULL,
  p_city text DEFAULT NULL,
  p_state text DEFAULT NULL,
  p_zip_code text DEFAULT NULL,
  p_total_value decimal DEFAULT 0,
  p_has_real_email boolean DEFAULT false
)
RETURNS uuid AS $$
DECLARE
  cart_id uuid;
  existing_cart_id uuid;
BEGIN
  -- Chercher un panier existant avec le même email ou téléphone
  SELECT id INTO existing_cart_id
  FROM abandoned_carts
  WHERE (email = p_email AND p_email IS NOT NULL)
     OR (phone = p_phone AND p_phone IS NOT NULL)
  LIMIT 1;

  IF existing_cart_id IS NOT NULL THEN
    -- Mettre à jour le panier existant
    UPDATE abandoned_carts
    SET 
      name = COALESCE(p_name, name),
      email = COALESCE(p_email, email),
      phone = COALESCE(p_phone, phone),
      address = COALESCE(p_address, address),
      city = COALESCE(p_city, city),
      state = COALESCE(p_state, state),
      zip_code = COALESCE(p_zip_code, zip_code),
      has_real_email = COALESCE(p_has_real_email, has_real_email),
      total_value = p_total_value,
      total_abandoned = total_abandoned + 1,
      last_abandoned = now()
    WHERE id = existing_cart_id;
    
    cart_id := existing_cart_id;
  ELSE
    -- Créer un nouveau panier abandonné
    INSERT INTO abandoned_carts (
      name, email, phone, address, city, state, zip_code, 
      has_real_email, total_value, total_abandoned
    ) VALUES (
      p_name, p_email, p_phone, p_address, p_city, p_state, p_zip_code,
      p_has_real_email, p_total_value, 1
    ) RETURNING id INTO cart_id;
  END IF;

  RETURN cart_id;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir les statistiques des paniers abandonnés
CREATE OR REPLACE FUNCTION get_abandoned_cart_stats()
RETURNS TABLE (
  total_abandoned_customers bigint,
  total_abandoned_orders bigint,
  total_abandoned_value decimal,
  average_abandoned_value decimal
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_abandoned_customers,
    SUM(total_abandoned) as total_abandoned_orders,
    SUM(total_value) as total_abandoned_value,
    CASE 
      WHEN COUNT(*) > 0 THEN AVG(total_value)
      ELSE 0 
    END as average_abandoned_value
  FROM abandoned_carts;
END;
$$ LANGUAGE plpgsql;

-- Activer RLS sur les nouvelles tables
ALTER TABLE abandoned_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE abandoned_cart_items ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour abandoned_carts
CREATE POLICY "Admins can view all abandoned carts" ON abandoned_carts
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE is_admin = true
    )
  );

CREATE POLICY "Admins can insert abandoned carts" ON abandoned_carts
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT id FROM profiles WHERE is_admin = true
    )
  );

CREATE POLICY "Admins can update abandoned carts" ON abandoned_carts
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE is_admin = true
    )
  );

CREATE POLICY "Admins can delete abandoned carts" ON abandoned_carts
  FOR DELETE USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE is_admin = true
    )
  );

-- Politiques RLS pour abandoned_cart_items
CREATE POLICY "Admins can view all abandoned cart items" ON abandoned_cart_items
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE is_admin = true
    )
  );

CREATE POLICY "Admins can insert abandoned cart items" ON abandoned_cart_items
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT id FROM profiles WHERE is_admin = true
    )
  );

CREATE POLICY "Admins can update abandoned cart items" ON abandoned_cart_items
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE is_admin = true
    )
  );

CREATE POLICY "Admins can delete abandoned cart items" ON abandoned_cart_items
  FOR DELETE USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE is_admin = true
    )
  );

-- Commentaires pour la documentation
COMMENT ON TABLE abandoned_carts IS 'Paniers abandonnés des clients invités';
COMMENT ON TABLE abandoned_cart_items IS 'Articles des paniers abandonnés';
COMMENT ON FUNCTION add_or_update_abandoned_cart(text, text, text, text, text, text, text, decimal, boolean) IS 'Ajoute ou met à jour un panier abandonné';
COMMENT ON FUNCTION get_abandoned_cart_stats() IS 'Retourne les statistiques des paniers abandonnés'; 