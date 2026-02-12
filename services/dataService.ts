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

// ============ TRIGGERS ============

export async function getTriggers(orgId: string): Promise<Trigger[]> {
    const { data, error } = await supabase
        .from('triggers')
        .select('*')
        .eq('org_id', orgId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('[DataService] Error fetching triggers:', error);
        return [];
    }
    return data || [];
}

export async function createTrigger(
    orgId: string,
    trigger: { product: string; event: string; source?: string; logic?: string; trigger_type?: 'active' | 'ai_generated' }
): Promise<Trigger | null> {
    const { data, error } = await supabase
        .from('triggers')
        .insert({
            org_id: orgId,
            product: trigger.product,
            event: trigger.event,
            source: trigger.source || null,
            logic: trigger.logic || null,
            trigger_type: trigger.trigger_type || 'active',
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
        .update({ is_active: false })
        .eq('id', triggerId);

    if (error) {
        console.error('[DataService] Error deleting trigger:', error);
        return false;
    }
    return true;
}

export async function updateTriggerType(
    triggerId: string,
    triggerType: 'active' | 'ai_generated'
): Promise<boolean> {
    const { error } = await supabase
        .from('triggers')
        .update({ trigger_type: triggerType })
        .eq('id', triggerId);

    if (error) {
        console.error('[DataService] Error updating trigger type:', error);
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
        decision_maker?: string;
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
                decision_maker: signal.decision_maker || null,
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
        .update({ status })
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
    content: Record<string, unknown>
): Promise<Dossier | null> {
    const { data, error } = await supabase
        .from('dossiers')
        .upsert(
            {
                org_id: orgId,
                signal_id: signalId,
                content,
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

export async function createHuntLog(orgId: string): Promise<string | null> {
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
        signals_found?: number;
        status?: 'running' | 'success' | 'failed';
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

// ============ BUSINESS PROFILE ============

export async function getBusinessProfile(orgId: string): Promise<Record<string, unknown> | null> {
    const { data, error } = await supabase
        .from('organizations')
        .select('business_profile')
        .eq('id', orgId)
        .single();

    if (error) {
        console.error('[DataService] Error fetching business profile:', error);
        return null;
    }
    return data?.business_profile || null;
}

export async function saveBusinessProfile(
    orgId: string,
    profile: Record<string, unknown>
): Promise<boolean> {
    const { error } = await supabase
        .from('organizations')
        .update({ business_profile: profile })
        .eq('id', orgId);

    if (error) {
        console.error('[DataService] Error saving business profile:', error);
        return false;
    }
    console.log('[DataService] Business profile saved');
    return true;
}

// Export all functions as a service object
export const dataService = {
    getOrganization,
    getTriggers,
    createTrigger,
    deleteTrigger,
    updateTriggerType,
    getSignals,
    upsertSignal,
    updateSignalStatus,
    getDossier,
    saveDossier,
    createHuntLog,
    updateHuntLog,
    getBusinessProfile,
    saveBusinessProfile,
};
