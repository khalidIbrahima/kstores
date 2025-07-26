-- Migration pour créer la table abandoned_cart_notifications
-- Date: 2025-01-01

-- Créer la table abandoned_cart_notifications
CREATE TABLE IF NOT EXISTS public.abandoned_cart_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cart_id UUID NOT NULL REFERENCES public.abandoned_carts(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL CHECK (notification_type IN ('whatsapp', 'email', 'sms')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'delivered')),
    message_content TEXT,
    recipient_phone TEXT,
    recipient_email TEXT,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivered_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Créer les index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_abandoned_cart_notifications_cart_id ON public.abandoned_cart_notifications(cart_id);
CREATE INDEX IF NOT EXISTS idx_abandoned_cart_notifications_status ON public.abandoned_cart_notifications(status);
CREATE INDEX IF NOT EXISTS idx_abandoned_cart_notifications_sent_at ON public.abandoned_cart_notifications(sent_at);
CREATE INDEX IF NOT EXISTS idx_abandoned_cart_notifications_type ON public.abandoned_cart_notifications(notification_type);

-- Créer la fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_abandoned_cart_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger pour updated_at
CREATE TRIGGER trigger_update_abandoned_cart_notifications_updated_at
    BEFORE UPDATE ON public.abandoned_cart_notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_abandoned_cart_notifications_updated_at();

-- Activer RLS (Row Level Security)
ALTER TABLE public.abandoned_cart_notifications ENABLE ROW LEVEL SECURITY;

-- Politique RLS pour les admins (lecture et écriture complètes)
CREATE POLICY "Admins can manage abandoned cart notifications" ON public.abandoned_cart_notifications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Politique RLS pour les utilisateurs (lecture seule de leurs propres notifications)
CREATE POLICY "Users can view their own abandoned cart notifications" ON public.abandoned_cart_notifications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.abandoned_carts 
            WHERE abandoned_carts.id = abandoned_cart_notifications.cart_id 
            AND abandoned_carts.user_id = auth.uid()
        )
    );

-- Fonction pour créer une notification de panier abandonné
CREATE OR REPLACE FUNCTION create_abandoned_cart_notification(
    p_cart_id UUID,
    p_notification_type TEXT,
    p_message_content TEXT,
    p_recipient_phone TEXT DEFAULT NULL,
    p_recipient_email TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO public.abandoned_cart_notifications (
        cart_id,
        notification_type,
        message_content,
        recipient_phone,
        recipient_email,
        status
    ) VALUES (
        p_cart_id,
        p_notification_type,
        p_message_content,
        p_recipient_phone,
        p_recipient_email,
        'pending'
    ) RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour marquer une notification comme envoyée
CREATE OR REPLACE FUNCTION mark_notification_sent(
    p_notification_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.abandoned_cart_notifications
    SET 
        status = 'sent',
        sent_at = NOW(),
        updated_at = NOW()
    WHERE id = p_notification_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour marquer une notification comme échouée
CREATE OR REPLACE FUNCTION mark_notification_failed(
    p_notification_id UUID,
    p_error_message TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.abandoned_cart_notifications
    SET 
        status = 'failed',
        error_message = p_error_message,
        retry_count = retry_count + 1,
        updated_at = NOW()
    WHERE id = p_notification_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour marquer une notification comme livrée
CREATE OR REPLACE FUNCTION mark_notification_delivered(
    p_notification_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.abandoned_cart_notifications
    SET 
        status = 'delivered',
        delivered_at = NOW(),
        updated_at = NOW()
    WHERE id = p_notification_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les statistiques des notifications
CREATE OR REPLACE FUNCTION get_abandoned_cart_notification_stats()
RETURNS JSON AS $$
DECLARE
    stats JSON;
BEGIN
    SELECT json_build_object(
        'total', COALESCE(total_count, 0),
        'sent', COALESCE(sent_count, 0),
        'failed', COALESCE(failed_count, 0),
        'whatsapp', COALESCE(whatsapp_count, 0),
        'email', COALESCE(email_count, 0),
        'today', COALESCE(today_count, 0),
        'recovery_rate', COALESCE(recovery_rate, 0)
    ) INTO stats
    FROM (
        SELECT 
            COUNT(*) as total_count,
            COUNT(*) FILTER (WHERE status = 'sent' OR status = 'delivered') as sent_count,
            COUNT(*) FILTER (WHERE status = 'failed') as failed_count,
            COUNT(*) FILTER (WHERE notification_type = 'whatsapp') as whatsapp_count,
            COUNT(*) FILTER (WHERE notification_type = 'email') as email_count,
            COUNT(*) FILTER (WHERE DATE(sent_at) = CURRENT_DATE) as today_count,
            CASE 
                WHEN COUNT(*) > 0 THEN 
                    ROUND(
                        (COUNT(*) FILTER (WHERE status = 'delivered'))::DECIMAL / COUNT(*) * 100, 2
                    )
                ELSE 0 
            END as recovery_rate
        FROM public.abandoned_cart_notifications
    ) stats_subquery;
    
    RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaires pour la documentation
COMMENT ON TABLE public.abandoned_cart_notifications IS 'Table pour stocker l''historique des notifications de paniers abandonnés';
COMMENT ON COLUMN public.abandoned_cart_notifications.id IS 'Identifiant unique de la notification';
COMMENT ON COLUMN public.abandoned_cart_notifications.cart_id IS 'Référence vers le panier abandonné';
COMMENT ON COLUMN public.abandoned_cart_notifications.notification_type IS 'Type de notification (whatsapp, email, sms)';
COMMENT ON COLUMN public.abandoned_cart_notifications.status IS 'Statut de la notification (pending, sent, failed, delivered)';
COMMENT ON COLUMN public.abandoned_cart_notifications.message_content IS 'Contenu du message envoyé';
COMMENT ON COLUMN public.abandoned_cart_notifications.recipient_phone IS 'Numéro de téléphone du destinataire';
COMMENT ON COLUMN public.abandoned_cart_notifications.recipient_email IS 'Email du destinataire';
COMMENT ON COLUMN public.abandoned_cart_notifications.sent_at IS 'Date et heure d''envoi';
COMMENT ON COLUMN public.abandoned_cart_notifications.delivered_at IS 'Date et heure de livraison';
COMMENT ON COLUMN public.abandoned_cart_notifications.error_message IS 'Message d''erreur en cas d''échec';
COMMENT ON COLUMN public.abandoned_cart_notifications.retry_count IS 'Nombre de tentatives d''envoi';
COMMENT ON COLUMN public.abandoned_cart_notifications.max_retries IS 'Nombre maximum de tentatives autorisées'; 