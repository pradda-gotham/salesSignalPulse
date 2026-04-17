
export enum SignalUrgency {
  EMERGENCY = 'EMERGENCY',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW'
}

export type LeadStatus = 'New' | 'Contacted' | 'Followed-up' | 'Meeting Booked' | 'Archived';

// ============ ADVANCED BUSINESS PROFILE SECTIONS ============

export interface BestCustomerExample {
  name: string;
  whyIdeal: string;
}

export interface ICPSection {
  priorityIndustries?: string[];
  companySize?: string;                // "1-50", "50-200", "200-1000", "1000+"
  revenueRange?: string;               // "$1M-$5M", "$5M-$50M", "$50M-$500M", "$500M+"
  typicalBuyerTitles?: string[];       // "CFO", "Head of Ops", "Marketing Director"
  customerType?: 'B2B' | 'B2C' | 'Both';
  companyStagePreference?: 'new' | 'established' | 'fast_growing' | 'stable' | 'no_preference';
  bestCustomers?: BestCustomerExample[];
  bestCustomerRevenuePercent?: number; // 0-100
}

export interface ProblemSolutionFitSection {
  painPoints?: string[];               // key problems you solve
  buyingTriggers?: string[];           // events that lead to a sale: "hiring", "funding", "expansion", etc.
  readinessSignals?: string[];         // signals indicating a company is ready to buy
}

export interface USPSection {
  whyChooseUs?: string;                // free-text: why customers choose you
  uniqueStrength?: string;             // what you do better than anyone
  customerFeedback?: string;           // what customers say after buying
  proofPoints?: string[];              // case studies, ROI metrics, testimonials
  measurableOutcomes?: string[];       // "30% cost reduction", "2x faster onboarding"
}

export interface CompetitorEntry {
  name: string;
  whyWeWin?: string;
  whyWeLose?: string;
}

export interface DealCharacteristicsSection {
  avgDealSize?: string;                // "$10K-$50K", "$50K-$200K", etc.
  typicalSalesCycle?: string;          // "1-2 weeks", "1-3 months", "3-6 months", "6-12 months"
  salesMotion?: 'high_touch' | 'low_touch' | 'hybrid';
  highProbabilityIndustries?: string[];
  highProbabilityBuyerRoles?: string[];
  highProbabilityCompanyStages?: string[];
  competitors?: CompetitorEntry[];
}

export interface ExclusionsSection {
  excludedIndustries?: string[];
  excludedCompanySizes?: string[];
  excludedRegions?: string[];
  redFlags?: string[];                 // "no budget allocated", "already locked into competitor"
}

export interface SalesApproachSection {
  primaryChannels?: string[];          // "email", "cold_call", "linkedin", "inbound"
  bestMessaging?: string;              // what messaging works best
  commonObjections?: string[];         // objections you commonly face
  whatConvinces?: string;              // what typically convinces a customer to buy
  toneOfVoice?: string;               // "professional", "consultative", "friendly", "technical"
}

export interface DataSourcePreferencesSection {
  currentLeadSources?: string[];       // where they currently find leads
  trustedSources?: string[];           // "news", "linkedin", "job_boards", "industry_portals"
  monitoredWebsites?: string[];        // specific URLs to watch
  monitoredCompetitors?: string[];     // competitor names to track
}

export interface SuccessMetricsSection {
  goodLeadDefinition?: string;         // what defines a "good lead"
  expectedConversionRate?: string;     // "5%", "10-15%"
  volumeVsQuality?: 'volume' | 'quality' | 'balanced';
}

export interface BusinessProfile {
  id?: string;
  name: string;
  industry: string;
  products: string[];
  targetGroups: string[];
  geography: string[];
  website: string;
  isVerified?: boolean;
  // --- Advanced profile sections (all optional) ---
  icp?: ICPSection;
  problemSolutionFit?: ProblemSolutionFitSection;
  usp?: USPSection;
  dealCharacteristics?: DealCharacteristicsSection;
  exclusions?: ExclusionsSection;
  salesApproach?: SalesApproachSection;
  dataSources?: DataSourcePreferencesSection;
  successMetrics?: SuccessMetricsSection;
}

