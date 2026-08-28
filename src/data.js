import { supabase } from './supabase';

export async function updateProfile(userId, values) {
  const { error } = await supabase.from('profiles').update(values).eq('id', userId);
  if (error) throw error;
}

export async function updateCouple(coupleId, values) {
  const { error } = await supabase.from('couples').update(values).eq('id', coupleId);
  if (error) throw error;
}

export async function loadDaily(coupleId, userId) {
  const { data: questions, error: questionError } = await supabase.from('daily_questions').select('id, prompt').order('id');
  if (questionError) throw questionError;
  if (!questions.length) return { question: null, answers: [] };
  const now = new Date();
  const localDay = Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000);
  const question = questions[localDay % questions.length];
  const { data: answers, error: answerError } = await supabase.from('answers').select('id, user_id, answer, created_at').eq('couple_id', coupleId).eq('question_id', question.id);
  if (answerError) throw answerError;
  return { question, answers: answers || [], ownAnswer: answers?.find((item) => item.user_id === userId) || null };
}

export async function saveAnswer(coupleId, questionId, userId, answer) {
  const { error } = await supabase.from('answers').upsert({ couple_id: coupleId, question_id: questionId, user_id: userId, answer }, { onConflict: 'question_id,user_id' });
  if (error) throw error;
}

export async function loadMemories(coupleId) {
  const { data, error } = await supabase.from('memories').select('*').eq('couple_id', coupleId).order('memory_date', { ascending: false });
  if (error) throw error;
  return Promise.all((data || []).map(async (memory) => {
    if (!memory.photo_path) return memory;
    const { data: signed } = await supabase.storage.from('memory-photos').createSignedUrl(memory.photo_path, 3600);
    return { ...memory, photo_url: signed?.signedUrl || null };
  }));
}

export async function addMemory({ coupleId, userId, title, note, memoryDate, file }) {
  let photoPath = null;
  if (file) {
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    photoPath = `${coupleId}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from('memory-photos').upload(photoPath, file, { cacheControl: '3600', upsert: false });
    if (uploadError) throw uploadError;
  }
  const { error } = await supabase.from('memories').insert({ couple_id: coupleId, created_by: userId, title, note, memory_date: memoryDate, photo_path: photoPath });
  if (error) {
    if (photoPath) await supabase.storage.from('memory-photos').remove([photoPath]);
    throw error;
  }
}

export async function loadDatePlans(coupleId) {
  const { data, error } = await supabase.from('date_plans').select('*').eq('couple_id', coupleId).order('planned_for', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function addDatePlan({ coupleId, userId, title, details, plannedFor }) {
  const { error } = await supabase.from('date_plans').insert({ couple_id: coupleId, created_by: userId, title, details, planned_for: new Date(plannedFor).toISOString() });
  if (error) throw error;
}

export function distanceMiles(a, b) {
  if ([a?.latitude, a?.longitude, b?.latitude, b?.longitude].some((value) => value == null)) return null;
  const radians = (degrees) => degrees * Math.PI / 180;
  const earthMiles = 3958.8;
  const dLat = radians(b.latitude - a.latitude);
  const dLon = radians(b.longitude - a.longitude);
  const lat1 = radians(a.latitude);
  const lat2 = radians(b.latitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return Math.round(earthMiles * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)));
}
