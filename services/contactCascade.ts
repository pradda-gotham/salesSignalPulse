// ============================================================================
// Contact Cascade — 5-tier contact discovery pipeline
// ----------------------------------------------------------------------------
// Tier 1: Apollo direct match on normalized company name
// Tier 2: Apollo fuzzy match with best-candidate scoring
// Tier 3: Gemini Google-Search-grounded contact discovery (for Apollo gaps)
// Tier 4: Research hints only (LinkedIn search URL, tender portal, etc.)
// Tier 5: Manual user entry (not handled here — UI layer)
// ----------------------------------------------------------------------------
// Goal: every dossier returns SOMETHING actionable, never an empty state.
// ============================================================================

import { GoogleGenAI, Type } from "@google/genai";
import { apolloService } from "./apolloService";
import {
    BusinessProfile,
    MarketSignal,
    EnrichedContact,
    EnrichedCompany,
    ContactDiscoveryTier,
} from "../types";

// ============ ROLE KEYWORD SYNONYM LIBRARY ============

// Maps role categories to the set of titles Apollo might index under.
// Widens the net so "Procurement Officer" matches "Head of Supply Chain" too.
const ROLE_SYNONYMS: Record<string, string[]> = {
    procurement: ['Procurement', 'Purchasing', 'Supply Chain', 'Sourcing', 'Vendor Management', 'Buyer'],
    operations: ['Operations', 'COO', 'Chief Operating Officer', 'Plant Manager', 'Site Manager', 'Production', 'General Manager'],
    finance: ['CFO', 'Chief Financial Officer', 'Finance Director', 'Controller', 'Treasury', 'VP Finance'],
    executive: ['CEO', 'Chief Executive Officer', 'President', 'Managing Director', 'Founder'],
    sales: ['VP Sales', 'Head of Sales', 'Sales Director', 'Chief Revenue Officer', 'CRO'],
    marketing: ['CMO', 'Chief Marketing Officer', 'Head of Marketing', 'VP Marketing', 'Marketing Director'],
    engineering: ['CTO', 'Chief Technology Officer', 'VP Engineering', 'Head of Engineering', 'Director of Engineering'],
    hr: ['CHRO', 'Chief People Officer', 'VP People', 'Head of HR', 'People Operations'],
    facilities: ['Facilities Manager', 'Head of Facilities', 'Property Manager', 'Estate Manager'],
    construction: ['Project Manager', 'Construction Manager', 'Site Engineer', 'Superintendent'],
    marketing_digital: ['Head of Digital', 'Digital Marketing Director', 'Growth Lead', 'Performance Marketing'],
};

/**
 * Derive a wide, deduped list of role keywords to search Apollo with.
 * Priority order:
 *   1. Profile's typicalBuyerTitles (user-configured — most signal-specific)
 *   2. Categories detected in the signal's decisionMaker text
 *   3. Generic executive fallback
 */
export function deriveRoleKeywords(signal: MarketSignal, profile: BusinessProfile): string[] {
    const out = new Set<string>();

    // 1. Profile-configured buyer titles (highest priority — user knows their market)
    const userTitles = profile.icp?.typicalBuyerTitles?.filter(Boolean) || [];
    for (const title of userTitles) {
        out.add(title);
        // Also expand to synonyms of the category the title belongs to
        const category = detectRoleCategory(title);
        if (category) ROLE_SYNONYMS[category].forEach(t => out.add(t));
    }

    // 2. Categories detected in the signal's decisionMaker text
    const dmText = (signal.decisionMaker || '').toLowerCase();
    const signalCategory = detectRoleCategory(dmText);
    if (signalCategory) ROLE_SYNONYMS[signalCategory].forEach(t => out.add(t));

    // 3. Executive fallback if nothing else matched
    if (out.size === 0) {
        ROLE_SYNONYMS.executive.forEach(t => out.add(t));
        ROLE_SYNONYMS.operations.forEach(t => out.add(t));
    }

    return [...out];
}

