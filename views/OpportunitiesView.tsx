
import React from 'react';
import {
  ArrowLeft,
  FileText,
  DollarSign,
  MessageSquare,
  ShieldCheck,
  TrendingUp,
  Package,
  Layers,
  Loader2,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Target,
  Swords,
  ShieldAlert,
  ChevronRight,
  Globe,
  Linkedin,
  User,
  ExternalLink,
  Building
} from 'lucide-react';
import { DealDossier, MarketSignal } from '../types';
import { useTheme } from '../contexts/ThemeContext';

interface OpportunitiesViewProps {
  signal: MarketSignal | null;
  dossier: DealDossier | null;
  isLoading: boolean;
  error?: string | null;
  onRetry: () => void;
  onBack: () => void;
}

const SkeletonPulse: React.FC<{ className?: string }> = ({ className }) => {
  const { isDarkMode } = useTheme();
  return (
    <div className={`animate-pulse rounded-xl ${isDarkMode ? 'bg-white/5' : 'bg-gray-200'} ${className}`} />
  );
};

const OpportunitiesView: React.FC<OpportunitiesViewProps> = ({ signal, dossier, isLoading, error, onRetry, onBack }) => {
  const { isDarkMode } = useTheme();

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center animate-in fade-in duration-500 px-4">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <div>
          <h2 className={`text-2xl font-black mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Dossier Generation Failed</h2>
          <p className={`max-md mx-auto ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>
            {error || "An unexpected error occurred during intelligence gathering."}
          </p>
        </div>
        <div className="flex gap-4">
          <button onClick={onBack} className={`px-6 py-3 rounded-xl font-bold transition-all ${isDarkMode ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
            Back to Signals
          </button>
          <button onClick={onRetry} className="px-6 py-3 bg-orange-600 hover:bg-orange-50 text-white rounded-xl font-bold flex items-center gap-2 transition-all">
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

  if (!signal) {
    return (
      <div className="text-center py-20 animate-in fade-in">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 ${isDarkMode ? 'bg-zinc-900' : 'bg-gray-100'}`}>
          <Target className={`w-8 h-8 ${isDarkMode ? 'text-zinc-700' : 'text-gray-400'}`} />
        </div>
        <p className={`italic text-lg mb-6 ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>Select a signal from the Signal engine to generate a strategic Dossier.</p>
        <button onClick={onBack} className={`px-8 py-3 rounded-xl font-bold border transition-all ${isDarkMode ? 'bg-white/5 hover:bg-white/10 text-white border-white/5' : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200'}`}>
          View Signal Engine
        </button>
      </div>
    );
  }

  const displayAccountName = dossier?.accountName || signal.headline.split(':')[0] || "Target Account";
  const displaySummary = dossier?.executiveSummary || signal.summary;
  const isPending = !dossier && isLoading;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in slide-in-from-right duration-500 pb-32">
      <button onClick={onBack} className={`flex items-center gap-2 transition-colors group mb-4 ${isDarkMode ? 'text-zinc-500 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back
      </button>

      {/* Header */}
      <div className={`flex items-start justify-between border-b pb-10 ${isDarkMode ? 'border-white/5' : 'border-gray-200'}`}>
        <div className="space-y-4 flex-1">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded bg-orange-600/10 text-orange-500 text-[10px] font-black uppercase tracking-widest border border-orange-500/20">
              {isPending ? 'Gathering Intelligence...' : 'Battle-Ready Dossier'}
            </span>
            {dossier ? (
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded border text-xs font-bold animate-in fade-in duration-700 ${dossier.confidence === 'High' ? 'text-green-500 border-green-500/20 bg-green-500/10' : 'text-yellow-500 border-yellow-500/20 bg-yellow-500/10'
                }`}>
                <ShieldCheck className="w-3.5 h-3.5" />
                {dossier.confidence} Conf.
              </div>
            ) : <SkeletonPulse className="w-24 h-6" />}
          </div>
          <h1 className={`text-5xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{displayAccountName}</h1>
          <p className={`text-xl leading-relaxed max-w-2xl italic ${isDarkMode ? 'text-zinc-400' : 'text-gray-500'}`}>
            Detected Signal: “{signal.headline}”
          </p>
        </div>
        <div className="text-right min-w-[120px]">
          <div className="text-[10px] text-zinc-500 font-black uppercase mb-2 tracking-widest">Est. Opportunity</div>
          {dossier ? (
            <div className={`text-4xl font-black flex items-center justify-end animate-in fade-in zoom-in-95 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              <DollarSign className="w-8 h-8 text-orange-500 -mr-1" />
              {(dossier.pricingStrategy.estimatedValue / 1000).toFixed(0)}k
            </div>
          ) : <SkeletonPulse className="w-32 h-10 ml-auto" />}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Executive Summary */}
          <section className="space-y-4">
            <div className={`flex items-center gap-2 font-bold uppercase tracking-widest text-[10px] ${isDarkMode ? 'text-zinc-400' : 'text-gray-500'}`}>
              <FileText className="w-4 h-4 text-orange-500" />
              Strategic Briefing
            </div>
            <div className={`p-8 rounded-[2rem] border leading-relaxed italic text-lg shadow-inner relative overflow-hidden ${isDarkMode ? 'bg-white/5 border-white/5 text-zinc-200' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
              {displaySummary}
              {isPending && (
                <div className={`absolute inset-0 flex items-end justify-center pb-4 ${isDarkMode ? 'bg-gradient-to-t from-[#0a0a0a]/50 to-transparent' : 'bg-gradient-to-t from-white/50 to-transparent'}`}>
                  <span className="flex items-center gap-2 text-[10px] font-black text-orange-500 animate-pulse">
                    <Loader2 className="w-3 h-3 animate-spin" /> ENHANCING WITH ACCOUNT INTEL
                  </span>
                </div>
              )}
            </div>
          </section>

          {/* Recommended Bundle */}
          <section className="space-y-6">
            <div className={`flex items-center gap-2 font-bold uppercase tracking-widest text-[10px] ${isDarkMode ? 'text-zinc-400' : 'text-gray-500'}`}>
              <Package className="w-4 h-4 text-orange-500" />
              Product Configuration
            </div>
            <div className={`overflow-hidden rounded-[2rem] border ${isDarkMode ? 'border-white/5' : 'border-gray-200'}`}>
              <table className="w-full text-left text-sm">
                <thead className={`font-bold uppercase tracking-wider text-[10px] ${isDarkMode ? 'bg-white/5 text-zinc-500' : 'bg-gray-100 text-gray-500'}`}>
                  <tr>
                    <th className="px-8 py-5">SKU</th>
                    <th className="px-8 py-5">Item</th>
                    <th className="px-8 py-5 text-right">Qty</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? 'divide-white/5' : 'divide-gray-200'}`}>
                  {dossier ? dossier.recommendedBundle.map((item, i) => (
                    <tr key={i} className={`animate-in fade-in slide-in-from-left-2 duration-300 ${isDarkMode ? 'hover:bg-white/[0.02]' : 'hover:bg-gray-50'}`} style={{ animationDelay: `${i * 100}ms` }}>
                      <td className="px-8 py-5 font-mono text-orange-400 font-bold">{item.sku}</td>
                      <td className={`px-8 py-5 ${isDarkMode ? 'text-zinc-300' : 'text-gray-700'}`}>{item.description}</td>
                      <td className={`px-8 py-5 text-right font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{item.quantity}</td>
                    </tr>
                  )) : Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-8 py-5"><SkeletonPulse className="w-16 h-4" /></td>
                      <td className="px-8 py-5"><SkeletonPulse className="w-48 h-4" /></td>
                      <td className="px-8 py-5 text-right"><SkeletonPulse className="w-8 h-4 ml-auto" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Pricing Strategy - moved to main content for better layout */}
          <section className={`p-6 rounded-2xl border space-y-4 ${isDarkMode ? 'bg-zinc-900 border-white/5' : 'bg-gray-50 border-gray-200'}`}>
            <div className={`flex items-center gap-2 font-bold uppercase tracking-widest text-[10px] ${isDarkMode ? 'text-zinc-400' : 'text-gray-500'}`}>
              <TrendingUp className="w-4 h-4 text-orange-500" />
              Pricing Strategy
            </div>
            {dossier ? (
              <div className="flex items-start gap-8 animate-in fade-in">
                <div className="flex-1">
                  <div className="text-xs text-zinc-500 mb-1">Recommended Logic</div>
                  <div className={`font-black leading-relaxed ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{dossier.pricingStrategy.logic}</div>
                </div>
                <div className={`flex-shrink-0 text-right border-l pl-8 ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
                  <div className="text-xs text-zinc-500 mb-1">Flex Allowance</div>
                  <div className="text-orange-400 text-4xl font-black">{dossier.pricingStrategy.discount}%</div>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-8">
                <SkeletonPulse className="flex-1 h-16" />
                <SkeletonPulse className="w-24 h-12" />
              </div>
            )}
          </section>
        </div>

        <div className="lg:col-span-1 space-y-6">
          {/* Account Intelligence Module */}
          <section className={`p-5 rounded-2xl border space-y-4 ${isDarkMode ? 'bg-zinc-900 border-white/5' : 'bg-gray-50 border-gray-200'}`}>
            <div className={`flex items-center gap-2 font-bold uppercase tracking-widest text-[10px] ${isDarkMode ? 'text-zinc-400' : 'text-gray-500'}`}>
              <Target className="w-4 h-4 text-orange-500" />
              Account Intelligence
            </div>
            <div className="space-y-6">
              <div className="space-y-3">
                <div className={`flex items-center gap-3 font-bold text-lg leading-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  <Building className="w-5 h-5 text-zinc-500 flex-shrink-0" />
                  {displayAccountName}
                </div>
                <div className="flex flex-col gap-2 pl-8">
                  {dossier ? (
                    <>
                      <a
                        href={dossier.targetWebsite?.startsWith('http') ? dossier.targetWebsite : `https://${dossier.targetWebsite}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-2 text-sm transition-colors animate-in fade-in ${isDarkMode ? 'text-zinc-400 hover:text-orange-400' : 'text-gray-500 hover:text-orange-600'}`}
                      >
                        <Globe className="w-3.5 h-3.5" />
                        {dossier.targetWebsite || 'Website Unavailable'}
                      </a>
                      <a
                        href={dossier.targetLinkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-2 text-sm transition-colors animate-in fade-in ${isDarkMode ? 'text-zinc-400 hover:text-orange-400' : 'text-gray-500 hover:text-orange-600'}`}
                      >
                        <Linkedin className="w-3.5 h-3.5" />
                        LinkedIn Profile
                      </a>
                    </>
                  ) : (
                    <>
                      <SkeletonPulse className="w-32 h-3" />
                      <SkeletonPulse className="w-24 h-3" />
                    </>
                  )}
                  {/* CRITICAL MECHANIC: Display the verified news source headline and link */}
                  <a
                    href={signal.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-orange-500 hover:text-orange-400 transition-colors font-bold mt-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Source: {signal.sourceTitle || 'View Trigger Article'}
                  </a>
                </div>
              </div>

              <div className={`h-px ${isDarkMode ? 'bg-white/5' : 'bg-gray-200'}`} />

              <div className="space-y-3">
                <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Key Stakeholder</div>
                <div className={`flex items-center gap-3 font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  <User className="w-5 h-5 text-zinc-500 flex-shrink-0" />
                  {dossier?.keyPersonName || signal.decisionMaker || <SkeletonPulse className="w-24 h-6" />}
                </div>
                <div className="pl-8">
                  {dossier ? (
                    <a
                      href={dossier.keyPersonLinkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-2 text-sm transition-colors animate-in fade-in ${isDarkMode ? 'text-zinc-400 hover:text-orange-400' : 'text-gray-500 hover:text-orange-600'}`}
                    >
                      <Linkedin className="w-3.5 h-3.5" />
                      Stakeholder LinkedIn
                    </a>
                  ) : <SkeletonPulse className="w-24 h-3" />}
                </div>
              </div>
            </div>
          </section>

          {/* Battlecard */}
          <section className={`p-6 rounded-2xl border space-y-4 relative overflow-hidden ${isDarkMode ? 'bg-orange-600/10 border-orange-500/20' : 'bg-orange-50 border-orange-200'}`}>
            <div className="flex items-center gap-2 text-orange-400 font-bold uppercase tracking-widest text-[10px]">
              <Swords className="w-4 h-4" />
              Competitive Battlecard
            </div>
            {dossier ? (
              <div className="space-y-6 animate-in fade-in duration-1000">
                <div>
                  <div className="text-[10px] font-black text-red-500 uppercase mb-2 tracking-tighter">Competitor Weakness</div>
                  <p className={`text-sm italic leading-relaxed ${isDarkMode ? 'text-zinc-300' : 'text-gray-700'}`}>"{dossier.battlecard.competitorWeakness}"</p>
                </div>
                <div className={`h-px ${isDarkMode ? 'bg-white/5' : 'bg-gray-200'}`} />
                <div>
                  <div className="text-[10px] font-black text-green-500 uppercase mb-2 tracking-tighter">Our Strike Edge</div>
                  <p className={`text-sm font-medium leading-relaxed ${isDarkMode ? 'text-zinc-300' : 'text-gray-700'}`}>"{dossier.battlecard.ourEdge}"</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <SkeletonPulse className="w-full h-12" />
                <div className={`h-px ${isDarkMode ? 'bg-white/5' : 'bg-gray-200'}`} />
                <SkeletonPulse className="w-full h-12" />
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Action Bar */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-7xl px-8 flex gap-4 z-30 animate-in slide-in-from-bottom-8 duration-700">
        <button
          disabled={!dossier}
          className="flex-1 py-5 bg-orange-600 hover:bg-orange-500 text-white font-black rounded-2xl transition-all shadow-2xl shadow-orange-500/30 flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
        >
          {dossier ? 'Push Opportunity to CRM (Salesforce)' : 'Gathering Deployment Specs...'}
          <ChevronRight className="w-5 h-5" />
        </button>
        <button
          disabled={!dossier}
          className={`px-10 py-5 font-bold rounded-2xl border backdrop-blur-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${isDarkMode ? 'bg-white/5 hover:bg-white/10 text-white border-white/10' : 'bg-white/80 hover:bg-white text-gray-900 border-gray-200'}`}
        >
          <MessageSquare className="w-4 h-4" />
          {dossier ? 'Email Rep Briefing' : 'Generating Briefing...'}
        </button>
      </div>
    </div>
  );
};

export default OpportunitiesView;
