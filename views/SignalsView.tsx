
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
  ExternalLink
} from 'lucide-react';
import { MarketSignal, SignalUrgency, BusinessProfile, LeadStatus } from '../types';
import { geminiService } from '../services/geminiService';
import { useTheme } from '../contexts/ThemeContext';

const UrgencyBadge: React.FC<{ urgency: SignalUrgency }> = ({ urgency }) => {
  const styles = {
    [SignalUrgency.EMERGENCY]: 'bg-red-500/10 text-red-400 border-red-500/20',
    [SignalUrgency.HIGH]: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    [SignalUrgency.MEDIUM]: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    [SignalUrgency.LOW]: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  };

  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${styles[urgency]}`}>
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
    <div className={`border rounded-3xl overflow-hidden transition-all shadow-lg animate-in slide-in-from-bottom-4 duration-500 ${signal.relevanceFeedback === 'Negative'
        ? 'opacity-40 grayscale scale-95'
        : isDarkMode
          ? 'bg-[#141414] border-white/5 hover:border-orange-500/30'
          : 'bg-white border-gray-200 hover:border-orange-400'
      }`}>
      <div className="p-8">
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-5">
            <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center border ${signal.urgency === SignalUrgency.EMERGENCY ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-orange-500/10 border-orange-500/20 text-orange-500'
              }`}>
              <span className="text-[10px] font-black uppercase tracking-tighter mb-1">Score</span>
              <span className="text-2xl font-black">{signal.score}</span>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className={`text-2xl font-black group-hover:text-orange-400 transition-colors leading-tight ${isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>{signal.headline}</h3>
                <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${isDarkMode ? 'bg-white/5 text-zinc-500 border-white/5' : 'bg-gray-100 text-gray-500 border-gray-200'
                  }`}>
                  <MapPin className="w-3 h-3" /> {signal.region}
                </div>
              </div>
              <div className={`flex items-center gap-4 text-sm font-medium ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>
                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {signal.timestamp}</span>
                <UrgencyBadge urgency={signal.urgency} />
              </div>
            </div>
          </div>

          <div className={`flex items-center gap-2 p-1.5 rounded-xl border ${isDarkMode ? 'bg-[#0a0a0a] border-white/5' : 'bg-gray-100 border-gray-200'
            }`}>
            <button
              onClick={() => onUpdateFeedback(signal.id, 'Positive')}
              className={`p-2 rounded-lg transition-all ${signal.relevanceFeedback === 'Positive' ? 'bg-green-500/20 text-green-500' : isDarkMode ? 'text-zinc-600 hover:text-green-500' : 'text-gray-400 hover:text-green-500'}`}
              title="Relevant Signal"
            >
              <ThumbsUp className="w-4 h-4" />
            </button>
            <button
              onClick={() => onUpdateFeedback(signal.id, 'Negative')}
              className={`p-2 rounded-lg transition-all ${signal.relevanceFeedback === 'Negative' ? 'bg-red-500/20 text-red-500' : isDarkMode ? 'text-zinc-600 hover:text-red-500' : 'text-gray-400 hover:text-red-500'}`}
              title="Not Relevant"
            >
              <ThumbsDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-12 gap-10 mb-8">
          <div className="md:col-span-8 space-y-6">
            <div>
              <h4 className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>Signal Analysis</h4>
              <p className={`leading-relaxed text-lg ${isDarkMode ? 'text-zinc-300' : 'text-gray-700'}`}>{signal.summary}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {signal.matchedProducts.map(p => (
                <span key={p} className="px-3 py-1 bg-orange-500/10 text-orange-400 text-xs font-bold rounded-lg border border-orange-500/20 uppercase tracking-tight">
                  {p}
                </span>
              ))}
            </div>
            <div className="pt-2">
              <a
                href={signal.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-orange-500 hover:text-orange-400 font-bold group/link"
              >
                <ExternalLink className="w-4 h-4" />
                Source: {signal.sourceTitle}
              </a>
            </div>
          </div>

          <div className={`md:col-span-4 space-y-6 border-l pl-10 ${isDarkMode ? 'border-white/5' : 'border-gray-200'}`}>
            <div>
              <h4 className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>Confidence</h4>
              <div className="space-y-3">
                {[
                  { label: 'Freshness', val: signal.confidenceDetails.freshness },
                  { label: 'Buyer Match', val: signal.confidenceDetails.buyerMatch },
                ].map((f) => (
                  <div key={f.label} className="space-y-1">
                    <div className={`flex justify-between text-[10px] font-bold uppercase ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>
                      <span>{f.label}</span>
                      <span>{f.val}%</span>
                    </div>
                    <div className={`h-1 rounded-full overflow-hidden ${isDarkMode ? 'bg-white/5' : 'bg-gray-200'}`}>
                      <div className="h-full bg-orange-600 rounded-full" style={{ width: `${f.val}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-[#0a0a0a] border-white/5' : 'bg-gray-50 border-gray-200'}`}>
              <div className={`text-[10px] font-bold uppercase mb-2 ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>Target Executive</div>
              <div className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{signal.decisionMaker}</div>
            </div>
          </div>
        </div>

        {showOutreach && (
          <div className={`mb-8 p-6 rounded-2xl border animate-in fade-in duration-300 ${isDarkMode ? 'bg-[#0a0a0a] border-orange-500/20' : 'bg-orange-50 border-orange-200'
            }`}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex gap-2">
                {[
                  { id: 'Email', icon: Mail },
                  { id: 'LinkedIn', icon: Linkedin },
                  { id: 'Call', icon: Phone }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveOutreachTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeOutreachTab === tab.id
                        ? 'bg-orange-600 text-white'
                        : isDarkMode ? 'text-zinc-500 hover:text-white' : 'text-gray-500 hover:text-gray-700'
                      }`}
                  >
                    <tab.icon className="w-3.5 h-3.5" />
                    {tab.id}
                  </button>
                ))}
              </div>
              <button
                onClick={() => copyContent(outreachPack ? (activeOutreachTab === 'Email' ? outreachPack.email : activeOutreachTab === 'LinkedIn' ? outreachPack.linkedin : outreachPack.call) : '')}
                className="text-xs text-orange-400 hover:text-orange-300 font-bold"
              >
                {copied ? 'Copied!' : 'Copy Template'}
              </button>
            </div>

            <div className={`font-serif leading-relaxed italic text-lg min-h-[100px] flex items-center ${isDarkMode ? 'text-zinc-300' : 'text-gray-700'}`}>
              {isGeneratingOutreach ? (
                <div className="w-full flex justify-center"><Loader2 className="animate-spin w-6 h-6 text-orange-500" /></div>
              ) : outreachPack ? (
                <div className="whitespace-pre-wrap">
                  {activeOutreachTab === 'Email' ? outreachPack.email : activeOutreachTab === 'LinkedIn' ? outreachPack.linkedin : outreachPack.call}
                </div>
              ) : "Draft failed."}
            </div>
          </div>
        )}

        <div className={`flex items-center justify-between pt-6 border-t ${isDarkMode ? 'border-white/5' : 'border-gray-200'}`}>
          <div className="flex gap-3">
            <select
              value={signal.status}
              onChange={(e) => onUpdateStatus(signal.id, e.target.value as LeadStatus)}
              className={`border rounded-xl px-4 py-2 text-xs font-bold focus:outline-none focus:border-orange-500/50 ${isDarkMode ? 'bg-white/5 border-white/5 text-zinc-400' : 'bg-gray-100 border-gray-200 text-gray-600'
                }`}
            >
              <option value="New">Status: New</option>
              <option value="Contacted">Status: Contacted</option>
              <option value="Followed-up">Status: Followed-up</option>
              <option value="Meeting Booked">Status: Meeting Booked</option>
              <option value="Archived">Status: Archived</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleToggleOutreach} className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold border transition-all ${isDarkMode ? 'border-white/5 text-zinc-400 hover:text-white bg-white/5' : 'border-gray-200 text-gray-600 hover:text-gray-900 bg-gray-100'
              }`}>
              <MessageSquare className="w-4 h-4" /> {showOutreach ? 'Hide Outreach' : 'Outreach Pack'}
            </button>
            <button onClick={() => onViewDossier(signal)} className="flex items-center gap-2 px-8 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-sm font-black transition-all">
              <ShieldCheck className="w-4 h-4" /> Deal Dossier <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const SignalsView: React.FC<{ signals: MarketSignal[], profile: BusinessProfile, isHunting: boolean, isSearching: boolean, onUpdateStatus: (id: string, s: LeadStatus) => void, onUpdateFeedback: (id: string, f: 'Positive' | 'Negative') => void, onViewDossier: (s: MarketSignal) => void, activeRegion: string, onRegionChange: (r: string) => void }> = ({ signals, profile, isHunting, isSearching, onUpdateStatus, onUpdateFeedback, onViewDossier, activeRegion, onRegionChange }) => {
  const { isDarkMode } = useTheme();
  const filteredSignals = signals.filter(s => s.status !== 'Archived');

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-700">
      <div className="flex items-end justify-between">
        <div>
          <h1 className={`text-5xl font-black tracking-tight mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Market Pulse</h1>
          <p className={`text-xl font-medium ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>Real-time opportunities for <span className="text-orange-400">{profile.name}</span></p>
        </div>

        <div className="flex flex-col items-end gap-3">
          {/* Dynamic Territory Selector */}
          <div className={`flex items-center gap-2 border rounded-2xl p-1 pr-3 ${isDarkMode ? 'bg-[#141414] border-white/5' : 'bg-white border-gray-200'
            }`}>
            <div className="bg-orange-600/10 text-orange-500 p-2 rounded-xl">
              <MapPin className="w-4 h-4" />
            </div>
            <select
              value={activeRegion}
              onChange={(e) => onRegionChange(e.target.value)}
              className={`bg-transparent text-sm font-bold focus:outline-none cursor-pointer appearance-none pr-6 ${isDarkMode ? 'text-white' : 'text-gray-900'
                }`}
            >
              {profile.geography.map(geo => (
                <option key={geo} value={geo} className={isDarkMode ? 'bg-[#141414]' : 'bg-white'}>Focusing on: {geo}</option>
              ))}
            </select>
          </div>

          <div className={`flex items-center gap-2 text-[10px] font-black px-4 py-2 rounded-full border ${isHunting
              ? 'bg-green-500/10 text-green-500 border-green-500/20'
              : isDarkMode
                ? 'bg-zinc-800 text-zinc-500 border-white/5'
                : 'bg-gray-100 text-gray-500 border-gray-200'
            }`}>
            <Radar className={`w-3 h-3 ${isHunting ? 'animate-spin' : ''}`} />
            {isHunting ? 'SCANNER ACTIVE' : 'ENGINE STANDBY'}
          </div>
        </div>
      </div>

      <div className="grid gap-10">
        {isSearching ? (
          <div className="py-32 flex flex-col items-center text-center space-y-8 animate-in fade-in duration-500">
            <div className="relative">
              <Loader2 className="w-20 h-20 text-orange-500 animate-spin" />
              <Sparkles className="w-8 h-8 text-orange-400 absolute -top-2 -right-2 animate-pulse" />
            </div>
            <div className="space-y-2">
              <h3 className={`text-3xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Hunting in {activeRegion}...</h3>
              <p className={`max-w-sm mx-auto text-lg italic leading-relaxed ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>
                Scanning the web for real-time triggers using strict news grounding.
              </p>
            </div>
          </div>
        ) : filteredSignals.length > 0 ? (
          filteredSignals.map(s => <LeadCard key={s.id} signal={s} profile={profile} onUpdateStatus={onUpdateStatus} onUpdateFeedback={onUpdateFeedback} onViewDossier={onViewDossier} />)
        ) : (
          <div className="py-24 text-center space-y-6">
            <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto border shadow-xl ${isDarkMode ? 'bg-zinc-900 border-white/5' : 'bg-gray-100 border-gray-200'
              }`}>
              <Radar className={`w-10 h-10 animate-pulse ${isDarkMode ? 'text-zinc-800' : 'text-gray-400'}`} />
            </div>
            <h3 className={`text-2xl font-black ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>Awaiting Signal Activation</h3>
            <p className={`max-w-sm mx-auto ${isDarkMode ? 'text-zinc-600' : 'text-gray-500'}`}>Calibrate your strategy and select a target territory to begin autonomous hunting.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SignalsView;