function detectRoleCategory(text: string): string | null {
    const t = text.toLowerCase();
    if (/procure|purchas|supply chain|sourc|buyer|vendor/.test(t)) return 'procurement';
    if (/operat|coo|plant|site\s*manager|production|general manager/.test(t)) return 'operations';
    if (/cfo|financ|controller|treasur/.test(t)) return 'finance';
    if (/ceo|chief executive|president|managing director|founder/.test(t)) return 'executive';
    if (/sales|revenue|cro\b/.test(t)) return 'sales';
    if (/market|cmo|brand|growth/.test(t)) return 'marketing';
    if (/engineer|cto|technolog|technical/.test(t)) return 'engineering';
    if (/hr\b|people|chro|talent/.test(t)) return 'hr';
    if (/facilit|proper|estate|building/.test(t)) return 'facilities';
    if (/construct|site engineer|superintend|project manager/.test(t)) return 'construction';
    return null;
}

// ============ COMPANY NAME NORMALIZATION ============

let cachedAI: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
    if (!cachedAI) {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) throw new Error('Missing VITE_GEMINI_API_KEY');
        cachedAI = new GoogleGenAI({ apiKey });
    }
    return cachedAI;
}

/**
 * Regex-based quick clean — fast, deterministic.
 * Handles common legal suffixes + project-name contamination.
 */
export function quickNormalize(raw: string): string {
    let s = raw;
    // Strip parentheticals: "Acme (Project X)" → "Acme"
    s = s.replace(/\s*\([^)]*\)/g, '');
    // Strip common legal suffixes globally (not just English)
    s = s.replace(/\b(Pty\s*Ltd|Pty|Ltd|Limited|Inc|LLC|PLC|Corp|Corporation|Group|Holdings|GmbH|AG|SA|SARL|SAS|BV|AB|Oy|KK|株式会社)\b\.?/gi, '');
    // Strip common project/announcement suffixes
    s = s.replace(/\b(Project|Initiative|Programme?|Stage|Phase|Development|Construction|Tender|Contract|Announcement)\b/gi, '');
    // Collapse whitespace
    s = s.replace(/\s+/g, ' ').trim();
    // Strip trailing punctuation
    s = s.replace(/[.,;:\-]+$/, '').trim();
    return s || raw;
}

/**
 * AI-driven normalization — used when quickNormalize might not be enough.
 * Returns canonical company name for Apollo lookup.
 */
export async function aiNormalizeCompanyName(raw: string): Promise<string> {
    const quick = quickNormalize(raw);
    // Short-circuit: if the quick clean looks clean (no suspicious chars, under 5 words), skip the AI call
    if (quick.length < 40 && quick.split(/\s+/).length <= 4 && !/[:;|]/.test(quick)) {
        return quick;
    }

    try {
        const ai = getAI();
        const response = await Promise.race([
            ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: `Given this raw organization reference, return ONLY the canonical legal company name that could be looked up in a B2B database like Apollo or LinkedIn. Strip project names, tender references, locations, department labels, and any descriptive suffixes. Return just the company.

Examples:
Input: "Acme Construction Group Pty Ltd (Royal Hospital Expansion Project)"
Output: Acme Construction

Input: "NSW Department of Health - Western Sydney Regional Office"
Output: NSW Department of Health

Input: "Google Cloud Sustainability Initiative - Partner Announcement"
Output: Google

Now normalize:
Input: "${raw}"
Output:`,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: { type: Type.OBJECT, properties: { name: { type: Type.STRING } }, required: ['name'] },
                    temperature: 0.1,
                },
            }),
            new Promise<never>((_, reject) => setTimeout(() => reject(new Error('normalize timeout')), 15000)),
        ]);
        const parsed = JSON.parse((response as any).text || '{}');
        const aiName = (parsed.name || '').trim();
        return aiName || quick;
    } catch (err) {
        console.warn('[ContactCascade] AI normalize failed, falling back to quick clean:', (err as Error).message);
        return quick;
    }
}

// ============ DOMAIN EXTRACTION FROM SIGNAL ============

/**
 * If the signal's sourceUrl is the company's own site (not a news outlet),
 * extracting its domain lets us skip fuzzy name search entirely.
 */
