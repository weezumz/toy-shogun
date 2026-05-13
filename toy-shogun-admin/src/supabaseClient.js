// supabaseClient.js
// This file initializes the Supabase client and exports it for use throughout the app.
// Think of this as the "connector" between your React app and your Supabase database.

import { createClient } from '@supabase/supabase-js';

// These values are pulled from your .env file so they're never exposed publicly
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storageKey: 'toy-shogun-admin-auth',
    // Bypass navigator.locks — prevents fetch hangs when the lock gets stuck
    lock: (_name, _acquireTimeout, fn) => fn(),
  },
});