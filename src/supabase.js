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
  if (!data?.couples) return null;

  const { data: memberships, error: memberError } = await supabase
    .from('couple_members')
    .select('user_id, joined_at')
    .eq('couple_id', data.couple_id)
    .order('joined_at');
  if (memberError) throw memberError;

  const ids = memberships.map((member) => member.user_id);
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, display_name, timezone, city, address_label, latitude, longitude')
    .in('id', ids);
  if (profileError) throw profileError;

  return {
    ...data.couples,
    members: memberships.map((member) => ({
      ...member,
      ...(profiles.find((profile) => profile.id === member.user_id) || {}),
    })),
  };
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
