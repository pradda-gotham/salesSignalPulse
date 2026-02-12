
import React, { useState } from 'react';
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
import { SalesTrigger, BusinessProfile, MarketSignal } from '../types';
import { useTheme } from '../contexts/ThemeContext';

interface StrategyViewProps {
  profile: BusinessProfile | null;
  triggers: SalesTrigger[];
  setTriggers: React.Dispatch<React.SetStateAction<SalesTrigger[]>>;
  signals: MarketSignal[];
  onGenerateSignals: () => void;
  isGenerating: boolean;
  onDeleteTrigger?: (triggerId: string) => Promise<boolean>;
  onActivateTrigger?: (triggerId: string) => Promise<boolean>;
}

type TabType = 'active' | 'ai_generated';

const StrategyView: React.FC<StrategyViewProps> = ({
  profile,
  triggers,
  setTriggers,
  signals,
  onGenerateSignals,
  isGenerating,
  onDeleteTrigger,
  onActivateTrigger
}) => {
  const { isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('active');

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
      label: 'Reliability',
      value: '98.2% Accurate',
      icon: CheckCircle2,
      color: 'text-accent-green',
      valueColor: 'text-emerald-500'
    },
    {
      label: 'Activity Level',
      value: 'High Frequency',
      icon: TrendingUp,
      color: 'text-accent-purple',
      valueColor: 'text-violet-500'
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
          <button className={`px-4 py-1.5 border rounded-md text-xs font-medium transition-all flex items-center gap-2 ${isDarkMode ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-50'}`}>
            <Plus className="w-3.5 h-3.5" />
            Custom Signal
          </button>
          <button className={`px-4 py-1.5 rounded-md text-xs font-medium hover:opacity-90 transition-all flex items-center gap-2 ${isDarkMode ? 'bg-slate-100 text-slate-900' : 'bg-slate-900 text-white'}`}>
            <Globe className="w-3.5 h-3.5" />
            Track Website
          </button>
        </div>
      </header>

      {/* Metrics Row */}
      <div className={`rounded-xl flex overflow-hidden ${isDarkMode ? 'bg-slate-900 border border-slate-800/60' : 'bg-white border border-slate-200/60'}`}>
        {metrics.map((m, i) => (
          <div key={i} className={`flex-1 flex items-center gap-3 px-6 py-4 ${i !== metrics.length - 1 ? (isDarkMode ? 'border-r border-slate-800/50' : 'border-r border-slate-100') : ''}`}>
            <m.icon className={`w-5 h-5 ${m.color === 'text-accent-green' ? 'text-emerald-500' : m.color === 'text-accent-purple' ? 'text-violet-500' : 'text-slate-400'}`} />
            <div>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider leading-none mb-1">{m.label}</p>
              <p className={`text-sm font-medium ${m.valueColor || (isDarkMode ? 'text-slate-200' : 'text-slate-900')}`}>{m.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <section className="space-y-4">
        {/* Table Header with Tabs */}
        <div className="flex items-center justify-between px-1">
          <h2 className={`text-sm font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Active Configurations</h2>
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
              AI Generated
              {aiGeneratedTriggers.length > 0 && (
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${activeTab === 'ai_generated' ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-500'}`}>
                  {aiGeneratedTriggers.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Table Container */}
        <div className={`rounded-xl overflow-hidden border ${isDarkMode ? 'bg-slate-900 border-slate-800/60' : 'bg-white border-slate-200/60'}`}>
          <table className="w-full text-left">
            <thead>
              <tr className={`border-b ${isDarkMode ? 'border-slate-800 bg-slate-800/30' : 'border-slate-100 bg-slate-50/50'}`}>
                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Trigger Event</th>
                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Logic & Intent</th>
                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</th>
                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Category</th>
                <th className="px-6 py-3 text-right"></th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
              {displayTriggers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      {activeTab === 'ai_generated' ? (
                        <>
                          <Sparkles className="w-8 h-8 text-slate-300" />
                          <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            No AI-generated triggers yet.
                          </p>
                          <p className="text-xs text-slate-400">
                            Run a <strong>Live Hunt</strong> calibration to generate intelligent triggers.
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
                          AI Suggested
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
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* Show Activate button only for AI Generated triggers */}
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
          <div className={`w-px h-4 ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
          <div className="flex items-center gap-4">
            <button className="text-[11px] font-bold text-slate-500 hover:text-indigo-500 transition-colors uppercase tracking-widest">Global Filter</button>
            <button
              onClick={onGenerateSignals}
              disabled={isGenerating || activeTriggers.length === 0}
              className={`text-white text-[11px] font-bold px-4 py-1.5 rounded-full hover:shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed ${isDarkMode ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-indigo-600 hover:bg-indigo-700'}`}
            >
              {isGenerating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Sync Signals
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};

export default StrategyView;
