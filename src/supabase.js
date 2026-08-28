import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(url && anonKey);
export const supabase = supabaseConfigured
  ? createClient(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;

export async function loadCouple(userId) {
  const { data, error } = await supabase
    .from('couple_members')
    .select('couple_id, couples(*)')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data?.couples ?? null;
}

export async function createCouple(name, reunionDate) {
  const { data, error } = await supabase.rpc('create_couple', {
    couple_name: name,
    reunion_at: reunionDate || null,
  });
  if (error) throw error;
  return data;
}

export async function joinCouple(inviteCode) {
  const { data, error } = await supabase.rpc('join_couple', { code: inviteCode.trim().toUpperCase() });
  if (error) throw error;
  return data;
}
