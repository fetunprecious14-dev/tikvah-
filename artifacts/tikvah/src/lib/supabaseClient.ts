import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
// The modern publishable key (sb_publishable_...) is preferred; the legacy
// anon JWT still works and is accepted as a fallback for older projects.
const key = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY) as string | undefined;

if (!url || !key) {
  throw new Error(
    'VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (or VITE_SUPABASE_ANON_KEY) must be set — see .env.example.',
  );
}

// Both of these are safe to ship to the browser: the publishable/anon key is
// designed to be public (it's the whole point of Supabase's client-side auth
// model), and it's meaningless without Supabase's own auth checks and this
// project's RLS policies. Never put the service_role/secret key here.
export const supabase = createClient(url, key);
