// ============================================================================
// NEXDO SERVER-SIDE SUPABASE DATABASE CLIENT
// Production-grade PostgreSQL database integration via @supabase/supabase-js.
// Safely connects backend services using server-only environment variables:
// - SUPABASE_URL / VITE_SUPABASE_URL
// - SUPABASE_SERVICE_ROLE_KEY (Server only, bypasses RLS for trusted backend operations)
// - SUPABASE_ANON_KEY / VITE_SUPABASE_ANON_KEY (Public / RLS-scoped fallback)
// Zero secrets exposed to client bundles.
// ============================================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Server-side environment variable resolution
function getEnv(key: string): string {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] as string;
  }
  if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env[key]) {
    return (import.meta as any).env[key] as string;
  }
  return '';
}

export const SUPABASE_URL = getEnv('SUPABASE_URL') || getEnv('VITE_SUPABASE_URL') || '';
export const SUPABASE_SERVICE_ROLE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY') || '';
export const SUPABASE_ANON_KEY = getEnv('SUPABASE_ANON_KEY') || getEnv('VITE_SUPABASE_ANON_KEY') || '';

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL && (SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY)
);

let cachedClient: SupabaseClient | null = null;

/**
 * Returns a configured Supabase client.
 * Uses SUPABASE_SERVICE_ROLE_KEY on backend if provided for full schema access,
 * falling back to ANON_KEY.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (cachedClient) return cachedClient;

  const keyToUse = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
  if (!SUPABASE_URL || !keyToUse) return null;

  try {
    cachedClient = createClient(SUPABASE_URL, keyToUse, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    return cachedClient;
  } catch (err) {
    console.warn('[NEXDO Backend] Failed to initialize Supabase client:', err);
    return null;
  }
}

/**
 * Verifies live database connectivity without leaking credentials
 */
export async function checkSupabaseConnection(): Promise<{
  connected: boolean;
  environment: 'production' | 'development';
  timestamp: string;
  error?: string;
}> {
  const timestamp = new Date().toISOString();
  if (!isSupabaseConfigured) {
    return {
      connected: false,
      environment: 'development',
      timestamp,
      error: 'Supabase credentials not configured in environment',
    };
  }

  const client = getSupabaseClient();
  if (!client) {
    return {
      connected: false,
      environment: 'development',
      timestamp,
      error: 'Could not create Supabase client',
    };
  }

  try {
    // Ping users or service_requests table
    const { error } = await client.from('users').select('id').limit(1);
    if (error) {
      return {
        connected: false,
        environment: 'production',
        timestamp,
        error: error.message,
      };
    }
    return {
      connected: true,
      environment: 'production',
      timestamp,
    };
  } catch (err: any) {
    return {
      connected: false,
      environment: 'production',
      timestamp,
      error: err?.message || 'Connection failure',
    };
  }
}
