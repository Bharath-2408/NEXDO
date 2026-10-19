// ============================================================================
// SUPABASE CLIENT INITIALIZATION (Client-Side Anon Read-Only Scope)
// NEXDO uses server-authoritative custom authentication against `public.users`
// via backend router endpoints (`/api/auth/*`) with PBKDF2-SHA512 password
// hashing, secure session management, and server-side role enforcement.
//
// Client bundles connect via this client strictly for RLS-scoped public reads
// (e.g. active technician profiles). Authentication state is managed via
// `nexdoApi.auth` and AppContext sessions.
// Zero backend secrets or service-role keys are exposed to the browser.
// ============================================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Retrieve credentials safely from Vite env or process.env
const supabaseUrl =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  (typeof process !== 'undefined' && process.env?.SUPABASE_URL) ||
  '';

const supabaseAnonKey =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  (typeof process !== 'undefined' && process.env?.SUPABASE_ANON_KEY) ||
  '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;
