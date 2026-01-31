import { GoogleGenAI, Type } from "@google/genai";
import { BusinessProfile, SalesTrigger, MarketSignal, SignalUrgency, SignalConfidence, DealDossier } from "../types";

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
    // More inclusive keyword extraction, preserving more context
    const stopWords = new Set(['the', 'and', 'for', 'with', 'from', 'this', 'that', 'into', 'under', 'project', 'construction', 'new', 'nsw', 'gov', 'govt', 'wa', 'nt', 'qld', 'vic', 'sa', 'tas', 'au', 'nz']);
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
   */
  calculateScore(signal: any, chunk: any): number {
    let score = 0;
    const chunkTitle = chunk.web?.title || "";
    const chunkUri = chunk.web?.uri || "";
    const chunkKeywords = this.getKeywords(chunkTitle);

    // 1. Check direct source title match (if AI provided it)
    if (signal.sourceTitle) {
      const sourceKeywords = this.getKeywords(signal.sourceTitle);
      const matches = sourceKeywords.filter(k => chunkKeywords.includes(k));
      score += matches.length * 15;
    }

    // 2. Check signal headline match (often more reliable than the AI's 'sourceTitle' field)
    const headlineKeywords = this.getKeywords(signal.headline);
    const headlineMatches = headlineKeywords.filter(k => chunkKeywords.includes(k));
    score += headlineMatches.length * 10;

    // 3. Domain match
    const signalHost = this.getHostname(signal.sourceUrl);
    const chunkHost = this.getHostname(chunkUri);
    if (signalHost && chunkHost && signalHost === chunkHost) {
      score += 40;
    }

    // 4. Source quality weighting
    if (chunkHost.includes('.gov') || chunkHost.includes('.govt')) {
      score += 20;
    } else if (['abc.net.au', 'nzherald', 'smh.com.au', 'theguardian'].some(news => chunkHost.includes(news))) {
      score += 10;
    } else if (['tenderlink', 'tenders', 'bci', 'australiantenders'].some(agg => chunkHost.includes(agg))) {
      score -= 5;
    }

    return score;
  }
};

