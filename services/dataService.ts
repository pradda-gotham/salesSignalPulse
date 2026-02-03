// Supabase Data Service for Multi-Tenant Operations
import { supabase } from '../src/lib/supabase';
import { Database } from '../src/lib/database.types';

type Organization = Database['public']['Tables']['organizations']['Row'];
type Trigger = Database['public']['Tables']['triggers']['Row'];
type Signal = Database['public']['Tables']['signals']['Row'];
type Dossier = Database['public']['Tables']['dossiers']['Row'];

// ============ ORGANIZATION ============

export async function getOrganization(orgId: string): Promise<Organization | null> {
    const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .single();

    if (error) {
        console.error('[DataService] Error fetching organization:', error);
        return null;
    }
    return data;
}

export async function updateOrganization(
    orgId: string,
    updates: Partial<Organization>
): Promise<Organization | null> {
    const { data, error } = await supabase
        .from('organizations')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', orgId)
        .select()
        .single();

    if (error) {
        console.error('[DataService] Error updating organization:', error);
        return null;
    }
    return data;
}

// ============ TRIGGERS ============

export async function getTriggers(orgId: string): Promise<Trigger[]> {
    const { data, error } = await supabase
        .from('triggers')
        .select('*')
        .eq('org_id', orgId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('[DataService] Error fetching triggers:', error);
        return [];
    }
    return data || [];
}

export async function createTrigger(
    orgId: string,
    trigger: { product: string; event: string; source?: string; logic?: string }
): Promise<Trigger | null> {
    const { data, error } = await supabase
        .from('triggers')
        .insert({
            org_id: orgId,
            product: trigger.product,
            event: trigger.event,
            source: trigger.source || null,
            logic: trigger.logic || null,
        })
        .select()
        .single();

    if (error) {
        console.error('[DataService] Error creating trigger:', error);
        return null;
    }
    return data;
}

export async function deleteTrigger(triggerId: string): Promise<boolean> {
    const { error } = await supabase
        .from('triggers')
        .update({ status: 'deleted' })
        .eq('id', triggerId);

    if (error) {
        console.error('[DataService] Error deleting trigger:', error);
        return false;
    }
    return true;
}

// ============ SIGNALS ============

export async function getSignals(orgId: string, limit = 50): Promise<Signal[]> {
    const { data, error } = await supabase
        .from('signals')
        .select('*')
        .eq('org_id', orgId)
        .neq('status', 'archived')
        .order('found_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('[DataService] Error fetching signals:', error);
        return [];
    }
    return data || [];
}

export async function upsertSignal(
    orgId: string,
    signal: {
        fingerprint: string;
        headline: string;
        summary?: string;
        source_url?: string;
        source_title?: string;
        prospect_company?: string;
        prospect_website?: string;
        prospect_linkedin?: string;
        decision_maker?: string;
        estimated_value?: number;
        confidence?: 'low' | 'medium' | 'high';
        urgency?: 'emergency' | 'high' | 'medium' | 'low';
        score?: number;
        matched_products?: string[];
        trigger_id?: string;
    }
): Promise<Signal | null> {
    const { data, error } = await supabase
        .from('signals')
        .upsert(
            {
                org_id: orgId,
                fingerprint: signal.fingerprint,
                headline: signal.headline,
                summary: signal.summary || null,
                source_url: signal.source_url || null,
                source_title: signal.source_title || null,
                prospect_company: signal.prospect_company || null,
                prospect_website: signal.prospect_website || null,
                prospect_linkedin: signal.prospect_linkedin || null,
                decision_maker: signal.decision_maker || null,
                estimated_value: signal.estimated_value || null,
                confidence: signal.confidence || 'medium',
                urgency: signal.urgency || 'medium',
                score: signal.score || 50,
                matched_products: signal.matched_products || [],
                trigger_id: signal.trigger_id || null,
            },
            { onConflict: 'org_id,fingerprint' }
        )
        .select()
        .single();

    if (error) {
        console.error('[DataService] Error upserting signal:', error);
        return null;
    }
    return data;
}

export async function updateSignalStatus(
    signalId: string,
    status: 'new' | 'contacted' | 'meeting' | 'won' | 'lost' | 'archived'
): Promise<boolean> {
    const { error } = await supabase
        .from('signals')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', signalId);

    if (error) {
        console.error('[DataService] Error updating signal status:', error);
        return false;
    }
    return true;
}

// ============ DOSSIERS ============

export async function getDossier(signalId: string): Promise<Dossier | null> {
    const { data, error } = await supabase
        .from('dossiers')
        .select('*')
        .eq('signal_id', signalId)
        .single();

    if (error && error.code !== 'PGRST116') {
        console.error('[DataService] Error fetching dossier:', error);
    }
    return data || null;
}

export async function saveDossier(
    orgId: string,
    signalId: string,
    dossier: {
        account_name?: string;
        executive_summary?: string;
        commercial_opportunity?: string;
        recommended_bundle?: any;
        pricing_strategy?: any;
        battlecard?: any;
        call_script?: string;
        confidence?: 'low' | 'medium' | 'high';
        assumptions?: string[];
        enriched_contacts?: any[];
        enriched_company?: any;
        is_enriched?: boolean;
    }
): Promise<Dossier | null> {
    const { data, error } = await supabase
        .from('dossiers')
        .upsert(
            {
                org_id: orgId,
                signal_id: signalId,
                ...dossier,
            },
            { onConflict: 'signal_id' }
        )
        .select()
        .single();

    if (error) {
        console.error('[DataService] Error saving dossier:', error);
        return null;
    }
    return data;
}

// ============ HUNT LOGS ============

export async function createHuntLog(
    orgId: string
): Promise<string | null> {
    const { data, error } = await supabase
        .from('hunt_logs')
        .insert({ org_id: orgId })
        .select('id')
        .single();

    if (error) {
        console.error('[DataService] Error creating hunt log:', error);
        return null;
    }
    return data?.id || null;
}

export async function updateHuntLog(
    huntId: string,
    updates: {
        completed_at?: string;
        triggers_processed?: number;
        signals_found?: number;
        new_signals?: number;
        status?: 'success' | 'partial' | 'failed';
        error?: string;
    }
): Promise<boolean> {
    const { error } = await supabase
        .from('hunt_logs')
        .update(updates)
        .eq('id', huntId);

    if (error) {
        console.error('[DataService] Error updating hunt log:', error);
        return false;
    }
    return true;
}

// Export all functions as a service object
export const dataService = {
    getOrganization,
    updateOrganization,
    getTriggers,
    createTrigger,
    deleteTrigger,
    getSignals,
    upsertSignal,
    updateSignalStatus,
    getDossier,
    saveDossier,
    createHuntLog,
    updateHuntLog,
};
