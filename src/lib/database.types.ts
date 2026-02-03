
export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            organizations: {
                Row: {
                    id: string
                    name: string
                    industry: string | null
                    products: string[]
                    target_groups: string[]
                    geography: string[]
                    website: string | null
                    hunt_time: string
                    timezone: string
                    is_active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    industry?: string | null
                    products?: string[]
                    target_groups?: string[]
                    geography?: string[]
                    website?: string | null
                    hunt_time?: string
                    timezone?: string
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    industry?: string | null
                    products?: string[]
                    target_groups?: string[]
                    geography?: string[]
                    website?: string | null
                    hunt_time?: string
                    timezone?: string
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            users: {
                Row: {
                    id: string
                    org_id: string
                    email: string
                    name: string | null
                    role: 'admin' | 'member'
                    receives_digest: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    org_id: string
                    email: string
                    name?: string | null
                    role?: 'admin' | 'member'
                    receives_digest?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    org_id?: string
                    email?: string
                    name?: string | null
                    role?: 'admin' | 'member'
                    receives_digest?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "users_org_id_fkey"
                        columns: ["org_id"]
                        referencedRelation: "organizations"
                        referencedColumns: ["id"]
                    }
                ]
            }
            triggers: {
                Row: {
                    id: string
                    org_id: string
                    product: string
                    event: string
                    source: string | null
                    logic: string | null
                    limit_to_sites: string[]
                    status: 'active' | 'paused' | 'deleted'
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    org_id: string
                    product: string
                    event: string
                    source?: string | null
                    logic?: string | null
                    limit_to_sites?: string[]
                    status?: 'active' | 'paused' | 'deleted'
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    org_id?: string
                    product?: string
                    event?: string
                    source?: string | null
                    logic?: string | null
                    limit_to_sites?: string[]
                    status?: 'active' | 'paused' | 'deleted'
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "triggers_org_id_fkey"
                        columns: ["org_id"]
                        referencedRelation: "organizations"
                        referencedColumns: ["id"]
                    }
                ]
            }
            signals: {
                Row: {
                    id: string
                    org_id: string
                    trigger_id: string | null
                    fingerprint: string
                    headline: string
                    summary: string | null
                    source_url: string | null
                    source_title: string | null
                    prospect_company: string | null
                    prospect_website: string | null
                    prospect_linkedin: string | null
                    decision_maker: string | null
                    estimated_value: number | null
                    confidence: 'low' | 'medium' | 'high'
                    urgency: 'emergency' | 'high' | 'medium' | 'low'
                    score: number
                    status: 'new' | 'contacted' | 'meeting' | 'won' | 'lost' | 'archived'
                    matched_products: string[]
                    found_at: string
                    last_emailed_at: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    org_id: string
                    trigger_id?: string | null
                    fingerprint: string
                    headline: string
                    summary?: string | null
                    source_url?: string | null
                    source_title?: string | null
                    prospect_company?: string | null
                    prospect_website?: string | null
                    prospect_linkedin?: string | null
                    decision_maker?: string | null
                    estimated_value?: number | null
                    confidence?: 'low' | 'medium' | 'high'
                    urgency?: 'emergency' | 'high' | 'medium' | 'low'
                    score?: number
                    status?: 'new' | 'contacted' | 'meeting' | 'won' | 'lost' | 'archived'
                    matched_products?: string[]
                    found_at?: string
                    last_emailed_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    org_id?: string
                    trigger_id?: string | null
                    fingerprint?: string
                    headline?: string
                    summary?: string | null
                    source_url?: string | null
                    source_title?: string | null
                    prospect_company?: string | null
                    prospect_website?: string | null
                    prospect_linkedin?: string | null
                    decision_maker?: string | null
                    estimated_value?: number | null
                    confidence?: 'low' | 'medium' | 'high'
                    urgency?: 'emergency' | 'high' | 'medium' | 'low'
                    score?: number
                    status?: 'new' | 'contacted' | 'meeting' | 'won' | 'lost' | 'archived'
                    matched_products?: string[]
                    found_at?: string
                    last_emailed_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "signals_org_id_fkey"
                        columns: ["org_id"]
                        referencedRelation: "organizations"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "signals_trigger_id_fkey"
                        columns: ["trigger_id"]
                        referencedRelation: "triggers"
                        referencedColumns: ["id"]
                    }
                ]
            }
            dossiers: {
                Row: {
                    id: string
                    signal_id: string
                    org_id: string
                    account_name: string | null
                    executive_summary: string | null
                    commercial_opportunity: string | null
                    recommended_bundle: Json
                    pricing_strategy: Json
                    battlecard: Json
                    call_script: string | null
                    confidence: 'low' | 'medium' | 'high'
                    assumptions: string[]
                    enriched_contacts: Json
                    enriched_company: Json | null
                    is_enriched: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    signal_id: string
                    org_id: string
                    account_name?: string | null
                    executive_summary?: string | null
                    commercial_opportunity?: string | null
                    recommended_bundle?: Json
                    pricing_strategy?: Json
                    battlecard?: Json
                    call_script?: string | null
                    confidence?: 'low' | 'medium' | 'high'
                    assumptions?: string[]
                    enriched_contacts?: Json
                    enriched_company?: Json | null
                    is_enriched?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    signal_id?: string
                    org_id?: string
                    account_name?: string | null
                    executive_summary?: string | null
                    commercial_opportunity?: string | null
                    recommended_bundle?: Json
                    pricing_strategy?: Json
                    battlecard?: Json
                    call_script?: string | null
                    confidence?: 'low' | 'medium' | 'high'
                    assumptions?: string[]
                    enriched_contacts?: Json
                    enriched_company?: Json | null
                    is_enriched?: boolean
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "dossiers_org_id_fkey"
                        columns: ["org_id"]
                        referencedRelation: "organizations"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "dossiers_signal_id_fkey"
                        columns: ["signal_id"]
                        referencedRelation: "signals"
                        referencedColumns: ["id"]
                    }
                ]
            }
            hunt_logs: {
                Row: {
                    id: string
                    org_id: string
                    started_at: string
                    completed_at: string | null
                    triggers_processed: number
                    signals_found: number
                    new_signals: number
                    status: 'success' | 'partial' | 'failed'
                    error: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    org_id: string
                    started_at?: string
                    completed_at?: string | null
                    triggers_processed?: number
                    signals_found?: number
                    new_signals?: number
                    status?: 'success' | 'partial' | 'failed'
                    error?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    org_id?: string
                    started_at?: string
                    completed_at?: string | null
                    triggers_processed?: number
                    signals_found?: number
                    new_signals?: number
                    status?: 'success' | 'partial' | 'failed'
                    error?: string | null
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "hunt_logs_org_id_fkey"
                        columns: ["org_id"]
                        referencedRelation: "organizations"
                        referencedColumns: ["id"]
                    }
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            user_org_id: {
                Args: Record<PropertyKey, never>
                Returns: string
            }
        }
        Enums: {
            user_role: 'admin' | 'member'
            trigger_status: 'active' | 'paused' | 'deleted'
            signal_status: 'new' | 'contacted' | 'meeting' | 'won' | 'lost' | 'archived'
            confidence_level: 'low' | 'medium' | 'high'
            urgency_level: 'emergency' | 'high' | 'medium' | 'low'
            hunt_status: 'success' | 'partial' | 'failed'
        }
    }
}
