import { supabase } from './supabase';

export async function createNotification({ user_id, type, data }) {
  return await supabase.from('notifications').insert([
    {
      user_id,
      type,
      data,
      is_read: false
    }
  ]);
} 