export interface SalesTrigger {
  id: string;
  product: string;
  event: string;
  source: string;
  logic: string;
  limitToSite?: string | string[]; // Support both single string (legacy) and array of strings
  scope?: 'global' | 'bundle' | 'single'; // New Bundle Logic
  bundleName?: string;
  targetProducts?: string[];
  searchMode?: 'web' | 'sites' | 'both'; // Default is 'both' if limitToSite exists, otherwise 'web'
  triggerType?: 'active' | 'ai_generated';
  status: 'Approved' | 'Rejected' | 'Pending';
}

export interface TrackedWebsite {
  id: string;
  url: string;
  purpose?: string;
  targetKeywords?: string;
  isActive: boolean;
  lastScannedAt?: string;
}


export interface SignalConfidence {
  freshness: number;
  proximity: number;
  intentStrength: number;
  buyerMatch: number;
  urgency: number;
  total: number;
}

// ============ SIGNAL QUALITY — LEAD CLASSIFICATION & RESEARCH HINTS ============

export type LeadType =
  | 'direct_company'      // A named private company that could be a buyer directly
  | 'government_tender'   // A government/public sector tender or RFP
  | 'project_winner'      // A contractor/company that won a project (indirect buyer)
  | 'market_trend';       // A market-level shift (goes to market trend dashboard, not leads)

export interface SignalEntity {
  name: string;
  type: 'company' | 'government' | 'person' | 'organization';
  role: 'seller' | 'buyer' | 'contractor' | 'client' | 'neutral';
}

// Structured hints that help the user act on indirect leads (tenders, project winners)
// when Apollo cannot resolve the company directly.
export interface ResearchHints {
  tenderPortalUrl?: string;        // Link to the original tender listing
  tenderId?: string;               // Reference ID from the portal
  agency?: string;                 // Issuing government body
  submissionDeadline?: string;     // ISO date or free-text deadline
  linkedinSearchUrl?: string;      // Pre-built LinkedIn search for decision makers
  googleContactSearch?: string;    // Pre-built Google search for contacts
  suggestedNextAction?: string;    // Human-readable next step for the sales rep
}

export interface MarketSignal {
  id: string;
  headline: string;
  summary: string;
  importance: string;
  matchedProducts: string[];
  decisionMaker: string;
  score: number;
  urgency: SignalUrgency;
  timestamp: string;
  sourceUrl: string;
  sourceTitle: string;
  region: string;
  confidenceDetails: SignalConfidence;
  status: LeadStatus;
  relevanceFeedback?: 'Positive' | 'Negative';
  trackedWebsiteId?: string;
  // --- Signal quality enrichment (all optional for legacy compat) ---
  leadType?: LeadType;
  entities?: SignalEntity[];
  researchHints?: ResearchHints;
  semanticFingerprint?: string;     // accountName + event + weekBucket hash for cross-run dedup
  relevanceScore?: number;          // 0-100 from the relevance scoring pass
  relevanceReasoning?: string;      // Why this signal was accepted/rejected by the scorer
}

export interface EnrichedContact {
  name: string;
  title: string;
  email: string | null;
  phone: string | null;
  linkedinUrl: string | null;
  isPrimary: boolean;
  confidence: number;
  source: 'apollo' | 'gemini';
}

export interface EnrichedCompany {
  name: string;
  domain: string;
  linkedinUrl: string | null;
  employeeCount: number | null;
  revenue: string | null;
  industry: string | null;
  source: 'apollo';
}

// ============ GLASS BOX AI — PROJECT INTELLIGENCE ============

export interface ScaleMetric {
  metric: string;           // "beds", "floors", "employees", "doors", "sq_meters"
  value: number;
  unit: string;             // "beds", "m²", "staff", "units"
  source: string;           // "Article states 20 new aged care beds"
  confidence: 'high' | 'medium' | 'low';
}

export interface ProjectIntelligence {
  industry: string;
  projectType: string;
  scaleMetrics: ScaleMetric[];
  timeline?: string;
  location?: string;
  totalBudget?: { value: number; currency: string; source: string };
  keyEntities: string[];    // Companies, organizations mentioned
  extractedAt: string;
}

// Per-line-item derivation explaining HOW quantity was calculated
export interface LineItemDerivation {
  formula: string;                   // "beds × handles_per_door"
  inputs: Record<string, {
    label: string;
    value: number;
    source: 'signal' | 'catalog' | 'industry_standard' | 'company_rule' | 'ai_inference';
  }>;
  result: number;                    // The computed quantity
  reasoning: string;                 // Human-readable: "20 beds × 1 entry door × 1 handle = 20"
  confidence: 'high' | 'medium' | 'low';
}

