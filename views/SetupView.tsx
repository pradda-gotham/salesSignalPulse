
import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  CheckCircle2,
  Building2,
  Target,
  Activity,
  Box,
  Globe,
  RefreshCw,
  Search,
  Filter,
  Monitor,
  LayoutGrid,
  Zap,
  TrendingUp,
  ArrowRight,
  Sparkles,
  MoreHorizontal
} from 'lucide-react';
import { SalesTrigger, BusinessProfile, MarketSignal, TrackedWebsite } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { geminiService } from '../services/geminiService';
import { CustomTriggerModal } from '../components/CustomTriggerModal';
import { TrackWebsiteModal } from '../components/TrackWebsiteModal';

interface SetupViewProps {
  profile: BusinessProfile | null;
  triggers: SalesTrigger[];
  trackedWebsites?: TrackedWebsite[];
  setTriggers: React.Dispatch<React.SetStateAction<SalesTrigger[]>>;
  signals: MarketSignal[];
  onGenerateSignals: () => void;
  isGenerating: boolean;
  onDeleteTrigger?: (triggerId: string) => Promise<boolean>;
  onActivateTrigger?: (triggerId: string) => Promise<boolean>;
  onAddTrackedWebsite?: (website: { url: string; purpose?: string; target_keywords?: string }) => Promise<TrackedWebsite | null>;
  onRemoveTrackedWebsite?: (id: string) => Promise<boolean>;
  onScanWebsite?: (site: TrackedWebsite) => Promise<void>;
  marketActivity?: { level: string, summary: string, colorClass: string } | null;
  isAssessing?: boolean;
}

type TabType = 'active' | 'ai_generated' | 'tracked_sites';

