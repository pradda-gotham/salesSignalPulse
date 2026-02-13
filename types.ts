
export enum SignalUrgency {
  EMERGENCY = 'EMERGENCY',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW'
}

export type LeadStatus = 'New' | 'Contacted' | 'Followed-up' | 'Meeting Booked' | 'Archived';

export interface BusinessProfile {
  id?: string;
  name: string;
  industry: string;
  products: string[];
  targetGroups: string[];
  geography: string[];
  website: string;
  isVerified?: boolean;
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

export interface SignalConfidence {
  freshness: number;
  proximity: number;
  intentStrength: number;
  buyerMatch: number;
  urgency: number;
  total: number;
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
  }[];
  pricingStrategy: {
    logic: string;
    discount: number;
    estimatedValue: number;
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
  // Cost estimation
  estimation?: CostEstimation;
}

// ============ COST ESTIMATION ============

export interface CostLineItem {
  description: string;
  unit: string;            // 'm³', 'hrs', 'days', 'lump sum', '%', 'each', 'tonnes'
  quantity: number;
  unitRate: number;
  amount: number;          // quantity × unitRate
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
