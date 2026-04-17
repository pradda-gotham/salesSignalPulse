// Hook for loading organization data from Supabase
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dataService } from '../services/dataService';
import { SalesTrigger, MarketSignal, SignalUrgency, LeadStatus, TrackedWebsite, ProductCatalogItem, RateCardEntry } from '../types';
import { Database } from '../src/lib/database.types';

type DbTrigger = Database['public']['Tables']['triggers']['Row'];
type DbSignal = Database['public']['Tables']['signals']['Row'];
type DbTrackedWebsite = Database['public']['Tables']['tracked_websites']['Row'];

function dbTrackedWebsiteToApp(t: DbTrackedWebsite): TrackedWebsite {
    return {
        id: t.id,
        url: t.url,
        purpose: t.purpose || undefined,
        targetKeywords: t.target_keywords || undefined,
        isActive: t.is_active ?? true,
        lastScannedAt: t.last_scanned_at || undefined,
    };
}

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
    // Map DB relevance_feedback (lowercase) to app type (PascalCase)
    const feedbackRaw = (s as any).relevance_feedback as string | null;
    const relevanceFeedback: 'Positive' | 'Negative' | undefined =
        feedbackRaw === 'positive' ? 'Positive' :
        feedbackRaw === 'negative' ? 'Negative' :
        undefined;

    const sAny = s as any;
    const leadType = sAny.lead_type as MarketSignal['leadType'] | null;
    const entities = sAny.entities as MarketSignal['entities'] | null;
    const researchHints = sAny.research_hints as MarketSignal['researchHints'] | null;
    const semanticFingerprint = sAny.semantic_fingerprint as string | null;
    const relevanceScore = typeof sAny.relevance_score === 'number' ? sAny.relevance_score : undefined;
    const relevanceReasoning = sAny.relevance_reasoning as string | null;

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
            total: s.score || 50,
        },
        status: mapStatus(s.status),
        relevanceFeedback,
        trackedWebsiteId: s.tracked_website_id || undefined,
        leadType: leadType || undefined,
        entities: entities || undefined,
        researchHints: researchHints || undefined,
        semanticFingerprint: semanticFingerprint || undefined,
        relevanceScore,
        relevanceReasoning: relevanceReasoning || undefined,
    };
}