// Full audit trail for the entire estimation
export interface EstimationAuditTrail {
  projectIntelligence: ProjectIntelligence;
  bundleDerivation: Array<{
    sku: string;
    description: string;
    quantity: number;
    derivation: LineItemDerivation;
    unitPrice: AuditablePrice;
    lineTotal: number;
  }>;
  subtotal: number;
  discount: { percent: number; reasoning: string };
  estimatedValue: number;
  assumptions: Array<{ category: string; statement: string; confidence: 'high' | 'medium' | 'low' }>;
  sourceBreakdown: { catalogPercent: number; rateCardPercent: number; aiEstimatePercent: number };
  generatedAt: string;
}

export interface DealDossier {
  id: string;
  signalId: string;
  accountName: string;
  executiveSummary: string;
  commercialOpportunity: string;
  recommendedBundle: {
    sku: string;
    description: string;
    quantity: number;
    catalogItemId?: string;
    unitPrice?: number | AuditablePrice;
    lineTotal?: number;
    derivation?: LineItemDerivation;  // Glass Box: why this quantity
  }[];
  pricingStrategy: {
    logic: string;
    discount: number | AuditablePrice;
    estimatedValue: number | AuditablePrice;
    derivation?: 'catalog_sum' | 'ai_estimate' | 'hybrid';
  };
  battlecard: {
    competitorWeakness: string;
    ourEdge: string;
  };
  callScript: string;
  confidence: 'Low' | 'Medium' | 'High';
  assumptions: string[];
  targetWebsite?: string;
  targetLinkedin?: string;
  keyPersonName?: string;
  keyPersonLinkedin?: string;
  // Apollo enrichment fields
  enrichedContacts?: EnrichedContact[];
  enrichedCompany?: EnrichedCompany;
  isEnriched?: boolean;
  // Glass Box AI
  projectIntelligence?: ProjectIntelligence;
  auditTrail?: EstimationAuditTrail;
  // Cost estimation
  estimation?: CostEstimation;
}

// ============ PRODUCT CATALOG & RATE CARDS ============

export type PriceSource = 'catalog' | 'rate_card' | 'ai_estimate' | 'manual';

export interface AuditablePrice {
  value: number;
  source: PriceSource;
  confidence: number;             // 0-100: catalog=100, rate_card=95, ai_estimate=40-70, manual=100
  sourceDetail?: string;          // e.g. "SKU HNG-HD-001 @ $45/each" or "AI estimate via Google Search"
  overriddenFrom?: {
    value: number;
    source: PriceSource;
  };
  updatedBy?: string;
  updatedAt?: string;
}

export interface ProductCatalogItem {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  unitPrice: number;
  costBasis?: number;
  unit: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface RateCardEntry {
  id: string;
  category: 'labour' | 'equipment' | 'overhead' | 'subContractors' | 'materials';
  description: string;
  unit: string;
  defaultRate: number;
  region?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuditLogEntry {
  id: string;
  dossierId: string;
  fieldPath: string;
  previousValue: unknown;
  newValue: unknown;
  changedBy?: string;
  changedAt: string;
}

// ============ COST ESTIMATION ============

export interface CostLineItem {
  description: string;
  unit: string;            // 'm³', 'hrs', 'days', 'lump sum', '%', 'each', 'tonnes'
  quantity: number;
  unitRate: number | AuditablePrice;
  amount: number;          // quantity × unitRate (or unitRate.value)
  rateCardEntryId?: string;
  source: 'ai' | 'rate_card' | 'manual';
  isAdjusted: boolean;
}

export interface CostCategory {
  total: number;
  items: CostLineItem[];
  notes?: string;
}

export interface CostEstimation {
  id: string;
  dossierId: string;
  signalId: string;
  createdAt: string;
  updatedAt: string;
  estimationType: 'ai_generated' | 'template_based' | 'manual';
  confidence: 'low' | 'medium' | 'high';

  // The 5 cost categories
  materials: CostCategory;
  labour: CostCategory;
  subContractors: CostCategory;
  equipment: CostCategory;
  overhead: CostCategory;

  // Summary totals
  totalDirectCosts: number;    // materials + labour + sub + equipment
  totalIndirectCosts: number;  // overhead
  grandTotal: number;
  contingency: number;         // percentage (0-30)
  finalEstimate: number;       // grandTotal × (1 + contingency/100)

  // Metadata
  assumptions: string[];
  region: string;
  projectType: string;
  projectScale: string;
}
