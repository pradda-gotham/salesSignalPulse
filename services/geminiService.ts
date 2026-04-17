import { Type } from "@google/genai";
import { BusinessProfile, SalesTrigger, MarketSignal, SignalUrgency, SignalConfidence, DealDossier, EnrichedContact, EnrichedCompany, CostEstimation, CostCategory, TrackedWebsite, ProductCatalogItem, RateCardEntry, AuditablePrice, ProjectIntelligence, ScaleMetric, LineItemDerivation, EstimationAuditTrail, LeadType, SignalEntity, ResearchHints } from "../types";
import { apolloService } from "./apolloService";

// Uses the new backend proxy to hide the API key
const callGeminiAPI = async (payload: any) => {
  const response = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini Proxy Error: ${response.status} - ${errorText}`);
  }

  return response.json();
};

const mockedAI = {
  models: {
    generateContent: callGeminiAPI
  }
};

const getAI = () => {
  return mockedAI;
};

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const isQuotaError = error.message?.includes('quota') || error.message?.includes('429');
      if (isQuotaError && i < maxRetries - 1) {
        const waitTime = Math.pow(2, i) * 1000 + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

/**
 * Wraps a promise in a timeout to prevent infinite hanging if the API connection silently drops.
 */
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutHandle: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new Error(`Operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  return Promise.race([
    promise,
    timeoutPromise
  ]).finally(() => {
    clearTimeout(timeoutHandle);
  });
}



/**
 * Validates that a URL is accessible. Returns true if the URL responds, false otherwise.
 * Uses a simple fetch with a short timeout.
 */
async function validateUrl(url: string, timeoutMs: number = 5000): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      mode: 'no-cors' // Allow cross-origin requests without CORS errors
    });

    clearTimeout(timeoutId);
    return true; // If no error thrown, URL is reachable
  } catch (error) {
    console.warn(`[URL Validation] Failed for ${url}:`, (error as Error).message);
    return false;
  }
}

// Pass 2: The Verifier - Finds the exact URL for a specific headline
async function verifySignalSource(headline: string, companyName: string): Promise<string> {
  return withRetry(async () => {
    try {
      const ai = getAI();
      console.log(`[VERIFY] Starting verification for: "${headline.substring(0, 60)}..."`);

      const response = await withTimeout(
        ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `Find the exact URL of the news article, press release, or announcement for this headline: "${headline}".
          The article may involve ${companyName}.
          Respond with ONLY the full URL. Nothing else. No markdown. No explanation.`,
          config: {
            tools: [{ googleSearch: {} }],
            temperature: 0.1
          }
        }),
        45000 // 45 second timeout
      );

      const rawText = response.text ? response.text.trim() : "";
      console.log(`[VERIFY] Raw response text: "${rawText.substring(0, 200)}"`);

      // Strategy 1: Extract URL from the response text using regex
      // This handles cases where Gemini wraps the URL in markdown, backticks, or extra text
      const urlRegex = /https?:\/\/[^\s"'`<>\])\n]+/gi;
      const urlMatches = rawText.match(urlRegex);

      if (urlMatches && urlMatches.length > 0) {
        // Clean trailing punctuation that might have been captured
        const cleanUrl = urlMatches[0].replace(/[.,;:!?)]+$/, '');
        try {
          const parsed = new URL(cleanUrl);
          if (parsed.pathname.length > 3) {
            console.log(`[VERIFY] ✅ Found URL from text: ${cleanUrl}`);
            return cleanUrl;
          }
        } catch (e) { /* invalid URL, try next strategy */ }
      }

      // Strategy 2: Check grounding chunks for deep links
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      console.log(`[VERIFY] Grounding chunks: ${chunks.length}`);

      if (chunks.length > 0) {
        // Find a URL that isn't just a root domain
        const deepLink = chunks.find(c => {
          try {
            const url = new URL(c.web?.uri || '');
            return url.pathname.length > 3;
          } catch (e) { return false; }
        });

        if (deepLink?.web?.uri) {
          console.log(`[VERIFY] ✅ Found URL from grounding chunk: ${deepLink.web.uri}`);
          return deepLink.web.uri;
        }

        // If no deep link, take ANY grounding chunk URL (even a homepage is better than nothing)
        const anyChunk = chunks.find(c => c.web?.uri);
        if (anyChunk?.web?.uri) {
          console.log(`[VERIFY] ⚠️ Using homepage-level grounding URL: ${anyChunk.web.uri}`);
          return anyChunk.web.uri;
        }
      }

      // Strategy 3: Check search entry points (another metadata location for search grounding URLs)
      const searchEntryPoint = response.candidates?.[0]?.groundingMetadata?.searchEntryPoint;
      if (searchEntryPoint?.renderedContent) {
        const entryMatches = searchEntryPoint.renderedContent.match(urlRegex);
        if (entryMatches && entryMatches.length > 0) {
          const cleanEntryUrl = entryMatches[0].replace(/[.,;:!?)]+$/, '');
          console.log(`[VERIFY] ✅ Found URL from search entry point: ${cleanEntryUrl}`);
          return cleanEntryUrl;
        }
      }

      console.warn(`[VERIFY] ❌ Could not find any URL for: "${headline.substring(0, 60)}..."`);
      return "unverified";
    } catch (err) {
      console.warn(`[VERIFY FAILED] Could not verify source for "${headline.substring(0, 60)}...":`, (err as Error).message);
      return "unverified";
    }
  });
}

// ============ ADVANCED PROFILE CONTEXT BUILDER ============
// Injects ICP, USP, exclusions, deal characteristics, etc. into AI prompts

function buildAdvancedContext(profile: BusinessProfile): string {
  const parts: string[] = [];

  // ICP
  if (profile.icp?.companySize) parts.push(`Target company size: ${profile.icp.companySize} employees`);
  if (profile.icp?.revenueRange) parts.push(`Target revenue range: ${profile.icp.revenueRange}`);
  if (profile.icp?.typicalBuyerTitles?.filter(Boolean).length) parts.push(`Key decision-maker titles: ${profile.icp.typicalBuyerTitles.filter(Boolean).join(', ')}`);
  if (profile.icp?.customerType) parts.push(`Customer type: ${profile.icp.customerType}`);
  if (profile.icp?.priorityIndustries?.filter(Boolean).length) parts.push(`Priority industries: ${profile.icp.priorityIndustries.filter(Boolean).join(', ')}`);
  if (profile.icp?.companyStagePreference && profile.icp.companyStagePreference !== 'no_preference') parts.push(`Preferred company stage: ${profile.icp.companyStagePreference}`);

  // Problem-Solution Fit
  if (profile.problemSolutionFit?.painPoints?.filter(Boolean).length) parts.push(`Problems we solve: ${profile.problemSolutionFit.painPoints.filter(Boolean).join('; ')}`);
  if (profile.problemSolutionFit?.buyingTriggers?.filter(Boolean).length) parts.push(`Known buying triggers: ${profile.problemSolutionFit.buyingTriggers.filter(Boolean).join(', ')}`);
  if (profile.problemSolutionFit?.readinessSignals?.filter(Boolean).length) parts.push(`Readiness signals: ${profile.problemSolutionFit.readinessSignals.filter(Boolean).join('; ')}`);

  // USP
  if (profile.usp?.whyChooseUs) parts.push(`Why customers choose us: ${profile.usp.whyChooseUs}`);
  if (profile.usp?.uniqueStrength) parts.push(`Our unique strength: ${profile.usp.uniqueStrength}`);
  if (profile.usp?.proofPoints?.filter(Boolean).length) parts.push(`Proof points: ${profile.usp.proofPoints.filter(Boolean).join('; ')}`);
  if (profile.usp?.measurableOutcomes?.filter(Boolean).length) parts.push(`Measurable outcomes: ${profile.usp.measurableOutcomes.filter(Boolean).join('; ')}`);

  // Deal Characteristics
  if (profile.dealCharacteristics?.avgDealSize) parts.push(`Typical deal size: ${profile.dealCharacteristics.avgDealSize}`);
  if (profile.dealCharacteristics?.typicalSalesCycle) parts.push(`Sales cycle: ${profile.dealCharacteristics.typicalSalesCycle}`);
  if (profile.dealCharacteristics?.competitors?.filter(c => c.name).length) {
    const compStr = profile.dealCharacteristics.competitors!.filter(c => c.name).map(c => {
      let s = c.name;
      if (c.whyWeWin) s += ` (we win because: ${c.whyWeWin})`;
      if (c.whyWeLose) s += ` (we lose because: ${c.whyWeLose})`;
      return s;
    }).join('; ');
    parts.push(`Competitors: ${compStr}`);
  }

  // Exclusions
  if (profile.exclusions?.excludedIndustries?.filter(Boolean).length) parts.push(`EXCLUDE these industries: ${profile.exclusions.excludedIndustries.filter(Boolean).join(', ')}`);
  if (profile.exclusions?.excludedRegions?.filter(Boolean).length) parts.push(`EXCLUDE these regions: ${profile.exclusions.excludedRegions.filter(Boolean).join(', ')}`);
  if (profile.exclusions?.excludedCompanySizes?.filter(Boolean).length) parts.push(`EXCLUDE these company sizes: ${profile.exclusions.excludedCompanySizes.filter(Boolean).join(', ')}`);
  if (profile.exclusions?.redFlags?.filter(Boolean).length) parts.push(`Red flags to avoid: ${profile.exclusions.redFlags.filter(Boolean).join('; ')}`);

  // Sales Approach
  if (profile.salesApproach?.toneOfVoice) parts.push(`Preferred tone: ${profile.salesApproach.toneOfVoice}`);
  if (profile.salesApproach?.primaryChannels?.length) parts.push(`Primary sales channels: ${profile.salesApproach.primaryChannels.join(', ')}`);
  if (profile.salesApproach?.commonObjections?.filter(Boolean).length) parts.push(`Common objections: ${profile.salesApproach.commonObjections.filter(Boolean).join('; ')}`);

  // Data Sources
  if (profile.dataSources?.trustedSources?.filter(Boolean).length) parts.push(`Preferred signal sources: ${profile.dataSources.trustedSources.filter(Boolean).join(', ')}`);
  if (profile.dataSources?.monitoredCompetitors?.filter(Boolean).length) parts.push(`Monitor competitors: ${profile.dataSources.monitoredCompetitors.filter(Boolean).join(', ')}`);

  // Success Metrics
  if (profile.successMetrics?.goodLeadDefinition) parts.push(`Good lead definition: ${profile.successMetrics.goodLeadDefinition}`);
  if (profile.successMetrics?.volumeVsQuality) parts.push(`Priority: ${profile.successMetrics.volumeVsQuality} over ${profile.successMetrics.volumeVsQuality === 'volume' ? 'quality' : 'volume'}`);

  return parts.length > 0 ? '\n\nADVANCED BUSINESS PROFILE CONTEXT:\n' + parts.join('\n') : '';
}

