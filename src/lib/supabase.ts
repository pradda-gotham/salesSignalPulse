
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Flag to check if Supabase is properly configured
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
    console.error('[Supabase] CRITICAL: Missing environment variables!');
    console.error('[Supabase] VITE_SUPABASE_URL:', supabaseUrl ? 'SET' : 'MISSING');
    console.error('[Supabase] VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'SET' : 'MISSING');
    console.error('[Supabase] Please check your .env.local file');
}

// Create client - will throw proper errors if credentials are wrong
export const supabase = createClient<Database>(
    supabaseUrl || '',
    supabaseAnonKey || ''
);
