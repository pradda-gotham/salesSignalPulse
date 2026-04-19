// Supabase Data Service for Multi-Tenant Operations
import { supabase } from '../src/lib/supabase';
import { Database } from '../src/lib/database.types';

type Organization = Database['public']['Tables']['organizations']['Row'];
type Trigger = Database['public']['Tables']['triggers']['Row'];
type Signal = Database['public']['Tables']['signals']['Row'];
type Dossier = Database['public']['Tables']['dossiers']['Row'];
type DbTrackedWebsite = Database['public']['Tables']['tracked_websites']['Row'];

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
            is_active: true // Explicitly set new triggers to active
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
        .delete()
        .eq('id', triggerId);

    if (error) {
        console.error('[DataService] Error deleting trigger:', error);
        return false;
    }
    return true;
}

export async function toggleTriggerActiveState(triggerId: string, isActive: boolean): Promise<boolean> {
    const { error } = await supabase
        .from('triggers')
        .update({ is_active: isActive })
        .eq('id', triggerId);

    if (error) {
        console.error('[DataService] Error toggling trigger active state:', error);
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

// ============ TRACKED WEBSITES ============

export async function getTrackedWebsites(orgId: string): Promise<DbTrackedWebsite[]> {
    const { data, error } = await supabase
        .from('tracked_websites')
        .select('*')
        .eq('org_id', orgId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('[DataService] Error fetching tracked websites:', error);
        return [];
    }
    return data || [];
}

export async function createTrackedWebsite(
    orgId: string,
    website: { url: string; target_keywords?: string; purpose?: string }
): Promise<DbTrackedWebsite | null> {
    const { data, error } = await supabase
        .from('tracked_websites')
        .insert({
            org_id: orgId,
            url: website.url,
            target_keywords: website.target_keywords || null,
            purpose: website.purpose || null,
            is_active: true,
        })
        .select()
        .single();

    if (error) {
        console.error('[DataService] Error creating tracked website:', error);
        return null;
    }
    return data;
}

export async function deleteTrackedWebsite(id: string): Promise<boolean> {
    const { error } = await supabase
        .from('tracked_websites')
        .update({ is_active: false })
        .eq('id', id);

    if (error) {
        console.error('[DataService] Error deleting tracked website:', error);
        return false;
    }
    return true;
}

export async function updateTrackedWebsite(
    id: string,
    updates: { last_scanned_at?: string; }
): Promise<boolean> {
    const { error } = await supabase
        .from('tracked_websites')
        .update(updates)
        .eq('id', id);

    if (error) {
        console.error('[DataService] Error updating tracked website:', error);
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
        tracked_website_id?: string;
        // Signal quality fields
        lead_type?: 'direct_company' | 'government_tender' | 'project_winner' | 'market_trend';
        semantic_fingerprint?: string;
        entities?: unknown;
        research_hints?: unknown;
        relevance_score?: number;
        relevance_reasoning?: string;
    }
): Promise<Signal | null> {
    // Cross-run semantic dedup: if this opportunity (same account + event + week)
    // was already stored for this org, skip the upsert and return the existing row.
    if (signal.semantic_fingerprint) {
        const query: any = supabase.from('signals').select('*').eq('org_id', orgId);
        const { data: existing } = await query
            .eq('semantic_fingerprint', signal.semantic_fingerprint)
            .maybeSingle();
        if (existing) {
            console.log('[DataService] Semantic fingerprint match, signal already exists:', signal.headline.substring(0, 60));
            return existing as Signal;
        }
    }

    const payload: Record<string, unknown> = {
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
        tracked_website_id: signal.tracked_website_id || null,
    };

    if (signal.lead_type) payload.lead_type = signal.lead_type;
    if (signal.semantic_fingerprint) payload.semantic_fingerprint = signal.semantic_fingerprint;
    if (signal.entities !== undefined) payload.entities = signal.entities;
    if (signal.research_hints !== undefined) payload.research_hints = signal.research_hints;
    if (signal.relevance_score !== undefined) payload.relevance_score = signal.relevance_score;
    if (signal.relevance_reasoning) payload.relevance_reasoning = signal.relevance_reasoning;

    const { data, error } = await supabase
        .from('signals')
        .upsert(payload as any, { onConflict: 'org_id,fingerprint' })
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

export async function updateSignalFeedback(
    signalId: string,
    feedback: 'positive' | 'negative'
): Promise<boolean> {
    const { error } = await supabase
        .from('signals')
        .update({ relevance_feedback: feedback } as any)
        .eq('id', signalId);

    if (error) {
        console.error('[DataService] Error updating signal feedback:', error);
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

// ============ PRODUCT CATALOG ============

export async function getProductCatalog(orgId: string): Promise<any[]> {
    const { data, error } = await supabase
        .from('product_catalog')
        .select('*')
        .eq('org_id', orgId)
        .eq('is_active', true)
        .order('category', { ascending: true });

    if (error) {
        console.error('[DataService] Error fetching product catalog:', error);
        return [];
    }
    return (data || []).map(row => ({
        id: row.id,
        sku: row.sku,
        name: row.name,
        description: row.description,
        category: row.category,
        unitPrice: Number(row.unit_price),
        costBasis: row.cost_basis ? Number(row.cost_basis) : undefined,
        unit: row.unit,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    }));
}

export async function upsertProductCatalogItem(
    orgId: string,
    item: { id?: string; sku: string; name: string; description?: string; category?: string; unitPrice: number; costBasis?: number; unit?: string }
): Promise<any | null> {
    const payload: any = {
        org_id: orgId,
        sku: item.sku,
        name: item.name,
        description: item.description || '',
        category: item.category || 'General',
        unit_price: item.unitPrice,
        cost_basis: item.costBasis ?? null,
        unit: item.unit || 'each',
        updated_at: new Date().toISOString(),
    };
    if (item.id) payload.id = item.id;

    const { data, error } = await supabase
        .from('product_catalog')
        .upsert(payload, { onConflict: 'org_id,sku' })
        .select()
        .single();

    if (error) {
        console.error('[DataService] Error upserting catalog item:', error);
        return null;
    }
    return data;
}

export async function deleteProductCatalogItem(itemId: string): Promise<boolean> {
    const { error } = await supabase
        .from('product_catalog')
        .update({ is_active: false })
        .eq('id', itemId);

    if (error) {
        console.error('[DataService] Error deleting catalog item:', error);
        return false;
    }
    return true;
}

// ============ RATE CARDS ============

export async function getRateCards(orgId: string, category?: string): Promise<any[]> {
    let query = supabase
        .from('rate_cards')
        .select('*')
        .eq('org_id', orgId)
        .eq('is_active', true)
        .order('category', { ascending: true });

    if (category) query = query.eq('category', category);

    const { data, error } = await query;

    if (error) {
        console.error('[DataService] Error fetching rate cards:', error);
        return [];
    }
    return (data || []).map(row => ({
        id: row.id,
        category: row.category,
        description: row.description,
        unit: row.unit,
        defaultRate: Number(row.default_rate),
        region: row.region,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    }));
}

export async function upsertRateCardEntry(
    orgId: string,
    entry: { id?: string; category: string; description: string; unit: string; defaultRate: number; region?: string }
): Promise<any | null> {
    const payload: any = {
        org_id: orgId,
        category: entry.category,
        description: entry.description,
        unit: entry.unit,
        default_rate: entry.defaultRate,
        region: entry.region || null,
        updated_at: new Date().toISOString(),
    };
    if (entry.id) payload.id = entry.id;

    const { data, error } = await supabase
        .from('rate_cards')
        .upsert(payload)
        .select()
        .single();

    if (error) {
        console.error('[DataService] Error upserting rate card:', error);
        return null;
    }
    return data;
}

export async function deleteRateCardEntry(entryId: string): Promise<boolean> {
    const { error } = await supabase
        .from('rate_cards')
        .update({ is_active: false })
        .eq('id', entryId);

    if (error) {
        console.error('[DataService] Error deleting rate card:', error);
        return false;
    }
    return true;
}

// ============ ESTIMATE AUDIT LOG ============

export async function logEstimateChange(
    orgId: string,
    dossierId: string,
    fieldPath: string,
    previousValue: unknown,
    newValue: unknown,
    changedBy?: string
): Promise<void> {
    const { error } = await supabase
        .from('estimate_audit_log')
        .insert({
            org_id: orgId,
            dossier_id: dossierId,
            field_path: fieldPath,
            previous_value: previousValue,
            new_value: newValue,
            changed_by: changedBy || null,
        });

    if (error) {
        console.error('[DataService] Error logging estimate change:', error);
    }
}

export async function getAuditLog(dossierId: string): Promise<any[]> {
    const { data, error } = await supabase
        .from('estimate_audit_log')
        .select('*')
        .eq('dossier_id', dossierId)
        .order('changed_at', { ascending: false });

    if (error) {
        console.error('[DataService] Error fetching audit log:', error);
        return [];
    }
    return data || [];
}

// Export all functions as a service object
export const dataService = {
    getOrganization,
    getTriggers,
    createTrigger,
    deleteTrigger,
    toggleTriggerActiveState,
    updateTriggerType,
    getTrackedWebsites,
    createTrackedWebsite,
    deleteTrackedWebsite,
    updateTrackedWebsite,
    getSignals,
    upsertSignal,
    updateSignalStatus,
    updateSignalFeedback,
    getDossier,
    saveDossier,
    createHuntLog,
    updateHuntLog,
    getBusinessProfile,
    saveBusinessProfile,
    getProductCatalog,
    upsertProductCatalogItem,
    deleteProductCatalogItem,
    getRateCards,
    upsertRateCardEntry,
    deleteRateCardEntry,
    logEstimateChange,
    getAuditLog,
};