// Legacy bundle processing (used when no catalog or when Glass Box Stage 2 fails)
function legacyProcessBundle(
  data: any,
  catalogMap: Map<string, ProductCatalogItem>,
  hasCatalog: boolean
): { bundle: DealDossier['recommendedBundle']; pricingStrategy: DealDossier['pricingStrategy'] } {
  const processedBundle = (data.recommendedBundle || []).map((item: any) => {
    const catalogMatch = catalogMap.get((item.sku || '').toLowerCase());
    let unitPrice: AuditablePrice;
    let catalogItemId: string | undefined;

    if (catalogMatch) {
      unitPrice = {
        value: catalogMatch.unitPrice,
        source: 'catalog',
        confidence: 100,
        sourceDetail: `Catalog SKU ${catalogMatch.sku} @ $${catalogMatch.unitPrice}/${catalogMatch.unit}`,
      };
      catalogItemId = catalogMatch.id;
    } else {
      unitPrice = {
        value: item.unitPrice || 0,
        source: 'ai_estimate',
        confidence: 40,
        sourceDetail: 'AI-generated estimate — no catalog match',
      };
    }

    const lineTotal = item.quantity * unitPrice.value;
    return { sku: item.sku, description: item.description, quantity: item.quantity, catalogItemId, unitPrice, lineTotal };
  });

  const bundleSubtotal = processedBundle.reduce((sum: number, b: any) => sum + (b.lineTotal || 0), 0);
  const aiDiscount = data.pricingStrategy?.discount || 0;
  const discountAmount = bundleSubtotal * (aiDiscount / 100);
  const derivedEstimatedValue = bundleSubtotal - discountAmount;

  const hasCatalogItems = processedBundle.some((b: any) => b.catalogItemId);
  const derivation: 'catalog_sum' | 'ai_estimate' | 'hybrid' = hasCatalog
    ? (hasCatalogItems ? (processedBundle.every((b: any) => b.catalogItemId) ? 'catalog_sum' : 'hybrid') : 'ai_estimate')
    : 'ai_estimate';

  const processedPricingStrategy = {
    logic: data.pricingStrategy?.logic || '',
    discount: {
      value: aiDiscount,
      source: 'ai_estimate' as const,
      confidence: 40,
      sourceDetail: 'AI-recommended discount percentage',
    } as AuditablePrice,
    estimatedValue: {
      value: bundleSubtotal > 0 ? derivedEstimatedValue : (data.pricingStrategy?.estimatedValue || 0),
      source: (derivation === 'catalog_sum' ? 'catalog' : derivation === 'hybrid' ? 'catalog' : 'ai_estimate') as AuditablePrice['source'],
      confidence: derivation === 'catalog_sum' ? 95 : derivation === 'hybrid' ? 70 : 40,
      sourceDetail: derivation === 'catalog_sum'
        ? `Derived from catalog pricing: $${bundleSubtotal.toLocaleString()} - ${aiDiscount}% discount`
        : derivation === 'hybrid'
          ? `Partially catalog-based: $${bundleSubtotal.toLocaleString()} - ${aiDiscount}% discount`
          : 'AI-generated estimate — configure product catalog for accurate pricing',
    } as AuditablePrice,
    derivation,
  };

  return { bundle: processedBundle, pricingStrategy: processedPricingStrategy };
}

// ============ SIGNAL QUALITY HELPERS ============

/**
 * Compute a semantic fingerprint that stays stable across hunt runs for the
 * same opportunity. Uses canonical account name + event type + week bucket
 * so a slightly different headline for the same deal still dedups.
 */
function computeSemanticFingerprint(accountName: string, canonicalEvent: string, timestamp?: string): string {
  const normalize = (s: string) => (s || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\b(the|a|an|inc|ltd|pty|limited|corporation|corp|llc|plc|group|holdings)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const account = normalize(accountName) || 'unknown';
  const event = normalize(canonicalEvent) || 'unknown';

  // Week bucket: floor to Monday of the week so same opportunity within a week collapses.
  const d = timestamp ? new Date(timestamp) : new Date();
  const day = d.getUTCDay(); // 0 = Sunday
  const diff = (day === 0 ? -6 : 1) - day;
  const weekStart = new Date(d);
  weekStart.setUTCDate(d.getUTCDate() + diff);
  const weekBucket = `${weekStart.getUTCFullYear()}-W${Math.ceil(((weekStart.getTime() - new Date(Date.UTC(weekStart.getUTCFullYear(), 0, 1)).getTime()) / 86400000 + 1) / 7)}`;

  const raw = `${account}::${event}::${weekBucket}`;
  return btoa(unescape(encodeURIComponent(raw))).substring(0, 48);
}

/**
 * Build actionable research hints for signals where direct enrichment is unlikely
 * (government tenders, project winners, market trends). Gives the sales rep a
 * concrete next step instead of a dead-end "no contact found".
 */
function computeResearchHints(
  leadType: LeadType | undefined,
  accountName: string,
  headline: string,
  sourceUrl: string,
  entities: SignalEntity[] | undefined,
  profile: BusinessProfile
): ResearchHints | undefined {
  if (!leadType || leadType === 'direct_company') return undefined;

  const hints: ResearchHints = {};
  const buyerTitles = profile.icp?.typicalBuyerTitles?.filter(Boolean) || ['Procurement', 'Operations Manager'];
  const encodedHeadline = encodeURIComponent(headline.substring(0, 120));

  if (leadType === 'government_tender') {
    hints.tenderPortalUrl = sourceUrl || undefined;
    const agency = entities?.find(e => e.type === 'government')?.name || accountName;
    hints.agency = agency;
    hints.linkedinSearchUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(buyerTitles[0] + ' ' + agency)}`;
    hints.googleContactSearch = `https://www.google.com/search?q=${encodeURIComponent(agency + ' procurement contact email')}`;
    hints.suggestedNextAction = `Open the tender portal to find the exact RFP reference, then search LinkedIn for ${buyerTitles.slice(0, 2).join(' / ')} at ${agency}. Contact the agency procurement office directly if contacts aren't listed.`;
  } else if (leadType === 'project_winner') {
    const winner = entities?.find(e => e.role === 'contractor')?.name || accountName;
    hints.linkedinSearchUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent('Procurement Manager ' + winner)}`;
    hints.googleContactSearch = `https://www.google.com/search?q=${encodeURIComponent(winner + ' procurement supplier onboarding')}`;
    hints.suggestedNextAction = `${winner} won this project — they now need suppliers. Reach out to their procurement team before competitors do. Check their careers page for recent procurement hires.`;
  } else if (leadType === 'market_trend') {
    hints.googleContactSearch = `https://www.google.com/search?q=${encodedHeadline}+buyer+intent`;
    hints.suggestedNextAction = `This is a market-level trend, not a specific lead. Use it to inform outreach messaging and segment targeting in your campaigns.`;
  }

  return Object.keys(hints).length > 0 ? hints : undefined;
}

/**
 * Post-hunt relevance scoring pass. Runs a single low-cost Gemini call to
 * triage the candidate signals against the user's profile (products, ICP,
 * exclusions) and returns per-signal keep/reject decisions with reasoning.
 * This is the hard exclusion filter that keeps irrelevant signals out.
 */
async function scoreSignalsRelevance(
  candidates: MarketSignal[],
  profile: BusinessProfile
): Promise<Array<{ id: string; keep: boolean; score: number; reasoning: string }>> {
  if (candidates.length === 0) return [];

  const ai = getAI();
  const excluded = [
    ...(profile.exclusions?.excludedIndustries?.filter(Boolean) || []),
    ...(profile.exclusions?.excludedRegions?.filter(Boolean) || []),
  ];
  const buyerTitles = profile.icp?.typicalBuyerTitles?.filter(Boolean) || [];
  const goodLeadDef = profile.successMetrics?.goodLeadDefinition || '';

  const prompt = `You are a lead qualification analyst. Score each of the following signals for relevance to this business:

BUSINESS: ${profile.name} (${profile.industry})
PRODUCTS: ${profile.products.join(', ')}
TARGET BUYERS: ${profile.targetGroups.join(', ')}
${buyerTitles.length ? `DECISION MAKER TITLES: ${buyerTitles.join(', ')}` : ''}
${goodLeadDef ? `WHAT MAKES A GOOD LEAD: ${goodLeadDef}` : ''}
${excluded.length ? `HARD EXCLUSIONS (reject if signal is about any of these): ${excluded.join(', ')}` : ''}

SIGNALS TO SCORE:
${candidates.map((s, idx) => `${idx + 1}. [id=${s.id}] "${s.headline}" — ${s.summary.substring(0, 200)}`).join('\n')}

For EACH signal, return:
- id: the exact id from above
- score: 0-100 relevance score (100 = perfect fit, 0 = totally irrelevant)
- keep: true if score >= 50 AND no hard exclusion match, false otherwise
- reasoning: 1 sentence explaining why

Return a JSON array. Be strict on exclusions — if the signal is about an excluded industry/region, keep=false regardless of score.`;

  try {
    const response = await withTimeout(
      ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                score: { type: Type.NUMBER },
                keep: { type: Type.BOOLEAN },
                reasoning: { type: Type.STRING },
              },
              required: ['id', 'score', 'keep', 'reasoning'],
            },
          },
          temperature: 0.1,
        },
      }),
      45000
    );
    const parsed = JSON.parse(response.text || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('[RELEVANCE] Scoring pass failed, keeping all candidates:', (err as Error).message);
    return candidates.map(c => ({ id: c.id, keep: true, score: 60, reasoning: 'Relevance scorer unavailable' }));
  }
}

