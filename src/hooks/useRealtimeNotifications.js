import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useRealtimeNotifications(userId) {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let query = supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (userId) query = query.eq('user_id', userId);

    query.then(({ data }) => setNotifications(data || []));

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: userId ? `user_id=eq.${userId}` : undefined
        },
        (payload) => {
          setNotifications((prev) => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const unreadNotifications = notifications.filter(n => !n.is_read);
  const unreadCount = unreadNotifications.length;

  return { notifications, unreadNotifications, unreadCount, setNotifications, open, setOpen };
} 