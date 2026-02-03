import { createClient } from '@supabase/supabase-js';

// New Supabase project credentials
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://euwzzzpdvsknmcgwbprs.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1d3p6enBkdnNrbm1jZ3dicHJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMzA0NDEsImV4cCI6MjA4NTcwNjQ0MX0.BT9Sd43-TIZITxxWuHhFrDBzctU8Dh4uhhNiofAayck';

// Simple database types
export interface Organization {
    id: string;
    name: string;
    created_at: string;
}

export interface UserProfile {
    id: string;
    email: string;
    org_id: string | null;
    created_at: string;
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);

console.log('[Supabase] Client initialized');