const SetupView: React.FC<SetupViewProps> = ({
  profile,
  triggers,
  trackedWebsites = [],
  setTriggers,
  signals,
  onGenerateSignals,
  isGenerating,
  onDeleteTrigger,
  onActivateTrigger,
  onAddTrackedWebsite,
  onRemoveTrackedWebsite,
  onScanWebsite,
  marketActivity,
  isAssessing
}) => {
  const { isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('active');
  const [showCustomTriggerModal, setShowCustomTriggerModal] = useState(false);
  const [showTrackWebsiteModal, setShowTrackWebsiteModal] = useState(false);
  const [scanningSiteId, setScanningSiteId] = useState<string | null>(null);

  // NOTE: Default presets are created in App.tsx during onboarding.
  // Do NOT create them here — it caused duplication on every mount/remount.

  // Filter triggers by tab
  const activeTriggers = triggers.filter(t => !t.triggerType || t.triggerType === 'active');
  const aiGeneratedTriggers = triggers.filter(t => t.triggerType === 'ai_generated');
  const displayTriggers = activeTab === 'active' ? activeTriggers : aiGeneratedTriggers;

  const handleDelete = async (id: string) => {
    if (onDeleteTrigger) {
      await onDeleteTrigger(id);
    } else {
      setTriggers(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleActivate = async (id: string) => {
    if (onActivateTrigger) {
      await onActivateTrigger(id);
    }
  };

  // Metric Data
  const metrics = [
    {
      label: 'Base Profile',
      value: profile?.name || 'Not Set',
      icon: Building2,
      color: 'text-slate-400'
    },
    {
      label: 'Active Products',
      value: `${profile?.products?.length || 0} Active SKUs`,
      icon: Box,
      color: 'text-slate-400'
    },
    {
      label: 'Targeting',
      value: `${profile?.targetGroups?.length || 0} Priority Segments`,
      icon: Target,
      color: 'text-slate-400'
    },

    {
      label: 'Activity Level',
      value: isAssessing ? 'Polling Trend...' : (marketActivity?.level || 'Assessing...'),
      icon: isAssessing ? RefreshCw : (marketActivity ? Activity : TrendingUp),
      color: 'text-accent-purple',
      valueColor: isAssessing ? 'text-slate-400' : (marketActivity?.colorClass || 'text-violet-500'),
      summary: marketActivity?.summary,
      isSpinning: isAssessing
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500 pb-32">

      {/* Header Section */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className={`text-xl font-semibold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            Signal Engine Setup
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-normal">
            Configure and refine automated market intelligence triggers.
          </p>
        </div>
        <div className="flex items-center gap-3">

          <button 
            onClick={() => setShowTrackWebsiteModal(true)}
            className={`px-4 py-1.5 rounded-md text-xs font-medium hover:opacity-90 transition-all flex items-center gap-2 ${isDarkMode ? 'bg-slate-100 text-slate-900' : 'bg-slate-900 text-white'}`}>
            <Globe className="w-3.5 h-3.5" />
            Track Website
          </button>
        </div>
      </header>

      {/* Metrics Row */}
      <div className={`rounded-xl flex ${isDarkMode ? 'bg-slate-900 border border-slate-800/60' : 'bg-white border border-slate-200/60'}`}>
        {metrics.map((m, i) => (
          <div key={i} className={`flex-1 flex items-center gap-3 px-6 py-4 relative group ${i !== metrics.length - 1 ? (isDarkMode ? 'border-r border-slate-800/50' : 'border-r border-slate-100') : ''}`}>
            <m.icon className={`w-5 h-5 ${m.isSpinning ? 'animate-spin' : ''} ${m.color === 'text-accent-green' ? 'text-emerald-500' : m.color === 'text-accent-purple' ? 'text-violet-500' : 'text-slate-400'}`} />
            <div>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider leading-none mb-1">{m.label}</p>
              <p className={`text-sm font-medium ${m.valueColor || (isDarkMode ? 'text-slate-200' : 'text-slate-900')}`}>{m.value}</p>
            </div>
            {m.summary && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-8 opacity-0 group-hover:opacity-100 group-hover:translate-y-4 transition-all z-20 pointer-events-none w-56 p-2 text-xs rounded shadow-lg bg-slate-800 text-white border border-slate-700 text-center leading-relaxed">
                {m.summary}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <section className="space-y-4">
        {/* Table Header with Tabs */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-4">
            <h2 className={`text-sm font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Active Configurations</h2>
            <button
              onClick={() => setShowCustomTriggerModal(true)}
              className={`px-3 py-1 rounded border text-xs font-medium flex items-center gap-1.5 transition-all ${isDarkMode ? 'bg-[#141414] border-white/10 text-white hover:border-[#6C5DD3]/50 hover:text-[#6C5DD3]' : 'bg-white border-slate-200 text-[#1B1D21] hover:border-[#6C5DD3]/50 hover:text-[#6C5DD3]'}`}
            >
              <Plus className="w-3.5 h-3.5" /> Create Trigger
            </button>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('active')}
              className={`text-xs font-medium pb-1 transition-colors ${activeTab === 'active' ? 'text-indigo-500 border-b-2 border-indigo-500' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Active Triggers
              {activeTriggers.length > 0 && (
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${activeTab === 'active' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                  {activeTriggers.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('ai_generated')}
              className={`text-xs font-medium pb-1 transition-colors flex items-center gap-1 ${activeTab === 'ai_generated' ? 'text-indigo-500 border-b-2 border-indigo-500' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Sparkles className="w-3 h-3" />
              Leadpulse Generated
              {aiGeneratedTriggers.length > 0 && (
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${activeTab === 'ai_generated' ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-500'}`}>
                  {aiGeneratedTriggers.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('tracked_sites')}
              className={`text-xs font-medium pb-1 transition-colors flex items-center gap-1 ${activeTab === 'tracked_sites' ? 'text-indigo-500 border-b-2 border-indigo-500' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Globe className="w-3 h-3" />
              Tracked Sites
              {trackedWebsites.length > 0 && (
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${activeTab === 'tracked_sites' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                  {trackedWebsites.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Table Container */}
        <div className={`rounded-xl overflow-hidden border ${isDarkMode ? 'bg-slate-900 border-slate-800/60' : 'bg-white border-slate-200/60'}`}>
          <table className="w-full text-left">
            <thead>
              {activeTab === 'tracked_sites' ? (
                <tr className={`border-b ${isDarkMode ? 'border-slate-800 bg-slate-800/30' : 'border-slate-100 bg-slate-50/50'}`}>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Website URL</th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Tracking Purpose & Keywords</th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Last Scanned</th>
                  <th className="px-6 py-3 text-right"></th>
                </tr>
              ) : (
                <tr className={`border-b ${isDarkMode ? 'border-slate-800 bg-slate-800/30' : 'border-slate-100 bg-slate-50/50'}`}>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Trigger Event</th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Logic & Intent</th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Category</th>
                  <th className="px-6 py-3 text-right"></th>
                </tr>
              )}
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
              {activeTab === 'tracked_sites' ? (
                trackedWebsites.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Globe className="w-8 h-8 text-slate-300" />
                        <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          No websites are currently being tracked.
                        </p>
                        <button
                          onClick={() => setShowTrackWebsiteModal(true)}
                          className="mt-2 text-xs font-semibold text-indigo-500 hover:text-indigo-600"
                        >
                          + Track a Website
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  trackedWebsites.map((site) => (
                    <tr key={site.id} className={`group transition-colors ${isDarkMode ? 'hover:bg-slate-800/20' : 'hover:bg-slate-50/50'}`}>
                      <td className="px-6 py-5 align-top">
                        <p className={`text-sm font-semibold max-w-xs truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{site.url}</p>
                      </td>
                      <td className="px-6 py-5 align-top">
                        {site.purpose && <p className={`text-xs font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{site.purpose}</p>}
                        <p className={`text-xs max-w-xs italic leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>"{site.targetKeywords || 'Any interesting signals'}"</p>
                      </td>
                      <td className="px-6 py-5 align-top">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase border bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                          Active
                        </span>
                      </td>
                      <td className="px-6 py-5 align-top">
                        <span className={`text-xs px-2 py-1 rounded inline-flex items-center gap-1.5 ${isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
                          <Monitor className="w-3 h-3" /> {site.lastScannedAt ? new Date(site.lastScannedAt).toLocaleDateString() : 'Never'}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right align-top">
                        <div className="flex items-center justify-end gap-2 transition-opacity">
                          <button
                            onClick={async () => {
                              if (onScanWebsite) {
                                setScanningSiteId(site.id);
                                await onScanWebsite(site);
                                setScanningSiteId(null);
                              }
                            }}
                            disabled={scanningSiteId !== null}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold transition-all ${
                              scanningSiteId === site.id
                                ? 'bg-indigo-500/20 text-indigo-400 cursor-not-allowed'
                                : 'bg-indigo-500 text-white hover:bg-indigo-600'
                            }`}
                          >
                            {scanningSiteId === site.id ? (
                              <>
                                <RefreshCw className="w-3 h-3 animate-spin" />
                                Scanning...
                              </>
                            ) : (
                              <>
                                <Zap className="w-3 h-3 fill-current" />
                                Scan Now
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => onRemoveTrackedWebsite && onRemoveTrackedWebsite(site.id)}
                            className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )
              ) : displayTriggers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      {activeTab === 'ai_generated' ? (
                        <>
                          <Sparkles className="w-8 h-8 text-slate-300" />
                          <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            No Leadpulse-generated triggers yet.
                          </p>
                          <p className="text-xs text-slate-400">
                            Run a <strong>Live Hunt</strong> calibration to generate intelligent Leadpulse triggers.
                          </p>
                        </>
                      ) : (
                        <>
                          <Target className="w-8 h-8 text-slate-300" />
                          <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            No active triggers configured.
                          </p>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                displayTriggers.map((t) => (
                  <tr key={t.id} className={`group transition-colors ${isDarkMode ? 'hover:bg-slate-800/20' : 'hover:bg-slate-50/50'}`}>
                    <td className="px-6 py-5 align-top">
                      <p className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{t.event}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{t.source}</p>
                    </td>
                    <td className="px-6 py-5 align-top">
                      <p className={`text-xs max-w-xs italic leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>"{t.logic}"</p>
                    </td>
                    <td className="px-6 py-5 align-top">
                      {t.triggerType === 'ai_generated' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase border bg-purple-500/10 text-purple-500 border-purple-500/20">
                          Leadpulse Suggested
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase border bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                          Verified
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-5 align-top">
                      {t.scope === 'global' ? (
                        <span className={`text-xs px-2 py-1 rounded inline-flex items-center gap-1.5 ${isDarkMode ? 'bg-blue-500/10 text-blue-400' : 'bg-slate-100 text-slate-600'}`}>
                          <Globe className="w-3 h-3" /> All Products
                        </span>
                      ) : t.scope === 'bundle' ? (
                        <span className={`text-xs px-2 py-1 rounded inline-flex items-center gap-1.5 ${isDarkMode ? 'bg-purple-500/10 text-purple-400' : 'bg-slate-100 text-slate-600'}`}>
                          <RefreshCw className="w-3 h-3" /> {t.bundleName}
                        </span>
                      ) : (
                        <span className={`text-xs px-2 py-1 rounded inline-flex items-center gap-1.5 ${isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
                          {t.product}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-5 text-right align-top">
                      <div className="flex items-center justify-end gap-2 transition-opacity">
                        {/* Show Activate button only for Leadpulse Generated triggers */}
                        {t.triggerType === 'ai_generated' && onActivateTrigger && (
                          <button
                            onClick={() => handleActivate(t.id)}
                            className="px-3 py-1 bg-indigo-500 text-white rounded text-[10px] font-semibold transition-all hover:bg-indigo-600 flex items-center gap-1"
                          >
                            <ArrowRight className="w-3 h-3" />
                            Activate
                          </button>
                        )}
                        {activeTab === 'active' && (
                          <button className={`px-3 py-1 border rounded text-[10px] font-medium transition-all ${isDarkMode ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-50'}`}>
                            Verify
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Floating Bottom Bar */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-8 duration-700">
        <div className={`backdrop-blur-md border shadow-lg rounded-full px-6 py-3 flex items-center gap-6 ${isDarkMode ? 'bg-slate-900/80 border-slate-800/60' : 'bg-white/80 border-slate-200/60'}`}>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <p className={`text-[11px] font-semibold uppercase tracking-tighter ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              {activeTriggers.length} Active Trigger{activeTriggers.length !== 1 ? 's' : ''}
            </p>
          </div>
          
          <div className={`w-px h-6 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`}></div>
          
          <button
            onClick={onGenerateSignals}
            disabled={isGenerating || activeTriggers.length === 0}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#6C5DD3] focus:ring-offset-2 ${
              isGenerating || activeTriggers.length === 0
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-500'
                : 'bg-gradient-to-r from-[#6C5DD3] to-[#5b4eb3] text-white hover:shadow-md hover:-translate-y-0.5 hover:from-[#7c6deb] hover:to-[#6C5DD3]'
            }`}
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Initializing Hunt...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 fill-current" />
                Trigger Live Hunt
              </>
            )}
          </button>
        </div>
      </div>

      {/* Custom Trigger Modal */}
      {showCustomTriggerModal && (
        <CustomTriggerModal
          onClose={() => setShowCustomTriggerModal(false)}
          onAdd={(newTrigger) => {
            setTriggers(prev => [...prev, newTrigger]);
            setActiveTab('active');
          }}
        />
      )}

      {/* Track Website Modal */}
      {showTrackWebsiteModal && (
        <TrackWebsiteModal
          onClose={() => setShowTrackWebsiteModal(false)}
          onAdd={async (newSite) => {
            if (onAddTrackedWebsite) {
              await onAddTrackedWebsite(newSite);
            }
            setActiveTab('tracked_sites');
          }}
        />
      )}

    </div>
  );
};

export default SetupView;
