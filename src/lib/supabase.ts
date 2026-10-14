import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Read from env or local config storage
const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export function getCustomSupabaseConfig(): { url: string; anonKey: string } | null {
  try {
    const raw = localStorage.getItem('the_journal_supabase_config');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.url && parsed.anonKey) {
        return parsed;
      }
    }
  } catch {
    // Ignore JSON parse errors
  }
  return null;
}

export function saveCustomSupabaseConfig(url: string, anonKey: string) {
  localStorage.setItem('the_journal_supabase_config', JSON.stringify({ url: url.trim(), anonKey: anonKey.trim() }));
}

export function clearCustomSupabaseConfig() {
  localStorage.removeItem('the_journal_supabase_config');
}

export function getActiveSupabaseCredentials(): { url: string; anonKey: string; isLive: boolean } {
  const custom = getCustomSupabaseConfig();
  if (custom && custom.url && custom.anonKey) {
    return { url: custom.url, anonKey: custom.anonKey, isLive: true };
  }
  if (envUrl && envKey && !envUrl.includes('your-project') && !envKey.includes('your-anon-key')) {
    return { url: envUrl, anonKey: envKey, isLive: true };
  }
  return { url: '', anonKey: '', isLive: false };
}

let cachedClient: SupabaseClient | null = null;
let lastUsedConfigStr = '';

export function getSupabaseClient(): SupabaseClient | null {
  const creds = getActiveSupabaseCredentials();
  if (!creds.isLive) {
    return null;
  }

  const configStr = `${creds.url}:::${creds.anonKey}`;
  if (cachedClient && lastUsedConfigStr === configStr) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(creds.url, creds.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    lastUsedConfigStr = configStr;
    return cachedClient;
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err);
    return null;
  }
}
