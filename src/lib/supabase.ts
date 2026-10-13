import { createClient } from '@supabase/supabase-js';

// Strict Server-Side Security Guard:
// Prevent SUPABASE_SERVICE_ROLE_KEY from ever being initialized or executed in browser/client environments.
if (typeof window !== 'undefined') {
  throw new Error('Security Violation: Supabase server client cannot be loaded in a browser/client environment.');
}

const rawUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '').trim();
const SUPABASE_URL = (rawUrl.startsWith('http') ? rawUrl : 'https://kwrliixcdmjyuurjucrc.supabase.co').replace(/\/$/, '');

const rawKey = (
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_KEY ||
  ''
).trim();
const SUPABASE_KEY = rawKey === '[SENSITIVE]' ? 'dummy_key' : (rawKey || 'dummy_key');

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
