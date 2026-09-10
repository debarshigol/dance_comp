import { createClient } from '@supabase/supabase-js';

const STORAGE_KEYS = {
  SUPABASE_URL: 'dance_comp_supabase_url',
  SUPABASE_KEY: 'dance_comp_supabase_anon_key'
};

export function getSupabaseConfig() {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const storedUrl = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.SUPABASE_URL) : null;
  const storedKey = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.SUPABASE_KEY) : null;

  const url = storedUrl || envUrl || '';
  const key = storedKey || envKey || '';

  return { url, key, isConfigured: Boolean(url && key && url.startsWith('http')) };
}

export function saveSupabaseConfig(url, key) {
  if (typeof window !== 'undefined') {
    if (url) localStorage.setItem(STORAGE_KEYS.SUPABASE_URL, url.trim());
    else localStorage.removeItem(STORAGE_KEYS.SUPABASE_URL);

    if (key) localStorage.setItem(STORAGE_KEYS.SUPABASE_KEY, key.trim());
    else localStorage.removeItem(STORAGE_KEYS.SUPABASE_KEY);
  }
}

let cachedClient = null;
let lastUrl = null;
let lastKey = null;

export function getSupabaseClient() {
  const { url, key, isConfigured } = getSupabaseConfig();

  if (!isConfigured) {
    return null;
  }

  if (cachedClient && lastUrl === url && lastKey === key) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    });
    lastUrl = url;
    lastKey = key;
    return cachedClient;
  } catch (err) {
    console.error('Failed to create Supabase client:', err);
    return null;
  }
}

export async function testSupabaseConnection(url, key) {
  try {
    const testClient = createClient(url, key);
    const { data, error } = await testClient.from('competition_rounds').select('id, name').limit(2);
    if (error) {
      // Check if table missing
      if (error.code === '42P01') {
        return { success: false, message: 'Connected to Supabase, but tables are missing. Please execute supabase_schema.sql in your Supabase SQL Editor.' };
      }
      return { success: false, message: error.message };
    }
    return { success: true, count: data?.length ?? 0 };
  } catch (err) {
    return { success: false, message: err.message };
  }
}
