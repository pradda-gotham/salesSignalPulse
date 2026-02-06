
import React, { useState, useEffect } from 'react';
import { MarketSignal, BusinessProfile, SalesTrigger, DealDossier, LeadStatus } from './types';
import Layout from './components/Layout';
import SignalsView from './views/SignalsView';
import OpportunitiesView from './views/OpportunitiesView';
import StrategyView from './views/StrategyView';
import InsightsView from './views/InsightsView';
import OnboardingView from './views/OnboardingView';
import { LoginView } from './views/LoginView';
import { AuthCallback } from './views/AuthCallback';
import { SetupOrgView } from './views/SetupOrgView';
import AuthTestPage from './views/AuthTestPage';
import AdhocHuntView from './views/AdhocHuntView';
import SettingsView, { getSettings } from './views/SettingsView';
import { emailService } from './services/emailService';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useOrgData } from './hooks/useOrgData';
import { geminiService } from './services/geminiService';
import { dataService } from './services/dataService';
import { AlertTriangle, Key, ExternalLink, LogOut, Loader2 } from 'lucide-react';

// Set to true to use the simplified auth test page
const AUTH_TEST_MODE = false;

declare global {
  var aistudio: {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  };
}


// Main App wrapped with AuthProvider
const App: React.FC = () => {
  return (
    <AuthProvider>
      {AUTH_TEST_MODE ? <AuthTestPage /> : <AppContent />}
    </AuthProvider>
  );
};