export function useOrgData() {
    const { organization, userProfile } = useAuth();
    const [triggers, setTriggers] = useState<SalesTrigger[]>([]);
    const [trackedWebsites, setTrackedWebsites] = useState<TrackedWebsite[]>([]);
    const [signals, setSignals] = useState<MarketSignal[]>([]);
    const [catalog, setCatalog] = useState<ProductCatalogItem[]>([]);
    const [rateCards, setRateCards] = useState<RateCardEntry[]>([]);
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

    // Load tracked websites
    const loadTrackedWebsites = useCallback(async () => {
        if (!orgId) return;
        const dbTrackedWebsites = await dataService.getTrackedWebsites(orgId);
        setTrackedWebsites(dbTrackedWebsites.map(dbTrackedWebsiteToApp));
    }, [orgId]);

    // Load product catalog
    const loadCatalog = useCallback(async () => {
        if (!orgId) return;
        const items = await dataService.getProductCatalog(orgId);
        setCatalog(items);
    }, [orgId]);

    // Load rate cards
    const loadRateCards = useCallback(async () => {
        if (!orgId) return;
        const entries = await dataService.getRateCards(orgId);
        setRateCards(entries);
    }, [orgId]);

    // Initial load
    useEffect(() => {
        const load = async () => {
            setLoading(true);
            await Promise.all([loadTriggers(), loadSignals(), loadTrackedWebsites(), loadCatalog(), loadRateCards()]);
            setLoading(false);
        };

        if (orgId) {
            load();
        }
    }, [orgId, loadTriggers, loadSignals, loadTrackedWebsites, loadCatalog, loadRateCards]);

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
                console.log('[OrgData] Skipping duplicate Leadpulse trigger:', fingerprint);
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
        console.log(`[OrgData] Added ${added.length} unique Leadpulse triggers (skipped ${newTriggers.length - added.length} duplicates)`);
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

    // Add a tracked website
    const addTrackedWebsite = useCallback(async (website: { url: string; target_keywords?: string; purpose?: string }) => {
        if (!orgId) return null;
        const created = await dataService.createTrackedWebsite(orgId, website);
        if (created) {
            const appWebsite = dbTrackedWebsiteToApp(created);
            setTrackedWebsites(prev => [appWebsite, ...prev]);
            return appWebsite;
        }
        return null;
    }, [orgId]);

    // Remove a tracked website
    const removeTrackedWebsite = useCallback(async (siteId: string) => {
        const success = await dataService.deleteTrackedWebsite(siteId);
        if (success) {
            setTrackedWebsites(prev => prev.filter(t => t.id !== siteId));
        }
        return success;
    }, []);

    // Update scan time for a tracked website
    const updateTrackedWebsiteScanTime = useCallback(async (siteId: string) => {
        const timestamp = new Date().toISOString();
        const success = await dataService.updateTrackedWebsite(siteId, { last_scanned_at: timestamp });
        if (success) {
            setTrackedWebsites(prev => prev.map(t => 
                t.id === siteId ? { ...t, lastScannedAt: timestamp } : t
            ));
        }
        return success ? timestamp : null;
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
            tracked_website_id: signal.trackedWebsiteId,
            lead_type: signal.leadType,
            semantic_fingerprint: signal.semanticFingerprint,
            entities: signal.entities,
            research_hints: signal.researchHints,
            relevance_score: signal.relevanceScore,
            relevance_reasoning: signal.relevanceReasoning,
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

    // Update signal relevance feedback
    const updateSignalFeedback = useCallback(async (signalId: string, feedback: 'Positive' | 'Negative') => {
        const dbFeedback = feedback === 'Positive' ? 'positive' : 'negative';
        const success = await dataService.updateSignalFeedback(signalId, dbFeedback);
        if (success) {
            setSignals(prev => prev.map(s =>
                s.id === signalId ? { ...s, relevanceFeedback: feedback } : s
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

    // ============ PRODUCT CATALOG CRUD ============

    const addCatalogItem = useCallback(async (item: { sku: string; name: string; description?: string; category?: string; unitPrice: number; costBasis?: number; unit?: string }) => {
        if (!orgId) return null;
        const created = await dataService.upsertProductCatalogItem(orgId, item);
        if (created) {
            await loadCatalog();
        }
        return created;
    }, [orgId, loadCatalog]);

    const updateCatalogItem = useCallback(async (item: { id: string; sku: string; name: string; description?: string; category?: string; unitPrice: number; costBasis?: number; unit?: string }) => {
        if (!orgId) return null;
        const updated = await dataService.upsertProductCatalogItem(orgId, item);
        if (updated) {
            await loadCatalog();
        }
        return updated;
    }, [orgId, loadCatalog]);

    const removeCatalogItem = useCallback(async (itemId: string) => {
        const success = await dataService.deleteProductCatalogItem(itemId);
        if (success) {
            setCatalog(prev => prev.filter(c => c.id !== itemId));
        }
        return success;
    }, []);

    // ============ RATE CARD CRUD ============

    const addRateCardEntry = useCallback(async (entry: { category: string; description: string; unit: string; defaultRate: number; region?: string }) => {
        if (!orgId) return null;
        const created = await dataService.upsertRateCardEntry(orgId, entry);
        if (created) {
            await loadRateCards();
        }
        return created;
    }, [orgId, loadRateCards]);

    const updateRateCardEntry = useCallback(async (entry: { id: string; category: string; description: string; unit: string; defaultRate: number; region?: string }) => {
        if (!orgId) return null;
        const updated = await dataService.upsertRateCardEntry(orgId, entry);
        if (updated) {
            await loadRateCards();
        }
        return updated;
    }, [orgId, loadRateCards]);

    const removeRateCardEntry = useCallback(async (entryId: string) => {
        const success = await dataService.deleteRateCardEntry(entryId);
        if (success) {
            setRateCards(prev => prev.filter(r => r.id !== entryId));
        }
        return success;
    }, []);

    // ============ AUDIT LOG ============

    const logEstimateChange = useCallback(async (dossierId: string, fieldPath: string, previousValue: unknown, newValue: unknown) => {
        if (!orgId) return;
        await dataService.logEstimateChange(orgId, dossierId, fieldPath, previousValue, newValue, userProfile?.id);
    }, [orgId, userProfile]);

    const getAuditLog = useCallback(async (dossierId: string) => {
        return await dataService.getAuditLog(dossierId);
    }, []);

    return {
        organization,
        userProfile,
        triggers,
        trackedWebsites,
        signals,
        catalog,
        rateCards,
        loading,
        loadTriggers,
        loadSignals,
        loadTrackedWebsites,
        loadCatalog,
        loadRateCards,
        addTrigger,
        addAITriggers,
        removeTrigger,
        activateTrigger,
        addTrackedWebsite,
        removeTrackedWebsite,
        updateTrackedWebsiteScanTime,
        saveSignal,
        updateSignalStatus,
        updateSignalFeedback,
        createHuntLog,
        completeHuntLog,
        saveDossier,
        loadBusinessProfile,
        saveBusinessProfile,
        setSignals,
        addCatalogItem,
        updateCatalogItem,
        removeCatalogItem,
        addRateCardEntry,
        updateRateCardEntry,
        removeRateCardEntry,
        logEstimateChange,
        getAuditLog,
    };
}
