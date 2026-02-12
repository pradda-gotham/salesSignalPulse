// Hook for loading organization data from Supabase
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dataService } from '../services/dataService';
import { SalesTrigger, MarketSignal, SignalUrgency, LeadStatus } from '../types';
import { Database } from '../src/lib/database.types';

type DbTrigger = Database['public']['Tables']['triggers']['Row'];
type DbSignal = Database['public']['Tables']['signals']['Row'];

// Convert DB trigger to app SalesTrigger format
function dbTriggerToAppTrigger(t: DbTrigger): SalesTrigger {
    return {
        id: t.id,
        product: t.product,
        event: t.event,
        source: t.source || '',
        logic: t.logic || '',
        triggerType: (t as any).trigger_type || 'active',
        status: 'Approved',
    };
}

// Map DB urgency to app SignalUrgency enum
function mapUrgency(dbUrgency: string | null): SignalUrgency {
    switch (dbUrgency) {
        case 'emergency': return SignalUrgency.EMERGENCY;
        case 'high': return SignalUrgency.HIGH;
        case 'medium': return SignalUrgency.MEDIUM;
        case 'low': return SignalUrgency.LOW;
        default: return SignalUrgency.MEDIUM;
    }
}

// Map DB status to app LeadStatus
function mapStatus(dbStatus: string | null): LeadStatus {
    switch (dbStatus) {
        case 'new': return 'New';
        case 'contacted': return 'Contacted';
        case 'meeting': return 'Meeting Booked';
        case 'won':
        case 'lost':
        case 'archived': return 'Archived';
        default: return 'New';
    }
}

// Convert DB signal to app MarketSignal format
function dbSignalToAppSignal(s: DbSignal): MarketSignal {
    return {
        id: s.id,
        headline: s.headline,
        summary: s.summary || '',
        importance: s.confidence || 'medium',
        sourceUrl: s.source_url || '',
        sourceTitle: s.source_title || '',
        matchedProducts: s.matched_products || [],
        decisionMaker: s.decision_maker || '',
        score: s.score,
        urgency: mapUrgency(s.urgency),
        timestamp: s.found_at,
        region: '',
        confidenceDetails: {
            freshness: 0,
            proximity: 0,
            intentStrength: 0,
            buyerMatch: 0,
            urgency: 0,
            total: s.score,
        },
        status: mapStatus(s.status),
    };
}