const NEWS_DOMAINS = new Set([
    'reuters.com', 'bloomberg.com', 'wsj.com', 'nytimes.com', 'ft.com',
    'theguardian.com', 'bbc.com', 'bbc.co.uk', 'cnn.com', 'forbes.com',
    'techcrunch.com', 'businesswire.com', 'prnewswire.com', 'vertexaisearch.cloud.google.com',
    'medium.com', 'linkedin.com', 'twitter.com', 'x.com', 'facebook.com',
    'google.com', 'yahoo.com', 'news.google.com', 'msn.com', 'smh.com.au',
    'afr.com', 'theage.com.au', 'abc.net.au', 'news.com.au', 'crikey.com.au',
]);

export function extractLikelyCompanyDomain(signal: MarketSignal): string | null {
    if (!signal.sourceUrl) return null;
    try {
        const host = new URL(signal.sourceUrl).hostname.replace(/^www\./, '').toLowerCase();
        // If it's a known news/aggregator host, don't treat as company domain
        for (const news of NEWS_DOMAINS) {
            if (host === news || host.endsWith('.' + news)) return null;
        }
        // Filter out Google redirector domains
        if (host.includes('vertexaisearch') || host.includes('googleusercontent')) return null;
        return host;
    } catch {
        return null;
    }
}

// ============ TIER 3: GEMINI GROUNDED CONTACT DISCOVERY ============

/**
 * When Apollo returns nothing, use Gemini with Google Search grounding to
 * find real people at the company. This is the key fix for government
 * tenders and non-Apollo-indexed orgs.
 */
export async function geminiDiscoverContacts(
    companyName: string,
    domainHint: string | null,
    roleKeywords: string[],
    maxContacts: number = 3
): Promise<EnrichedContact[]> {
    try {
        const ai = getAI();
        const rolesStr = roleKeywords.slice(0, 5).join(', ');

        const prompt = `GROUNDED SEARCH TASK: Find currently-employed decision makers at the organization "${companyName}"${domainHint ? ` (website: ${domainHint})` : ''}.

ROLES TO SEARCH FOR: ${rolesStr}

For EACH person you find, return:
- name: Full name (first + last)
- title: Exact current title as it appears on LinkedIn or company website
- linkedinUrl: Full LinkedIn profile URL (must start with https://www.linkedin.com/in/...)
- sourceDetail: Where you found them (e.g. "${companyName} leadership page", "LinkedIn profile")
- confidence: 0-100 — how confident you are this person is currently at this org in this role

STRICT RULES:
- Only return REAL people found via search grounding. Never invent names.
- Only return LinkedIn URLs that are proper /in/ profile URLs, not /company/ pages.
- Do NOT return email addresses — public emails are unreliable; leave email field empty.
- If you find fewer than ${maxContacts} people, return only what you found. Empty list is OK.
- Prefer senior/decision-making titles over junior staff.

Return up to ${maxContacts} contacts.`;

        const response = await Promise.race([
            ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
                config: {
                    tools: [{ googleSearch: {} }],
                    temperature: 0.1,
                },
            }),
            new Promise<never>((_, reject) => setTimeout(() => reject(new Error('tier3 timeout')), 45000)),
        ]);

        const rawText = ((response as any).text || '').trim();
        if (!rawText) return [];

        // Gemini + grounding returns free-text, so parse JSON out of it
        let jsonText = rawText;
        const fenceMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (fenceMatch) jsonText = fenceMatch[1].trim();
        if (!jsonText.startsWith('[') && !jsonText.startsWith('{')) {
            const arrMatch = rawText.match(/\[[\s\S]*\]/);
            if (arrMatch) jsonText = arrMatch[0];
        }

        let parsed: any;
        try {
            parsed = JSON.parse(jsonText);
        } catch {
            console.warn('[ContactCascade] Tier 3 failed to parse JSON from Gemini');
            return [];
        }

        const items = Array.isArray(parsed) ? parsed : (parsed.contacts || []);
        const contacts: EnrichedContact[] = [];

        for (const item of items) {
            if (!item?.name || typeof item.name !== 'string') continue;
            const linkedinUrl = typeof item.linkedinUrl === 'string' && /linkedin\.com\/in\//i.test(item.linkedinUrl)
                ? item.linkedinUrl
                : null;

            contacts.push({
                name: item.name.trim(),
                title: (item.title || 'Unknown').toString().trim(),
                email: null,
                phone: null,
                linkedinUrl,
                isPrimary: contacts.length === 0,
                confidence: Math.min(70, Math.max(40, Number(item.confidence) || 55)),
                source: 'gemini',
                sourceDetail: typeof item.sourceDetail === 'string' ? item.sourceDetail : undefined,
                needsVerification: true,
            });
            if (contacts.length >= maxContacts) break;
        }

        console.log(`[ContactCascade] Tier 3 Gemini found ${contacts.length} candidate contacts`);
        return contacts;
    } catch (err) {
        console.warn('[ContactCascade] Tier 3 Gemini discovery failed:', (err as Error).message);
        return [];
    }
}

