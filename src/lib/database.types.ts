// Database types for Supabase - pulsesignal-v2

export interface Database {
    public: {
        Tables: {
            organizations: {
                Row: {
                    id: string;
                    name: string;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    name: string;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    name?: string;
                    created_at?: string;
                };
            };
            users: {
                Row: {
                    id: string;
                    email: string;
                    org_id: string | null;
                    created_at: string;
                };
                Insert: {
                    id: string;
                    email: string;
                    org_id?: string | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    email?: string;
                    org_id?: string | null;
                    created_at?: string;
                };
            };
            triggers: {
                Row: {
                    id: string;
                    org_id: string;
                    product: string;
                    event: string;
                    source: string | null;
                    logic: string | null;
                    is_active: boolean;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    org_id: string;
                    product: string;
                    event: string;
                    source?: string | null;
                    logic?: string | null;
                    is_active?: boolean;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    org_id?: string;
                    product?: string;
                    event?: string;
                    source?: string | null;
                    logic?: string | null;
                    is_active?: boolean;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            signals: {
                Row: {
                    id: string;
                    org_id: string;
                    trigger_id: string | null;
                    fingerprint: string;
                    headline: string;
                    summary: string | null;
                    source_url: string | null;
                    source_title: string | null;
                    decision_maker: string | null;
                    matched_products: string[] | null;
                    confidence: string | null;
                    urgency: string | null;
                    score: number;
                    status: string | null;
                    found_at: string;
                    contacted_at: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    org_id: string;
                    trigger_id?: string | null;
                    fingerprint: string;
                    headline: string;
                    summary?: string | null;
                    source_url?: string | null;
                    source_title?: string | null;
                    decision_maker?: string | null;
                    matched_products?: string[] | null;
                    confidence?: string | null;
                    urgency?: string | null;
                    score?: number;
                    status?: string | null;
                    found_at?: string;
                    contacted_at?: string | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    org_id?: string;
                    trigger_id?: string | null;
                    fingerprint?: string;
                    headline?: string;
                    summary?: string | null;
                    source_url?: string | null;
                    source_title?: string | null;
                    decision_maker?: string | null;
                    matched_products?: string[] | null;
                    confidence?: string | null;
                    urgency?: string | null;
                    score?: number;
                    status?: string | null;
                    found_at?: string;
                    contacted_at?: string | null;
                    created_at?: string;
                };
            };
            dossiers: {
                Row: {
                    id: string;
                    org_id: string;
                    signal_id: string | null;
                    content: Record<string, unknown>;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    org_id: string;
                    signal_id?: string | null;
                    content: Record<string, unknown>;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    org_id?: string;
                    signal_id?: string | null;
                    content?: Record<string, unknown>;
                    created_at?: string;
                };
            };
            hunt_logs: {
                Row: {
                    id: string;
                    org_id: string;
                    trigger_id: string | null;
                    started_at: string;
                    completed_at: string | null;
                    signals_found: number;
                    status: string | null;
                    error: string | null;
                };
                Insert: {
                    id?: string;
                    org_id: string;
                    trigger_id?: string | null;
                    started_at?: string;
                    completed_at?: string | null;
                    signals_found?: number;
                    status?: string | null;
                    error?: string | null;
                };
                Update: {
                    id?: string;
                    org_id?: string;
                    trigger_id?: string | null;
                    started_at?: string;
                    completed_at?: string | null;
                    signals_found?: number;
                    status?: string | null;
                    error?: string | null;
                };
            };
        };
    };
}
