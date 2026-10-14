import { createClient } from '@supabase/supabase-js';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://your-project-id.supabase.co' &&
  !supabaseUrl.includes('your-project')
);

// Client-side Supabase client singleton
export const supabase = (() => {
  if (!isSupabaseConfigured) return null;
  try {
    return createClient(supabaseUrl, supabaseAnonKey);
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
})();

/**
 * Safely formats Supabase / PostgREST errors into readable string descriptions,
 * preventing `{}` serialization in Next.js Turbopack console and error overlays.
 */
export function formatSupabaseError(error: unknown): string {
  if (!error) return 'Unknown error';
  if (typeof error === 'string') return error;
  if (typeof error === 'object') {
    const err = error as Record<string, unknown>;
    const parts = [
      err.message ? `message: ${err.message}` : null,
      err.code ? `code: ${err.code}` : null,
      err.details ? `details: ${err.details}` : null,
      err.hint ? `hint: ${err.hint}` : null
    ].filter(Boolean);
    if (parts.length > 0) return parts.join(', ');
    try {
      const str = JSON.stringify(error);
      if (str && str !== '{}') return str;
    } catch {}
  }
  return String(error);
}

