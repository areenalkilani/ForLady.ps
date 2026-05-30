import { createClient } from '@supabase/supabase-js';

const supabaseUrl = String(import.meta.env.VITE_SUPABASE_URL || '').trim().replace(/\/+$/, '');
const supabaseAnonKey = String(import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();
const isJwtAnonKey = supabaseAnonKey.split('.').length === 3 && supabaseAnonKey.length > 100;
const isPublishableKey = supabaseAnonKey.startsWith('sb_publishable_');

function isValidUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    isValidUrl(supabaseUrl) &&
    (isJwtAnonKey || isPublishableKey) &&
    !supabaseUrl.includes('YOUR_PROJECT') &&
    !supabaseAnonKey.includes('YOUR_ANON_KEY')
);

if (isSupabaseConfigured) {
  console.info('[Supabase] Configured project URL:', supabaseUrl);
} else {
  console.warn(
    `[Supabase] Missing or invalid Vite env vars. URL present: ${Boolean(supabaseUrl)}. Key length: ${supabaseAnonKey.length}. Use either the long anon JWT or the sb_publishable key from Supabase Project Settings > API.`
  );
}

export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://invalid-project.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey : 'invalid-anon-key',
  {
    auth: {
      storage: window.localStorage,
      storageKey: 'forlady.supabase.auth',
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
    global: {
      headers: {
        'X-Client-Info': 'forlady-vite-ecommerce',
      },
    },
  }
);

export async function verifySupabaseConnection() {
  if (!isSupabaseConfigured) return { ok: false, reason: 'missing-env' };
  const { data, error } = await supabase.auth.getSession();
  console.info('[Supabase] Session check:', {
    hasSession: Boolean(data.session),
    userId: data.session?.user?.id || null,
    error: error?.message || null,
  });
  return { ok: !error, session: data.session, error };
}

export function publicStorageUrl(bucket, path) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  if (!isSupabaseConfigured) return path;

  const cleanPath = String(path)
    .replace(/^\/+/, '')
    .replace(new RegExp(`^${bucket}/`), '');

  const { data } = supabase.storage.from(bucket).getPublicUrl(cleanPath);
  console.debug('[Supabase Storage] Public URL generated:', { bucket, path: cleanPath, publicUrl: data.publicUrl });
  return data.publicUrl;
}
