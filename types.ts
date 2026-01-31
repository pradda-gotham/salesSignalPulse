
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
  searchMode?: 'web' | 'sites' | 'both'; // Default is 'both' if limitToSite exists, otherwise 'web'
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
}
