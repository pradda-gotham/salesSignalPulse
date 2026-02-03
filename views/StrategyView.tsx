
import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Briefcase,
  Target,
  Zap,
  Activity,
  MousePointer2,
  PlusCircle,
  Settings2,
  Terminal,
  Search,
  Package,
  MapPin,
  Radar,
  Rocket,
  Globe,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { SalesTrigger, BusinessProfile } from '../types';
import { useTheme } from '../contexts/ThemeContext';

interface StrategyViewProps {
  profile: BusinessProfile;
  onTriggersUpdated: (triggers: SalesTrigger[]) => void;
  onStartHunting: () => void;
  activeRegion: string;
  onRegionChange: (r: string) => void;
}

const StrategyView: React.FC<StrategyViewProps> = ({ profile, onTriggersUpdated, onStartHunting, activeRegion, onRegionChange }) => {
  const { isDarkMode } = useTheme();
  const [triggers, setTriggers] = useState<SalesTrigger[]>([]);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardType, setWizardType] = useState<'tender' | 'project' | null>(null);
  const [wizardWebsite, setWizardWebsite] = useState('');
  const [globalSearchMode, setGlobalSearchMode] = useState<'web' | 'sites' | 'both'>('web');
  const [customSignal, setCustomSignal] = useState({
    event: '',
    product: profile.products[0] || '',
    source: 'Web Scraping / Custom Feed',
    limitToSite: '',
    logic: ''
  });

  const loadMVPPresets = () => {
    const presets: SalesTrigger[] = [
      {
        id: `mvp-tender-${Date.now()}`,
        event: 'Contract Awarded',
        product: profile.products[0] || 'Core Product',
        source: 'Government Tenders / Industry News',
        logic: 'Winning bidder enters immediate procurement phase.',
        status: 'Approved'
      },
      {
        id: `mvp-project-${Date.now()}`,
        event: 'New Project Announcement',
        product: profile.products[0] || 'Core Product',
        source: 'Construction / Development News',
        logic: 'New facility requires immediate site setup and infrastructure.',
        status: 'Approved'
      }
    ];
    setTriggers(presets);
    onTriggersUpdated(presets);
  };

  // Auto-load MVP presets on mount
  useEffect(() => {
    if (triggers.length === 0) {
      loadMVPPresets();
    }
  }, []);

  const handleWizardNext = () => {
    if (wizardStep === 1 && wizardType) {
      setWizardStep(2);
    } else if (wizardStep === 2 && wizardWebsite.trim()) {
      const newTrigger: SalesTrigger = {
        id: `custom-${wizardType}-${Date.now()}`,
        event: wizardType === 'tender' ? 'Contract Awarded' : 'New Project Announcement',
        product: profile.products[0] || 'Core Product',
        source: wizardType === 'tender' ? 'Government Tenders' : 'Construction News',
        limitToSite: [wizardWebsite.trim()],
        logic: wizardType === 'tender'
          ? 'Winning bidder enters immediate procurement phase.'
          : 'New facility requires immediate site setup and infrastructure.',
        status: 'Approved'
      };
      const nextTriggers = [...triggers, newTrigger];
      setTriggers(nextTriggers);
      onTriggersUpdated(nextTriggers);
      setWizardStep(3);
    }
  };

  const handleWizardReset = () => {
    setWizardStep(1);
    setWizardType(null);
    setWizardWebsite('');
  };

  const handleWizardClose = () => {
    setShowWizard(false);
    handleWizardReset();
  };

  const updateTriggerStatus = (id: string, status: SalesTrigger['status']) => {
    const nextTriggers = triggers.map(t => t.id === id ? { ...t, status } : t);
    setTriggers(nextTriggers);
    onTriggersUpdated(nextTriggers);
  };

  const handleAddCustom = () => {
    if (!customSignal.event || !customSignal.logic) return;
    const newTrigger: SalesTrigger = {
      id: `custom-${Date.now()}`,
      ...customSignal,
      status: 'Approved'
    };
    const nextTriggers = [newTrigger, ...triggers];
    setTriggers(nextTriggers);
    onTriggersUpdated(nextTriggers);
    setCustomSignal({ event: '', product: profile.products[0] || '', source: 'Web Scraping / Custom Feed', limitToSite: '', logic: '' });
    setShowCustomForm(false);
  };

  const approvedCount = triggers.filter(t => t.status === 'Approved').length;

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700 pb-32">
      {/* Header Section */}
      <div className={`flex items-end justify-between border-b pb-10 ${isDarkMode ? 'border-white/5' : 'border-gray-200'}`}>
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-orange-600/20 text-orange-500' : 'bg-orange-100 text-orange-600'}`}>
              <Settings2 className="w-5 h-5" />
            </div>
            <span className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500">Configuration Hub</span>
          </div>
          <h1 className={`text-6xl font-black tracking-tight mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Signal Engine <span className="text-orange-500">Setup</span></h1>
          <p className={`text-xl font-medium ${isDarkMode ? 'text-zinc-400' : 'text-gray-500'}`}>Configure the market events that trigger sales opportunities.</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => setShowCustomForm(true)}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold border transition-all ${isDarkMode
              ? 'bg-white/5 hover:bg-white/10 text-white border-white/10'
              : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200 shadow-sm'
              }`}
          >
            <PlusCircle className="w-4 h-4" /> Add Custom Signal
          </button>
          <button
            onClick={() => setShowWizard(true)}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold border transition-all shadow-[0_0_15px_rgba(34,197,94,0.1)] hover:shadow-[0_0_25px_rgba(34,197,94,0.2)] ${isDarkMode
              ? 'bg-green-600/10 hover:bg-green-600/20 text-green-400 border-green-500/20'
              : 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200'
              }`}
          >
            <Globe className="w-4 h-4" />
            Add Known Website
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid md:grid-cols-4 gap-6">
        {[
          { label: 'Base Profile', val: profile.name, icon: Briefcase },
          { label: 'Products Linked', val: profile.products.length, icon: Package },
          { label: 'Target Segments', val: profile.targetGroups.length, icon: Target },
          { label: 'Active Configs', val: approvedCount, icon: Zap },
        ].map((stat, i) => (
          <div key={i} className={`p-6 rounded-3xl border flex items-center gap-4 group ${isDarkMode ? 'bg-[#141414] border-white/5' : 'bg-white border-gray-200 shadow-sm'
            }`}>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${isDarkMode
              ? 'bg-white/5 text-zinc-500 group-hover:text-orange-400'
              : 'bg-gray-100 text-gray-500 group-hover:text-orange-600'
              }`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{stat.label}</div>
              <div className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stat.val}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-8">
        {/* Website Wizard */}
        {showWizard && (
          <div className="p-12 rounded-[2.5rem] bg-green-600/10 border-2 border-green-500/30 animate-in slide-in-from-top-4 duration-500 shadow-2xl space-y-8 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <h3 className={`text-3xl font-black flex items-center gap-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                <Globe className="w-8 h-8 text-green-500" />
                Add Known Website - Step {wizardStep} of 3
              </h3>
              <button onClick={handleWizardClose} className="text-zinc-500 hover:text-green-500 transition-colors">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Step 1: Choose Type */}
            {wizardStep === 1 && (
              <div className="space-y-6">
                <p className={`text-lg ${isDarkMode ? 'text-zinc-300' : 'text-gray-600'}`}>Which type of opportunity do you want to track from this site?</p>
                <div className="grid md:grid-cols-2 gap-6">
                  <button
                    onClick={() => setWizardType('tender')}
                    className={`p-8 rounded-2xl border-2 transition-all ${wizardType === 'tender'
                      ? 'bg-green-500/20 border-green-500 shadow-lg shadow-green-500/20'
                      : isDarkMode
                        ? 'bg-white/5 border-white/10 hover:border-green-500/50'
                        : 'bg-white/50 border-white/40 hover:border-green-500/50' // Light mode styles adjusted for tinted bg context
                      }`}
                  >
                    <div className="text-left space-y-3">
                      <div className={`text-2xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>📋 Tender Awards</div>
                      <p className={isDarkMode ? 'text-zinc-400' : 'text-gray-600'}>Track contract awards and winning bids</p>
                    </div>
                  </button>
                  <button
                    onClick={() => setWizardType('project')}
                    className={`p-8 rounded-2xl border-2 transition-all ${wizardType === 'project'
                      ? 'bg-green-500/20 border-green-500 shadow-lg shadow-green-500/20'
                      : isDarkMode
                        ? 'bg-white/5 border-white/10 hover:border-green-500/50'
                        : 'bg-white/50 border-white/40 hover:border-green-500/50'
                      }`}
                  >
                    <div className="text-left space-y-3">
                      <div className={`text-2xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>🏗️ New Projects</div>
                      <p className={isDarkMode ? 'text-zinc-400' : 'text-gray-600'}>Track new project announcements and approvals</p>
                    </div>
                  </button>
                </div>
                <div className="flex justify-end pt-4">
                  <button
                    onClick={handleWizardNext}
                    disabled={!wizardType}
                    className="px-10 py-4 bg-green-600 hover:bg-green-500 text-white font-black rounded-2xl transition-all shadow-xl flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Enter Website */}
            {wizardStep === 2 && (
              <div className="space-y-6">
                <p className={`text-lg ${isDarkMode ? 'text-zinc-300' : 'text-gray-600'}`}>
                  Enter the website you check for {wizardType === 'tender' ? 'Tender Awards' : 'New Projects'}
                </p>
                <div className="space-y-3">
                  <label className="text-sm font-bold text-zinc-400">Website URL</label>
                  <input
                    type="text"
                    placeholder="e.g. tenders.nsw.gov.au"
                    className={`w-full border-2 rounded-2xl px-6 py-4 text-lg font-mono focus:outline-none focus:border-green-500 transition-all ${isDarkMode
                      ? 'bg-black/40 border-green-500/30 text-white'
                      : 'bg-white/60 border-green-500/20 text-gray-900'
                      }`}
                    value={wizardWebsite}
                    onChange={e => setWizardWebsite(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="flex justify-between pt-4">
                  <button
                    onClick={() => setWizardStep(1)}
                    className={`px-10 py-4 font-black rounded-2xl transition-all flex items-center gap-2 ${isDarkMode ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-white/50 hover:bg-white/80 text-gray-900'
                      }`}
                  >
                    <ArrowLeft className="w-5 h-5" /> Back
                  </button>
                  <button
                    onClick={handleWizardNext}
                    disabled={!wizardWebsite.trim()}
                    className="px-10 py-4 bg-green-600 hover:bg-green-500 text-white font-black rounded-2xl transition-all shadow-xl flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add Site <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Success */}
            {wizardStep === 3 && (
              <div className="space-y-6 text-center">
                <div className="text-6xl mb-4">✅</div>
                <p className={`text-3xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Site Added!</p>
                <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-black/40 border-green-500/30' : 'bg-white/60 border-green-500/20'
                  }`}>
                  <div className="text-blue-400 font-mono text-lg mb-2">📍 {wizardWebsite}</div>
                  <div className="text-zinc-400">Tracking: {wizardType === 'tender' ? 'Tender Awards' : 'New Projects'}</div>
                </div>
                <div className="flex gap-4 justify-center pt-4">
                  <button
                    onClick={() => {
                      setWizardStep(1);
                      setWizardType(null);
                      setWizardWebsite('');
                    }}
                    className={`px-10 py-4 font-black rounded-2xl transition-all ${isDarkMode ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-white/50 hover:bg-white/80 text-gray-900'
                      }`}
                  >
                    Add Another Site
                  </button>
                  <button
                    onClick={handleWizardClose}
                    className="px-10 py-4 bg-green-600 hover:bg-green-500 text-white font-black rounded-2xl transition-all shadow-xl"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Custom Form (kept for advanced users) */}
        {showCustomForm && (
          <div className="p-8 rounded-[2.5rem] bg-orange-600/10 border-2 border-orange-500/30 animate-in slide-in-from-top-4 duration-500 shadow-2xl space-y-6 custom-backdrop-blur">
            <div className="flex items-center justify-between">
              <h3 className={`text-2xl font-black flex items-center gap-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                <Terminal className="w-6 h-6 text-orange-500" />
                Define Custom Signal Parameter
              </h3>
              <button onClick={() => setShowCustomForm(false)} className="text-zinc-500 hover:text-orange-500 transition-colors">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Event Headline</label>
                <input
                  type="text"
                  placeholder="e.g. Regional Manager hired by Competitor"
                  className={`w-full border rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 transition-all ${isDarkMode
                    ? 'bg-black/40 border-white/5 text-white'
                    : 'bg-white/60 border-gray-200 text-gray-900'
                    }`}
                  value={customSignal.event}
                  onChange={e => setCustomSignal({ ...customSignal, event: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Relevant Product</label>
                <select
                  className={`w-full border rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 transition-all ${isDarkMode
                    ? 'bg-black/40 border-white/5 text-white'
                    : 'bg-white/60 border-gray-200 text-gray-900'
                    }`}
                  value={customSignal.product}
                  onChange={e => setCustomSignal({ ...customSignal, product: e.target.value })}
                >
                  {profile.products.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                  Target Specific Site <span className="bg-orange-500/20 text-orange-400 px-1.5 rounded text-[9px]">OPTIONAL</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. tenders.nsw.gov.au (Leave empty to search entire web)"
                  className={`w-full border rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 transition-all font-mono text-sm ${isDarkMode
                    ? 'bg-black/40 border-white/5 text-white placeholder:text-zinc-600'
                    : 'bg-white/60 border-gray-200 text-gray-900 placeholder:text-gray-400'
                    }`}
                  value={customSignal.limitToSite || ''}
                  onChange={e => setCustomSignal({ ...customSignal, limitToSite: e.target.value })}
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Intent Logic (Why this is a sale opportunity?)</label>
                <textarea
                  rows={2}
                  placeholder="Identify accounts currently using competitor solutions that might be open to replacement following personnel shift..."
                  className={`w-full border rounded-2xl px-4 py-3 focus:outline-none focus:border-orange-500 transition-all resize-none ${isDarkMode
                    ? 'bg-black/40 border-white/5 text-white'
                    : 'bg-white/60 border-gray-200 text-gray-900'
                    }`}
                  value={customSignal.logic}
                  onChange={e => setCustomSignal({ ...customSignal, logic: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={handleAddCustom}
                className="px-10 py-4 bg-orange-600 hover:bg-orange-500 text-white font-black rounded-2xl transition-all shadow-xl flex items-center gap-2"
              >
                <Plus className="w-5 h-5" /> Activate Signal Configuration
              </button>
            </div>
          </div>
        )}

        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <h2 className={`text-3xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Active Configurations</h2>
              <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${isDarkMode ? 'bg-white/5 text-zinc-500 border-white/5' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                {triggers.length} Parameters Total
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-zinc-600 uppercase tracking-wider">Search:</span>
              <div className={`inline-flex items-center rounded-lg p-0.5 border ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-gray-100 border-gray-200'}`}>
                <button
                  onClick={() => {
                    setGlobalSearchMode('web');
                    const nextTriggers = triggers.map(t => ({ ...t, searchMode: 'web' as const }));
                    setTriggers(nextTriggers);
                    onTriggersUpdated(nextTriggers);
                  }}
                  className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${globalSearchMode === 'web'
                    ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                    : 'text-zinc-500 hover:text-zinc-400'
                    }`}
                >
                  Web
                </button>
                <button
                  onClick={() => {
                    setGlobalSearchMode('sites');
                    const nextTriggers = triggers.map(t => ({ ...t, searchMode: 'sites' as const }));
                    setTriggers(nextTriggers);
                    onTriggersUpdated(nextTriggers);
                  }}
                  className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${globalSearchMode === 'sites'
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                    : 'text-zinc-500 hover:text-zinc-400'
                    }`}
                >
                  Sites
                </button>
                <button
                  onClick={() => {
                    setGlobalSearchMode('both');
                    const nextTriggers = triggers.map(t => ({ ...t, searchMode: 'both' as const }));
                    setTriggers(nextTriggers);
                    onTriggersUpdated(nextTriggers);
                  }}
                  className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${globalSearchMode === 'both'
                    ? 'bg-green-600/20 text-green-400 border border-green-500/30'
                    : 'text-zinc-500 hover:text-zinc-400'
                    }`}
                >
                  Both
                </button>
              </div>
            </div>
          </div>

          <div className={`rounded-[2.5rem] border overflow-hidden shadow-2xl transition-all duration-300 min-h-[400px] ${isDarkMode ? 'bg-[#0f0f0f] border-white/5' : 'bg-white border-gray-200'
            }`}>
            <table className="w-full text-left text-sm border-collapse">
              <thead className={`font-bold uppercase tracking-wider text-[10px] ${isDarkMode ? 'bg-white/5 text-zinc-500' : 'bg-gray-50 text-gray-500'
                }`}>
                <tr>
                  <th className="px-8 py-6">Configured Signal</th>
                  <th className="px-8 py-6">Logic & Intent</th>
                  <th className="px-8 py-6">Status</th>
                  <th className="px-8 py-6 text-right">Verification</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? 'divide-white/5' : 'divide-gray-100'}`}>
                {triggers.map((t) => (
                  <React.Fragment key={t.id}>
                    <tr className={`group transition-all duration-300 ${t.status === 'Rejected' ? 'opacity-30' : isDarkMode ? 'hover:bg-white/[0.03]' : 'hover:bg-gray-50'}`}>
                      <td className="px-8 py-6">
                        <div className={`font-black text-lg transition-colors mb-1 ${isDarkMode ? 'text-white group-hover:text-orange-400' : 'text-gray-900 group-hover:text-orange-600'
                          }`}>{t.event}</div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-black text-orange-500 uppercase tracking-tighter bg-orange-500/10 px-1.5 py-0.5 rounded">{t.product}</span>
                          <span className="text-[10px] text-zinc-500 flex items-center gap-1"><Search className="w-2.5 h-2.5" /> {t.source}</span>

                          {/* Website badges - only show if sites mode or both */}
                          {(globalSearchMode === 'sites' || globalSearchMode === 'both') && (() => {
                            const sites = Array.isArray(t.limitToSite) ? t.limitToSite : (t.limitToSite ? [t.limitToSite] : []);
                            return sites.filter(s => s.trim()).map((site, idx) => (
                              <span key={idx} className="text-[10px] text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded font-mono border border-blue-400/20">
                                🌐 {site}
                              </span>
                            ));
                          })()}
                        </div>
                      </td>
                      <td className={`px-8 py-6 max-w-sm leading-relaxed font-medium italic ${isDarkMode ? 'text-zinc-400' : 'text-gray-500'
                        }`}>
                        "{t.logic}"
                      </td>
                      <td className="px-8 py-6">
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black border uppercase tracking-wider ${t.status === 'Approved'
                          ? 'text-green-500 border-green-500/20 bg-green-500/10'
                          : t.status === 'Rejected'
                            ? 'text-red-500 border-red-500/20 bg-red-500/10'
                            : isDarkMode
                              ? 'text-zinc-500 border-white/5 bg-white/5'
                              : 'text-gray-500 border-gray-200 bg-gray-100'
                          }`}>
                          {t.status === 'Pending' ? 'Calibrating' : t.status}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => updateTriggerStatus(t.id, 'Approved')}
                            className={`px-5 py-3 rounded-2xl transition-all flex items-center gap-2 ${t.status === 'Approved'
                              ? 'bg-green-600 text-white shadow-lg shadow-green-600/20'
                              : 'text-zinc-500 hover:text-green-500 border border-transparent hover:bg-green-500/10'
                              }`}
                          >
                            <CheckCircle2 className="w-5 h-5" />
                            <span className="text-xs font-black whitespace-nowrap">Verify Logic</span>
                          </button>
                          <button
                            onClick={() => updateTriggerStatus(t.id, 'Rejected')}
                            className={`p-3 rounded-2xl transition-all ${t.status === 'Rejected'
                              ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                              : 'text-zinc-500 hover:text-red-500 border border-transparent hover:bg-red-500/10'
                              }`}
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    <tr className={`${t.status === 'Rejected' ? 'opacity-30' : ''} ${isDarkMode ? 'bg-white/[0.01] border-t border-white/5' : 'bg-gray-50/50 border-t border-gray-100'}`}>
                      <td colSpan={4} className="px-8 py-4">
                        <div className="space-y-3">
                          {/* Website inputs - only show if global mode is 'sites' or 'both' */}
                          {(globalSearchMode === 'sites' || globalSearchMode === 'both') && (
                            <div className="space-y-3">
                              {(() => {
                                const sites = Array.isArray(t.limitToSite) ? t.limitToSite : (t.limitToSite ? [t.limitToSite] : []);
                                return (
                                  <>
                                    {sites.map((site, idx) => (
                                      <div key={idx} className="flex items-center gap-3">
                                        <Globe className="w-4 h-4 text-blue-400 flex-shrink-0" />
                                        <input
                                          type="text"
                                          placeholder="Add website URL (e.g., tenders.nsw.gov.au)"
                                          value={site}
                                          onChange={(e) => {
                                            const newSites = [...sites];
                                            newSites[idx] = e.target.value;
                                            const nextTriggers = triggers.map(trigger =>
                                              trigger.id === t.id ? { ...trigger, limitToSite: newSites.filter(s => s.trim()) } : trigger
                                            );
                                            setTriggers(nextTriggers);
                                            onTriggersUpdated(nextTriggers);
                                          }}
                                          className={`flex-1 border rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-blue-500 transition-all ${isDarkMode
                                            ? 'bg-black/40 border-blue-500/20 text-white placeholder:text-zinc-600'
                                            : 'bg-white border-blue-200 text-gray-900 placeholder:text-gray-400'
                                            }`}
                                        />
                                        {sites.length > 1 && (
                                          <button
                                            onClick={() => {
                                              const newSites = sites.filter((_, i) => i !== idx);
                                              const nextTriggers = triggers.map(trigger =>
                                                trigger.id === t.id ? { ...trigger, limitToSite: newSites.length ? newSites : undefined } : trigger
                                              );
                                              setTriggers(nextTriggers);
                                              onTriggersUpdated(nextTriggers);
                                            }}
                                            className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg transition-all"
                                          >
                                            <XCircle className="w-4 h-4" />
                                          </button>
                                        )}
                                      </div>
                                    ))}
                                    <button
                                      onClick={() => {
                                        const newSites = [...sites, ''];
                                        const nextTriggers = triggers.map(trigger =>
                                          trigger.id === t.id ? { ...trigger, limitToSite: newSites } : trigger
                                        );
                                        setTriggers(nextTriggers);
                                        onTriggersUpdated(nextTriggers);
                                      }}
                                      className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-xl transition-all text-sm font-bold border border-blue-500/20"
                                    >
                                      <Plus className="w-4 h-4" /> Add Website
                                    </button>
                                  </>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Compact Action Bar */}
      {approvedCount > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-4xl px-4 z-40 animate-in slide-in-from-bottom-4 duration-500">
          <div className="px-6 py-4 rounded-2xl bg-gradient-to-r from-orange-600 to-red-600 border border-orange-400/20 shadow-[0_20px_40px_rgba(249,115,22,0.3)] flex items-center justify-between backdrop-blur-xl">
            {/* Left Side - Info */}
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Zap className="w-5 h-5 text-white fill-white" />
              </div>
              <div>
                <h3 className="text-base font-black text-white leading-tight">Market Intelligence Engine</h3>
                <p className="text-xs text-orange-100/80 font-medium">{approvedCount} verified signals active</p>
              </div>
            </div>

            {/* Middle - Region Selector */}
            <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg border border-white/20">
              <MapPin className="w-3.5 h-3.5 text-white" />
              <select
                value={activeRegion}
                onChange={(e) => onRegionChange(e.target.value)}
                className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer appearance-none pr-2"
              >
                {profile.geography.map(geo => (
                  <option key={geo} value={geo} className="bg-orange-700">{geo}</option>
                ))}
              </select>
            </div>

            {/* Right Side - Action Button */}
            <button
              onClick={onStartHunting}
              className="px-6 py-3 bg-white text-orange-600 hover:bg-orange-50 font-black text-sm rounded-xl transition-all shadow-lg active:scale-95 flex items-center gap-2"
            >
              <Activity className="w-4 h-4" /> Sync Market Signals
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StrategyView;
