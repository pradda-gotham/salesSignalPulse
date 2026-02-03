
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from './database.types';

// TEMPORARY: Hardcoded values for debugging env loading issue
// TODO: Remove these and use env vars once fixed
const HARDCODED_URL = 'https://gkjdulfxxnzmwlrfpnrx.supabase.co';
const HARDCODED_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdramR1bGZ4eG56bXdscmZwbnJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMDE3MzYsImV4cCI6MjA4NTY3NzczNn0._NiN0lQYO0V319bUps6VaDyvBcO50GC2LDEtGe0vYRc';

// Try to use env vars first, fall back to hardcoded
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || HARDCODED_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || HARDCODED_KEY;

// Log what we're using
console.log('[Supabase] URL source:', import.meta.env.VITE_SUPABASE_URL ? 'env' : 'hardcoded');
console.log('[Supabase] Key source:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'env' : 'hardcoded');

// Flag to check if Supabase is properly configured
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Create client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
