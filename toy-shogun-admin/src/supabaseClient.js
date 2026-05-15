import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Singleton — prevents HMR from creating multiple GoTrueClient instances
// which causes fetch hangs and "Multiple GoTrueClient instances" warnings.
const GLOBAL_KEY = '__toy_shogun_admin_supabase__';
if (!window[GLOBAL_KEY]) {
  window[GLOBAL_KEY] = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storageKey: 'toy-shogun-admin-auth',
      lock: (_name, _acquireTimeout, fn) => fn(),
    },
  });
}

export const supabase = window[GLOBAL_KEY];