// ============ MAIN CASCADE ENTRY POINT ============

export interface ContactCascadeResult {
    contacts: EnrichedContact[];
    company: EnrichedCompany | null;
    tier: ContactDiscoveryTier;
    notes: string;
}

/**
 * Runs the full 5-tier cascade (Tiers 1–4 here; Tier 5 is manual UI-only).
 * Always returns a result — never throws, always gives the UI something to show.
 */
export async function runContactCascade(
    signal: MarketSignal,
    profile: BusinessProfile,
    rawCompanyName: string
): Promise<ContactCascadeResult> {
    const notes: string[] = [];
    const roleKeywords = deriveRoleKeywords(signal, profile);
    console.log(`[ContactCascade] Role keywords: ${roleKeywords.join(', ')}`);

    // ---------- PREP: Normalize name + extract domain hint ----------
    const normalizedName = await aiNormalizeCompanyName(rawCompanyName);
    notes.push(`Normalized "${rawCompanyName}" → "${normalizedName}"`);
    const domainHint = extractLikelyCompanyDomain(signal);
    if (domainHint) notes.push(`Domain hint from source URL: ${domainHint}`);

    // ---------- TIER 1: Apollo domain-first, then name lookup ----------
    let apolloCompany = null;

    if (domainHint) {
        // Domain is much more reliable than fuzzy name — try it first
        try {
            const contacts = await apolloService.findAndEnrichDecisionMakers(domainHint, roleKeywords, 3);
            if (contacts.length > 0) {
                console.log(`[ContactCascade] Tier 1 domain-direct hit: ${contacts.length} contacts at ${domainHint}`);
                const enriched = contacts.map((c, idx) => mapApolloContact(c, idx === 0));
                return {
                    contacts: enriched,
                    company: null, // We didn't fetch company; domain was enough
                    tier: 'apollo_direct',
                    notes: `Domain-first Apollo match on ${domainHint}; ${contacts.length} contacts enriched.`,
                };
            }
            notes.push(`Apollo domain-direct on ${domainHint}: no contacts in role set`);
        } catch (err) {
            notes.push(`Apollo domain-direct error: ${(err as Error).message}`);
        }
    }

    // ---------- TIER 1b: Apollo name lookup ----------
    apolloCompany = await apolloService.findCompany(normalizedName);
    let matchedVia: 'direct' | 'fuzzy' = 'direct';

    // ---------- TIER 2: Fuzzy fallback with best-candidate scoring ----------
    // If Tier 1b missed OR the top match looks dubious, fetch 5 candidates
    // and score them against signal context (domain/industry/region/size).
    const candidateNeedsReview = !apolloCompany || !looksLikeReasonableMatch(apolloCompany, normalizedName, domainHint);
    if (candidateNeedsReview) {
        const candidates = await apolloService.findCompanyCandidates(normalizedName, 5);
        if (candidates.length > 0) {
            const scored = candidates
                .map(c => ({ company: c, score: scoreCompanyCandidate(c, signal, profile, normalizedName, domainHint) }))
                .sort((a, b) => b.score - a.score);
            const best = scored[0];
            console.log(`[ContactCascade] Tier 2 scored candidates:`, scored.map(s => `${s.company.name}=${s.score}`).join(', '));
            if (best && best.score >= 40) {
                apolloCompany = best.company;
                matchedVia = 'fuzzy';
                notes.push(`Tier 2 fuzzy picked "${best.company.name}" (score ${best.score}/100)`);
            } else {
                notes.push(`Tier 2 fuzzy: no candidate scored >= 40 threshold`);
                apolloCompany = null;
            }
        }
    }

    if (apolloCompany) {
        notes.push(`Apollo company match: ${apolloCompany.name} (${apolloCompany.primary_domain})`);
        const contacts = await apolloService.findAndEnrichDecisionMakers(apolloCompany.primary_domain, roleKeywords, 3);
        if (contacts.length > 0) {
            const enriched = contacts.map((c, idx) => mapApolloContact(c, idx === 0, matchedVia));
            return {
                contacts: enriched,
                company: mapApolloCompany(apolloCompany),
                tier: matchedVia === 'fuzzy' ? 'apollo_fuzzy' : 'apollo_direct',
                notes: `${notes.join('; ')}; ${contacts.length} contacts enriched.`,
            };
        }
        notes.push(`Apollo found company but no contacts in role set`);
    } else {
        notes.push(`Apollo: no company match for "${normalizedName}"`);
    }

    // ---------- TIER 3: Gemini grounded contact discovery ----------
    const geminiContacts = await geminiDiscoverContacts(normalizedName, domainHint, roleKeywords, 3);
    if (geminiContacts.length > 0) {
        notes.push(`Gemini grounded search: ${geminiContacts.length} candidate contacts`);
        return {
            contacts: geminiContacts,
            company: apolloCompany ? mapApolloCompany(apolloCompany) : null,
            tier: 'gemini_grounded',
            notes: notes.join('; '),
        };
    }
    notes.push(`Gemini grounded search: no candidates found`);

    // ---------- TIER 4: Research hints only ----------
    return {
        contacts: [],
        company: apolloCompany ? mapApolloCompany(apolloCompany) : null,
        tier: 'hints_only',
        notes: notes.join('; '),
    };
}

