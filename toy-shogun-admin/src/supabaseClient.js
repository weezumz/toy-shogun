// supabaseClient.js
// This file initializes the Supabase client and exports it for use throughout the app.
// Think of this as the "connector" between your React app and your Supabase database.

import { createClient } from '@supabase/supabase-js';

// These values are pulled from your .env file so they're never exposed publicly
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Create and export the Supabase client instance
// This is imported by any file that needs to talk to the database
export const supabase = createClient(supabaseUrl, supabaseAnonKey);