// Inner component that uses auth context
const AppContent: React.FC = () => {
  const { user, userProfile, organization, loading, signOut } = useAuth();

  // Use org data hook for Supabase persistence
  const {
    triggers: dbTriggers,
    signals: dbSignals,
    addTrigger,
    saveSignal,
    updateSignalStatus,
    createHuntLog,
    completeHuntLog,
    saveDossier: saveDossierToDb,
    loadBusinessProfile,
    saveBusinessProfile,
    loading: orgDataLoading
  } = useOrgData();

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
  const [isLoadingProfile, setIsLoadingProfile] = useState(true); // Prevent flash

  // Adhoc/Live Hunt session state
  const [isAdhocSession, setIsAdhocSession] = useState(false);
  const [adhocProfile, setAdhocProfile] = useState<BusinessProfile | null>(null);
  const [adhocTriggers, setAdhocTriggers] = useState<SalesTrigger[]>([]);

  // Route handling for auth callback
  const [currentRoute, setCurrentRoute] = useState(window.location.pathname);

  useEffect(() => {
    const handleRouteChange = () => setCurrentRoute(window.location.pathname);
    window.addEventListener('popstate', handleRouteChange);
    return () => window.removeEventListener('popstate', handleRouteChange);
  }, []);

  // Cache for prefetched dossiers
  const [dossierCache, setDossierCache] = useState<Record<string, DealDossier>>({});
  const [fetchingDossierIds, setFetchingDossierIds] = useState<Set<string>>(new Set());

  // Map local signal IDs to database UUIDs
  const [signalIdMap, setSignalIdMap] = useState<Record<string, string>>({});

  useEffect(() => {
    if (businessProfile && businessProfile.geography.length > 0 && !activeHuntingRegion) {
      setActiveHuntingRegion(businessProfile.geography[0]);
    }
  }, [businessProfile]);

  // Sync DB data to local state
  useEffect(() => {
    if (dbTriggers.length > 0) {
      console.log('[APP] Syncing triggers from DB:', dbTriggers.length);
      setActiveTriggers(dbTriggers);
    }
    if (dbSignals.length > 0) {
      console.log('[APP] Syncing signals from DB:', dbSignals.length);
      setSignals(dbSignals);
    }
  }, [dbTriggers, dbSignals]);

  // Load business profile from Supabase when organization is available
  useEffect(() => {
    const loadProfile = async () => {
      // Only load if we have organization
      if (!organization?.id) {
        console.log('[APP] No organization ID yet, skipping profile load');
        setIsLoadingProfile(false);
        return;
      }

      if (businessProfile) {
        console.log('[APP] Business profile already loaded, skipping');
        setIsLoadingProfile(false);
        return;
      }

      try {
        console.log('[APP] Loading business profile for org:', organization.id);
        const savedProfile = await loadBusinessProfile();
        console.log('[APP] loadBusinessProfile returned:', savedProfile);

        if (savedProfile) {
          console.log('[APP] Setting business profile from Supabase');
          setBusinessProfile(savedProfile as unknown as BusinessProfile);
        } else {
          console.log('[APP] No business profile found in Supabase for org:', organization.id);
        }
      } finally {
        setIsLoadingProfile(false);
      }
    };
    loadProfile();
  }, [organization?.id]);

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

    let dossierToShow: DealDossier | null = null;

    // 1. Check local cache first
    if (dossierCache[signal.id]) {
      dossierToShow = dossierCache[signal.id];
      setSelectedDossier(dossierToShow);
      setIsGeneratingDossier(false);
    } else if (businessProfile) {
      // 2. Resolve Database Signal ID (Use map or fallback to signal.id for historical signals)
      const dbSignalId = signalIdMap[signal.id] || signal.id;

      setIsGeneratingDossier(true);
      try {
        // 3. Check Supabase for existing dossier
        console.log('[APP] Checking DB for dossier:', dbSignalId);
        const existingDossier = await dataService.getDossier(dbSignalId);

        if (existingDossier) {
          console.log('[APP] Found existing dossier in DB');
          // Cast the JSON content to DealDossier type
          dossierToShow = existingDossier.content as unknown as DealDossier;
          setSelectedDossier(dossierToShow);
          setDossierCache(prev => ({ ...prev, [signal.id]: dossierToShow! }));
        } else {
          // 4. If not found, generate new dossier
          console.log('[APP] No dossier found, generating new one...');
          dossierToShow = await geminiService.generateDossier(signal, businessProfile);
          setSelectedDossier(dossierToShow);
          setDossierCache(prev => ({ ...prev, [signal.id]: dossierToShow! }));

          // 5. Save new dossier to Supabase
          if (dbSignalId) {
            await saveDossierToDb(dbSignalId, dossierToShow as unknown as Record<string, unknown>);
            console.log("[APP] Dossier saved to Supabase for signal:", dbSignalId);
          } else {
            console.warn("[APP] No database UUID found for signal:", signal.id);
          }
        }

      } catch (e) {
        handleError(e);
        setDossierError("The AI encountered an issue generating this dossier. This might be due to API rate limits.");
      } finally {
        setIsGeneratingDossier(false);
      }
    }

    // 6. Send Email Notification - NOW triggers on EVERY dossier view (not just new generation)
    if (dossierToShow) {
      const settings = getSettings(userProfile); // Cloud-first settings
      console.log('[APP] Email settings:', { autoSend: settings.autoSendDossier, recipients: settings.emailRecipients });

      if (settings.autoSendDossier) {
        const recipients = settings.emailRecipients.split(',').map(e => e.trim()).filter(Boolean);
        if (recipients.length > 0) {
          console.log('[APP] Sending dossier email to:', recipients);
          emailService.sendDossierEmail({
            dossier: dossierToShow,
            recipients
          }); // Fire and forget
        } else {
          console.log('[APP] No email recipients configured');
        }
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

  const handleProfileVerified = async (profile: BusinessProfile) => {
    setBusinessProfile(profile);
    setActiveTab('strategy');

    // Save profile to Supabase
    const saved = await saveBusinessProfile(profile as unknown as Record<string, unknown>);
    if (saved) {
      console.log('[APP] Business profile saved to Supabase');
    } else {
      console.warn('[APP] Failed to save business profile to Supabase');
    }
  };

  const handleStartHunting = () => {
    // Check if we're in adhoc session mode
    if (isAdhocSession && adhocProfile && adhocTriggers.length > 0) {
      setIsHunting(true);
      triggerHunting(adhocProfile, adhocTriggers, activeHuntingRegion);
      setActiveTab('signals');
      // Reset adhoc session after starting hunt
      setIsAdhocSession(false);
      setAdhocProfile(null);
      setAdhocTriggers([]);
      return;
    }

    // Normal flow
    if (businessProfile && activeTriggers.length > 0) {
      setIsHunting(true);
      triggerHunting(businessProfile, activeTriggers, activeHuntingRegion);
      setActiveTab('signals');
    }
  };

  const handleTriggersUpdated = async (triggers: SalesTrigger[]) => {
    // Find new triggers that don't exist in current state
    const existingIds = new Set(activeTriggers.map(t => t.id));
    const newTriggers = triggers.filter(t => !existingIds.has(t.id));

    // Save new triggers to Supabase
    if (newTriggers.length > 0) {
      console.log('[APP] Saving', newTriggers.length, 'new triggers to Supabase...');
      for (const trigger of newTriggers) {
        await addTrigger({
          product: trigger.product,
          event: trigger.event,
          source: trigger.source,
          logic: trigger.logic
        });
      }
      console.log('[APP] Triggers saved to Supabase');
    }

    setActiveTriggers(triggers);
  };

  const triggerHunting = async (profile: BusinessProfile, triggers: SalesTrigger[], region?: string) => {
    console.log("[APP] Triggering Hunt with:", { profile, triggers, region });
    setIsSearchingSignals(true);

    // Create hunt log
    const huntId = await createHuntLog();
    console.log("[APP] Hunt log created:", huntId);

    try {
      const discovered = await geminiService.huntSignals(profile, triggers, region);
      setSignals(discovered);

      // Save discovered signals to Supabase and track database IDs
      console.log("[APP] Saving", discovered.length, "signals to Supabase...");
      const newIdMap: Record<string, string> = {};
      for (const signal of discovered) {
        const savedSignal = await saveSignal(signal);
        if (savedSignal) {
          // Map local signal ID to database UUID
          newIdMap[signal.id] = savedSignal.id;
        }
      }
      setSignalIdMap(prev => ({ ...prev, ...newIdMap }));
      console.log("[APP] Signals saved to Supabase, ID map:", newIdMap);

      // Complete hunt log with success
      if (huntId) {
        await completeHuntLog(huntId, discovered.length, 'success');
        console.log("[APP] Hunt log completed successfully");
      }

      if (discovered.length > 0) {
        const topSignals = [...discovered].sort((a, b) => b.score - a.score).slice(0, 2);
        topSignals.forEach(s => prefetchDossier(s));
      }
    } catch (e) {
      // Complete hunt log with error
      if (huntId) {
        await completeHuntLog(huntId, 0, 'failed', String(e));
        console.log("[APP] Hunt log completed with error");
      }
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

  const handleAuthComplete = () => {
    window.history.replaceState(null, '', '/');
    setCurrentRoute('/');
  };

  const handleSignOut = async () => {
    await signOut();
    setBusinessProfile(null);
    setSignals([]);
    setActiveTriggers([]);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-zinc-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Auth callback route
  if (currentRoute === '/auth/callback' || window.location.hash.includes('access_token')) {
    return <AuthCallback onComplete={handleAuthComplete} />;
  }

  // Not logged in - show login
  if (!user) {
    return <LoginView />;
  }

  // Logged in but no profile - show org setup
  if (!userProfile) {
    return <SetupOrgView onComplete={() => setCurrentRoute('/')} />;
  }

  // Logged in with profile - show main app
  const renderContent = () => {
    // Show loading while profile is being fetched
    if (isLoadingProfile) {
      return (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          <span className="ml-3 text-zinc-400">Loading your workspace...</span>
        </div>
      );
    }

    // Strategy and Settings are always accessible
    if (activeTab === 'strategy') {
      // Use adhoc profile if in adhoc session mode, otherwise use main profile
      const currentProfile = isAdhocSession ? adhocProfile : businessProfile;
      const currentTriggers = isAdhocSession ? adhocTriggers : activeTriggers;

      return (
        <StrategyView
          profile={currentProfile}
          onTriggersUpdated={isAdhocSession ? setAdhocTriggers : handleTriggersUpdated}
          onStartHunting={handleStartHunting}
          activeRegion={activeHuntingRegion}
          onRegionChange={setActiveHuntingRegion}
          initialTriggers={isAdhocSession ? adhocTriggers : undefined}
        />
      );
    }

    if (activeTab === 'settings') {
      return <SettingsView />;
    }

    // For other tabs, require business profile
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
      case 'insights':
        return <InsightsView profile={businessProfile} />;
      case 'live-hunt':
        return (
          <AdhocHuntView
            onCalibrationComplete={(profile, triggers) => {
              // Store adhoc session data
              setAdhocProfile(profile);
              setAdhocTriggers(triggers);
              setIsAdhocSession(true);
              // Set region from profile
              if (profile.geography.length > 0) {
                setActiveHuntingRegion(profile.geography[0]);
              }
              // Navigate to strategy for review
              setActiveTab('strategy');
            }}
          />
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
