-- Migration: Add abandoned cart notifications system
-- Description: Tables and functions for managing abandoned cart notifications

-- Table pour stocker les notifications de paniers abandonnés
CREATE TABLE IF NOT EXISTS abandoned_cart_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id uuid REFERENCES abandoned_carts(id) ON DELETE CASCADE,
  customer_phone text,
  customer_email text,
  customer_name text,
  notification_type text NOT NULL CHECK (notification_type IN ('whatsapp', 'email', 'sms')),
  message_content text,
  error_message text,
  sent_at timestamptz DEFAULT now(),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'delivered')),
  delivery_confirmation timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Table pour les liens de récupération de panier
CREATE TABLE IF NOT EXISTS cart_recovery_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id uuid REFERENCES abandoned_carts(id) ON DELETE CASCADE,
  recovery_token text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  is_used boolean DEFAULT false,
  used_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Table pour les campagnes de récupération
CREATE TABLE IF NOT EXISTS cart_recovery_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  target_hours integer DEFAULT 24, -- Heures après abandon
  notification_type text DEFAULT 'whatsapp' CHECK (notification_type IN ('whatsapp', 'email', 'sms')),
  message_template text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_abandoned_cart_notifications_cart_id ON abandoned_cart_notifications(cart_id);
CREATE INDEX IF NOT EXISTS idx_abandoned_cart_notifications_sent_at ON abandoned_cart_notifications(sent_at);
CREATE INDEX IF NOT EXISTS idx_abandoned_cart_notifications_status ON abandoned_cart_notifications(status);
CREATE INDEX IF NOT EXISTS idx_cart_recovery_links_token ON cart_recovery_links(recovery_token);
CREATE INDEX IF NOT EXISTS idx_cart_recovery_links_expires ON cart_recovery_links(expires_at);

-- Fonction pour nettoyer les liens de récupération expirés
CREATE OR REPLACE FUNCTION cleanup_expired_recovery_links()
RETURNS void AS $$
BEGIN
  DELETE FROM cart_recovery_links 
  WHERE expires_at < now() AND is_used = false;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour nettoyer automatiquement les liens expirés
CREATE OR REPLACE FUNCTION trigger_cleanup_expired_links()
RETURNS TRIGGER AS $$
BEGIN
  -- Nettoyer les liens expirés lors de l'insertion d'un nouveau lien
  PERFORM cleanup_expired_recovery_links();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cleanup_expired_recovery_links
  AFTER INSERT ON cart_recovery_links
  FOR EACH ROW
  EXECUTE FUNCTION trigger_cleanup_expired_links();