// ============ APOLLO → APP MAPPERS ============

function mapApolloContact(c: any, isPrimary: boolean, matchedVia: 'direct' | 'fuzzy' = 'direct'): EnrichedContact {
    const baseConfidence = c.email ? 95 : 75;
    // Fuzzy-matched companies get a confidence haircut — the contacts are real
    // but they might be at a slightly-different-but-similarly-named org.
    const confidence = matchedVia === 'fuzzy' ? Math.max(55, baseConfidence - 15) : baseConfidence;
    return {
        name: c.name || `${c.first_name || ''} ${c.last_name || ''}`.trim() || 'Unknown',
        title: c.title || 'Unknown Title',
        email: c.email || null,
        phone: c.sanitized_phone || null,
        linkedinUrl: c.linkedin_url || null,
        isPrimary,
        confidence,
        source: matchedVia === 'fuzzy' ? 'apollo_fuzzy' : 'apollo',
        needsVerification: matchedVia === 'fuzzy',
    };
}

// ============ TIER 2 HELPERS: RANKING & REASONABLENESS ============

/**
 * Quick gate — is the top Apollo hit even plausibly the right company?
 * If not, Tier 2 fuzzy rescoring kicks in.
 */
function looksLikeReasonableMatch(
    candidate: any,
    normalizedName: string,
    domainHint: string | null
): boolean {
    if (!candidate) return false;

    // If we have a domain hint and the candidate's domain matches, trust it.
    if (domainHint && candidate.primary_domain) {
        const candDomain = candidate.primary_domain.toLowerCase();
        if (candDomain === domainHint || candDomain.endsWith('.' + domainHint) || domainHint.endsWith('.' + candDomain)) {
            return true;
        }
        // Domain hint exists but candidate's domain is clearly different — dubious
        // Let Tier 2 rescore.
        return false;
    }

    // No domain hint → do a name-similarity check.
    const a = normalizedName.toLowerCase().replace(/\s+/g, '');
    const b = (candidate.name || '').toLowerCase().replace(/\s+/g, '');
    if (!b) return false;
    // Accept if either contains the other as substring, or first word matches.
    if (a.includes(b) || b.includes(a)) return true;
    const firstWordA = normalizedName.toLowerCase().split(/\s+/)[0];
    const firstWordB = (candidate.name || '').toLowerCase().split(/\s+/)[0];
    return firstWordA === firstWordB && firstWordA.length >= 4;
}

