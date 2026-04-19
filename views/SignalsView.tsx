
import React, { useState, useEffect } from 'react';
import {
  Zap,
  Clock,
  Target,
  Mail,
  ArrowRight,
  Loader2,
  ShieldCheck,
  Radar,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Linkedin,
  Phone,
  CheckCircle2,
  Bookmark,
  MapPin,
  ChevronDown,
  ExternalLink,
  Download,
  Flame,
  Filter,
  TrendingUp,
  RefreshCw,
  Plus,
  Globe
} from 'lucide-react';
import { MarketSignal, SignalUrgency, BusinessProfile, LeadStatus, DealDossier } from '../types';
import { geminiService } from '../services/geminiService';
import { useTheme } from '../contexts/ThemeContext';
import { exportSignalsToExcel } from '../utils/exportToExcel';
import { getVL } from '../utils/vesper';

const UrgencyBadge: React.FC<{ urgency: SignalUrgency }> = ({ urgency }) => {
  const { isDarkMode } = useTheme();

  const styles = {
    [SignalUrgency.EMERGENCY]: 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20',
    [SignalUrgency.HIGH]: 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20',
    [SignalUrgency.MEDIUM]: 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20',
    [SignalUrgency.LOW]: isDarkMode ? 'bg-zinc-800 text-zinc-400 border-zinc-700' : 'bg-gray-100 text-gray-500 border-gray-200',
  };

  return (
    <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-bold border uppercase tracking-widest ${styles[urgency]}`}>
      {urgency}
    </span>
  );
};

interface LeadCardProps {
  signal: MarketSignal;
  profile: BusinessProfile;
  onUpdateStatus: (id: string, status: LeadStatus) => void;
  onUpdateFeedback: (id: string, feedback: 'Positive' | 'Negative') => void;
  onViewDossier: (s: MarketSignal) => void;
}

const LeadCard: React.FC<LeadCardProps> = ({ signal, profile, onUpdateStatus, onUpdateFeedback, onViewDossier }) => {
  const { isDarkMode } = useTheme();
  const vl = getVL(isDarkMode);
  
  const [isGeneratingOutreach, setIsGeneratingOutreach] = useState(false);
  const [outreachPack, setOutreachPack] = useState<{ email: string, linkedin: string, call: string } | null>(null);
  const [activeOutreachTab, setActiveOutreachTab] = useState<'Email' | 'LinkedIn' | 'Call'>('Email');
  const [showOutreach, setShowOutreach] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleToggleOutreach = async () => {
    if (showOutreach) {
      setShowOutreach(false);
      return;
    }
    setShowOutreach(true);
    if (!outreachPack) {
      setIsGeneratingOutreach(true);
      try {
        const pack = await geminiService.generateOutreach(signal, profile);
        setOutreachPack(pack);
      } catch (e) {
        console.error(e);
      } finally {
        setIsGeneratingOutreach(false);
      }
    }
  };

  const copyContent = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      className={`vl-card transition-all animate-in slide-in-from-bottom-4 duration-500 group ${
        signal.relevanceFeedback === 'Negative' ? 'opacity-40 grayscale scale-[0.98]' : ''
      }`}
      style={{
        border: `1px solid ${vl.border}`,
        background: vl.surface,
      }}
    >
      {/* Card Header & Main Content */}
      <div className="p-6">
        <div className="flex items-start justify-between gap-6 mb-5 border-b pb-5" style={{ borderColor: vl.border }}>
          <div className="flex gap-4 flex-1">
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 
                      className="text-lg font-semibold leading-tight group-hover:text-[#635BFF] transition-colors"
                      style={{ color: vl.textMain }}
                    >
                      {signal.headline}
                    </h3>
                    {signal.trackedWebsiteId && (
                      <span className="px-2 py-0.5 rounded-[4px] text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 whitespace-nowrap">
                        Tracked Site
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div 
                      className="flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] text-[10px] font-bold uppercase border"
                      style={{ background: vl.chipBg, color: vl.chipText, borderColor: vl.border }}
                    >
                      <MapPin className="w-3 h-3" /> {signal.region}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] font-medium" style={{ color: vl.textMuted }}>
                      <Clock className="w-3.5 h-3.5" /> {signal.timestamp}
                    </div>
                    <UrgencyBadge urgency={signal.urgency} />
                  </div>
                </div>

                {/* Feedback Actions */}
                <div className="flex items-center gap-1 ml-4">
                  <button
                    onClick={() => onUpdateFeedback(signal.id, 'Positive')}
                    className={`p-1.5 rounded-[4px] transition-all border ${signal.relevanceFeedback === 'Positive' ? 'text-green-500 bg-green-500/10 border-green-500/20' : 'text-slate-400 hover:text-green-500 hover:bg-green-500/10 border-transparent'}`}
                    title="Relevant Signal"
                  >
                    <ThumbsUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onUpdateFeedback(signal.id, 'Negative')}
                    className={`p-1.5 rounded-[4px] transition-all border ${signal.relevanceFeedback === 'Negative' ? 'text-red-500 bg-red-500/10 border-red-500/20' : 'text-slate-400 hover:text-red-500 hover:bg-red-500/10 border-transparent'}`}
                    title="Not Relevant"
                  >
                    <ThumbsDown className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-6">
          {/* Analysis Text */}
          <div className="md:col-span-2 space-y-4">
            <div>
              <h4 className="label-caps mb-2" style={{ color: vl.textMuted }}>Signal Analysis</h4>
              <p className="text-[13px] leading-relaxed" style={{ color: vl.textBody }}>{signal.summary}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {signal.matchedProducts.map(p => (
                <span 
                  key={p} 
                  className="px-2 py-1 text-[10px] font-bold rounded-[4px] uppercase tracking-wide border"
                  style={{ background: vl.primarySoft, color: vl.primary, borderColor: isDarkMode ? 'rgba(99,91,255,0.2)' : 'rgba(99,91,255,0.1)' }}
                >
                  {p}
                </span>
              ))}
            </div>
            <div className="pt-2">
              {signal.sourceUrl ? (
                <a
                  href={signal.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold hover:underline"
                  style={{ color: vl.primary }}
                >
                  <ExternalLink className="w-3 h-3" />
                  Source: {signal.sourceTitle}
                </a>
              ) : (
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: vl.textMuted }}>
                  <ExternalLink className="w-3 h-3 opacity-50" />
                  Source: {signal.sourceTitle} (Unpublished)
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4 pl-6 border-l" style={{ borderColor: vl.border }}>
            <div className="p-3 rounded-[6px] border" style={{ background: vl.surfaceMuted, borderColor: vl.borderStrong }}>
              <div className="label-caps mb-1" style={{ color: vl.textMuted }}>Decision Maker</div>
              <div className="text-[13px] font-bold" style={{ color: vl.textMain }}>{signal.decisionMaker}</div>
            </div>
          </div>
        </div>

        {/* Outreach Dropdown */}
        {showOutreach && (
          <div 
            className="mb-6 p-6 rounded-[6px] border animate-in fade-in duration-300"
            style={{ background: vl.surfaceMuted, borderColor: vl.border }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-2">
                {[
                  { id: 'Email', icon: Mail },
                  { id: 'LinkedIn', icon: Linkedin },
                  { id: 'Call', icon: Phone }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveOutreachTab(tab.id as any)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-[4px] text-xs font-bold transition-all"
                    style={{
                      background: activeOutreachTab === tab.id ? vl.primary : 'transparent',
                      color: activeOutreachTab === tab.id ? '#fff' : vl.textMuted,
                    }}
                  >
                    <tab.icon className="w-3.5 h-3.5" /> {tab.id}
                  </button>
                ))}
              </div>
              <button
                onClick={() => copyContent(outreachPack ? (activeOutreachTab === 'Email' ? outreachPack.email : activeOutreachTab === 'LinkedIn' ? outreachPack.linkedin : outreachPack.call) : '')}
                className="text-xs font-bold hover:underline"
                style={{ color: vl.primary }}
              >
                {copied ? 'Copied!' : 'Copy Template'}
              </button>
            </div>

            <div 
              className="font-mono text-xs leading-relaxed p-4 rounded-[6px] min-h-[100px] border"
              style={{ background: vl.surface, borderColor: vl.borderStrong, color: vl.textBody }}
            >
              {isGeneratingOutreach ? (
                <div className="flex items-center justify-center gap-2 py-8" style={{ color: vl.primary }}>
                  <Loader2 className="animate-spin w-4 h-4" /> Generating personalized outreach...
                </div>
              ) : outreachPack ? (
                <div className="whitespace-pre-wrap">
                  {activeOutreachTab === 'Email' ? outreachPack.email : activeOutreachTab === 'LinkedIn' ? outreachPack.linkedin : outreachPack.call}
                </div>
              ) : "Click to generate draft."}
            </div>
          </div>
        )}

        {/* Action Footer */}
        <div className="flex items-center justify-between pt-4 mt-2">
          <div className="flex items-center gap-2">
            <select
              value={signal.status}
              onChange={(e) => onUpdateStatus(signal.id, e.target.value as LeadStatus)}
              className="text-xs font-semibold bg-transparent border-none focus:ring-0 cursor-pointer"
              style={{ color: vl.textMuted }}
            >
              <option value="New">Status: New</option>
              <option value="Contacted">Status: Contacted</option>
              <option value="Meeting Booked">Status: Meeting Booked</option>
              <option value="Archived">Status: Archived</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleOutreach}
              className="px-4 py-2 rounded-[6px] text-xs font-bold border transition-all flex items-center gap-2"
              style={{ borderColor: vl.borderStrong, color: vl.textBody, background: vl.surface }}
            >
              <MessageSquare className="w-3.5 h-3.5" /> {showOutreach ? 'Hide Outreach' : 'Generate Outreach'}
            </button>
            <button
              onClick={() => onViewDossier(signal)}
              className="btn-primary px-5 py-2 text-xs font-bold flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5" /> View Dossier
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const SignalsView: React.FC<{ 
  signals: MarketSignal[], 
  profile: BusinessProfile, 
  isHunting: boolean, 
  isSearching: boolean, 
  onUpdateStatus: (id: string, s: LeadStatus) => void, 
  onUpdateFeedback: (id: string, f: 'Positive' | 'Negative') => void, 
  onViewDossier: (s: MarketSignal) => void, 
  activeRegion: string, 
  onRegionChange: (r: string) => void, 
  dossierCache?: Record<string, DealDossier>, 
  enrichmentProgress?: { current: number; total: number } | null,
  marketActivity?: { level: string, summary: string, colorClass: string } | null,
  isAssessing?: boolean
}> = ({ 
  signals, 
  profile, 
  isHunting, 
  isSearching, 
  onUpdateStatus, 
  onUpdateFeedback, 
  onViewDossier, 
  activeRegion, 
  onRegionChange, 
  dossierCache = {}, 
  enrichmentProgress,
  marketActivity,
  isAssessing 
}) => {
  const { isDarkMode } = useTheme();
  const vl = getVL(isDarkMode);
  const [viewMode, setViewMode] = useState<'all' | 'website'>('all');

  const filteredSignals = signals.filter(s => {
    if (s.status === 'Archived') return false;
    if (viewMode === 'website' && !s.trackedWebsiteId) return false;
    return true; 
  });
  const isEnriching = enrichmentProgress !== null && enrichmentProgress !== undefined && enrichmentProgress.current < enrichmentProgress.total;

  // Metrics Calculation
  const totalSignals = filteredSignals.length;
  const highUrgency = filteredSignals.filter(s => s.urgency === SignalUrgency.HIGH || s.urgency === SignalUrgency.EMERGENCY).length;
  // const pipeline = filteredSignals.filter(s => s.status === 'Contacted' || s.status === 'Meeting Booked').length;

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-32 animate-in fade-in duration-700">

      {/* Header Section */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 
            style={{ fontFamily: "'Newsreader', Georgia, serif", color: vl.textMain }} 
            className="text-3xl font-semibold tracking-tight"
          >
            Market Pulse
          </h1>
          <p className="text-[13px] mt-1" style={{ color: vl.textBody }}>
            Real-time leads for <span className="font-semibold" style={{ color: vl.primary }}>{profile.name}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Enrichment Badge */}
          {isEnriching && (
            <div 
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold"
              style={{ background: vl.primarySoft, color: vl.primary, borderColor: isDarkMode ? 'rgba(99,91,255,0.2)' : 'rgba(99,91,255,0.1)' }}
            >
              <Loader2 className="w-3 h-3 animate-spin" />
              Processing {enrichmentProgress!.current + 1}/{enrichmentProgress!.total}
            </div>
          )}

          {/* Export Button */}
          {filteredSignals.length > 0 && (
            <button
              onClick={() => exportSignalsToExcel(filteredSignals, dossierCache)}
              disabled={isEnriching}
              className="px-4 py-2 border rounded-[6px] text-xs font-bold transition-all flex items-center gap-2"
              style={{ background: vl.surface, color: vl.textBody, borderColor: vl.borderStrong }}
            >
              <Download className="w-3.5 h-3.5" /> Export
            </button>
          )}
        </div>
      </div>

      {/* Metrics Grid */}
      <div 
        className="rounded-[6px] border flex shadow-sm overflow-visible"
        style={{ background: vl.surface, borderColor: vl.border }}
      >
        {/* Total Leads */}
        <div className="flex-1 flex items-center gap-3 px-6 py-4 border-r" style={{ borderColor: vl.border }}>
          <div className="w-8 h-8 rounded-[6px] flex items-center justify-center" style={{ background: vl.primarySoft, color: vl.primary }}>
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <p className="label-caps mb-0.5" style={{ color: vl.textMuted }}>Leads</p>
            <p className="text-sm font-bold" style={{ color: vl.textMain }}>{totalSignals} Active Signals</p>
          </div>
        </div>

        {/* High Priority */}
        <div className="flex-1 flex items-center gap-3 px-6 py-4 border-r" style={{ borderColor: vl.border }}>
          <div className="w-8 h-8 rounded-[6px] flex items-center justify-center bg-orange-500/10 text-orange-500">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <p className="label-caps mb-0.5" style={{ color: vl.textMuted }}>High Priority</p>
            <p className="text-sm font-bold text-orange-500">{highUrgency} Urgent Leads</p>
          </div>
        </div>

        {/* Activity Level */}
        <div className="flex-1 flex items-center gap-3 px-6 py-4 relative group border-r" style={{ borderColor: vl.border }}>
          <div className={`w-8 h-8 rounded-[6px] flex items-center justify-center ${isAssessing ? 'bg-zinc-500/10 text-zinc-500' : 'bg-green-500/10 text-green-500'}`}>
            {isAssessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
          </div>
          <div>
            <p className="label-caps mb-0.5" style={{ color: vl.textMuted }}>Activity Level</p>
            <p className="text-sm font-bold" style={{ color: isAssessing ? vl.textMuted : '#10B981' }}>
              {isAssessing ? 'Polling Trend...' : (marketActivity?.level || 'Assessing...')}
            </p>
          </div>
          {marketActivity?.summary && (
            <div 
              className="absolute top-full left-1/2 -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-20 w-56 p-2 text-xs rounded-[6px] shadow-lg text-center"
              style={{ background: isDarkMode ? '#1E293B' : '#191C1E', color: '#fff' }}
            >
              {marketActivity.summary}
            </div>
          )}
        </div>

        {/* Territory (Filter) */}
        <div className="flex-1 flex items-center gap-3 px-6 py-4">
          <div className="w-8 h-8 rounded-[6px] flex items-center justify-center" style={{ background: vl.chipBg, color: vl.textMuted }}>
            <MapPin className="w-4 h-4" />
          </div>
          <div className="flex flex-col flex-1">
            <p className="label-caps mb-0.5" style={{ color: vl.textMuted }}>Territory Focus</p>
            <select
              value={activeRegion}
              onChange={(e) => onRegionChange(e.target.value)}
              className="bg-transparent text-[13px] font-bold focus:outline-none cursor-pointer appearance-none p-0 border-none w-full leading-none"
              style={{ color: vl.textMain }}
            >
              {(profile.geography || []).map(geo => (
                <option key={geo} value={geo} style={{ background: vl.surface, color: vl.textMain }}>{geo}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Signals List */}
      <div className="space-y-6 mt-8">
        
        {/* Signal View Tabs */}
        <div className="flex gap-4 border-b" style={{ borderColor: vl.border }}>
          <button
            onClick={() => setViewMode('all')}
            className="text-xs font-semibold py-3 px-2 transition-colors relative"
            style={{ color: viewMode === 'all' ? vl.primary : vl.textMuted }}
          >
            All Signals
            {viewMode === 'all' && (
              <span className="absolute bottom-0 left-0 w-full h-[2px] rounded-t-full" style={{ background: vl.primary }}></span>
            )}
          </button>
          <button
            onClick={() => setViewMode('website')}
            className="text-xs font-semibold py-3 px-2 transition-colors relative flex items-center gap-1.5"
            style={{ color: viewMode === 'website' ? vl.primary : vl.textMuted }}
          >
            <Globe className="w-3.5 h-3.5" />
            Website Signals
            {viewMode === 'website' && (
              <span className="absolute bottom-0 left-0 w-full h-[2px] rounded-t-full" style={{ background: vl.primary }}></span>
            )}
          </button>
        </div>

        {isSearching ? (
          <div className="py-32 flex flex-col items-center justify-center text-center space-y-6">
            <div className="relative">
              <Loader2 className="w-12 h-12 animate-spin opacity-50" style={{ color: vl.primary }} />
              <Sparkles className="w-5 h-5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" style={{ color: vl.primary }} />
            </div>
            <div>
              <h3 className="text-lg font-semibold" style={{ fontFamily: "'Newsreader', Georgia, serif", color: vl.textMain }}>Hunting in {activeRegion}...</h3>
              <p className="text-[13px]" style={{ color: vl.textBody }}>Scanning verified news sources for triggers.</p>
            </div>
          </div>
        ) : filteredSignals.length > 0 ? (
          <div className="grid gap-4">
            {filteredSignals.map(s => (
              <LeadCard
                key={s.id}
                signal={s}
                profile={profile}
                onUpdateStatus={onUpdateStatus}
                onUpdateFeedback={onUpdateFeedback}
                onViewDossier={onViewDossier}
              />
            ))}
          </div>
        ) : (
          <div className="py-24 text-center rounded-[6px] border border-dashed" style={{ borderColor: vl.borderStrong }}>
            <div className="w-12 h-12 rounded-[6px] flex items-center justify-center mx-auto mb-4" style={{ background: vl.chipBg }}>
              <Radar className="w-6 h-6" style={{ color: vl.textMuted }} />
            </div>
            <h3 className="text-base font-semibold" style={{ color: vl.textMain }}>No Active Signals</h3>
            <p className="text-[13px]" style={{ color: vl.textMuted }}>Select a target territory or adjust your strategy to begin.</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default SignalsView;
