
import React, { useState } from 'react';
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
  Filter
} from 'lucide-react';
import { MarketSignal, SignalUrgency, BusinessProfile, LeadStatus, DealDossier } from '../types';
import { geminiService } from '../services/geminiService';
import { useTheme } from '../contexts/ThemeContext';
import { exportSignalsToExcel } from '../utils/exportToExcel';

const UrgencyBadge: React.FC<{ urgency: SignalUrgency }> = ({ urgency }) => {
  const { isDarkMode } = useTheme();

  const styles = {
    [SignalUrgency.EMERGENCY]: 'bg-[#FF5F5F]/10 text-[#FF5F5F] border-[#FF5F5F]/20',
    [SignalUrgency.HIGH]: 'bg-[#FFAD33]/10 text-[#FFAD33] border-[#FFAD33]/20',
    [SignalUrgency.MEDIUM]: 'bg-[#4CE364]/10 text-[#4CE364] border-[#4CE364]/20',
    [SignalUrgency.LOW]: 'bg-[#808191]/10 text-[#808191] border-[#808191]/20',
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${styles[urgency]}`}>
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
    <div className={`rounded-xl border transition-all animate-in slide-in-from-bottom-4 duration-500 ${signal.relevanceFeedback === 'Negative'
        ? 'opacity-40 grayscale scale-95'
        : isDarkMode
          ? 'bg-[#141414] border-white/5 hover:border-[#6C5DD3]/30 shadow-sm'
          : 'bg-white border-slate-200/60 hover:shadow-md hover:border-[#6C5DD3]/30'
      }`}>

      {/* Card Header & Main Content */}
      <div className="p-6">
        <div className="flex items-start justify-between gap-6 mb-6">
          {/* Left: Score & Headline */}
          <div className="flex gap-4 flex-1">
            {/* Score Box */}
            <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${signal.urgency === SignalUrgency.EMERGENCY || signal.urgency === SignalUrgency.HIGH
                ? 'bg-[#FF5F5F]/10 text-[#FF5F5F]'
                : 'bg-[#6C5DD3]/10 text-[#6C5DD3]'
              }`}>
              <span className="text-[10px] font-bold uppercase opacity-60 leading-none mb-0.5">Score</span>
              <span className="text-xl font-bold leading-none">{signal.score}</span>
            </div>

            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className={`text-lg font-bold leading-tight mb-2 group-hover:text-[#6C5DD3] transition-colors ${isDarkMode ? 'text-white' : 'text-[#1B1D21]'}`}>
                    {signal.headline}
                  </h3>
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${isDarkMode ? 'bg-white/5 text-zinc-400 border-white/5' : 'bg-slate-50 text-[#808191] border-slate-100'}`}>
                      <MapPin className="w-3 h-3" /> {signal.region}
                    </div>
                    <div className={`flex items-center gap-1.5 text-[11px] font-medium ${isDarkMode ? 'text-zinc-500' : 'text-[#808191]'}`}>
                      <Clock className="w-3.5 h-3.5" /> {signal.timestamp}
                    </div>
                    <UrgencyBadge urgency={signal.urgency} />
                  </div>
                </div>

                {/* Feedback Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onUpdateFeedback(signal.id, 'Positive')}
                    className={`p-1.5 rounded transition-all ${signal.relevanceFeedback === 'Positive' ? 'text-green-500 bg-green-500/10' : 'text-slate-300 hover:text-green-500 hover:bg-green-500/5'}`}
                    title="Relevant Signal"
                  >
                    <ThumbsUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onUpdateFeedback(signal.id, 'Negative')}
                    className={`p-1.5 rounded transition-all ${signal.relevanceFeedback === 'Negative' ? 'text-red-500 bg-red-500/10' : 'text-slate-300 hover:text-red-500 hover:bg-red-500/5'}`}
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
              <h4 className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${isDarkMode ? 'text-zinc-500' : 'text-[#808191]'}`}>Signal Analysis</h4>
              <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-zinc-300' : 'text-[#50515e]'}`}>{signal.summary}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {signal.matchedProducts.map(p => (
                <span key={p} className={`px-2 py-1 text-[10px] font-bold rounded uppercase tracking-wide border ${isDarkMode ? 'bg-[#6C5DD3]/10 text-[#6C5DD3] border-[#6C5DD3]/20' : 'bg-[#6C5DD3]/5 text-[#6C5DD3] border-[#6C5DD3]/10'}`}>
                  {p}
                </span>
              ))}
            </div>
            <div className="pt-2">
              <a
                href={signal.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1.5 text-xs font-semibold hover:underline ${isDarkMode ? 'text-[#6C5DD3]' : 'text-[#6C5DD3]'}`}
              >
                <ExternalLink className="w-3 h-3" />
                Source: {signal.sourceTitle}
              </a>
            </div>
          </div>

          {/* Right Column: Confidence & Target */}
          <div className={`space-y-4 pl-6 border-l ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`}>
            <div>
              <h4 className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${isDarkMode ? 'text-zinc-500' : 'text-[#808191]'}`}>Confidence Score</h4>
              <div className="space-y-3">
                {[
                  { label: 'Freshness', val: signal.confidenceDetails.freshness },
                  { label: 'Buyer Match', val: signal.confidenceDetails.buyerMatch },
                ].map((f) => (
                  <div key={f.label} className="space-y-1">
                    <div className={`flex justify-between text-[10px] font-bold uppercase ${isDarkMode ? 'text-zinc-500' : 'text-[#808191]'}`}>
                      <span>{f.label}</span>
                      <span>{f.val}%</span>
                    </div>
                    <div className={`h-1 rounded-full overflow-hidden ${isDarkMode ? 'bg-white/5' : 'bg-slate-100'}`}>
                      <div className="h-full bg-gradient-to-r from-[#6C5DD3] to-[#00C4FF] rounded-full" style={{ width: `${f.val}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
              <div className={`text-[10px] font-bold uppercase mb-1 ${isDarkMode ? 'text-zinc-500' : 'text-[#808191]'}`}>Decision Maker</div>
              <div className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-[#1B1D21]'}`}>{signal.decisionMaker}</div>
            </div>
          </div>
        </div>

        {/* Outreach Dropdown */}
        {showOutreach && (
          <div className={`mb-6 p-6 rounded-xl border animate-in fade-in duration-300 ${isDarkMode ? 'bg-[#0a0a0a]/50 border-[#6C5DD3]/20' : 'bg-[#6C5DD3]/5 border-[#6C5DD3]/10'}`}>
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
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${activeOutreachTab === tab.id
                        ? 'bg-[#6C5DD3] text-white'
                        : isDarkMode ? 'text-zinc-400 hover:text-white hover:bg-white/5' : 'text-[#808191] hover:text-[#1B1D21] hover:bg-white'
                      }`}
                  >
                    <tab.icon className="w-3.5 h-3.5" /> {tab.id}
                  </button>
                ))}
              </div>
              <button
                onClick={() => copyContent(outreachPack ? (activeOutreachTab === 'Email' ? outreachPack.email : activeOutreachTab === 'LinkedIn' ? outreachPack.linkedin : outreachPack.call) : '')}
                className="text-xs font-bold text-[#6C5DD3] hover:underline"
              >
                {copied ? 'Copied!' : 'Copy Template'}
              </button>
            </div>

            <div className={`font-mono text-xs leading-relaxed p-4 rounded-lg min-h-[100px] border ${isDarkMode ? 'bg-black/40 border-white/5 text-zinc-300' : 'bg-white border-slate-200 text-[#50515e]'}`}>
              {isGeneratingOutreach ? (
                <div className="flex items-center justify-center gap-2 py-8 text-[#6C5DD3]">
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
        <div className={`flex items-center justify-between pt-4 border-t ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`}>
          <div className="flex items-center gap-2">
            <select
              value={signal.status}
              onChange={(e) => onUpdateStatus(signal.id, e.target.value as LeadStatus)}
              className={`text-xs font-semibold bg-transparent border-none focus:ring-0 cursor-pointer ${isDarkMode ? 'text-zinc-400' : 'text-[#808191]'}`}
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
              className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all flex items-center gap-2 ${isDarkMode ? 'border-white/10 text-zinc-300 hover:bg-white/5' : 'border-slate-200 text-[#50515e] hover:bg-slate-50'}`}
            >
              <MessageSquare className="w-3.5 h-3.5" /> {showOutreach ? 'Hide Outreach' : 'Generate Outreach'}
            </button>
            <button
              onClick={() => onViewDossier(signal)}
              className="px-5 py-2 rounded-lg text-xs font-bold bg-[#6C5DD3] hover:bg-[#5B4EC2] text-white transition-all shadow-sm flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5" /> View Dossier
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const SignalsView: React.FC<{ signals: MarketSignal[], profile: BusinessProfile, isHunting: boolean, isSearching: boolean, onUpdateStatus: (id: string, s: LeadStatus) => void, onUpdateFeedback: (id: string, f: 'Positive' | 'Negative') => void, onViewDossier: (s: MarketSignal) => void, activeRegion: string, onRegionChange: (r: string) => void, dossierCache?: Record<string, DealDossier>, enrichmentProgress?: { current: number; total: number } | null }> = ({ signals, profile, isHunting, isSearching, onUpdateStatus, onUpdateFeedback, onViewDossier, activeRegion, onRegionChange, dossierCache = {}, enrichmentProgress }) => {
  const { isDarkMode } = useTheme();
  const filteredSignals = signals.filter(s => s.status !== 'Archived');
  const isEnriching = enrichmentProgress !== null && enrichmentProgress !== undefined && enrichmentProgress.current < enrichmentProgress.total;

  // Metrics Calculation
  const totalSignals = filteredSignals.length;
  const highUrgency = filteredSignals.filter(s => s.urgency === 'High' || s.urgency === 'Emergency').length;
  const pipeline = filteredSignals.filter(s => s.status === 'Contacted' || s.status === 'Meeting Booked').length;

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-32 font-sans animate-in fade-in duration-700">

      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-xl font-semibold tracking-tight ${isDarkMode ? 'text-white' : 'text-[#1B1D21]'}`}>Market Pulse</h1>
          <p className={`text-sm mt-1 font-normal ${isDarkMode ? 'text-zinc-400' : 'text-[#808191]'}`}>
            Real-time opportunities for <span className="font-semibold text-[#6C5DD3]">{profile.name}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Enrichment Badge */}
          {isEnriching && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#6C5DD3]/20 bg-[#6C5DD3]/10 text-[#6C5DD3] text-xs font-bold">
              <Loader2 className="w-3 h-3 animate-spin" />
              Processing {enrichmentProgress!.current + 1}/{enrichmentProgress!.total}
            </div>
          )}

          {/* Scan Status Badge (Small) */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-[10px] font-bold uppercase tracking-wide ${isHunting
            ? 'bg-green-500/10 text-green-500 border-green-500/20'
            : isDarkMode ? 'bg-white/5 text-zinc-500 border-white/5' : 'bg-slate-100 text-[#808191] border-slate-200'}`}>
            <Radar className={`w-3 h-3 ${isHunting ? 'animate-spin' : ''}`} />
            {isHunting ? 'Scanning' : 'Standby'}
          </div>

          {/* Export Button */}
          {filteredSignals.length > 0 && (
            <button
              onClick={() => exportSignalsToExcel(filteredSignals, dossierCache)}
              disabled={isEnriching}
              className={`px-4 py-1.5 border rounded-md text-xs font-medium transition-all flex items-center gap-2 ${isDarkMode
                ? 'border-slate-700 hover:bg-slate-800 text-slate-300'
                : 'border-slate-200 hover:bg-slate-50 text-[#1B1D21]'}`}
            >
              <Download className="w-3.5 h-3.5" /> Export
            </button>
          )}
        </div>
      </div>

      {/* Metrics Grid (Strategy Style) */}
      <div className={`rounded-xl border flex shadow-sm overflow-hidden ${isDarkMode ? 'bg-[#141414] border-white/5' : 'bg-white border-slate-200/60'}`}>
        {/* Total Opportunities */}
        <div className={`flex-1 flex items-center gap-3 px-6 py-4 border-r ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`}>
          <Zap className={`w-5 h-5 ${isDarkMode ? 'text-zinc-500' : 'text-[#808191]'}`} />
          <div>
            <p className={`text-[10px] font-semibold uppercase tracking-wider leading-none mb-1 ${isDarkMode ? 'text-zinc-500' : 'text-[#808191]'}`}>Opportunities</p>
            <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-[#1B1D21]'}`}>{totalSignals} Active Signals</p>
          </div>
        </div>

        {/* High Priority */}
        <div className={`flex-1 flex items-center gap-3 px-6 py-4 border-r ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`}>
          <Flame className="w-5 h-5 text-[#FF5F5F]" />
          <div>
            <p className={`text-[10px] font-semibold uppercase tracking-wider leading-none mb-1 ${isDarkMode ? 'text-zinc-500' : 'text-[#808191]'}`}>High Priority</p>
            <p className="text-sm font-medium text-[#FF5F5F]">{highUrgency} Urgent Leads</p>
          </div>
        </div>

        {/* Pipeline */}
        <div className={`flex-1 flex items-center gap-3 px-6 py-4 border-r ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`}>
          <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
          <div>
            <p className={`text-[10px] font-semibold uppercase tracking-wider leading-none mb-1 ${isDarkMode ? 'text-zinc-500' : 'text-[#808191]'}`}>In Pipeline</p>
            <p className="text-sm font-medium text-[#10B981]">{pipeline} Actioned</p>
          </div>
        </div>

        {/* Territory (Filter) */}
        <div className="flex-1 flex items-center gap-3 px-6 py-4">
          <MapPin className={`w-5 h-5 ${isDarkMode ? 'text-zinc-500' : 'text-[#808191]'}`} />
          <div className="flex flex-col">
            <p className={`text-[10px] font-semibold uppercase tracking-wider leading-none mb-1 ${isDarkMode ? 'text-zinc-500' : 'text-[#808191]'}`}>Territory Focus</p>
            <select
              value={activeRegion}
              onChange={(e) => onRegionChange(e.target.value)}
              className={`bg-transparent text-sm font-medium focus:outline-none cursor-pointer appearance-none p-0 border-none w-full ${isDarkMode ? 'text-white' : 'text-[#1B1D21]'}`}
            >
              {(profile.geography || []).map(geo => (
                <option key={geo} value={geo} className={isDarkMode ? 'bg-[#141414]' : 'bg-white'}>{geo}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Signals List */}
      <div className="space-y-6">
        {isSearching ? (
          <div className="py-32 flex flex-col items-center justify-center text-center space-y-6">
            <div className="relative">
              <Loader2 className="w-16 h-16 text-[#6C5DD3] animate-spin opacity-50" />
              <Sparkles className="w-6 h-6 text-[#6C5DD3] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
            </div>
            <div>
              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-[#1B1D21]'}`}>Hunting in {activeRegion}...</h3>
              <p className={`text-sm ${isDarkMode ? 'text-zinc-500' : 'text-[#808191]'}`}>Scanning verified news sources for triggers.</p>
            </div>
          </div>
        ) : filteredSignals.length > 0 ? (
          <div className="grid gap-6">
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
          <div className={`py-24 text-center rounded-xl border border-dashed ${isDarkMode ? 'border-white/10' : 'border-slate-200'}`}>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isDarkMode ? 'bg-white/5' : 'bg-slate-50'}`}>
              <Radar className={`w-8 h-8 ${isDarkMode ? 'text-zinc-600' : 'text-slate-300'}`} />
            </div>
            <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-zinc-400' : 'text-[#808191]'}`}>No Active Signals</h3>
            <p className={`text-sm ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>Select a target territory or adjust your strategy to begin.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SignalsView;