/**
 * Score an Apollo candidate against signal/profile context, 0-100.
 *   Domain overlap with signal source URL: +40
 *   Industry match with profile.industry:  +20
 *   Region match with signal.region:       +20
 *   Employee count fits ICP size range:    +20
 *   Name similarity baseline:              +0..+20
 */
function scoreCompanyCandidate(
    candidate: any,
    signal: MarketSignal,
    profile: BusinessProfile,
    normalizedName: string,
    domainHint: string | null
): number {
    let score = 0;

    // Domain overlap — strongest signal
    if (domainHint && candidate.primary_domain) {
        const a = domainHint.toLowerCase();
        const b = candidate.primary_domain.toLowerCase();
        if (a === b) score += 40;
        else if (a.endsWith('.' + b) || b.endsWith('.' + a)) score += 30;
    }

    // Industry match
    if (profile.industry && candidate.industry) {
        const pInd = profile.industry.toLowerCase();
        const cInd = candidate.industry.toLowerCase();
        if (pInd === cInd || pInd.includes(cInd) || cInd.includes(pInd)) score += 20;
    }

    // Region / geography match — rough text overlap
    const signalRegion = (signal.region || '').toLowerCase();
    const profileGeo = (profile.geography || []).join(' ').toLowerCase();
    if (candidate.name && (signalRegion || profileGeo)) {
        // Apollo doesn't return HQ region on search; fall back to checking
        // if the profile geography appears in the candidate's name/industry.
        const blob = `${candidate.name} ${candidate.industry || ''}`.toLowerCase();
        if (signalRegion && signalRegion.split(/[,\s]+/).some(r => r.length > 3 && blob.includes(r))) score += 10;
        if (profileGeo && profileGeo.split(/[,\s]+/).some(r => r.length > 3 && blob.includes(r))) score += 10;
    }

    // Employee count within ICP size range
    const icpSize = profile.icp?.companySize;
    const empCount = Number(candidate.estimated_num_employees) || 0;
    if (icpSize && empCount > 0) {
        const [lo, hi] = parseSizeRange(icpSize);
        if (empCount >= lo && empCount <= hi) score += 20;
    }

    // Name similarity baseline
    const a = normalizedName.toLowerCase().replace(/\s+/g, '');
    const b = (candidate.name || '').toLowerCase().replace(/\s+/g, '');
    if (a && b) {
        if (a === b) score += 20;
        else if (a.includes(b) || b.includes(a)) score += 15;
        else {
            const firstA = normalizedName.toLowerCase().split(/\s+/)[0];
            const firstB = (candidate.name || '').toLowerCase().split(/\s+/)[0];
            if (firstA && firstA === firstB) score += 10;
        }
    }

    return Math.min(100, score);
}

function parseSizeRange(range: string): [number, number] {
    // Accepts "1-50", "50-200", "1000+", etc.
    const m = range.match(/(\d+)\s*[-–]\s*(\d+)/);
    if (m) return [Number(m[1]), Number(m[2])];
    const plus = range.match(/(\d+)\s*\+/);
    if (plus) return [Number(plus[1]), Number.MAX_SAFE_INTEGER];
    const n = range.match(/(\d+)/);
    if (n) return [Number(n[1]), Number(n[1]) * 4];
    return [0, Number.MAX_SAFE_INTEGER];
}

function mapApolloCompany(c: any): EnrichedCompany {
    return {
        name: c.name,
        domain: c.primary_domain,
        linkedinUrl: c.linkedin_url,
        employeeCount: c.estimated_num_employees,
        revenue: c.annual_revenue,
        industry: c.industry,
        source: 'apollo',
    };
}