export const geminiService = {
  async profileBusiness(url: string): Promise<Partial<BusinessProfile>> {
    return withRetry(async () => {
      const ai = getAI();
      const response = await withTimeout(
        ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `Profile the business at this URL: ${url}. Identify the actual company name, industry, core products, target customer groups, and geography. Return as JSON.`,
          config: {
            tools: [{ googleSearch: {} }],
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                industry: { type: Type.STRING },
                products: { type: Type.ARRAY, items: { type: Type.STRING } },
                targetGroups: { type: Type.ARRAY, items: { type: Type.STRING } },
                geography: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ["name", "industry", "products", "targetGroups", "geography"]
            }
          }
        }),
        45000 // 45 seconds for profiling
      );
      return JSON.parse(response.text || '{}');
    });
  },

  async generateTriggers(profile: BusinessProfile): Promise<SalesTrigger[]> {
    return withRetry(async () => {
      const ai = getAI();
      const advancedCtx = buildAdvancedContext(profile);
      const prompt = `Given these products: ${profile.products.join(', ')} and these target groups: ${profile.targetGroups.join(', ')} for the company ${profile.name} in the ${profile.industry} industry, what real-world events or "sales triggers" create immediate demand? Generate 4 triggers.
${advancedCtx}
For each trigger, provide:
- product: The specific product or service from the list above
- event: A concrete, searchable real-world event (e.g., "New government dietary guidelines released", "Major construction project announced", "Back-to-school season begins")
- source: A specific, searchable source type where this event would be reported (e.g., "Health news outlets", "Government procurement portals", "Industry trade publications", "Google Trends"). Be concrete — not vague categories.
- logic: Why this event creates buying intent for the product`;

      const response = await withTimeout(
        ai.models.generateContent({
          model: 'gemini-3-pro-preview',
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  product: { type: Type.STRING },
                  event: { type: Type.STRING },
                  source: { type: Type.STRING },
                  logic: { type: Type.STRING }
                },
                required: ["product", "event", "source", "logic"]
              }
            }
          }
        }),
        45000 // 45 seconds
      );

      const rawTriggers = JSON.parse(response.text || '[]');
      return rawTriggers.map((t: any, idx: number) => ({
        ...t,
        id: `ai-${btoa(unescape(encodeURIComponent(t.event + t.product))).substring(0, 16)}-${idx}`,
        status: 'Pending'
      }));
    });
  },

  async huntSignals(
    profile: BusinessProfile,
    activeTriggers: SalesTrigger[],
    activeRegion?: string,
    onSignal?: (signal: MarketSignal) => void
  ): Promise<MarketSignal[]> {
    return withRetry(async () => {
      const ai = getAI();
      const regionContext = activeRegion || profile.geography.join(', ');

      // Calculate date range for recency (past 14 days)
      const today = new Date();
      const twoWeeksAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);
      const dateRange = `between ${twoWeeksAgo.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} and ${today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;

      // Extract allowed sites from triggers and determine search mode
      const allowedSites: string[] = [];
      let runWebMode = false;
      let runSitesMode = false;

      console.warn("[GEMINI DEBUG] Active Triggers Received:", activeTriggers.map(t => ({ id: t.id, status: t.status, sites: t.limitToSite, mode: t.searchMode })));

      for (const trigger of activeTriggers.filter(t => t.status === 'Approved')) {
        const sites = Array.isArray(trigger.limitToSite)
          ? trigger.limitToSite
          : (trigger.limitToSite ? [trigger.limitToSite] : []);

        sites.forEach(s => {
          const cleaned = s.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
          if (cleaned && !allowedSites.includes(cleaned)) {
            allowedSites.push(cleaned);
          }
        });

        // Determine mode based on trigger config
        const mode = trigger.searchMode || (sites.length > 0 ? 'both' : 'web');
        if (mode === 'web' || mode === 'both') runWebMode = true;
        if (mode === 'sites' || mode === 'both') runSitesMode = sites.length > 0;
      }

      // If no approved triggers, default to web mode
      if (!runWebMode && !runSitesMode) {
        runWebMode = true;
      }

      console.log(`[DEBUG] Execution Mode - Web: ${runWebMode}, Sites: ${runSitesMode}`);
      console.log(`[DEBUG] Allowed Sites (Parsed):`, allowedSites);

      // NOTE: We intentionally do NOT use responseMimeType/responseSchema.
      // JSON schema mode suppresses grounding quality and causes frequent timeouts.
      // Instead we request JSON in the prompt and parse it from free-text response.

      // Build diverse prompt angles dynamically from triggers + profile
      const productsStr = profile.products.join(', ');
      const targetGroupsStr = profile.targetGroups.join(', ');

      const promptAngles: string[] = [];

      // 1. Trigger-derived angles — one per active trigger (most specific)
      const approvedTriggers = activeTriggers.filter(t => t.status === 'Approved');
      for (const trigger of approvedTriggers) {
        promptAngles.push(
          `Find 1 recent news article, announcement, or report in ${regionContext} about: "${trigger.event}". ` +
          `Look for sources like ${trigger.source}. ` +
          `This should be relevant to someone selling ${trigger.product} because: ${trigger.logic}. ` +
          `The result must be a real, verifiable event or trend that creates demand for ${trigger.product}.`
        );
      }

      // 2. Profile-derived angles — broader discovery (industry-agnostic)
      const advCtx = buildAdvancedContext(profile);
      const exclusionNote = profile.exclusions?.excludedIndustries?.filter(Boolean).length
        ? ` IMPORTANT: Do NOT return signals about these industries: ${profile.exclusions.excludedIndustries.filter(Boolean).join(', ')}.` : '';
      const buyerNote = profile.icp?.typicalBuyerTitles?.filter(Boolean).length
        ? ` Focus on signals relevant to these buyer roles: ${profile.icp.typicalBuyerTitles.filter(Boolean).join(', ')}.` : '';

      promptAngles.push(
        `Find 1 recent news or emerging trend in ${regionContext} relevant to the ${profile.industry} industry that would create demand for ${productsStr}. Look for market shifts, regulatory changes, seasonal patterns, or consumer behavior changes.${exclusionNote}${buyerNote}`,
        `Find 1 recent announcement, partnership, funding round, or expansion in ${regionContext} relevant to companies or individuals who buy ${productsStr}. Target audience: ${targetGroupsStr}.${exclusionNote}`,
        `Find 1 recent news article in ${regionContext} about a problem, challenge, or unmet need that ${profile.name}'s products (${productsStr}) could solve. Look for pain points experienced by ${targetGroupsStr}.${exclusionNote}`,
        `Find 1 recent industry report, survey result, or market research finding in ${regionContext} that signals growing demand for ${productsStr} within ${profile.industry}.${exclusionNote}`
      );

      // 2b. Advanced profile-driven angles (if configured)
      if (profile.problemSolutionFit?.buyingTriggers?.filter(Boolean).length) {
        const userTriggers = profile.problemSolutionFit.buyingTriggers.filter(Boolean);
        promptAngles.push(
          `Find 1 recent news in ${regionContext} matching these known buying triggers for ${productsStr}: ${userTriggers.join(', ')}. The ideal result shows a company or organization experiencing one of these triggers.${exclusionNote}`
        );
      }
      if (profile.dataSources?.monitoredCompetitors?.filter(Boolean).length) {
        promptAngles.push(
          `Find 1 recent news in ${regionContext} about competitors of ${profile.name}: ${profile.dataSources.monitoredCompetitors.filter(Boolean).join(', ')}. Look for their wins, losses, product launches, or customer complaints that create an opening for ${productsStr}.`
        );
      }

      // Add site-specific prompts if sites mode is active
      if (runSitesMode && allowedSites.length > 0) {
        for (const site of allowedSites) {
          promptAngles.push(
            `Search ONLY on site:${site} for 1 recent opportunity in ${regionContext} related to ${profile.industry} or ${profile.products.join(', ')}. STRICT: only return results from site:${site}.`
          );
        }
      }

      // Filter to web-only or sites-only based on mode
      const activePrompts = runWebMode ? promptAngles : promptAngles.filter(p => p.includes('site:'));

      const TARGET_SIGNALS = 10;
      const MIN_RELEVANT_SIGNALS = 3; // Retry if we fall below this after relevance scoring
      const discoveredSignals: MarketSignal[] = [];
      const seenHeadlines = new Set<string>();
      const seenSemanticFingerprints = new Set<string>();

      console.log(`[HUNT] Starting one-signal-per-call hunt. ${activePrompts.length} prompt angles available, targeting ${TARGET_SIGNALS} signals.`);

      // Inner helper so we can run the hunt loop twice (main pass + retry-if-short)
      const runHuntLoop = async (angles: string[], startIdx: number, maxSignals: number) => {
        for (let i = 0; i < angles.length && discoveredSignals.length < maxSignals; i++) {
        const angle = angles[i];

        // Build dedup clause from already-discovered headlines
        const dedupClause = seenHeadlines.size > 0
          ? `\n\nCRITICAL: Do NOT return any of these already-found signals:\n${[...seenHeadlines].map(h => `- "${h}"`).join('\n')}\nFind something DIFFERENT.`
          : '';

        const fullPrompt = `SEARCH GROUNDING TASK: ${angle}

         TIME CONSTRAINT: Only include results from ${dateRange}. Ignore anything older.
         Identify the key DECISION MAKER (company or person).
         If you cannot find a real, verifiable result, respond with exactly: {}
         Do NOT fabricate or guess any URLs. Do NOT include any source URL field.

         Respond with a JSON object (no markdown backticks) containing these fields:
         - headline (string): The title of the announcement
         - summary (string): A brief description of the opportunity
         - importance (string): Why this matters
         - decisionMaker (string): The key company or person
         - urgency (string): One of "STANDARD", "HIGH", or "EMERGENCY"
         - matchedProducts (array of strings): Which products are relevant
         - accountName (string): Canonical name of the BUYER organisation (company, agency, contractor) — not the publisher of the article
         - canonicalEvent (string): Short canonical event descriptor for deduplication (e.g. "Series B funding", "hospital expansion tender", "warehouse project win"). 3-6 words.
         - leadType (string): One of "direct_company" (named private company buying directly), "government_tender" (public sector RFP/tender), "project_winner" (a contractor that won a project and now needs suppliers), "market_trend" (broad market shift, no specific buyer)
         - entities (array): List of key entities mentioned. Each with {name, type: "company"|"government"|"person"|"organization", role: "seller"|"buyer"|"contractor"|"client"|"neutral"}
         - scores (object): Provide numeric scores from 0-100 for the following 4 metrics: "freshness" (how recent), "proximity" (geographic relevance), "intentStrength" (likelihood to buy), "buyerMatch" (how well they fit the profile).
         ${dedupClause}`;

        try {
          console.log(`\n[HUNT ${startIdx + i + 1}] Searching: "${angle.substring(0, 80)}..."`);

          const response = await withTimeout(
            ai.models.generateContent({
              model: 'gemini-3-flash-preview',
              contents: fullPrompt,
              config: {
                tools: [{ googleSearch: {} }],
                temperature: 0.1
              }
            }),
            45000
          );

          const rawText = (response.text || '').trim();
          if (!rawText || rawText === '{}') {
            console.log(`[HUNT ${startIdx + i + 1}] No signal found for this angle, skipping.`);
            continue;
          }

          // Parse JSON from free-text response (strip markdown code fences if present)
          let jsonText = rawText;
          const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (jsonMatch) jsonText = jsonMatch[1].trim();
          // Also try to find raw JSON object
          if (!jsonText.startsWith('{')) {
            const braceMatch = rawText.match(/\{[\s\S]*\}/);
            if (braceMatch) jsonText = braceMatch[0];
          }

          let signal: any;
          try {
            signal = JSON.parse(jsonText);
          } catch (parseErr) {
            console.warn(`[HUNT ${startIdx + i + 1}] Failed to parse JSON from response, skipping.`);
            continue;
          }

          // Skip empty or invalid signals
          if (!signal.headline || signal.headline.trim().length === 0) {
            console.log(`[HUNT ${startIdx + i + 1}] No signal found for this angle, skipping.`);
            continue;
          }

          const normalizedHeadline = signal.headline.toLowerCase().trim();
          if (seenHeadlines.has(normalizedHeadline)) {
            console.log(`[HUNT ${startIdx + i + 1}] Duplicate headline, skipping: "${signal.headline.substring(0, 50)}..."`);
            continue;
          }
          seenHeadlines.add(normalizedHeadline);

          // Semantic fingerprint dedup (cross-run + within-run)
          const accountName = (signal.accountName || signal.decisionMaker || '').toString();
          const canonicalEvent = (signal.canonicalEvent || '').toString();
          const semanticFingerprint = computeSemanticFingerprint(accountName, canonicalEvent);
          if (seenSemanticFingerprints.has(semanticFingerprint)) {
            console.log(`[HUNT ${startIdx + i + 1}] Duplicate semantic fingerprint (same opportunity), skipping.`);
            continue;
          }
          seenSemanticFingerprints.add(semanticFingerprint);

          // === SOURCE URL: Use ONLY grounding chunk URLs (Google-verified) ===
          // NEVER trust model-generated URLs — they are hallucinated.
          let sourceUrl = '';
          const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
          console.log(`[HUNT ${startIdx + i + 1}] Grounding chunks: ${chunks.length}`);

          if (chunks.length > 0) {
            // Find the best URL — prefer actual article URLs over redirect URLs
            for (const chunk of chunks) {
              if (chunk.web?.uri) {
                sourceUrl = chunk.web.uri;
                console.log(`[HUNT ${startIdx + i + 1}] Source URL (grounding): ${sourceUrl.substring(0, 100)}`);
                break;
              }
            }
          }

          const hasSource = sourceUrl.length > 0;

          // Domain whitelist check for sites mode
          if (runSitesMode && allowedSites.length > 0 && hasSource) {
            try {
              const sourceHost = new URL(sourceUrl).hostname;
              const matchesAllowedSite = allowedSites.some(site =>
                sourceHost.includes(site) || site.includes(sourceHost)
              );
              if (!matchesAllowedSite && !sourceHost.includes('vertexaisearch')) {
                console.log(`[HUNT ${startIdx + i + 1}] Domain filter rejected: ${sourceHost}`);
                continue;
              }
            } catch (e) { /* invalid URL, keep signal anyway */ }
          }

          console.log(`[HUNT ${startIdx + i + 1}] ✅ "${signal.headline.substring(0, 60)}..."`);
          console.log(`           Source: ${hasSource ? sourceUrl.substring(0, 120) : '(no grounding URL)'}`);

          const aiScores = signal.scores || {};
          const confidence: SignalConfidence = {
            freshness: typeof aiScores.freshness === 'number' ? aiScores.freshness : 90,
            proximity: typeof aiScores.proximity === 'number' ? aiScores.proximity : 100,
            intentStrength: typeof aiScores.intentStrength === 'number' ? aiScores.intentStrength : 95,
            buyerMatch: typeof aiScores.buyerMatch === 'number' ? aiScores.buyerMatch : 95,
            urgency: signal.urgency === SignalUrgency.EMERGENCY ? 100 : signal.urgency === SignalUrgency.HIGH ? 90 : 80,
            total: 0
          };
          confidence.total = Math.round((confidence.freshness + confidence.proximity + confidence.intentStrength + confidence.buyerMatch + confidence.urgency) / 5);

          // Classify + enrich signal
          const validLeadTypes: LeadType[] = ['direct_company', 'government_tender', 'project_winner', 'market_trend'];
          const leadType: LeadType = validLeadTypes.includes(signal.leadType) ? signal.leadType : 'direct_company';
          const entities: SignalEntity[] | undefined = Array.isArray(signal.entities) ? signal.entities.filter((e: any) => e && e.name) : undefined;
          const researchHints = computeResearchHints(leadType, accountName, signal.headline, sourceUrl, entities, profile);

          const marketSignal: MarketSignal = {
            headline: signal.headline,
            summary: signal.summary || '',
            importance: signal.importance || '',
            matchedProducts: Array.isArray(signal.matchedProducts) ? signal.matchedProducts : [],
            decisionMaker: signal.decisionMaker || accountName || '',
            urgency: signal.urgency || SignalUrgency.MEDIUM,
            id: `sig-${Date.now()}-${Math.random()}`,
            timestamp: hasSource ? 'Verified Live' : 'Unverified',
            score: confidence.total,
            confidenceDetails: confidence,
            sourceUrl: sourceUrl,
            sourceTitle: signal.headline,
            region: regionContext,
            status: 'New',
            leadType,
            entities,
            researchHints,
            semanticFingerprint,
          };

          discoveredSignals.push(marketSignal);

          // Stream signal to UI immediately
          if (onSignal) {
            onSignal(marketSignal);
          }

        } catch (err) {
          console.warn(`[HUNT ${startIdx + i + 1}] Failed:`, (err as Error).message);
        }

        // Small delay between calls to stay within rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
        }
      };

      // === MAIN HUNT PASS ===
      await runHuntLoop(activePrompts, 0, TARGET_SIGNALS);

      console.log(`\n[HUNT] Main pass complete. ${discoveredSignals.length} raw signals discovered. Running relevance triage...`);

      // === RELEVANCE SCORING PASS ===
      // Applies hard exclusions and filters out low-relevance signals.
      const scores = await scoreSignalsRelevance(discoveredSignals, profile);
      const scoreMap = new Map(scores.map(s => [s.id, s]));

      for (const sig of discoveredSignals) {
        const scored = scoreMap.get(sig.id);
        if (scored) {
          sig.relevanceScore = scored.score;
          sig.relevanceReasoning = scored.reasoning;
        }
      }

      let relevantSignals = discoveredSignals.filter(s => {
        const scored = scoreMap.get(s.id);
        return !scored || scored.keep;
      });

      console.log(`[HUNT] Relevance pass: ${relevantSignals.length} / ${discoveredSignals.length} signals kept.`);

      // === RETRY-IF-SHORT ===
      // If we fell below the minimum, run a second round with broader angles.
      if (relevantSignals.length < MIN_RELEVANT_SIGNALS && activePrompts.length > 0) {
        console.log(`[HUNT] Below minimum (${relevantSignals.length} < ${MIN_RELEVANT_SIGNALS}). Running retry round with broader angles...`);

        const retryAngles: string[] = [
          `Find 1 recent news in ${regionContext} about any company hiring decision-makers or expanding operations that could benefit from ${productsStr}. Broader net — any adjacent opportunity counts.`,
          `Find 1 recent announcement in ${regionContext} about new facilities, projects, or infrastructure that would need ${productsStr}. Include indirect buyers like contractors or project winners.`,
          `Find 1 recent regulatory change, policy update, or industry report in ${regionContext} that creates pressure to adopt ${productsStr} within ${profile.industry}.`,
          `Find 1 recent government procurement notice or public tender in ${regionContext} related to ${profile.industry} or ${productsStr}.`,
        ];

        const preRetryCount = discoveredSignals.length;
        await runHuntLoop(retryAngles, activePrompts.length, TARGET_SIGNALS);
        const newSignals = discoveredSignals.slice(preRetryCount);
        if (newSignals.length > 0) {
          const retryScores = await scoreSignalsRelevance(newSignals, profile);
          const retryScoreMap = new Map(retryScores.map(s => [s.id, s]));
          for (const sig of newSignals) {
            const scored = retryScoreMap.get(sig.id);
            if (scored) {
              sig.relevanceScore = scored.score;
              sig.relevanceReasoning = scored.reasoning;
              scoreMap.set(sig.id, scored);
            }
          }
          relevantSignals = discoveredSignals.filter(s => {
            const scored = scoreMap.get(s.id);
            return !scored || scored.keep;
          });
          console.log(`[HUNT] After retry: ${relevantSignals.length} relevant signals.`);
        }
      }

      console.log(`\n[HUNT] Complete. Returning ${relevantSignals.length} relevant signals (filtered from ${discoveredSignals.length} candidates).`);
      return relevantSignals;
    });
  },

  async generateOutreach(signal: MarketSignal, profile: BusinessProfile): Promise<{ email: string, linkedin: string, call: string }> {
    return withRetry(async () => {
      const ai = getAI();
      const response = await withTimeout(
        ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `Generate multi-channel B2B outreach for ${profile.name} targeting a ${signal.decisionMaker} regarding: "${signal.headline}".
          Context: ${signal.summary}.
          Source: ${signal.sourceUrl}.
          ${profile.salesApproach?.toneOfVoice ? `Tone of voice: ${profile.salesApproach.toneOfVoice}.` : ''}
          ${profile.usp?.whyChooseUs ? `Our key value prop: ${profile.usp.whyChooseUs}.` : ''}
          ${profile.usp?.uniqueStrength ? `Our unique edge: ${profile.usp.uniqueStrength}.` : ''}
          ${profile.salesApproach?.bestMessaging ? `Best messaging approach: ${profile.salesApproach.bestMessaging}.` : ''}
          ${profile.salesApproach?.commonObjections?.filter(Boolean).length ? `Address these common objections: ${profile.salesApproach.commonObjections.filter(Boolean).join('; ')}.` : ''}
          ${profile.usp?.measurableOutcomes?.filter(Boolean).length ? `Include these proof points if relevant: ${profile.usp.measurableOutcomes.filter(Boolean).join('; ')}.` : ''}
          Return JSON with 'email', 'linkedin', and 'call'.`,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                email: { type: Type.STRING },
                linkedin: { type: Type.STRING },
                call: { type: Type.STRING }
              },
              required: ["email", "linkedin", "call"]
            }
          }
        }),
        30000 // 30 seconds
      );
      return JSON.parse(response.text || '{}');
    });
  },

  // ============ GLASS BOX STAGE 1: Extract Project Intelligence ============
  async extractProjectIntelligence(signal: MarketSignal, profile: BusinessProfile): Promise<ProjectIntelligence> {
    return withRetry(async () => {
      const ai = getAI();
      const prompt = `You are an expert business analyst. Analyze this news signal and extract structured project intelligence.

NEWS/SIGNAL: "${signal.headline}"
SUMMARY: ${signal.summary}
SOURCE: ${signal.sourceUrl}
REGION: ${signal.region}

OUR COMPANY CONTEXT (for relevance):
- Company: ${profile.name}
- Industry: ${profile.industry}
- Products: ${profile.products.join(', ')}

TASK: Extract ALL quantifiable metrics that indicate the scale and scope of this project/opportunity. Look for:
1. Physical quantities (beds, floors, units, rooms, sqm, hectares, seats, etc.)
2. Financial indicators (project budget, contract value, funding amount)
3. Headcount/capacity metrics (employees, users, attendees, patients)
4. Timeline indicators (months, phases, completion dates)
5. Any other measurable indicators of project scale

For each metric, cite the EXACT source text from the article. If the article mentions a total project budget, extract it separately.

Be thorough — extract EVERY quantifiable metric you can find. If a metric is implied rather than stated, mark confidence as "low".`;

      const response = await withTimeout(
        ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }],
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                industry: { type: Type.STRING },
                projectType: { type: Type.STRING },
                scaleMetrics: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      metric: { type: Type.STRING },
                      value: { type: Type.NUMBER },
                      unit: { type: Type.STRING },
                      source: { type: Type.STRING },
                      confidence: { type: Type.STRING, enum: ['high', 'medium', 'low'] }
                    },
                    required: ['metric', 'value', 'unit', 'source', 'confidence']
                  }
                },
                timeline: { type: Type.STRING },
                location: { type: Type.STRING },
                totalBudget: {
                  type: Type.OBJECT,
                  properties: {
                    value: { type: Type.NUMBER },
                    currency: { type: Type.STRING },
                    source: { type: Type.STRING }
                  }
                },
                keyEntities: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ['industry', 'projectType', 'scaleMetrics', 'keyEntities']
            } as any
          }
        }),
        30000
      );

      const data = JSON.parse(response.text || '{}');
      console.log('[GLASS BOX] Stage 1 — Extracted project intelligence:', data.scaleMetrics?.length, 'metrics');

      return {
        ...data,
        extractedAt: new Date().toISOString(),
      } as ProjectIntelligence;
    });
  },

  // ============ GLASS BOX STAGE 2: Generate BOM with Reasoning ============
  async generateBOMWithReasoning(
    signal: MarketSignal,
    profile: BusinessProfile,
    intelligence: ProjectIntelligence,
    catalog: ProductCatalogItem[]
  ): Promise<{
    bundle: Array<{ sku: string; description: string; quantity: number; reasoning: string; formula: string; confidence: string; assumption: string }>;
    discountPercent: number;
    discountReasoning: string;
    assumptions: Array<{ category: string; statement: string; confidence: string }>;
  }> {
    return withRetry(async () => {
      const ai = getAI();

      const metricsText = intelligence.scaleMetrics.map(m =>
        `- ${m.metric}: ${m.value} ${m.unit} (${m.confidence} confidence) — "${m.source}"`
      ).join('\n');

      const budgetText = intelligence.totalBudget
        ? `Total Project Budget: ${intelligence.totalBudget.currency} ${intelligence.totalBudget.value.toLocaleString()} (source: "${intelligence.totalBudget.source}")`
        : 'Total Project Budget: Not specified in article';

      const catalogText = catalog.length > 0
        ? catalog.map(c => `SKU: ${c.sku} | ${c.name} | ${c.description} | $${c.unitPrice.toFixed(2)}/${c.unit} | Category: ${c.category}`).join('\n')
        : 'No product catalog configured.';

      const prompt = `You are an expert sales estimator. Given the project intelligence below, create a Bill of Materials (BOM) using ONLY products from the company catalog.

PROJECT INTELLIGENCE:
- Industry: ${intelligence.industry}
- Project Type: ${intelligence.projectType}
- Location: ${intelligence.location || signal.region}
- Timeline: ${intelligence.timeline || 'Not specified'}
- Key Entities: ${intelligence.keyEntities.join(', ')}

EXTRACTED SCALE METRICS:
${metricsText}

${budgetText}

SELLER COMPANY: ${profile.name}
PRODUCTS WE SELL: ${profile.products.join(', ')}

PRODUCT CATALOG:
${catalogText}

CRITICAL RULES — READ CAREFULLY:
1. You must ONLY recommend products from the catalog above. Use exact SKUs.
2. For each line item, you MUST explain your quantity derivation step by step.
3. Show the FORMULA: e.g., "20 beds × 1 handle per door = 20 handles"
4. Cite which scale metric you used and any industry standard/rule of thumb applied.
5. Do NOT calculate prices or totals — only output SKUs and quantities with reasoning. Our system will look up prices from the database.
6. If a product category is relevant but no exact SKU matches, use the closest match and note it.
7. Think about ALL the ways our products would be needed for this type of project.
8. Include assembly logic: if 1 door needs 3 hinges + 1 handle + 1 closer, list each separately.
9. Suggest an appropriate volume discount percentage with reasoning.
10. List ALL assumptions you're making, categorized.

For each bundle item return: sku, description, quantity, reasoning (detailed explanation), formula (mathematical), confidence (high/medium/low), assumption (the key assumption behind this line).`;

      const response = await withTimeout(
        ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }],
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                bundle: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      sku: { type: Type.STRING },
                      description: { type: Type.STRING },
                      quantity: { type: Type.NUMBER },
                      reasoning: { type: Type.STRING },
                      formula: { type: Type.STRING },
                      confidence: { type: Type.STRING, enum: ['high', 'medium', 'low'] },
                      assumption: { type: Type.STRING }
                    },
                    required: ['sku', 'description', 'quantity', 'reasoning', 'formula', 'confidence', 'assumption']
                  }
                },
                discountPercent: { type: Type.NUMBER },
                discountReasoning: { type: Type.STRING },
                assumptions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      category: { type: Type.STRING },
                      statement: { type: Type.STRING },
                      confidence: { type: Type.STRING, enum: ['high', 'medium', 'low'] }
                    },
                    required: ['category', 'statement', 'confidence']
                  }
                }
              },
              required: ['bundle', 'discountPercent', 'discountReasoning', 'assumptions']
            } as any
          }
        }),
        45000
      );

      const data = JSON.parse(response.text || '{}');
      console.log('[GLASS BOX] Stage 2 — BOM generated:', data.bundle?.length, 'line items');
      return data;
    });
  },

  async generateDossier(signal: MarketSignal, profile: BusinessProfile, catalog?: ProductCatalogItem[]): Promise<DealDossier> {
    return withRetry(async () => {
      const ai = getAI();

      // Build catalog injection if available
      const hasCatalog = catalog && catalog.length > 0;
      const catalogSection = hasCatalog
        ? `\n\nPRODUCT CATALOG (USE THESE EXACT SKUs AND PRICES):\n${catalog.map(c => `SKU: ${c.sku} | ${c.name} | $${c.unitPrice.toFixed(2)}/${c.unit} | Category: ${c.category}`).join('\n')}\n\nCRITICAL PRICING RULES:\n- Use ONLY SKUs from this catalog for the recommendedBundle.\n- Use exact unitPrice values from the catalog.\n- Calculate lineTotal = quantity × unitPrice for each item.\n- estimatedValue MUST equal sum of all lineTotals minus discount amount.\n- If a product is needed but NOT in the catalog, invent a descriptive SKU prefixed with "AI-" and estimate the price.`
        : '\n\nNOTE: No product catalog is configured. Generate reasonable SKUs and estimate prices. All prices will be labeled as AI estimates.';

      const dossierAdvancedCtx = buildAdvancedContext(profile);
      const prompt = `Generate a Deal Dossier for a sales opportunity.

SELLER COMPANY: ${profile.name}
SELLER PRODUCTS: ${profile.products.join(', ')}
SELLER TARGET CUSTOMERS: ${profile.targetGroups.join(', ')}
${dossierAdvancedCtx}
NEWS/SIGNAL: "${signal.headline}"
SOURCE: ${signal.sourceUrl}
REGION: ${signal.region}
${catalogSection}

CRITICAL RULES FOR accountName:
1. The accountName MUST be the TARGET — the company, organization, or audience segment that would PURCHASE from ${profile.name}
2. NEVER return "${profile.name}" as the accountName - they are the SELLER
3. Look for the entity in the news that would need ${profile.products.join(' or ')}. This could be a company, government body, organization, or (for B2C businesses) a demographic/audience segment.
4. The accountName should be whoever benefits from or needs ${profile.products.join(' or ')}

Example: If news says "City of Marion partnered with Blu Built to deliver a project", the accountName should be "Blu Built" (the buyer/contractor), NOT the seller company.

Focus:
1. Identify the TARGET from the news — the entity that would purchase or benefit from ${profile.products.join(', ')}
2. Provide strategic advice for ${profile.name} (the SELLER) to win this opportunity
3. For each bundle item, include sku, description, quantity, AND unitPrice
4. Return as JSON with accountName being the TARGET's name
5. IMPORTANT: pricingStrategy.discount MUST be a percentage (0 to 100), not an absolute dollar amount.`;

      const response = await withTimeout(
        ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }],
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                accountName: { type: Type.STRING },
                targetWebsite: { type: Type.STRING },
                targetLinkedin: { type: Type.STRING },
                keyPersonName: { type: Type.STRING },
                keyPersonLinkedin: { type: Type.STRING },
                executiveSummary: { type: Type.STRING },
                commercialOpportunity: { type: Type.STRING },
                recommendedBundle: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      sku: { type: Type.STRING },
                      description: { type: Type.STRING },
                      quantity: { type: Type.NUMBER },
                      unitPrice: { type: Type.NUMBER }
                    }
                  }
                },
                pricingStrategy: {
                  type: Type.OBJECT,
                  properties: {
                    logic: { type: Type.STRING },
                    discount: { type: Type.NUMBER, description: "Discount percentage (0-100)" },
                    estimatedValue: { type: Type.NUMBER }
                  }
                },
                battlecard: {
                  type: Type.OBJECT,
                  properties: {
                    competitorWeakness: { type: Type.STRING },
                    ourEdge: { type: Type.STRING }
                  }
                },
                callScript: { type: Type.STRING },
                confidence: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
                assumptions: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["accountName", "executiveSummary", "commercialOpportunity", "recommendedBundle", "pricingStrategy", "battlecard", "callScript", "confidence", "assumptions"]
            }
          }
        }),
        60000 // 60 seconds (Dossiers can be slower due to Grounding)
      );

      const data = JSON.parse(response.text || '{}');

      // ========== GLASS BOX vs LEGACY PIPELINE ==========
      const catalogMap = new Map<string, ProductCatalogItem>();
      if (hasCatalog) {
        catalog.forEach(c => catalogMap.set(c.sku.toLowerCase(), c));
      }

      let processedBundle: DealDossier['recommendedBundle'];
      let processedPricingStrategy: DealDossier['pricingStrategy'];
      let projectIntelligence: ProjectIntelligence | undefined;
      let auditTrail: EstimationAuditTrail | undefined;

      if (hasCatalog && catalog.length > 0) {
        // ========== GLASS BOX PIPELINE (catalog exists) ==========
        console.log('[GLASS BOX] Running two-stage auditable pipeline...');

        // Stage 1: Extract project intelligence
        try {
          projectIntelligence = await geminiService.extractProjectIntelligence(signal, profile);
        } catch (e) {
          console.warn('[GLASS BOX] Stage 1 failed, proceeding with limited intelligence:', e);
          projectIntelligence = {
            industry: profile.industry,
            projectType: 'General',
            scaleMetrics: [],
            keyEntities: [],
            extractedAt: new Date().toISOString(),
          };
        }

        // Stage 2: Generate BOM with reasoning
        let bomResult;
        try {
          bomResult = await geminiService.generateBOMWithReasoning(signal, profile, projectIntelligence, catalog);
        } catch (e) {
          console.warn('[GLASS BOX] Stage 2 failed, falling back to legacy bundle:', e);
          bomResult = null;
        }

        if (bomResult && bomResult.bundle?.length > 0) {
          // ===== DETERMINISTIC CALCULATION (code does all math) =====
          processedBundle = bomResult.bundle.map((item: any) => {
            const catalogMatch = catalogMap.get((item.sku || '').toLowerCase());
            let unitPrice: AuditablePrice;
            let catalogItemId: string | undefined;

            if (catalogMatch) {
              unitPrice = {
                value: catalogMatch.unitPrice,
                source: 'catalog',
                confidence: 100,
                sourceDetail: `Catalog SKU ${catalogMatch.sku} @ $${catalogMatch.unitPrice}/${catalogMatch.unit}`,
              };
              catalogItemId = catalogMatch.id;
            } else {
              unitPrice = {
                value: 0,
                source: 'ai_estimate',
                confidence: 20,
                sourceDetail: `No catalog match for SKU "${item.sku}"`,
              };
            }

            // DETERMINISTIC: code multiplies qty × price
            const lineTotal = item.quantity * unitPrice.value;

            // Build structured derivation
            const derivation: LineItemDerivation = {
              formula: item.formula || `${item.quantity} units`,
              inputs: {},
              result: item.quantity,
              reasoning: item.reasoning || '',
              confidence: item.confidence || 'medium',
            };

            // Parse formula inputs from scale metrics
            if (projectIntelligence?.scaleMetrics) {
              for (const metric of projectIntelligence.scaleMetrics) {
                if (item.reasoning?.toLowerCase().includes(metric.metric.toLowerCase())) {
                  derivation.inputs[metric.metric] = {
                    label: `${metric.metric} (${metric.unit})`,
                    value: metric.value,
                    source: 'signal',
                  };
                }
              }
            }

            return {
              sku: catalogMatch?.sku || item.sku,
              description: catalogMatch?.name || item.description,
              quantity: item.quantity,
              catalogItemId,
              unitPrice,
              lineTotal,
              derivation,
            };
          });

          // DETERMINISTIC: code calculates totals
          const bundleSubtotal = processedBundle.reduce((sum, b) => sum + (b.lineTotal || 0), 0);
          const discountPercent = bomResult.discountPercent || 0;
          const discountAmount = bundleSubtotal * (discountPercent / 100);
          const derivedEstimatedValue = bundleSubtotal - discountAmount;

          const allCatalogMatched = processedBundle.every(b => b.catalogItemId);
          const someCatalogMatched = processedBundle.some(b => b.catalogItemId);
          const derivationType: 'catalog_sum' | 'ai_estimate' | 'hybrid' =
            allCatalogMatched ? 'catalog_sum' : someCatalogMatched ? 'hybrid' : 'ai_estimate';

          processedPricingStrategy = {
            logic: bomResult.discountReasoning || data.pricingStrategy?.logic || '',
            discount: {
              value: discountPercent,
              source: 'ai_estimate',
              confidence: 50,
              sourceDetail: bomResult.discountReasoning || 'AI-recommended discount',
            } as AuditablePrice,
            estimatedValue: {
              value: derivedEstimatedValue,
              source: derivationType === 'catalog_sum' ? 'catalog' : derivationType === 'hybrid' ? 'catalog' : 'ai_estimate',
              confidence: derivationType === 'catalog_sum' ? 95 : derivationType === 'hybrid' ? 75 : 40,
              sourceDetail: `Glass Box: $${bundleSubtotal.toLocaleString()} subtotal - ${discountPercent}% discount = $${derivedEstimatedValue.toLocaleString()}`,
            } as AuditablePrice,
            derivation: derivationType,
          };

          // Build full audit trail
          const catalogCount = processedBundle.filter(b => b.catalogItemId).length;
          const totalItems = processedBundle.length;
          auditTrail = {
            projectIntelligence,
            bundleDerivation: processedBundle.map(b => ({
              sku: b.sku,
              description: b.description,
              quantity: b.quantity,
              derivation: b.derivation!,
              unitPrice: b.unitPrice as AuditablePrice,
              lineTotal: b.lineTotal || 0,
            })),
            subtotal: bundleSubtotal,
            discount: { percent: discountPercent, reasoning: bomResult.discountReasoning || '' },
            estimatedValue: derivedEstimatedValue,
            assumptions: (bomResult.assumptions || []).map((a: any) => ({
              category: a.category || 'general',
              statement: a.statement || a,
              confidence: a.confidence || 'medium',
            })),
            sourceBreakdown: {
              catalogPercent: totalItems > 0 ? Math.round((catalogCount / totalItems) * 100) : 0,
              rateCardPercent: 0,
              aiEstimatePercent: totalItems > 0 ? Math.round(((totalItems - catalogCount) / totalItems) * 100) : 100,
            },
            generatedAt: new Date().toISOString(),
          };

          console.log('[GLASS BOX] Audit trail complete:', catalogCount, '/', totalItems, 'catalog-matched,', `$${derivedEstimatedValue.toLocaleString()}`);
        } else {
          // Glass Box Stage 2 failed — fall back to legacy bundle from the dossier AI call
          console.log('[GLASS BOX] Falling back to legacy bundle processing');
          const fallbackResult = legacyProcessBundle(data, catalogMap, hasCatalog);
          processedBundle = fallbackResult.bundle;
          processedPricingStrategy = fallbackResult.pricingStrategy;
        }
      } else {
        // ========== LEGACY PIPELINE (no catalog) ==========
        const fallbackResult = legacyProcessBundle(data, catalogMap, false);
        processedBundle = fallbackResult.bundle;
        processedPricingStrategy = fallbackResult.pricingStrategy;
      }

      const baseDossier: DealDossier = {
        ...data,
        id: `dos-${Date.now()}`,
        signalId: signal.id,
        recommendedBundle: processedBundle,
        pricingStrategy: processedPricingStrategy,
        projectIntelligence,
        auditTrail,
      };

      // ========== APOLLO ENRICHMENT ==========

      // Clean company name by removing project-specific text
      const cleanCompanyName = (name: string): string => {
        let cleaned = name;

        // Remove text in parentheses (e.g. "Company (Project Name)" -> "Company")
        cleaned = cleaned.replace(/\s*\([^)]*\)/g, '');

        // Remove common project/announcement suffixes
        const suffixesToRemove = [
          'Project',
          'Announcement',
          'Development',
          'Initiative',
          'Program',
          'Stage',
          'Phase',
          'Staged',
          'Strengthening',
          'Construction',
          'Tender',
          'Contract'
        ];

        const suffixPattern = new RegExp(`\\b(${suffixesToRemove.join('|')})\\b`, 'gi');
        cleaned = cleaned.replace(suffixPattern, '');

        // Remove extra whitespace and trim
        cleaned = cleaned.replace(/\s+/g, ' ').trim();

        return cleaned;
      };

      const cleanedCompanyName = cleanCompanyName(baseDossier.accountName);
      console.warn('[DOSSIER] Starting Apollo enrichment for:', baseDossier.accountName);
      console.warn('[DOSSIER] Cleaned company name:', cleanedCompanyName);

      try {
        // Step 1: Find company on Apollo using cleaned name
        const company = await apolloService.findCompany(cleanedCompanyName);

        if (company) {
          console.warn('[DOSSIER] Company found on Apollo:', company.name);

          // Step 2: Extract role keywords from the signal's decision maker
          const decisionMakerText = signal.decisionMaker.toLowerCase();
          const roleKeywords: string[] = [];

          if (decisionMakerText.includes('ceo') || decisionMakerText.includes('chief executive')) {
            roleKeywords.push('CEO', 'Chief Executive Officer');
          }
          if (decisionMakerText.includes('coo') || decisionMakerText.includes('chief operating')) {
            roleKeywords.push('COO', 'Chief Operating Officer');
          }
          if (decisionMakerText.includes('director')) {
            roleKeywords.push('Director');
          }
          if (decisionMakerText.includes('manager') || decisionMakerText.includes('head')) {
            roleKeywords.push('Manager', 'Head');
          }
          if (decisionMakerText.includes('procurement') || decisionMakerText.includes('purchasing')) {
            roleKeywords.push('Procurement', 'Purchasing');
          }

          // Fallback to generic decision makers
          if (roleKeywords.length === 0) {
            roleKeywords.push('CEO', 'Director', 'Manager', 'Head');
          }

          // Step 3: Find and enrich decision makers (search + enrich for full details)
          const contacts = await apolloService.findAndEnrichDecisionMakers(company.primary_domain, roleKeywords, 3);

          if (contacts.length > 0) {
            console.warn('[DOSSIER] Found', contacts.length, 'verified contacts');

            // Map Apollo contacts to our enriched format
            const enrichedContacts: EnrichedContact[] = contacts.map((contact, index) => ({
              name: contact.name || `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Unknown',
              title: contact.title || 'Unknown Title',
              email: contact.email,
              phone: contact.sanitized_phone,
              linkedinUrl: contact.linkedin_url,
              isPrimary: index === 0,
              confidence: contact.email ? 95 : 70,
              source: 'apollo' as const
            }));

            // Map company data
            const enrichedCompany: EnrichedCompany = {
              name: company.name,
              domain: company.primary_domain,
              linkedinUrl: company.linkedin_url,
              employeeCount: company.estimated_num_employees,
              revenue: company.annual_revenue,
              industry: company.industry,
              source: 'apollo' as const
            };

            // Return enriched dossier
            return {
              ...baseDossier,
              enrichedContacts,
              enrichedCompany,
              isEnriched: true
            };
          } else {
            console.warn('[DOSSIER] No contacts found on Apollo');
          }
        } else {
          console.warn('[DOSSIER] Company not found on Apollo');
        }
      } catch (error) {
        console.error('[DOSSIER] Apollo enrichment failed:', error);
      }

      // Return base dossier if enrichment fails
      console.warn('[DOSSIER] Returning unenriched dossier');
      return {
        ...baseDossier,
        isEnriched: false
      };
    });
  },

  async generateEstimation(signal: MarketSignal, profile: BusinessProfile, dossier: DealDossier, rateCards?: RateCardEntry[]): Promise<CostEstimation> {
    return withRetry(async () => {
      const ai = getAI();

      // Extract numeric estimated value from potentially AuditablePrice
      const rawEstimatedValue = dossier.pricingStrategy?.estimatedValue;
      const estimatedValue = typeof rawEstimatedValue === 'object' && rawEstimatedValue !== null
        ? (rawEstimatedValue as AuditablePrice).value
        : (rawEstimatedValue as number) || 0;
      const bundleDesc = dossier.recommendedBundle?.map(b => `${b.quantity}x ${b.sku} - ${b.description}`).join('\n') || 'Not specified';

      // Build rate card injection if available
      const hasRateCards = rateCards && rateCards.length > 0;
      const rateCardSection = hasRateCards
        ? `\n\nCOMPANY RATE CARD (USE THESE RATES WHERE APPLICABLE):\n${
          ['labour', 'equipment', 'overhead', 'subContractors', 'materials'].map(cat => {
            const entries = rateCards.filter(r => r.category === cat);
            if (entries.length === 0) return '';
            return `${cat.charAt(0).toUpperCase() + cat.slice(1)}: ${entries.map(e => `${e.description} $${e.defaultRate}/${e.unit}`).join(', ')}`;
          }).filter(Boolean).join('\n')
        }\n\nCRITICAL: Where a rate card entry matches a line item, use the EXACT rate from the card. Only use market rates for items NOT covered by the rate card.`
        : '';

      const prompt = `You are an expert cost estimator. Generate a detailed cost estimation breakdown for this project opportunity.

PROJECT CONTEXT:
- Signal: "${signal.headline}"
- Summary: ${signal.summary}
- Region: ${signal.region}
- Account: ${dossier.accountName}
- Estimated Opportunity Value: $${estimatedValue.toLocaleString()}
- Recommended Products/Bundle:
${bundleDesc}

SELLER COMPANY: ${profile.name}
INDUSTRY: ${profile.industry}
PRODUCTS: ${profile.products.join(', ')}
${rateCardSection}

INSTRUCTIONS:
1. Search for CURRENT regional market rates for ${signal.region} to ensure pricing accuracy.
2. Break down costs into exactly 5 categories: materials, labour, subContractors, equipment, overhead.
3. For each category, provide 3-6 specific line items with realistic quantities and unit rates.
4. Use appropriate units: m³, m², tonnes, hrs, days, each, lump sum, % etc.
5. Materials should reflect actual building/industrial material costs for the region.
6. Labour rates should reflect current award rates or market rates for the region.
7. Equipment should include hire/day-rates for relevant machinery.
8. Overhead should include insurance, permits, site establishment, project management, and profit margin.
9. The subContractors category should cover specialized trades (electrical, plumbing, HVAC, etc.).
10. Provide a confidence level (low/medium/high) and list key assumptions.
11. Include a projectType and projectScale description.

Return as JSON.`;

      const response = await withTimeout(
        ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }],
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                confidence: { type: Type.STRING, enum: ['low', 'medium', 'high'] },
                projectType: { type: Type.STRING },
                projectScale: { type: Type.STRING },
                assumptions: { type: Type.ARRAY, items: { type: Type.STRING } },
                materials: {
                  type: Type.OBJECT,
                  properties: {
                    notes: { type: Type.STRING },
                    items: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          description: { type: Type.STRING },
                          unit: { type: Type.STRING },
                          quantity: { type: Type.NUMBER },
                          unitRate: { type: Type.NUMBER },
                          amount: { type: Type.NUMBER }
                        },
                        required: ['description', 'unit', 'quantity', 'unitRate', 'amount']
                      }
                    }
                  },
                  required: ['items']
                },
                labour: {
                  type: Type.OBJECT,
                  properties: {
                    notes: { type: Type.STRING },
                    items: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          description: { type: Type.STRING },
                          unit: { type: Type.STRING },
                          quantity: { type: Type.NUMBER },
                          unitRate: { type: Type.NUMBER },
                          amount: { type: Type.NUMBER }
                        },
                        required: ['description', 'unit', 'quantity', 'unitRate', 'amount']
                      }
                    }
                  },
                  required: ['items']
                },
                subContractors: {
                  type: Type.OBJECT,
                  properties: {
                    notes: { type: Type.STRING },
                    items: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          description: { type: Type.STRING },
                          unit: { type: Type.STRING },
                          quantity: { type: Type.NUMBER },
                          unitRate: { type: Type.NUMBER },
                          amount: { type: Type.NUMBER }
                        },
                        required: ['description', 'unit', 'quantity', 'unitRate', 'amount']
                      }
                    }
                  },
                  required: ['items']
                },
                equipment: {
                  type: Type.OBJECT,
                  properties: {
                    notes: { type: Type.STRING },
                    items: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          description: { type: Type.STRING },
                          unit: { type: Type.STRING },
                          quantity: { type: Type.NUMBER },
                          unitRate: { type: Type.NUMBER },
                          amount: { type: Type.NUMBER }
                        },
                        required: ['description', 'unit', 'quantity', 'unitRate', 'amount']
                      }
                    }
                  },
                  required: ['items']
                },
                overhead: {
                  type: Type.OBJECT,
                  properties: {
                    notes: { type: Type.STRING },
                    items: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          description: { type: Type.STRING },
                          unit: { type: Type.STRING },
                          quantity: { type: Type.NUMBER },
                          unitRate: { type: Type.NUMBER },
                          amount: { type: Type.NUMBER }
                        },
                        required: ['description', 'unit', 'quantity', 'unitRate', 'amount']
                      }
                    }
                  },
                  required: ['items']
                }
              },
              required: ['confidence', 'projectType', 'projectScale', 'assumptions', 'materials', 'labour', 'subContractors', 'equipment', 'overhead']
            } as any
          }
        }),
        60000 // 60 seconds (Heavy computation)
      );

      const data = JSON.parse(response.text || '{}');

      // Build rate card lookup by category
      const rateCardsByCategory = new Map<string, RateCardEntry[]>();
      if (hasRateCards) {
        rateCards.forEach(rc => {
          const existing = rateCardsByCategory.get(rc.category) || [];
          existing.push(rc);
          rateCardsByCategory.set(rc.category, existing);
        });
      }

      // Post-process: compute category totals, match against rate cards
      const processCategory = (cat: any, categoryName: string): CostCategory => {
        const categoryRates = rateCardsByCategory.get(categoryName) || [];

        const items = (cat.items || []).map((item: any) => {
          // Try to match this line item against a rate card entry (case-insensitive substring)
          const descLower = (item.description || '').toLowerCase();
          const rateMatch = categoryRates.find(rc =>
            descLower.includes(rc.description.toLowerCase()) ||
            rc.description.toLowerCase().includes(descLower)
          );

          let unitRate: number | AuditablePrice;
          let rateCardEntryId: string | undefined;
          let source: 'ai' | 'rate_card' | 'manual';

          if (rateMatch) {
            // Override with rate card value
            unitRate = {
              value: rateMatch.defaultRate,
              source: 'rate_card',
              confidence: 95,
              sourceDetail: `Rate card: ${rateMatch.description} @ $${rateMatch.defaultRate}/${rateMatch.unit}`,
            };
            rateCardEntryId = rateMatch.id;
            source = 'rate_card';
          } else {
            // Keep AI rate, wrap as AuditablePrice
            unitRate = {
              value: item.unitRate || 0,
              source: 'ai_estimate',
              confidence: 55,
              sourceDetail: 'AI estimate via Google Search grounding',
            };
            source = 'ai';
          }

          const rateValue = typeof unitRate === 'number' ? unitRate : unitRate.value;
          const amount = item.quantity * rateValue;

          return {
            description: item.description,
            unit: item.unit,
            quantity: item.quantity,
            unitRate,
            amount,
            rateCardEntryId,
            source,
            isAdjusted: false,
          };
        });
        return {
          total: items.reduce((sum: number, item: any) => sum + (item.amount || 0), 0),
          items,
          notes: cat.notes
        };
      };

      const materials = processCategory(data.materials, 'materials');
      const labour = processCategory(data.labour, 'labour');
      const subContractors = processCategory(data.subContractors, 'subContractors');
      const equipment = processCategory(data.equipment, 'equipment');
      const overhead = processCategory(data.overhead, 'overhead');

      const totalDirectCosts = materials.total + labour.total + subContractors.total + equipment.total;
      const totalIndirectCosts = overhead.total;
      const grandTotal = totalDirectCosts + totalIndirectCosts;
      const contingency = 10; // default 10%
      const finalEstimate = grandTotal * (1 + contingency / 100);

      return {
        id: `est-${Date.now()}`,
        dossierId: dossier.id,
        signalId: signal.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        estimationType: 'ai_generated',
        confidence: data.confidence || 'medium',
        materials,
        labour,
        subContractors,
        equipment,
        overhead,
        totalDirectCosts,
        totalIndirectCosts,
        grandTotal,
        contingency,
        finalEstimate,
        assumptions: data.assumptions || [],
        region: signal.region,
        projectType: data.projectType || 'General',
        projectScale: data.projectScale || 'Not specified'
      };
    });
  },

  async assessMarketActivity(profile: BusinessProfile): Promise<{ level: string, summary: string, colorClass: string }> {
    return withRetry(async () => {
      const ai = getAI();
      const regionContext = profile.geography.join(', ');
      
      const prompt = `Analyze the current live web news, tender announcements, and press releases for the past 7 days related to ${profile.industry} (${profile.products.join(', ')}) in ${regionContext}.
      
      Based on the volume and velocity of news, evaluate the market activity level for this sector.
      
      Respond with a JSON object containing:
      - level: Must be exactly one of "Surging", "Active", "Cooling", or "Quiet".
      - summary: A one-sentence explanation of the trend (e.g., "Infrastructure tenders in California are up 45% this week.").
      - colorClass: A tailwind text color class matching the level (e.g., "text-emerald-500" for Surging, "text-violet-500" for Active, "text-orange-500" for Cooling, "text-slate-500" for Quiet).
      
      Return ONLY valid JSON.`;

      const response = await withTimeout(
        ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }],
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                level: { type: Type.STRING, enum: ["Surging", "Active", "Cooling", "Quiet"] },
                summary: { type: Type.STRING },
                colorClass: { type: Type.STRING }
              },
              required: ["level", "summary", "colorClass"]
            }
          }
        }),
        30000 // 30 seconds for polling
      );

      const data = JSON.parse(response.text || '{}');
      return {
        level: data.level || "Active",
        summary: data.summary || "Unable to retrieve real-time data.",
        colorClass: data.colorClass || "text-slate-500"
      };
    });
  },

  async scanTrackedWebsites(profile: BusinessProfile, websites: TrackedWebsite[], onSignal?: (s: MarketSignal) => void): Promise<MarketSignal[]> {
    const ai = getAI();
    let discovered: MarketSignal[] = [];

    for (const site of websites) {
      if (!site.url) continue;
      console.log(`[SCAN] Scraping tracked website: ${site.url}`);
      try {
        const jinaUrl = `https://r.jina.ai/${site.url}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);
        
        const response = await fetch(jinaUrl, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          console.warn(`[SCAN] Failed to retrieve ${site.url}: ${response.statusText}`);
          continue;
        }

        const textContent = await response.text();
        const truncatedScrape = textContent.substring(0, 15000); // Send up to 15k characters

        const prompt = `You are a sales intelligence system extracting opportunities from a scraped webpage.
        Target Keywords for this website: ${site.targetKeywords || 'None specified'}
        Purpose/Context for tracking: ${site.purpose || 'None specified'}
        Our business profile: Industry: ${profile.industry}, Products: ${profile.products.join(', ')}.

        Extract up to 3 high-priority news/announcement/signals from this scraped text that would be a sales opportunity for our business profile or match the target keywords.
        Scraped content snippet:
        ===
        ${truncatedScrape}
        ===

        If there are NO strong matches or sales opportunities, return an empty array [].
        Otherwise, return a JSON array of market signals with these exact fields per object:
        - headline (string): Concise summary of the signal.
        - summary (string): Detail of what happened.
        - importance (string): Why it matters for us.
        - decisionMaker (string): The company or person involved.
        - urgency (string): One of "STANDARD", "HIGH", or "EMERGENCY".
        - matchedProducts (array of strings): Which of our products fit.
        - scores (object): Provide numeric scores from 0-100 for: "freshness", "proximity", "intentStrength", "buyerMatch".

        ONLY RETURN VALID JSON. Do not return markdown. Do not summarize outside of the JSON. If nothing is found, return: []`;

        const aiResponse = await withTimeout(
          ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
              temperature: 0.1,
            }
          }),
          45000
        );

        let jsonText = (aiResponse.text || '').trim();
        const match = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (match) jsonText = match[1].trim();

        const data = JSON.parse(jsonText);
        if (Array.isArray(data)) {
          for (const rawSignal of data) {
            const aiScores = rawSignal.scores || {};
            const confidence: SignalConfidence = {
              freshness: typeof aiScores.freshness === 'number' ? aiScores.freshness : 90,
              proximity: typeof aiScores.proximity === 'number' ? aiScores.proximity : 100,
              intentStrength: typeof aiScores.intentStrength === 'number' ? aiScores.intentStrength : 90,
              buyerMatch: typeof aiScores.buyerMatch === 'number' ? aiScores.buyerMatch : 90,
              urgency: rawSignal.urgency === SignalUrgency.EMERGENCY ? 100 : rawSignal.urgency === SignalUrgency.HIGH ? 90 : 80,
              total: 0
            };
            confidence.total = Math.round((confidence.freshness + confidence.proximity + confidence.intentStrength + confidence.buyerMatch + confidence.urgency) / 5);

            const completeSignal: MarketSignal = {
              ...rawSignal,
              id: `trksig-${Date.now()}-${Math.random()}`,
              timestamp: 'Just Now',
              score: confidence.total,
              confidenceDetails: confidence,
              sourceUrl: site.url, // Using tracked website URL as fallback
              sourceTitle: rawSignal.headline || "Website Extraction",
              region: profile.geography[0] || 'Unknown',
              status: 'New',
              relevanceFeedback: 'Unknown',
              trackedWebsiteId: site.id
            };

            discovered.push(completeSignal);
            if (onSignal) onSignal(completeSignal);
          }
        }
      } catch (err) {
        console.warn(`[SCAN] Error processing tracked website ${site.url}:`, err);
      }
    }

    return discovered;
  },

  // ============ INDUSTRY TRENDS (Insights Screen) ============
  async getIndustryTrends(profile: BusinessProfile): Promise<Array<{
    title: string;
    impact: string;
    relevance: string;
    marketShift: 'bullish' | 'bearish' | 'neutral';
    sourceTitle?: string;
    sourceUrl?: string;
  }>> {
    return withRetry(async () => {
      const ai = getAI();
      const today = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      const geoCtx = profile.geography.slice(0, 3).join(', ');
      const productsCtx = profile.products.slice(0, 4).join(', ');

      const prompt = `You are a senior market intelligence analyst. As of ${today}, identify exactly 4 major real-world trends shaping the ${profile.industry} industry in ${geoCtx}.

Our company (${profile.name}) sells: ${productsCtx}.
Our target customers: ${profile.targetGroups.slice(0, 3).join(', ')}.

For each trend:
1. Find a real, current trend (backed by recent news, reports, or data)
2. Explain the market direction it creates (bullish = growing demand, bearish = declining, neutral = structural shift)
3. Explain specifically how it affects companies selling ${productsCtx}

Be concrete and specific — cite what's actually happening in the market right now. Each trend should be distinct (e.g., regulatory, technological, economic, consumer behavior).`;

      const response = await withTimeout(
        ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }],
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  impact: { type: Type.STRING },
                  relevance: { type: Type.STRING },
                  marketShift: { type: Type.STRING, enum: ['bullish', 'bearish', 'neutral'] },
                  sourceTitle: { type: Type.STRING },
                  sourceUrl: { type: Type.STRING },
                },
                required: ['title', 'impact', 'relevance', 'marketShift'],
              },
            } as any,
          },
        }),
        45000
      );

      const trends = JSON.parse(response.text || '[]');
      console.log('[TRENDS] Fetched', trends.length, 'industry trends');

      // Enrich with grounding URLs where available
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      return trends.map((t: any, i: number) => ({
        ...t,
        sourceUrl: t.sourceUrl || chunks[i]?.web?.uri || '',
        sourceTitle: t.sourceTitle || chunks[i]?.web?.title || '',
      }));
    });
  },
};