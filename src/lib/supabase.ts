
import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

// Supabase configuration
const supabaseUrl = 'https://gkjdulfxxnzmwlrfpnrx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdramR1bGZ4eG56bXdscmZwbnJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMDE3MzYsImV4cCI6MjA4NTY3NzczNn0._NiN0lQYO0V319bUps6VaDyvBcO50GC2LDEtGe0vYRc';

// Flag to check if Supabase is properly configured
export const isSupabaseConfigured = true;

// Create client with proper configuration
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        flowType: 'pkce',
    },
    global: {
        headers: {
            'X-Client-Info': 'pulsesignal',
        },
    },
});

console.log('[Supabase] Client initialized with URL:', supabaseUrl);