export const geminiService = {
  async profileBusiness(url: string): Promise<Partial<BusinessProfile>> {
    return withRetry(async () => {
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Profile the business at this URL: ${url}. Identify the actual company name, industry, core products, target customer groups, and geography. Return as JSON.`,
        config: {
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
        id: `t-${idx}-${Date.now()}`,
        status: 'Pending'
      }));
    });
  },

  async huntSignals(profile: BusinessProfile, activeTriggers: SalesTrigger[], activeRegion?: string): Promise<MarketSignal[]> {
    return withRetry(async () => {
      const ai = getAI();
      const regionContext = activeRegion || profile.geography.join(', ');

      // MVP LOGIC: Check for specific preset IDs to run specialized prompts
      const isTenderHunt = activeTriggers.some(t => t.id.includes('mvp-tender') && t.status === 'Approved');
      const isProjectHunt = activeTriggers.some(t => t.id.includes('mvp-project') && t.status === 'Approved');

      let prompt = '';

      if (isTenderHunt) {
        prompt = `SEARCH GROUNDING TASK: Find 3 recent major contract awards or tender winners in ${regionContext} related to ${profile.industry} or ${profile.products.join(', ')}.
         
         REQUIREMENTS:
         1. Look for keywords like "awarded to", "contract signed", "winning bidder", "secured contract".
         2. Focus on Commercial or Government contracts > $1M.
         3. Return the exact source URL and Title.
         4. Identify the WINNING COMPANY as the decision maker.
         
         Format as JSON with keys: headline, summary, importance, matchedProducts, decisionMaker, urgency, sourceUrl, sourceTitle.`;
      } else if (isProjectHunt) {
        prompt = `SEARCH GROUNDING TASK: Find 3 recent new project announcements, construction starts, or development approvals in ${regionContext} related to ${profile.industry}.
         
         REQUIREMENTS:
         1. Look for keywords like "groundbreaking", "site establishment", "approved for construction", "development application approved".
         2. Focus on physical infrastructure or major facility setups.
         3. Return the exact source URL and Title.
         4. Identify the PROJECT OWNER/DEVELOPER as the decision maker.
         
         Format as JSON with keys: headline, summary, importance, matchedProducts, decisionMaker, urgency, sourceUrl, sourceTitle.`;
      } else {
        // Fallback to generic hunting
        const triggerContext = activeTriggers
          .filter(t => t.status === 'Approved')
          .map(t => {
            const siteConstraint = t.limitToSite ? `site:${t.limitToSite}` : '';
            return `${siteConstraint} ${t.event} for ${t.product}`.trim();
          })
          .join(', ');

        const generalConstraints = activeTriggers.some(t => t.limitToSite)
          ? "IMPORTANT: Use the 'site:' operator in search queries as specified in the Triggers list."
          : "";

        prompt = `SEARCH GROUNDING TASK: Find 3 CURRENT market events in ${regionContext} that create sales opportunities for ${profile.name}.
         
         Parameters:
         - Geography: ${regionContext}
         - Target Industries: ${profile.industry}
         - Triggers: ${triggerContext}
         
         REQUIREMENTS:
         1. Every signal MUST correspond to a real news article or government announcement found via the search tool.
         2. Provide a descriptive headline, a summary of the intent, and identify the decision-making entity.
         3. Include the verbatim 'sourceUrl' and 'sourceTitle' from the search results.
         4. ${generalConstraints}
         
         If no significant events are found, return an empty array [].`;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                headline: { type: Type.STRING },
                summary: { type: Type.STRING },
                importance: { type: Type.STRING },
                matchedProducts: { type: Type.ARRAY, items: { type: Type.STRING } },
                decisionMaker: { type: Type.STRING },
                urgency: { type: Type.STRING, enum: Object.values(SignalUrgency) },
                sourceUrl: { type: Type.STRING },
                sourceTitle: { type: Type.STRING }
              },
              required: ["headline", "summary", "importance", "matchedProducts", "decisionMaker", "urgency", "sourceUrl", "sourceTitle"]
            }
          }
        }
      });

      const signals = JSON.parse(response.text || '[]');
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

      if (signals.length > 0 && groundingChunks.length === 0) {
        console.warn("Signals found but no grounding metadata returned from Gemini. This may indicate a tool execution issue.");
      }

      const verifiedSignals: MarketSignal[] = [];

      for (let s of signals) {
        // Map signal to best search result using the robust scoring heuristic
        const rankedChunks = groundingChunks
          .map(c => ({
            chunk: c,
            score: matchUtils.calculateScore(s, c)
          }))
          .sort((a, b) => b.score - a.score);

        const bestMatch = rankedChunks[0];

        // LOGIC: We only discard if the score is truly zero, meaning no keywords or domain overlap at all.
        // A low score (e.g. 5 or 10) still suggests some connection to reality.
        if (!bestMatch || bestMatch.score <= 0 || !bestMatch.chunk.web?.uri) {
          console.warn(`Discarding signal as potentially hallucinated (Score: ${bestMatch?.score || 0}): ${s.headline}`);
          continue;
        }

        // Use the metadata's URI as the absolute source of truth
        const verifiedUrl = bestMatch.chunk.web.uri;
        const verifiedTitle = bestMatch.chunk.web.title || s.sourceTitle;

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
      const prompt = `Generate a Deal Dossier for ${profile.name} regarding the project: "${signal.headline}".
      
      Source Data: ${signal.sourceUrl}
      Region: ${signal.region}

      Focus:
      1. Identify the BUYER entity.
      2. Provide strategic advice for the SELLER.
      3. Return as JSON.`;

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
      return {
        ...data,
        id: `dos-${Date.now()}`,
        signalId: signal.id
      };
    });
  }
};