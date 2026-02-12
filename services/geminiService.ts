import { GoogleGenAI, Type } from "@google/genai";
import { BusinessProfile, SalesTrigger, MarketSignal, SignalUrgency, SignalConfidence, DealDossier, EnrichedContact, EnrichedCompany } from "../types";
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
 * Enhanced heuristic matching utilities for grounding verification.
 */
const matchUtils = {
  getKeywords(text: string): string[] {
    if (!text) return [];
    // Minimal stop words - keep industry-relevant terms like 'project', 'construction', 'new'
    const stopWords = new Set(['the', 'and', 'for', 'with', 'from', 'this', 'that', 'into', 'under', 'nsw', 'gov', 'govt', 'wa', 'nt', 'qld', 'vic', 'sa', 'tas', 'au', 'nz', 'com', 'www', 'http', 'https']);
    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.has(w));
  },

  getHostname(url: string): string {
    if (!url) return "";
    try {
      const cleanUrl = url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`;
      const parsed = new URL(cleanUrl);
      return parsed.hostname.replace('www.', '').toLowerCase();
    } catch {
      return url.toLowerCase();
    }
  },

  /**
   * Calculates a similarity score between a generated signal and a search result chunk.
   * Since we no longer ask the model for sourceUrl, we rely on headline/title matching.
   */
  calculateScore(signal: any, chunk: any, debug: boolean = false): number {
    let score = 0;
    const chunkTitle = chunk.web?.title || "";
    const chunkUri = chunk.web?.uri || "";
    const chunkKeywords = this.getKeywords(chunkTitle);

    // 1. Check signal headline match against chunk title
    const headlineKeywords = this.getKeywords(signal.headline);
    const headlineMatches = headlineKeywords.filter(k => chunkKeywords.includes(k));
    score += headlineMatches.length * 15;

    // 2. Check summary keywords match
    const summaryKeywords = this.getKeywords(signal.summary);
    const summaryMatches = summaryKeywords.filter(k => chunkKeywords.includes(k));
    score += summaryMatches.length * 5;

    // 3. Decision maker name match (company names often appear in URLs/titles)
    const decisionMakerKeywords = this.getKeywords(signal.decisionMaker);
    const decisionMakerMatches = decisionMakerKeywords.filter(k => chunkKeywords.includes(k));
    score += decisionMakerMatches.length * 20;

    // 4. Source quality weighting
    const chunkHost = this.getHostname(chunkUri);
    if (chunkHost.includes('.gov') || chunkHost.includes('.govt')) {
      score += 20;
    } else if (['abc.net.au', 'nzherald', 'smh.com.au', 'theguardian'].some(news => chunkHost.includes(news))) {
      score += 10;
    } else if (['tenderlink', 'tenders', 'bci', 'australiantenders'].some(agg => chunkHost.includes(agg))) {
      score -= 5;
    }

    // Debug logging for score breakdown
    if (debug) {
      console.log(`[SCORE DEBUG] Signal: "${signal.headline?.substring(0, 50)}..."`);
      console.log(`  Chunk: "${chunkTitle?.substring(0, 60)}..."`);
      console.log(`  Headline keywords: [${headlineKeywords.join(', ')}]`);
      console.log(`  Chunk keywords: [${chunkKeywords.join(', ')}]`);
      console.log(`  Matches: headline=${headlineMatches.length}(+${headlineMatches.length * 15}), summary=${summaryMatches.length}(+${summaryMatches.length * 5}), decisionMaker=${decisionMakerMatches.length}(+${decisionMakerMatches.length * 20})`);
      console.log(`  Final Score: ${score}`);
    }

    return score;
  }
};

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

export const geminiService = {
  async profileBusiness(url: string): Promise<Partial<BusinessProfile>> {
    return withRetry(async () => {
      const ai = getAI();
      const response = await ai.models.generateContent({
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
      });
      return JSON.parse(response.text || '{}');
    });
  },

  async generateTriggers(profile: BusinessProfile): Promise<SalesTrigger[]> {
    return withRetry(async () => {
      const ai = getAI();
      const prompt = `Given these products: ${profile.products.join(', ')} and these target groups: ${profile.targetGroups.join(', ')} for the company ${profile.name}, what real-world events or "sales triggers" create immediate demand? Generate 4 triggers. For each, provide a specific product, a trigger event, a data source, and the sales logic.`;

      const response = await ai.models.generateContent({
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
      });

      const rawTriggers = JSON.parse(response.text || '[]');
      return rawTriggers.map((t: any, idx: number) => ({
        ...t,
        id: `ai-${btoa(unescape(encodeURIComponent(t.event + t.product))).substring(0, 16)}-${idx}`,
        status: 'Pending'
      }));
    });
  },

  async huntSignals(profile: BusinessProfile, activeTriggers: SalesTrigger[], activeRegion?: string): Promise<MarketSignal[]> {
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

      // Define the response schema once for reuse
      // NOTE: We intentionally do NOT include sourceUrl/sourceTitle in the schema.
      // URLs are taken exclusively from groundingChunks metadata to prevent hallucination.
      const signalSchema = {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            headline: { type: Type.STRING },
            summary: { type: Type.STRING },
            importance: { type: Type.STRING },
            matchedProducts: { type: Type.ARRAY, items: { type: Type.STRING } },
            decisionMaker: { type: Type.STRING },
            urgency: { type: Type.STRING, enum: Object.values(SignalUrgency) }
          },
          required: ["headline", "summary", "importance", "matchedProducts", "decisionMaker", "urgency"]
        }
      };

      const allPromises: Promise<any>[] = [];

      // ========== WEB MODE: Multi-pass hunting ==========
      if (runWebMode) {
        console.log("[DEBUG] Starting Web Mode Searches...");
        const webPrompts = [
          // Pass 1: Tender/Contract Wins
          `SEARCH GROUNDING TASK: Find 6 recent contract awards or tender winners in ${regionContext} related to ${profile.industry} or ${profile.products.join(', ')}.
           
           TIME CONSTRAINT: Only include results from ${dateRange}. Ignore anything older.
           
           REQUIREMENTS:
           1. Look for keywords like "awarded to", "contract signed", "winning bidder", "secured contract".
           2. Focus on Commercial or Government contracts > $1M.
           3. Identify the WINNING COMPANY as the decision maker.
           4. DO NOT generate source URLs - these will be extracted from search metadata.
           
           If fewer than 6 results are found within the time range, return what you find. Do not make up results.
           Format as JSON array.`,

          // Pass 2: Project/Construction Announcements
          `SEARCH GROUNDING TASK: Find 6 recent project announcements, construction starts, or development approvals in ${regionContext} related to ${profile.industry}.
           
           TIME CONSTRAINT: Only include results from ${dateRange}. Ignore anything older.
           
           REQUIREMENTS:
           1. Look for keywords like "groundbreaking", "site establishment", "approved for construction", "development application approved", "commenced construction".
           2. Focus on physical infrastructure, facilities, or major capital projects.
           3. Identify the PROJECT OWNER/DEVELOPER as the decision maker.
           4. DO NOT generate source URLs - these will be extracted from search metadata.
           
           If fewer than 6 results are found within the time range, return what you find. Do not make up results.
           Format as JSON array.`,

          // Pass 3: Industry News & Press Releases
          `SEARCH GROUNDING TASK: Find 6 recent news articles or press releases about major business activities in ${regionContext} relevant to ${profile.name} selling ${profile.products.join(', ')}.
           
           TIME CONSTRAINT: Only include results from ${dateRange}. Ignore anything older.
           
           REQUIREMENTS:
           1. Look for expansion announcements, new facility openings, major investments, leadership changes indicating growth.
           2. Focus on companies that would be buyers for ${profile.products.join(', ')}.
           3. Identify the COMPANY MAKING THE ANNOUNCEMENT as the decision maker.
           4. DO NOT generate source URLs - these will be extracted from search metadata.
           
           Prioritize press releases from company newsrooms and reputable industry publications.
           If fewer than 6 results are found within the time range, return what you find. Do not make up results.
           Format as JSON array.`
        ];

        webPrompts.forEach((prompt, idx) => {
          allPromises.push(
            ai.models.generateContent({
              model: 'gemini-3-flash-preview',
              contents: prompt,
              config: {
                tools: [{ googleSearch: {} }],
                responseMimeType: "application/json",
                responseSchema: signalSchema as any
              }
            }).then(res => {
              console.log(`[DEBUG] Web Pass ${idx + 1} completed.`);
              return res;
            }).catch(err => {
              console.warn(`Web search pass ${idx + 1} failed:`, err.message);
              return null;
            })
          );
        });
      }

      // ========== SITES MODE: Per-site parallel searches ==========
      if (runSitesMode && allowedSites.length > 0) {
        console.log(`[DEBUG] Starting Sites Mode Searches for: ${allowedSites.join(', ')}`);
        for (const site of allowedSites) {
          const sitePrompt = `SEARCH GROUNDING TASK: Search ONLY on site:${site} for recent opportunities in ${regionContext} related to ${profile.industry} or ${profile.products.join(', ')}.
           
           STRICT CONSTRAINT: Only return results from site:${site}. Do not include results from any other domain.
           TIME CONSTRAINT: Only include results from ${dateRange}. Ignore anything older.
           
           REQUIREMENTS:
           1. Look for contract awards, project announcements, tender notices, or business news.
           2. Identify the relevant DECISION MAKER (company or organization).
           3. DO NOT generate source URLs - these will be extracted from search metadata.
           
           If no results are found on this specific site, return an empty array []. Do not make up results.
           Format as JSON array.`;

          allPromises.push(
            ai.models.generateContent({
              model: 'gemini-3-flash-preview',
              contents: sitePrompt,
              config: {
                tools: [{ googleSearch: {} }],
                responseMimeType: "application/json",
                responseSchema: signalSchema as any
              }
            }).then(res => {
              console.log(`[DEBUG] Site Search for ${site} completed.`);
              return res;
            }).catch(err => {
              console.warn(`Site search failed for ${site}:`, err.message);
              return null;
            })
          );
        }
      }

      // Execute all searches in parallel
      const responses = await Promise.all(allPromises);

      // Collect all signals and grounding chunks from all passes
      const allRawSignals: any[] = [];
      const allGroundingChunks: any[] = [];

      for (const response of responses) {
        if (!response) continue;
        try {
          const signals = JSON.parse(response.text || '[]');
          const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
          console.log(`[DEBUG] Pass Result: ${signals.length} signals, ${chunks.length} chunks.`);
          allRawSignals.push(...signals);
          allGroundingChunks.push(...chunks);
        } catch (e) {
          console.warn("Failed to parse response:", e);
        }
      }

      console.log(`[DEBUG] Total Raw Signals: ${allRawSignals.length}`);
      console.log(`[DEBUG] Total Grounding Chunks: ${allGroundingChunks.length}`);

      // Log sample grounding chunks for debugging
      if (allGroundingChunks.length > 0) {
        console.log(`[DEBUG] Sample Grounding Chunks:`);
        allGroundingChunks.slice(0, 3).forEach((chunk, i) => {
          console.log(`  ${i + 1}. "${chunk.web?.title?.substring(0, 60) || 'No title'}..." -> ${chunk.web?.uri || 'No URI'}`);
        });
      }

      if (allRawSignals.length > 0 && allGroundingChunks.length === 0) {
        console.warn("[WARNING] Signals found but NO grounding metadata returned. Using fallback mode.");
      }

      // Verify, filter, and deduplicate signals
      const verifiedSignals: MarketSignal[] = [];
      const seenUrls = new Set<string>();
      const seenHeadlines = new Set<string>();

      // ========== MINIMUM SCORE THRESHOLD ==========
      // Lowered from 0 to -10 to allow more signals through
      // Negative threshold allows even low-confidence matches when grounding is weak
      const MINIMUM_SCORE_THRESHOLD = -10;

      for (let s of allRawSignals) {
        console.log(`\n[VERIFY] Processing signal: "${s.headline?.substring(0, 60)}..."`);

        // Dedupe by headline similarity first (since we no longer have model-generated URLs)
        const normalizedHeadline = s.headline?.toLowerCase().trim();
        if (seenHeadlines.has(normalizedHeadline)) {
          console.log(`  [SKIP] Duplicate headline`);
          continue;
        }

        // ========== FALLBACK MODE: No grounding chunks ==========
        // If no grounding chunks returned, use the signal directly with a warning
        if (allGroundingChunks.length === 0) {
          console.warn(`  [FALLBACK] No grounding chunks available. Using signal with generated URL placeholder.`);
          seenHeadlines.add(normalizedHeadline);

          const confidence: SignalConfidence = {
            freshness: 70, // Lower confidence for unverified signals
            proximity: 100,
            intentStrength: 70,
            buyerMatch: 70,
            urgency: s.urgency === SignalUrgency.EMERGENCY ? 100 : 60,
            total: 0
          };
          confidence.total = Math.round((confidence.freshness + confidence.proximity + confidence.intentStrength + confidence.buyerMatch + confidence.urgency) / 5);

          verifiedSignals.push({
            ...s,
            id: `sig-${Date.now()}-${Math.random()}`,
            timestamp: 'Unverified',
            score: confidence.total,
            confidenceDetails: confidence,
            sourceUrl: '#unverified', // Placeholder URL
            sourceTitle: s.headline,
            region: regionContext,
            status: 'New'
          });
          continue;
        }

        // Map signal to best search result using robust scoring (with debug for first 3)
        const shouldDebug = verifiedSignals.length < 3;
        const rankedChunks = allGroundingChunks
          .map(c => ({
            chunk: c,
            score: matchUtils.calculateScore(s, c, shouldDebug)
          }))
          .sort((a, b) => b.score - a.score);

        const bestMatch = rankedChunks[0];
        const topScores = rankedChunks.slice(0, 3).map(r => r.score);
        console.log(`  [SCORING] Top 3 chunk scores: [${topScores.join(', ')}]`);
        console.log(`  [SCORING] Best match: score=${bestMatch?.score || 0}, url="${bestMatch?.chunk.web?.uri?.substring(0, 50) || 'none'}..."`);

        // Check if score meets threshold
        if (!bestMatch || bestMatch.score < MINIMUM_SCORE_THRESHOLD || !bestMatch.chunk.web?.uri) {
          console.log(`  [DISCARD] Score ${bestMatch?.score || 0} below threshold ${MINIMUM_SCORE_THRESHOLD}`);
          continue;
        }

        // Use grounding metadata as sole source of truth for URLs
        const verifiedUrl = bestMatch.chunk.web.uri;
        const verifiedTitle = bestMatch.chunk.web.title || s.headline; // Fallback to headline if no title
        const verifiedHost = matchUtils.getHostname(verifiedUrl);
        console.log(`  [VERIFIED] Using URL: ${verifiedUrl}`);

        // ========== DOMAIN WHITELIST FILTER ==========
        // If sites mode is active, enforce strict domain matching
        if (runSitesMode && allowedSites.length > 0) {
          const matchesAllowedSite = allowedSites.some(site =>
            verifiedHost.includes(site) || site.includes(verifiedHost)
          );
          if (!matchesAllowedSite) {
            console.log(`[DEBUG] Domain Filter: REJECTED ${verifiedHost}. Allowed: [${allowedSites.join(', ')}]`);
            continue;
          } else {
            console.log(`[DEBUG] Domain Filter: PASSED ${verifiedHost}`);
          }
        }

        // Mark URL and headline as seen
        seenUrls.add(verifiedHost);
        seenHeadlines.add(normalizedHeadline);

        const confidence: SignalConfidence = {
          freshness: 90,
          proximity: 100,
          intentStrength: 95,
          buyerMatch: 95,
          urgency: s.urgency === SignalUrgency.EMERGENCY ? 100 : 80,
          total: 0
        };
        confidence.total = Math.round((confidence.freshness + confidence.proximity + confidence.intentStrength + confidence.buyerMatch + confidence.urgency) / 5);

        verifiedSignals.push({
          ...s,
          id: `sig-${Date.now()}-${Math.random()}`,
          timestamp: 'Verified Live',
          score: confidence.total,
          confidenceDetails: confidence,
          sourceUrl: verifiedUrl,
          sourceTitle: verifiedTitle,
          region: regionContext,
          status: 'New'
        });
      }

      return verifiedSignals;
    });
  },

  async generateOutreach(signal: MarketSignal, profile: BusinessProfile): Promise<{ email: string, linkedin: string, call: string }> {
    return withRetry(async () => {
      const ai = getAI();
      const response = await ai.models.generateContent({
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
      });
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
1. The accountName MUST be the BUYER/PROSPECT company - the company that would PURCHASE from ${profile.name}
2. NEVER return "${profile.name}" as the accountName - they are the SELLER
3. Look for construction companies, developers, contractors, or project owners mentioned in the news
4. The accountName should be a company that needs ${profile.products.join(' or ')}

Example: If news says "City of Marion partnered with Blu Built to deliver a project", the accountName should be "Blu Built" (the contractor), NOT the seller company.

Focus:
1. Identify the BUYER company from the news (construction company, developer, contractor)
2. Provide strategic advice for ${profile.name} (the SELLER) to win this opportunity
3. Return as JSON with accountName being the BUYER's company name`;

      const response = await ai.models.generateContent({
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
      });

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
  }
};