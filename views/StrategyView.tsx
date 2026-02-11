
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
  ArrowLeft,
  Building2
} from 'lucide-react';
import { SalesTrigger, BusinessProfile } from '../types';
import { useTheme } from '../contexts/ThemeContext';

interface StrategyViewProps {
  profile: BusinessProfile;
  onTriggersUpdated: (triggers: SalesTrigger[]) => void;
  onStartHunting: () => void;
  activeRegion: string;
  onRegionChange: (r: string) => void;
  initialTriggers?: SalesTrigger[]; // For adhoc sessions with pre-generated triggers
}

const StrategyView: React.FC<StrategyViewProps> = ({ profile, onTriggersUpdated, onStartHunting, activeRegion, onRegionChange, initialTriggers }) => {
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
    product: profile?.products?.[0] || '',
    source: 'Web Scraping / Custom Feed',
    limitToSite: '',
    logic: ''
  });

  const loadMVPPresets = () => {
    const presets: SalesTrigger[] = [
      {
        id: `mvp-tender-${Date.now()}`,
        event: 'Contract Awarded',
        product: profile?.products?.[0] || 'Core Product',
        source: 'Government Tenders / Industry News',
        logic: 'Winning bidder enters immediate procurement phase.',
        status: 'Approved'
      },
      {
        id: `mvp-project-${Date.now()}`,
        event: 'New Project Announcement',
        product: profile?.products?.[0] || 'Core Product',
        source: 'Construction / Development News',
        logic: 'New facility requires immediate site setup and infrastructure.',
        status: 'Approved'
      }
    ];
    setTriggers(presets);
    onTriggersUpdated(presets);
  };

  // Auto-load triggers on mount: use initialTriggers if provided, otherwise load MVP presets
  useEffect(() => {
    if (initialTriggers && initialTriggers.length > 0) {
      setTriggers(initialTriggers);
      // Don't call onTriggersUpdated here since parent already has them
    } else if (triggers.length === 0) {
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
    <div className="max-w-7xl mx-auto space-y-10 pb-32 font-sans">

      {/* Header Section */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className={`text-xl font-semibold tracking-tight ${isDarkMode ? 'text-white' : 'text-[#1B1D21]'}`}>Signal Engine Setup</h1>
          <p className={`text-sm mt-1 font-normal ${isDarkMode ? 'text-zinc-400' : 'text-[#808191]'}`}>Configure and refine automated market intelligence triggers.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCustomForm(true)}
            className={`px-4 py-1.5 border rounded-md text-xs font-medium transition-all flex items-center gap-2 ${isDarkMode
              ? 'border-slate-700 hover:bg-slate-800 text-slate-300'
              : 'border-slate-200 hover:bg-slate-50 text-[#1B1D21]'}`}
          >
            <Plus className="w-4 h-4" />
            Custom Signal
          </button>
          <button
            onClick={() => setShowWizard(true)}
            className={`px-4 py-1.5 rounded-md text-xs font-medium hover:opacity-90 transition-all flex items-center gap-2 ${isDarkMode
              ? 'bg-white text-[#1B1D21]'
              : 'bg-[#1B1D21] text-white'}`}
          >
            <Globe className="w-4 h-4" />
            Track Website
          </button>
        </div>
      </header>

      {/* Metrics Grid */}
      <div className={`rounded-xl border flex shadow-sm overflow-hidden ${isDarkMode
        ? 'bg-[#141414] border-white/5'
        : 'bg-white border-slate-200/60'}`}>

        {/* Base Profile */}
        <div className={`flex-1 flex items-center gap-3 px-6 py-4 border-r ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`}>
          <Building2 className={`w-5 h-5 ${isDarkMode ? 'text-zinc-500' : 'text-[#808191]'}`} />
          <div>
            <p className={`text-[10px] font-semibold uppercase tracking-wider leading-none mb-1 ${isDarkMode ? 'text-zinc-500' : 'text-[#808191]'}`}>Base Profile</p>
            <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-[#1B1D21]'}`}>{profile.name}</p>
          </div>
        </div>

        {/* Active Products */}
        <div className={`flex-1 flex items-center gap-3 px-6 py-4 border-r ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`}>
          <Package className={`w-5 h-5 ${isDarkMode ? 'text-zinc-500' : 'text-[#808191]'}`} />
          <div>
            <p className={`text-[10px] font-semibold uppercase tracking-wider leading-none mb-1 ${isDarkMode ? 'text-zinc-500' : 'text-[#808191]'}`}>Active Products</p>
            <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-[#1B1D21]'}`}>{profile.products.length} Active SKUs</p>
          </div>
        </div>

        {/* Targeting */}
        <div className={`flex-1 flex items-center gap-3 px-6 py-4 border-r ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`}>
          <Target className={`w-5 h-5 ${isDarkMode ? 'text-zinc-500' : 'text-[#808191]'}`} />
          <div>
            <p className={`text-[10px] font-semibold uppercase tracking-wider leading-none mb-1 ${isDarkMode ? 'text-zinc-500' : 'text-[#808191]'}`}>Targeting</p>
            <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-[#1B1D21]'}`}>{profile.targetGroups.length} Priority Segments</p>
          </div>
        </div>

        {/* Reliability */}
        <div className={`flex-1 flex items-center gap-3 px-6 py-4 border-r ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`}>
          <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
          <div>
            <p className={`text-[10px] font-semibold uppercase tracking-wider leading-none mb-1 ${isDarkMode ? 'text-zinc-500' : 'text-[#808191]'}`}>Reliability</p>
            <p className="text-sm font-medium text-[#10B981]">98.2% Accurate</p>
          </div>
        </div>

        {/* Activity Level */}
        <div className="flex-1 flex items-center gap-3 px-6 py-4">
          {/* Use Blurple #6C5DD3 for high activity */}
          <Activity className="w-5 h-5 text-[#6C5DD3]" />
          <div>
            <p className={`text-[10px] font-semibold uppercase tracking-wider leading-none mb-1 ${isDarkMode ? 'text-zinc-500' : 'text-[#808191]'}`}>Activity Level</p>
            <p className="text-sm font-medium text-[#6C5DD3]">High Frequency</p>
          </div>
        </div>
      </div>

      {/* Legacy Wizards (Functionality Preserved) */}
      {showWizard && (
        <div className="p-12 rounded-[2.5rem] bg-green-600/10 border-2 border-green-500/30 animate-in slide-in-from-top-4 duration-500 shadow-2xl space-y-8 backdrop-blur-sm mb-10">
          {/* Same wizard content but adjust colors if needed */}
          <div className="flex items-center justify-between">
            <h3 className={`text-3xl font-black flex items-center gap-3 ${isDarkMode ? 'text-white' : 'text-[#1B1D21]'}`}>
              <Globe className="w-8 h-8 text-green-500" />
              Add Known Website - Step {wizardStep} of 3
            </h3>
            <button onClick={handleWizardClose} className="text-zinc-500 hover:text-green-500 transition-colors">
              <XCircle className="w-6 h-6" />
            </button>
          </div>
          {/* ... Wizard body omitted for brevity, keeping existing logical structure but ensuring text colors match ... */}
          {/* For brevity in rewrite, assume standard wizard rendering is acceptable as is or minimally tweaked */}
          {/* Step 1: Choose Type */}
          {wizardStep === 1 && (
            <div className="space-y-6">
              <p className={`text-lg ${isDarkMode ? 'text-zinc-300' : 'text-[#808191]'}`}>Which type of opportunity do you want to track from this site?</p>
              <div className="grid md:grid-cols-2 gap-6">
                <button
                  onClick={() => setWizardType('tender')}
                  className={`p-8 rounded-2xl border-2 transition-all ${wizardType === 'tender'
                    ? 'bg-green-500/20 border-green-500 shadow-lg shadow-green-500/20'
                    : isDarkMode
                      ? 'bg-white/5 border-white/10 hover:border-green-500/50'
                      : 'bg-white/50 border-white/40 hover:border-green-500/50'
                    }`}
                >
                  <div className="text-left space-y-3">
                    <div className={`text-2xl font-black ${isDarkMode ? 'text-white' : 'text-[#1B1D21]'}`}>📋 Tender Awards</div>
                    <p className={isDarkMode ? 'text-zinc-400' : 'text-[#808191]'}>Track contract awards and winning bids</p>
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
                    <div className={`text-2xl font-black ${isDarkMode ? 'text-white' : 'text-[#1B1D21]'}`}>🏗️ New Projects</div>
                    <p className={isDarkMode ? 'text-zinc-400' : 'text-[#808191]'}>Track new project announcements and approvals</p>
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
              <p className={`text-lg ${isDarkMode ? 'text-zinc-300' : 'text-[#808191]'}`}>
                Enter the website you check for {wizardType === 'tender' ? 'Tender Awards' : 'New Projects'}
              </p>
              <div className="space-y-3">
                <label className="text-sm font-bold text-zinc-400">Website URL</label>
                <input
                  type="text"
                  placeholder="e.g. tenders.nsw.gov.au"
                  className={`w-full border-2 rounded-2xl px-6 py-4 text-lg font-mono focus:outline-none focus:border-green-500 transition-all ${isDarkMode
                    ? 'bg-black/40 border-green-500/30 text-white'
                    : 'bg-white/60 border-green-500/20 text-[#1B1D21]'
                    }`}
                  value={wizardWebsite}
                  onChange={e => setWizardWebsite(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="flex justify-between pt-4">
                <button
                  onClick={() => setWizardStep(1)}
                  className={`px-10 py-4 font-black rounded-2xl transition-all flex items-center gap-2 ${isDarkMode ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-white/50 hover:bg-white/80 text-[#1B1D21]'
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
              <p className={`text-3xl font-black ${isDarkMode ? 'text-white' : 'text-[#1B1D21]'}`}>Site Added!</p>
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
                  className={`px-10 py-4 font-black rounded-2xl transition-all ${isDarkMode ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-white/50 hover:bg-white/80 text-[#1B1D21]'
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
        <div className="p-8 rounded-[2.5rem] bg-[#6C5DD3]/10 border-2 border-[#6C5DD3]/30 animate-in slide-in-from-top-4 duration-500 shadow-2xl space-y-6 custom-backdrop-blur mb-10">
          {/* Same Custom Form Content - Preserved */}
          <div className="flex items-center justify-between">
            <h3 className={`text-2xl font-black flex items-center gap-3 ${isDarkMode ? 'text-white' : 'text-[#1B1D21]'}`}>
              <Terminal className="w-6 h-6 text-[#6C5DD3]" />
              Define Custom Signal Parameter
            </h3>
            <button onClick={() => setShowCustomForm(false)} className="text-zinc-500 hover:text-[#6C5DD3] transition-colors">
              <XCircle className="w-6 h-6" />
            </button>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Event Headline</label>
              <input
                type="text"
                placeholder="e.g. Regional Manager hired by Competitor"
                className={`w-full border rounded-xl px-4 py-3 focus:outline-none focus:border-[#6C5DD3] transition-all ${isDarkMode
                  ? 'bg-black/40 border-white/5 text-white'
                  : 'bg-white/60 border-gray-200 text-[#1B1D21]'
                  }`}
                value={customSignal.event}
                onChange={e => setCustomSignal({ ...customSignal, event: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Relevant Product</label>
              <select
                className={`w-full border rounded-xl px-4 py-3 focus:outline-none focus:border-[#6C5DD3] transition-all ${isDarkMode
                  ? 'bg-black/40 border-white/5 text-white'
                  : 'bg-white/60 border-gray-200 text-[#1B1D21]'
                  }`}
                value={customSignal.product}
                onChange={e => setCustomSignal({ ...customSignal, product: e.target.value })}
              >
                {profile.products.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                Target Specific Site <span className="bg-[#6C5DD3]/20 text-[#6C5DD3] px-1.5 rounded text-[9px]">OPTIONAL</span>
              </label>
              <input
                type="text"
                placeholder="e.g. tenders.nsw.gov.au (Leave empty to search entire web)"
                className={`w-full border rounded-xl px-4 py-3 focus:outline-none focus:border-[#6C5DD3] transition-all font-mono text-sm ${isDarkMode
                  ? 'bg-black/40 border-white/5 text-white placeholder:text-zinc-600'
                  : 'bg-white/60 border-gray-200 text-[#1B1D21] placeholder:text-gray-400'
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
                className={`w-full border rounded-2xl px-4 py-3 focus:outline-none focus:border-[#6C5DD3] transition-all resize-none ${isDarkMode
                  ? 'bg-black/40 border-white/5 text-white'
                  : 'bg-white/60 border-gray-200 text-[#1B1D21]'
                  }`}
                value={customSignal.logic}
                onChange={e => setCustomSignal({ ...customSignal, logic: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button
              onClick={handleAddCustom}
              className="px-10 py-4 bg-[#6C5DD3] hover:bg-[#6C5DD3] text-white font-black rounded-2xl transition-all shadow-xl flex items-center gap-2"
            >
              <Plus className="w-5 h-5" /> Activate Signal Configuration
            </button>
          </div>
        </div>
      )}

      {/* Active Configurations Table */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className={`text-sm font-semibold ${isDarkMode ? 'text-slate-300' : 'text-[#1B1D21]'}`}>Active Configurations</h2>
          <div className="flex gap-4">
            <button
              onClick={() => {
                setGlobalSearchMode('web');
                onTriggersUpdated(triggers.map(t => ({ ...t, searchMode: 'web' as const })));
              }}
              className={`text-xs font-medium pb-1 border-b-2 transition-colors ${globalSearchMode === 'web' ? 'text-[#6C5DD3] border-[#6C5DD3]' : 'text-[#808191] border-transparent hover:text-[#1B1D21]'}`}
            >
              All Triggers
            </button>
            <button className="text-xs font-medium text-[#808191] hover:text-[#1B1D21] transition-colors pb-1 border-b-2 border-transparent">Archived</button>
          </div>
        </div>

        <div className={`border rounded-xl overflow-hidden shadow-sm ${isDarkMode
          ? 'bg-[#141414] border-white/5'
          : 'bg-white border-slate-200/60'}`}>
          <table className="w-full text-left">
            <thead>
              <tr className={`border-b ${isDarkMode ? 'border-white/5 bg-white/5' : 'border-slate-100 bg-slate-50/50'}`}>
                <th className={`px-6 py-3 text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-zinc-500' : 'text-[#808191]'}`}>Trigger Event</th>
                <th className={`px-6 py-3 text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-zinc-500' : 'text-[#808191]'}`}>Logic & Intent</th>
                <th className={`px-6 py-3 text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-zinc-500' : 'text-[#808191]'}`}>Status</th>
                <th className={`px-6 py-3 text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-zinc-500' : 'text-[#808191]'}`}>Category</th>
                <th className="px-6 py-3 text-right"></th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-white/5' : 'divide-slate-100'}`}>
              {triggers.map(t => (
                <tr key={t.id} className={`transition-colors group ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-slate-50/50'}`}>
                  <td className="px-6 py-5">
                    <p className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-[#1B1D21]'}`}>{t.event}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {t.limitToSite && t.limitToSite.length > 0 ? (
                        <span className={`text-xs px-1.5 py-0.5 rounded font-mono border ${isDarkMode ? 'text-blue-400 bg-blue-900/20 border-blue-900/30' : 'text-blue-500 bg-blue-50 border-blue-100'}`}>
                          {t.limitToSite[0]} {t.limitToSite.length > 1 && `+${t.limitToSite.length - 1}`}
                        </span>
                      ) : (
                        <p className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-[#808191]'}`}>{t.source}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <p className={`text-xs italic leading-relaxed max-w-xs ${isDarkMode ? 'text-zinc-400' : 'text-[#50515e]'}`}>"{t.logic}"</p>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase border
                          ${t.status === 'Approved' ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20' :
                        t.status === 'Rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                          isDarkMode ? 'bg-white/5 text-zinc-400 border-white/5' : 'bg-slate-100 text-[#808191] border-slate-200'}
                       `}>
                      {t.status === 'Approved' ? 'Verified' : t.status}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`text-xs px-2 py-1 rounded ${isDarkMode ? 'bg-white/5 text-zinc-400' : 'bg-slate-100 text-[#50515e]'}`}>{t.product}</span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => updateTriggerStatus(t.id, 'Approved')}
                        className={`opacity-0 group-hover:opacity-100 px-3 py-1 text-xs border rounded transition-all ${isDarkMode
                          ? 'border-white/10 hover:bg-white/5 text-white'
                          : 'border-slate-200 hover:bg-slate-50 text-[#1B1D21]'}`}
                      >
                        Verify
                      </button>
                      <button
                        onClick={() => updateTriggerStatus(t.id, 'Rejected')}
                        className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Bottom Floating Bar */}
      {approvedCount > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-500">
          <div className={`backdrop-blur-md border shadow-lg rounded-full px-6 py-3 flex items-center gap-6 ${isDarkMode
            ? 'bg-[#141414]/90 border-white/10'
            : 'bg-white/90 border-slate-200/60'}`}>

            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
              <p className={`text-[11px] font-semibold uppercase tracking-tighter ${isDarkMode ? 'text-zinc-300' : 'text-[#50515e]'}`}>Monitoring {triggers.length} Sources</p>
            </div>
            <div className={`w-px h-4 ${isDarkMode ? 'bg-white/10' : 'bg-slate-200'}`}></div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <MapPin className={`w-3.5 h-3.5 ${isDarkMode ? 'text-zinc-500' : 'text-[#808191]'}`} />
                <select
                  value={activeRegion}
                  onChange={(e) => onRegionChange(e.target.value)}
                  className={`bg-transparent text-[11px] font-bold uppercase tracking-widest focus:outline-none cursor-pointer appearance-none pr-2 hover:text-[#6C5DD3] transition-colors ${isDarkMode ? 'text-zinc-500' : 'text-[#808191]'}`}
                >
                  {profile.geography.map(geo => (
                    <option key={geo} value={geo} className={`bg-white dark:bg-slate-900 ${isDarkMode ? 'text-white' : 'text-[#1B1D21]'}`}>{geo}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={onStartHunting}
                className="bg-[#6C5DD3] text-white text-[11px] font-bold px-4 py-1.5 rounded-full hover:shadow-md transition-all flex items-center gap-1.5"
              >
                <Activity className="w-3.5 h-3.5" />
                Sync Signals
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StrategyView;