-- Fonction pour obtenir les paniers abandonnés éligibles pour notification
CREATE OR REPLACE FUNCTION get_eligible_abandoned_carts(hours_threshold integer DEFAULT 24)
RETURNS TABLE (
  cart_id uuid,
  customer_name text,
  customer_phone text,
  customer_email text,
  total_value decimal,
  last_abandoned timestamptz,
  notification_count integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ac.id as cart_id,
    ac.name as customer_name,
    ac.phone as customer_phone,
    ac.email as customer_email,
    ac.total_value,
    ac.last_abandoned,
    COALESCE(COUNT(acn.id), 0) as notification_count
  FROM abandoned_carts ac
  LEFT JOIN abandoned_cart_notifications acn ON ac.id = acn.cart_id
  WHERE ac.last_abandoned >= now() - interval '1 hour' * hours_threshold
    AND (ac.phone IS NOT NULL OR (ac.email IS NOT NULL AND ac.has_real_email = true))
  GROUP BY ac.id, ac.name, ac.phone, ac.email, ac.total_value, ac.last_abandoned
  HAVING COUNT(acn.id) < 3 -- Maximum 3 notifications par panier
  ORDER BY ac.last_abandoned DESC;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour marquer un lien de récupération comme utilisé
CREATE OR REPLACE FUNCTION use_recovery_link(token text)
RETURNS uuid AS $$
DECLARE
  cart_uuid uuid;
BEGIN
  UPDATE cart_recovery_links 
  SET is_used = true, used_at = now()
  WHERE recovery_token = token 
    AND expires_at > now() 
    AND is_used = false
  RETURNING cart_id INTO cart_uuid;
  
  RETURN cart_uuid;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir les statistiques des notifications
CREATE OR REPLACE FUNCTION get_notification_stats()
RETURNS TABLE (
  total_notifications bigint,
  sent_notifications bigint,
  failed_notifications bigint,
  whatsapp_notifications bigint,
  email_notifications bigint,
  today_notifications bigint,
  recovery_rate decimal
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_notifications,
    COUNT(*) FILTER (WHERE status = 'sent') as sent_notifications,
    COUNT(*) FILTER (WHERE status = 'failed') as failed_notifications,
    COUNT(*) FILTER (WHERE notification_type = 'whatsapp') as whatsapp_notifications,
    COUNT(*) FILTER (WHERE notification_type = 'email') as email_notifications,
    COUNT(*) FILTER (WHERE sent_at >= date_trunc('day', now())) as today_notifications,
    CASE 
      WHEN COUNT(*) > 0 THEN 
        (COUNT(*) FILTER (WHERE status = 'sent')::decimal / COUNT(*)::decimal) * 100
      ELSE 0 
    END as recovery_rate
  FROM abandoned_cart_notifications;
END;
$$ LANGUAGE plpgsql;

-- Insérer des campagnes de récupération par défaut
INSERT INTO cart_recovery_campaigns (name, description, target_hours, notification_type, message_template) VALUES
('Récupération 24h', 'Notification WhatsApp 24h après abandon', 24, 'whatsapp', 'Votre panier vous attend ! -10% si vous commandez dans les 24h'),
('Récupération 48h', 'Notification WhatsApp 48h après abandon', 48, 'whatsapp', 'Dernière chance ! Votre panier expire bientôt'),
('Récupération Email', 'Notification par email 24h après abandon', 24, 'email', 'Votre panier vous attend sur Kapital Stores');

-- Activer RLS sur les nouvelles tables
ALTER TABLE abandoned_cart_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_recovery_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_recovery_campaigns ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour abandoned_cart_notifications
CREATE POLICY "Admins can view all abandoned cart notifications" ON abandoned_cart_notifications
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE is_admin = true
    )
  );

CREATE POLICY "Admins can insert abandoned cart notifications" ON abandoned_cart_notifications
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT id FROM profiles WHERE is_admin = true
    )
  );

CREATE POLICY "Admins can update abandoned cart notifications" ON abandoned_cart_notifications
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE is_admin = true
    )
  );

-- Politiques RLS pour cart_recovery_links
CREATE POLICY "Anyone can view recovery links by token" ON cart_recovery_links
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage recovery links" ON cart_recovery_links
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE is_admin = true
    )
  );

-- Politiques RLS pour cart_recovery_campaigns
CREATE POLICY "Admins can manage recovery campaigns" ON cart_recovery_campaigns
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE is_admin = true
    )
  );

-- Commentaires pour la documentation
COMMENT ON TABLE abandoned_cart_notifications IS 'Historique des notifications envoyées pour les paniers abandonnés';
COMMENT ON TABLE cart_recovery_links IS 'Liens de récupération uniques pour les paniers abandonnés';
COMMENT ON TABLE cart_recovery_campaigns IS 'Campagnes de récupération de paniers abandonnés';
COMMENT ON FUNCTION get_eligible_abandoned_carts(integer) IS 'Récupère les paniers abandonnés éligibles pour notification';
COMMENT ON FUNCTION use_recovery_link(text) IS 'Marque un lien de récupération comme utilisé et retourne l\'ID du panier';
COMMENT ON FUNCTION get_notification_stats() IS 'Retourne les statistiques des notifications de paniers abandonnés'; 