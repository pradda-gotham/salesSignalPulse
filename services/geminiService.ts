import { GoogleGenAI, Type } from "@google/genai";
import { BusinessProfile, SalesTrigger, MarketSignal, SignalUrgency, SignalConfidence, DealDossier, EnrichedContact, EnrichedCompany, CostEstimation, CostCategory, TrackedWebsite } from "../types";
import { apolloService } from "./apolloService";

const getAI = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    console.error("VITE_GEMINI_API_KEY is missing! Please check .env.local");
    throw new Error("Missing API Key");
  }
  return new GoogleGenAI({ apiKey });
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
      const prompt = `Given these products: ${profile.products.join(', ')} and these target groups: ${profile.targetGroups.join(', ')} for the company ${profile.name} in the ${profile.industry} industry, what real-world events or "sales triggers" create immediate demand? Generate 4 triggers.

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
      promptAngles.push(
        `Find 1 recent news or emerging trend in ${regionContext} relevant to the ${profile.industry} industry that would create demand for ${productsStr}. Look for market shifts, regulatory changes, seasonal patterns, or consumer behavior changes.`,
        `Find 1 recent announcement, partnership, funding round, or expansion in ${regionContext} relevant to companies or individuals who buy ${productsStr}. Target audience: ${targetGroupsStr}.`,
        `Find 1 recent news article in ${regionContext} about a problem, challenge, or unmet need that ${profile.name}'s products (${productsStr}) could solve. Look for pain points experienced by ${targetGroupsStr}.`,
        `Find 1 recent industry report, survey result, or market research finding in ${regionContext} that signals growing demand for ${productsStr} within ${profile.industry}.`
      );

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
      const discoveredSignals: MarketSignal[] = [];
      const seenHeadlines = new Set<string>();

      console.log(`[HUNT] Starting one-signal-per-call hunt. ${activePrompts.length} prompt angles available, targeting ${TARGET_SIGNALS} signals.`);

      for (let i = 0; i < activePrompts.length && discoveredSignals.length < TARGET_SIGNALS; i++) {
        const angle = activePrompts[i];

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
         - scores (object): Provide numeric scores from 0-100 for the following 4 metrics: "freshness" (how recent), "proximity" (geographic relevance), "intentStrength" (likelihood to buy), "buyerMatch" (how well they fit the profile).
         ${dedupClause}`;

        try {
          console.log(`\n[HUNT ${i + 1}/${activePrompts.length}] Searching: "${angle.substring(0, 80)}..."`);

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
            console.log(`[HUNT ${i + 1}] No signal found for this angle, skipping.`);
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
            console.warn(`[HUNT ${i + 1}] Failed to parse JSON from response, skipping.`);
            continue;
          }

          // Skip empty or invalid signals
          if (!signal.headline || signal.headline.trim().length === 0) {
            console.log(`[HUNT ${i + 1}] No signal found for this angle, skipping.`);
            continue;
          }

          const normalizedHeadline = signal.headline.toLowerCase().trim();
          if (seenHeadlines.has(normalizedHeadline)) {
            console.log(`[HUNT ${i + 1}] Duplicate headline, skipping: "${signal.headline.substring(0, 50)}..."`);
            continue;
          }
          seenHeadlines.add(normalizedHeadline);

          // === SOURCE URL: Use ONLY grounding chunk URLs (Google-verified) ===
          // NEVER trust model-generated URLs — they are hallucinated.
          let sourceUrl = '';
          const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
          console.log(`[HUNT ${i + 1}] Grounding chunks: ${chunks.length}`);

          if (chunks.length > 0) {
            // Find the best URL — prefer actual article URLs over redirect URLs
            for (const chunk of chunks) {
              if (chunk.web?.uri) {
                sourceUrl = chunk.web.uri;
                console.log(`[HUNT ${i + 1}] Source URL (grounding): ${sourceUrl.substring(0, 100)}`);
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
                console.log(`[HUNT ${i + 1}] Domain filter rejected: ${sourceHost}`);
                continue;
              }
            } catch (e) { /* invalid URL, keep signal anyway */ }
          }

          console.log(`[HUNT ${i + 1}] ✅ "${signal.headline.substring(0, 60)}..."`);
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

          const marketSignal: MarketSignal = {
            ...signal,
            id: `sig-${Date.now()}-${Math.random()}`,
            timestamp: hasSource ? 'Verified Live' : 'Unverified',
            score: confidence.total,
            confidenceDetails: confidence,
            sourceUrl: sourceUrl,
            sourceTitle: signal.headline,
            region: regionContext,
            status: 'New'
          };

          discoveredSignals.push(marketSignal);

          // Stream signal to UI immediately
          if (onSignal) {
            onSignal(marketSignal);
          }

        } catch (err) {
          console.warn(`[HUNT ${i + 1}] Failed:`, (err as Error).message);
        }

        // Small delay between calls to stay within rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      console.log(`\n[HUNT] Complete. ${discoveredSignals.length} signals discovered.`);
      return discoveredSignals;
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

  async generateDossier(signal: MarketSignal, profile: BusinessProfile): Promise<DealDossier> {
    return withRetry(async () => {
      const ai = getAI();
      const prompt = `Generate a Deal Dossier for a sales opportunity.

SELLER COMPANY: ${profile.name}
SELLER PRODUCTS: ${profile.products.join(', ')}
SELLER TARGET CUSTOMERS: ${profile.targetGroups.join(', ')}

NEWS/SIGNAL: "${signal.headline}"
SOURCE: ${signal.sourceUrl}
REGION: ${signal.region}

CRITICAL RULES FOR accountName:
1. The accountName MUST be the TARGET — the company, organization, or audience segment that would PURCHASE from ${profile.name}
2. NEVER return "${profile.name}" as the accountName - they are the SELLER
3. Look for the entity in the news that would need ${profile.products.join(' or ')}. This could be a company, government body, organization, or (for B2C businesses) a demographic/audience segment.
4. The accountName should be whoever benefits from or needs ${profile.products.join(' or ')}

Example: If news says "City of Marion partnered with Blu Built to deliver a project", the accountName should be "Blu Built" (the buyer/contractor), NOT the seller company.

Focus:
1. Identify the TARGET from the news — the entity that would purchase or benefit from ${profile.products.join(', ')}
2. Provide strategic advice for ${profile.name} (the SELLER) to win this opportunity
3. Return as JSON with accountName being the TARGET's name`;

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
                      quantity: { type: Type.NUMBER }
                    }
                  }
                },
                pricingStrategy: {
                  type: Type.OBJECT,
                  properties: {
                    logic: { type: Type.STRING },
                    discount: { type: Type.NUMBER },
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
      const baseDossier: DealDossier = {
        ...data,
        id: `dos-${Date.now()}`,
        signalId: signal.id
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

  async generateEstimation(signal: MarketSignal, profile: BusinessProfile, dossier: DealDossier): Promise<CostEstimation> {
    return withRetry(async () => {
      const ai = getAI();

      const estimatedValue = dossier.pricingStrategy?.estimatedValue || 0;
      const bundleDesc = dossier.recommendedBundle?.map(b => `${b.quantity}x ${b.sku} - ${b.description}`).join('\n') || 'Not specified';

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

      // Post-process: compute category totals and overall totals
      const processCategory = (cat: any): CostCategory => {
        const items = (cat.items || []).map((item: any) => ({
          ...item,
          amount: item.amount || (item.quantity * item.unitRate),
          source: 'ai' as const,
          isAdjusted: false
        }));
        return {
          total: items.reduce((sum: number, item: any) => sum + (item.amount || 0), 0),
          items,
          notes: cat.notes
        };
      };

      const materials = processCategory(data.materials);
      const labour = processCategory(data.labour);
      const subContractors = processCategory(data.subContractors);
      const equipment = processCategory(data.equipment);
      const overhead = processCategory(data.overhead);

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
  }
};