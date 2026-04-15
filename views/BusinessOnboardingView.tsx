import React, { useState } from 'react';
import { Target, Package, Briefcase, ArrowRight } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { getVL } from '../utils/vesper';
import ProfileView from './ProfileView';
import CatalogView from './CatalogView';
import { BusinessProfile, ProductCatalogItem, RateCardEntry } from '../types';

interface BusinessOnboardingViewProps {
  // Profile Props
  profile: BusinessProfile | null;
  onSaveProfile: (profile: BusinessProfile) => Promise<void>;
  
  // Catalog Props
  catalog: ProductCatalogItem[];
  rateCards: RateCardEntry[];
  onAddCatalogItem: (item: any) => Promise<any>;
  onUpdateCatalogItem: (item: any) => Promise<any>;
  onRemoveCatalogItem: (id: string) => Promise<boolean>;
  onAddRateCardEntry: (entry: any) => Promise<any>;
  onUpdateRateCardEntry: (entry: any) => Promise<any>;
  onRemoveRateCardEntry: (id: string) => Promise<boolean>;
  
  // Navigation
  onProceedToSetup?: () => void;
}

type MainTab = 'questionnaire' | 'catalog';

const BusinessOnboardingView: React.FC<BusinessOnboardingViewProps> = ({
  profile, onSaveProfile,
  catalog, rateCards, onAddCatalogItem, onUpdateCatalogItem, onRemoveCatalogItem,
  onAddRateCardEntry, onUpdateRateCardEntry, onRemoveRateCardEntry,
  onProceedToSetup
}) => {
  const { isDarkMode } = useTheme();
  const vl = getVL(isDarkMode);
  
  const [activeTab, setActiveTab] = useState<MainTab>('questionnaire');

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 animate-in fade-in duration-500">
      {/* Unified Header */}
      <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-[6px] flex items-center justify-center p-2" style={{ background: vl.primarySoft, color: vl.primary }}>
                <Briefcase className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-semibold tracking-tight" style={{ fontFamily: "'Newsreader', Georgia, serif", color: vl.textMain }}>
                Business Onboarding
              </h1>
            </div>
            <p className="text-[13px] mt-1 ml-[52px]" style={{ color: vl.textBody }}>
              Configure your business identity and catalog to empower Leadpulse intelligence.
            </p>
          </div>
          
          {onProceedToSetup && (
            <button
              onClick={onProceedToSetup}
              className="flex items-center gap-2 px-6 py-2.5 text-[13px] font-bold transition-all rounded-[6px] shadow-sm ml-4"
              style={{ background: vl.primary, color: '#fff', border: 'none' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = vl.primaryHover; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = vl.primary; }}
            >
              Proceed to Trigger Setup
              <Target className="w-4 h-4 ml-1" />
            </button>
          )}
        </div>

        {/* Master Navigation Pills */}
        <div className="flex gap-1 p-1 rounded-[6px] w-fit border ml-[52px]" style={{ background: vl.surfaceMuted, borderColor: vl.border }}>
          <button
            onClick={() => setActiveTab('questionnaire')}
            className="flex items-center gap-2 px-6 py-2.5 text-[13px] font-bold transition-all rounded-[4px]"
            style={
              activeTab === 'questionnaire'
                ? { background: vl.surface, color: vl.primary, boxShadow: vl.shadow }
                : { color: vl.textMuted }
            }
          >
            <Target className="w-4 h-4" />
            Targeting Questionnaire
          </button>
          
          <button
            onClick={() => setActiveTab('catalog')}
            className="flex items-center gap-2 px-6 py-2.5 text-[13px] font-bold transition-all rounded-[4px]"
            style={
              activeTab === 'catalog'
                ? { background: vl.surface, color: vl.primary, boxShadow: vl.shadow }
                : { color: vl.textMuted }
            }
          >
            <Package className="w-4 h-4" />
            Product Catalog
          </button>
        </div>
      </div>

      <div className="pt-4 ml-[52px]">
        {/* Tab Content Routing */}
        {activeTab === 'questionnaire' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <ProfileView profile={profile} onSave={onSaveProfile} isEmbedded={true} />
          </div>
        )}

        {activeTab === 'catalog' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <CatalogView 
              catalog={catalog} 
              rateCards={rateCards}
              onAddCatalogItem={onAddCatalogItem}
              onUpdateCatalogItem={onUpdateCatalogItem}
              onRemoveCatalogItem={onRemoveCatalogItem}
              onAddRateCardEntry={onAddRateCardEntry}
              onUpdateRateCardEntry={onUpdateRateCardEntry}
              onRemoveRateCardEntry={onRemoveRateCardEntry}
              isEmbedded={true}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default BusinessOnboardingView;