export function useOrgData() {
    const { organization, userProfile } = useAuth();
    const [triggers, setTriggers] = useState<SalesTrigger[]>([]);
    const [signals, setSignals] = useState<MarketSignal[]>([]);
    const [loading, setLoading] = useState(true);

    const orgId = organization?.id;

    // Load triggers from Supabase
    const loadTriggers = useCallback(async () => {
        if (!orgId) return;

        const dbTriggers = await dataService.getTriggers(orgId);
        setTriggers(dbTriggers.map(dbTriggerToAppTrigger));
    }, [orgId]);

    // Load signals from Supabase
    const loadSignals = useCallback(async () => {
        if (!orgId) return;

        const dbSignals = await dataService.getSignals(orgId);
        setSignals(dbSignals.map(dbSignalToAppSignal));
    }, [orgId]);

    // Initial load
    useEffect(() => {
        const load = async () => {
            setLoading(true);
            await Promise.all([loadTriggers(), loadSignals()]);
            setLoading(false);
        };

        if (orgId) {
            load();
        }
    }, [orgId, loadTriggers, loadSignals]);

    // Add a new trigger
    const addTrigger = useCallback(async (trigger: { product: string; event: string; source?: string; logic?: string; trigger_type?: 'active' | 'ai_generated' }) => {
        if (!orgId) return null;

        const created = await dataService.createTrigger(orgId, trigger);
        if (created) {
            setTriggers(prev => [dbTriggerToAppTrigger(created), ...prev]);
        }
        return created;
    }, [orgId]);

    // Add AI-generated triggers with content-based deduplication
    const addAITriggers = useCallback(async (newTriggers: { product: string; event: string; source?: string; logic?: string }[]) => {
        if (!orgId) return [];

        // Build fingerprint set from ALL existing triggers (both active and ai_generated)
        const existingFingerprints = new Set(
            triggers.map(t => `${t.event.toLowerCase().trim()}-${t.product.toLowerCase().trim()}`)
        );

        const added: SalesTrigger[] = [];
        for (const trigger of newTriggers) {
            const fingerprint = `${trigger.event.toLowerCase().trim()}-${trigger.product.toLowerCase().trim()}`;
            if (existingFingerprints.has(fingerprint)) {
                console.log('[OrgData] Skipping duplicate AI trigger:', fingerprint);
                continue;
            }
            existingFingerprints.add(fingerprint);

            const created = await dataService.createTrigger(orgId, {
                ...trigger,
                trigger_type: 'ai_generated',
            });
            if (created) {
                added.push(dbTriggerToAppTrigger(created));
            }
        }

        if (added.length > 0) {
            setTriggers(prev => [...added, ...prev]);
        }
        console.log(`[OrgData] Added ${added.length} unique AI triggers (skipped ${newTriggers.length - added.length} duplicates)`);
        return added;
    }, [orgId, triggers]);

    // Activate an AI-generated trigger (move to 'active')
    const activateTrigger = useCallback(async (triggerId: string) => {
        const success = await dataService.updateTriggerType(triggerId, 'active');
        if (success) {
            setTriggers(prev => prev.map(t =>
                t.id === triggerId ? { ...t, triggerType: 'active' as const } : t
            ));
        }
        return success;
    }, []);

    // Remove a trigger
    const removeTrigger = useCallback(async (triggerId: string) => {
        const success = await dataService.deleteTrigger(triggerId);
        if (success) {
            setTriggers(prev => prev.filter(t => t.id !== triggerId));
        }
        return success;
    }, []);

    // Save a signal (upsert)
    const saveSignal = useCallback(async (signal: MarketSignal, triggerId?: string) => {
        if (!orgId) return null;

        // Generate fingerprint from headline + source (handle Unicode characters)
        const fingerprint = btoa(unescape(encodeURIComponent(signal.headline + (signal.sourceUrl || '')))).substring(0, 64);

        // Map app urgency to DB urgency
        const dbUrgency = signal.urgency === SignalUrgency.EMERGENCY ? 'emergency' :
            signal.urgency === SignalUrgency.HIGH ? 'high' :
                signal.urgency === SignalUrgency.MEDIUM ? 'medium' : 'low';

        const saved = await dataService.upsertSignal(orgId, {
            fingerprint,
            headline: signal.headline,
            summary: signal.summary,
            source_url: signal.sourceUrl,
            source_title: signal.sourceTitle,
            decision_maker: signal.decisionMaker,
            confidence: 'medium',
            urgency: dbUrgency as any,
            score: signal.score,
            matched_products: signal.matchedProducts,
            trigger_id: triggerId,
        });

        if (saved) {
            // Update local state
            setSignals(prev => {
                const existing = prev.findIndex(s => s.id === saved.id);
                const newSignal = dbSignalToAppSignal(saved);
                if (existing >= 0) {
                    const updated = [...prev];
                    updated[existing] = newSignal;
                    return updated;
                }
                return [newSignal, ...prev];
            });
        }

        return saved;
    }, [orgId]);

    // Update signal status
    const updateSignalStatus = useCallback(async (signalId: string, status: LeadStatus) => {
        const dbStatus = status === 'New' ? 'new' :
            status === 'Contacted' ? 'contacted' :
                status === 'Followed-up' ? 'contacted' :
                    status === 'Meeting Booked' ? 'meeting' :
                        'archived';

        const success = await dataService.updateSignalStatus(signalId, dbStatus as any);
        if (success) {
            setSignals(prev => prev.map(s =>
                s.id === signalId ? { ...s, status } : s
            ));
        }
        return success;
    }, []);

    // Create a hunt log when starting a hunt
    const createHuntLog = useCallback(async () => {
        if (!orgId) return null;
        return await dataService.createHuntLog(orgId);
    }, [orgId]);

    // Complete a hunt log
    const completeHuntLog = useCallback(async (huntId: string, signalsFound: number, status: 'success' | 'failed' = 'success', error?: string) => {
        return await dataService.updateHuntLog(huntId, {
            completed_at: new Date().toISOString(),
            signals_found: signalsFound,
            status,
            error,
        });
    }, []);

    // Save a dossier for a signal
    const saveDossier = useCallback(async (signalId: string, content: Record<string, unknown>) => {
        if (!orgId) return null;
        return await dataService.saveDossier(orgId, signalId, content);
    }, [orgId]);

    // Load business profile from Supabase
    const loadBusinessProfile = useCallback(async () => {
        if (!orgId) return null;
        const profile = await dataService.getBusinessProfile(orgId);
        console.log('[OrgData] Loaded business profile:', profile ? 'found' : 'not found');
        return profile;
    }, [orgId]);

    // Save business profile to Supabase
    const saveBusinessProfile = useCallback(async (profile: Record<string, unknown>) => {
        if (!orgId) return false;
        return await dataService.saveBusinessProfile(orgId, profile);
    }, [orgId]);

    return {
        organization,
        userProfile,
        triggers,
        signals,
        loading,
        loadTriggers,
        loadSignals,
        addTrigger,
        addAITriggers,
        removeTrigger,
        activateTrigger,
        saveSignal,
        updateSignalStatus,
        createHuntLog,
        completeHuntLog,
        saveDossier,
        loadBusinessProfile,
        saveBusinessProfile,
        setSignals,
    };
}
