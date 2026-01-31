
import React, { useState, useEffect } from 'react';
import { MarketSignal, BusinessProfile, SalesTrigger, DealDossier, LeadStatus } from './types';
import Layout from './components/Layout';
import SignalsView from './views/SignalsView';
import OpportunitiesView from './views/OpportunitiesView';
import StrategyView from './views/StrategyView';
import InsightsView from './views/InsightsView';
import OnboardingView from './views/OnboardingView';
import { geminiService } from './services/geminiService';
import { AlertTriangle, Key, ExternalLink, RefreshCw, Loader2 } from 'lucide-react';

declare global {
  var aistudio: {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  };
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('signals');
  const [selectedSignal, setSelectedSignal] = useState<MarketSignal | null>(null);
  const [selectedDossier, setSelectedDossier] = useState<DealDossier | null>(null);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [activeTriggers, setActiveTriggers] = useState<SalesTrigger[]>([]);
  const [signals, setSignals] = useState<MarketSignal[]>([]);
  const [isGeneratingDossier, setIsGeneratingDossier] = useState(false);
  const [isHunting, setIsHunting] = useState(false);
  const [isSearchingSignals, setIsSearchingSignals] = useState(false);
  const [dossierError, setDossierError] = useState<string | null>(null);
  const [showQuotaOverlay, setShowQuotaOverlay] = useState(false);
  const [activeHuntingRegion, setActiveHuntingRegion] = useState<string>('');

  // Cache for prefetched dossiers to enable instant view
  const [dossierCache, setDossierCache] = useState<Record<string, DealDossier>>({});
  const [fetchingDossierIds, setFetchingDossierIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (businessProfile && businessProfile.geography.length > 0 && !activeHuntingRegion) {
      setActiveHuntingRegion(businessProfile.geography[0]);
    }
  }, [businessProfile]);

  const handleError = (e: any) => {
    console.error("API Error", e);
    if (
      e.message?.includes('Requested entity was not found') ||
      e.message?.includes('quota') ||
      e.message?.includes('429')
    ) {
      setShowQuotaOverlay(true);
    }
  };

  const handleLogoClick = () => {
    setBusinessProfile(null);
    setSignals([]);
    setActiveTriggers([]);
    setSelectedSignal(null);
    setSelectedDossier(null);
    setDossierCache({});
    setActiveTab('signals');
    setIsHunting(false);
  };

  const prefetchDossier = async (signal: MarketSignal) => {
    if (dossierCache[signal.id] || fetchingDossierIds.has(signal.id) || !businessProfile) return;

    setFetchingDossierIds(prev => new Set(prev).add(signal.id));
    try {
      const dossier = await geminiService.generateDossier(signal, businessProfile);
      setDossierCache(prev => ({ ...prev, [signal.id]: dossier }));
    } catch (e) {
      console.warn(`Background prefetch failed for ${signal.id}`, e);
    } finally {
      setFetchingDossierIds(prev => {
        const next = new Set(prev);
        next.delete(signal.id);
        return next;
      });
    }
  };

  const handleViewDossier = async (signal: MarketSignal) => {
    setSelectedSignal(signal);
    setActiveTab('opportunities');
    setDossierError(null);

    // If already in cache, use it immediately
    if (dossierCache[signal.id]) {
      setSelectedDossier(dossierCache[signal.id]);
      setIsGeneratingDossier(false);
      return;
    }

    // Otherwise, start/wait for generation
    if (businessProfile) {
      setIsGeneratingDossier(true);
      try {
        const dossier = await geminiService.generateDossier(signal, businessProfile);
        setSelectedDossier(dossier);
        setDossierCache(prev => ({ ...prev, [signal.id]: dossier }));
      } catch (e) {
        handleError(e);
        setDossierError("The AI encountered an issue generating this dossier. This might be due to API rate limits.");
      } finally {
        setIsGeneratingDossier(false);
      }
    }
  };

  const handleUpdateStatus = (id: string, status: LeadStatus) => {
    setSignals(prev => prev.map(s => s.id === id ? { ...s, status } : s));
  };

  const handleUpdateFeedback = (id: string, feedback: 'Positive' | 'Negative') => {
    setSignals(prev => prev.map(s => s.id === id ? { ...s, relevanceFeedback: feedback } : s));
  };

  const handleBackToSignals = () => {
    setSelectedSignal(null);
    setSelectedDossier(null);
    setDossierError(null);
    setActiveTab('signals');
  };

  const handleProfileVerified = (profile: BusinessProfile) => {
    setBusinessProfile(profile);
    setActiveTab('strategy');
  };

  const handleStartHunting = () => {
    if (businessProfile && activeTriggers.length > 0) {
      setIsHunting(true);
      triggerHunting(businessProfile, activeTriggers, activeHuntingRegion);
      setActiveTab('signals');
    }
  };

  const handleTriggersUpdated = (triggers: SalesTrigger[]) => {
    setActiveTriggers(triggers);
  };

  const triggerHunting = async (profile: BusinessProfile, triggers: SalesTrigger[], region?: string) => {
    setIsSearchingSignals(true);
    try {
      const discovered = await geminiService.huntSignals(profile, triggers, region);
      setSignals(discovered);

      // BACKGROUND PREFETCH: Automatically start generating intelligence for the top ranked signals
      if (discovered.length > 0) {
        const topSignals = [...discovered].sort((a, b) => b.score - a.score).slice(0, 2);
        topSignals.forEach(s => prefetchDossier(s));
      }
    } catch (e) {
      handleError(e);
    } finally {
      setIsSearchingSignals(false);
    }
  };

  const handleOpenKeySelector = async () => {
    try {
      await window.aistudio.openSelectKey();
      setShowQuotaOverlay(false);
    } catch (e) {
      console.error("Key selection failed", e);
    }
  };


  const renderContent = () => {
    if (!businessProfile) {
      return (
        <div className="max-w-5xl mx-auto">
          <OnboardingView onVerified={handleProfileVerified} />
        </div>
      );
    }

    switch (activeTab) {
      case 'signals':
        return (
          <SignalsView
            signals={signals}
            profile={businessProfile}
            isHunting={isHunting}
            isSearching={isSearchingSignals}
            onUpdateStatus={handleUpdateStatus}
            onUpdateFeedback={handleUpdateFeedback}
            onViewDossier={handleViewDossier}
            activeRegion={activeHuntingRegion}
            onRegionChange={setActiveHuntingRegion}
          />
        );
      case 'opportunities':
        return (
          <OpportunitiesView
            signal={selectedSignal}
            dossier={selectedDossier}
            isLoading={isGeneratingDossier}
            error={dossierError}
            onRetry={() => selectedSignal && handleViewDossier(selectedSignal)}
            onBack={handleBackToSignals}
          />
        );
      case 'strategy':
        return (
          <StrategyView
            profile={businessProfile}
            onTriggersUpdated={handleTriggersUpdated}
            onStartHunting={handleStartHunting}
            activeRegion={activeHuntingRegion}
            onRegionChange={setActiveHuntingRegion}
          />
        );
      case 'insights':
        return <InsightsView profile={businessProfile} />;
      case 'settings':
        return (
          <div className="max-w-3xl mx-auto py-12 space-y-8 animate-in fade-in duration-500">
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">System Settings</h1>
            <div className="space-y-6">
              <section className="p-6 rounded-2xl bg-white dark:bg-[#141414] border border-zinc-200 dark:border-white/5 space-y-4">
                <h3 className="font-bold text-lg text-zinc-900 dark:text-white">Signal Delivery Cadence</h3>
                <div className="grid gap-3">
                  {['Real-Time', 'Daily Digest', 'Weekly Digest'].map(option => (
                    <label key={option} className="flex items-center justify-between p-4 rounded-xl border border-zinc-200 dark:border-white/5 hover:border-orange-500/30 cursor-pointer transition-all group">
                      <span className="font-medium text-zinc-600 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">{option}</span>
                      <input type="radio" name="freq" defaultChecked={option === 'Real-Time'} className="accent-orange-500 w-4 h-4" />
                    </label>
                  ))}
                </div>
              </section>
            </div>
          </div>
        );
      default:
        return (
          <SignalsView
            signals={signals}
            profile={businessProfile}
            isHunting={isHunting}
            isSearching={isSearchingSignals}
            onUpdateStatus={handleUpdateStatus}
            onUpdateFeedback={handleUpdateFeedback}
            onViewDossier={handleViewDossier}
            activeRegion={activeHuntingRegion}
            onRegionChange={setActiveHuntingRegion}
          />
        );
    }
  };

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab} onLogoClick={handleLogoClick}>
      {renderContent()}

      {/* Quota Recovery Overlay */}
      {showQuotaOverlay && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="max-w-md w-full bg-[#141414] border-2 border-orange-500/30 rounded-[2.5rem] p-10 text-center shadow-[0_0_100px_rgba(249,115,22,0.15)] space-y-8">
            <div className="w-20 h-20 bg-orange-600/10 rounded-3xl flex items-center justify-center mx-auto text-orange-500">
              <AlertTriangle className="w-10 h-10" />
            </div>
            <div className="space-y-4">
              <h2 className="text-3xl font-black text-white">API Issue</h2>
              <p className="text-zinc-400 text-lg leading-relaxed">
                We've encountered a service interruption. This typically happens when the shared quota is reached. Please link a billing-enabled API key to restore high-performance access.
              </p>
            </div>
            <div className="space-y-4">
              <button
                onClick={handleOpenKeySelector}
                className="w-full py-5 bg-orange-600 hover:bg-orange-50 text-white font-black rounded-2xl transition-all shadow-xl shadow-orange-500/20 flex items-center justify-center gap-3"
              >
                <Key className="w-5 h-5" /> Select Private API Key
              </button>
              <a
                href="https://ai.google.dev/gemini-api/docs/billing"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 text-sm text-zinc-500 hover:text-orange-400 transition-colors"
              >
                Learn about billing <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={() => setShowQuotaOverlay(false)}
                className="text-zinc-600 hover:text-white text-xs font-bold uppercase tracking-widest pt-4"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
