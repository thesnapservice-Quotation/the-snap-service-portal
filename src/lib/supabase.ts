import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = (
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  'https://lwsmgogcxngolukwqnjj.supabase.co'
).replace(/\/$/, '');

const SUPABASE_KEY = (
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_KEY ||
  ''
).trim();

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY || 'dummy_key', {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
