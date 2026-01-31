
import React from 'react';
import { 
  SignalUrgency, 
  BusinessProfile, 
  MarketSignal, 
  SalesTrigger, 
  DealDossier 
} from './types';

export const MOCK_BUSINESS_PROFILE: BusinessProfile = {
  name: "Titan Heavy Rentals",
  industry: "Heavy Equipment Rental",
  products: ["Excavators", "Dump Trucks", "Site Equipment"],
  targetGroups: ["Construction", "Mining", "Government Projects"],
  geography: ["WA", "NT"],
  website: "https://titan-heavy.io"
};

export const MOCK_TRIGGERS: SalesTrigger[] = [
  {
    id: 't1',
    product: 'Excavators',
    event: 'Project Approval',
    source: 'Gov Planning',
    logic: 'Earthworks need detected',
    status: 'Approved'
  },
  {
    id: 't2',
    product: 'Dump Trucks',
    event: 'Mining License',
    source: 'Mining News',
    logic: 'Material movement requirement',
    status: 'Approved'
  },
  {
    id: 't3',
    product: 'Site Equipment',
    event: 'Storm Warning',
    source: 'Weather API',
    logic: 'Power outage & site safety risk',
    status: 'Approved'
  }
];

// Mock arrays are intentionally empty to force the app to rely on real-time search discovery
export const MOCK_SIGNALS: MarketSignal[] = [];

export const MOCK_DOSSIER: DealDossier | null = null;
