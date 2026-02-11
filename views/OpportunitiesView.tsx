
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
  Building,
  CheckCircle2,
  Mail,
  Phone
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
    <div className={`animate-pulse rounded-md ${isDarkMode ? 'bg-white/5' : 'bg-slate-100'} ${className}`} />
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
          <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-[#1B1D21]'}`}>Dossier Generation Failed</h2>
          <p className={`max-w-md mx-auto ${isDarkMode ? 'text-zinc-500' : 'text-[#808191]'}`}>
            {error || "An unexpected error occurred during intelligence gathering."}
          </p>
        </div>
        <div className="flex gap-4">
          <button onClick={onBack} className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all border ${isDarkMode ? 'bg-white/5 hover:bg-white/10 text-white border-white/5' : 'bg-white hover:bg-slate-50 text-[#1B1D21] border-slate-200'}`}>
            Back to Signals
          </button>
          <button onClick={onRetry} className="px-6 py-2.5 bg-[#6C5DD3] hover:bg-[#5B4EC2] text-white rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-[#6C5DD3]/20">
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

  if (!signal) {
    return (
      <div className="text-center py-32 animate-in fade-in">
        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 border ${isDarkMode ? 'bg-[#141414] border-white/5' : 'bg-white border-slate-200'}`}>
          <Target className={`w-10 h-10 ${isDarkMode ? 'text-zinc-600' : 'text-slate-300'}`} />
        </div>
        <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-[#1B1D21]'}`}>No Signal Selected</h3>
        <p className={`text-sm mb-8 ${isDarkMode ? 'text-zinc-500' : 'text-[#808191]'}`}>Select a signal from the Market Pulse to generate a strategic Dossier.</p>
        <button onClick={onBack} className={`px-8 py-3 rounded-xl font-bold text-sm border transition-all ${isDarkMode ? 'bg-white/5 hover:bg-white/10 text-white border-white/5' : 'bg-white hover:bg-slate-50 text-[#1B1D21] border-slate-200'}`}>
          Return to Market Pulse
        </button>
      </div>
    );
  }

  const displayAccountName = dossier?.accountName || signal.headline.split(':')[0] || "Target Account";
  const displaySummary = dossier?.executiveSummary || signal.summary;
  const isPending = !dossier && isLoading;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in slide-in-from-right duration-500 pb-40 font-sans">

      {/* Back Navigation */}
      <button
        onClick={onBack}
        className={`flex items-center gap-2 text-sm font-medium transition-colors group ${isDarkMode ? 'text-zinc-500 hover:text-white' : 'text-[#808191] hover:text-[#1B1D21]'}`}
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Signals
      </button>

      {/* Header Section */}
      <div className={`flex items-start justify-between border-b pb-8 ${isDarkMode ? 'border-white/5' : 'border-slate-200/60'}`}>
        <div className="space-y-4 flex-1">
          <div className="flex items-center gap-3">
            {/* Status Badge */}
            <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border flex items-center gap-2 ${isPending
                ? 'bg-[#6C5DD3]/10 text-[#6C5DD3] border-[#6C5DD3]/20'
                : 'bg-[#6C5DD3]/10 text-[#6C5DD3] border-[#6C5DD3]/20'
              }`}>
              {isPending && <Loader2 className="w-3 h-3 animate-spin" />}
              {isPending ? 'Gathering Intelligence...' : 'Strategic Dossier Ready'}
            </div>

            {/* Confidence Badge */}
            {dossier ? (
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border animate-in fade-in ${dossier.confidence === 'High'
                  ? 'bg-green-500/10 text-green-600 border-green-500/20'
                  : 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
                }`}>
                <ShieldCheck className="w-3 h-3" />
                {dossier.confidence} Confidence
              </div>
            ) : <SkeletonPulse className="w-24 h-6 rounded-full" />}
          </div>

          <div>
            <h1 className={`text-4xl font-bold tracking-tight mb-2 ${isDarkMode ? 'text-white' : 'text-[#1B1D21]'}`}>
              {displayAccountName}
            </h1>
            <div className={`flex items-center gap-2 text-lg italic ${isDarkMode ? 'text-zinc-400' : 'text-[#808191]'}`}>
              <span className="opacity-50">Signal Detected:</span>
              <span className={isDarkMode ? 'text-zinc-300' : 'text-[#50515e]'}>“{signal.headline}”</span>
            </div>
          </div>
        </div>

        {/* Est. Opportunity Metric */}
        <div className="text-right min-w-[140px]">
          <div className={`text-[10px] font-bold uppercase mb-2 tracking-widest ${isDarkMode ? 'text-zinc-500' : 'text-[#808191]'}`}>
            Est. Opportunity
          </div>
          {dossier ? (
            <div className={`text-4xl font-mono font-bold flex items-center justify-end animate-in fade-in zoom-in-95 ${isDarkMode ? 'text-white' : 'text-[#1B1D21]'}`}>
              <span className="text-[#6C5DD3] mr-1">$</span>
              {(dossier.pricingStrategy.estimatedValue / 1000).toFixed(0)}k
            </div>
          ) : <SkeletonPulse className="w-32 h-10 ml-auto" />}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content (Left Column) */}
        <div className="lg:col-span-2 space-y-8">

          {/* Executive Summary */}
          <section className="space-y-4">
            <div className={`flex items-center gap-2 font-bold uppercase tracking-widest text-[10px] ${isDarkMode ? 'text-zinc-500' : 'text-[#808191]'}`}>
              <FileText className="w-4 h-4 text-[#6C5DD3]" />
              Strategic Briefing
            </div>
            <div className={`p-8 rounded-2xl border leading-relaxed text-[15px] shadow-sm relative overflow-hidden ${isDarkMode ? 'bg-[#141414] border-white/5 text-zinc-300' : 'bg-white border-slate-200/60 text-[#50515e]'
              }`}>
              {displaySummary}
              {isPending && (
                <div className={`absolute inset-0 flex items-center justify-center ${isDarkMode ? 'bg-[#141414]/80' : 'bg-white/80'}`}>
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 text-[#6C5DD3] animate-spin" />
                    <span className="text-xs font-bold text-[#6C5DD3] animate-pulse">ANALYZING OPPORTUNITY...</span>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Recommended Bundle */}
          <section className="space-y-4">
            <div className={`flex items-center gap-2 font-bold uppercase tracking-widest text-[10px] ${isDarkMode ? 'text-zinc-500' : 'text-[#808191]'}`}>
              <Package className="w-4 h-4 text-[#6C5DD3]" />
              Product Configuration
            </div>
            <div className={`overflow-hidden rounded-2xl border shadow-sm ${isDarkMode ? 'bg-[#141414] border-white/5' : 'bg-white border-slate-200/60'}`}>
              <table className="w-full text-left text-sm">
                <thead className={`font-bold uppercase tracking-wider text-[10px] border-b ${isDarkMode ? 'bg-white/5 text-zinc-500 border-white/5' : 'bg-slate-50/50 text-[#808191] border-slate-100'}`}>
                  <tr>
                    <th className="px-6 py-4">SKU</th>
                    <th className="px-6 py-4">Description</th>
                    <th className="px-6 py-4 text-right">Qty</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? 'divide-white/5' : 'divide-slate-100'}`}>
                  {dossier ? dossier.recommendedBundle.map((item, i) => (
                    <tr key={i} className={`animate-in fade-in slide-in-from-left-2 duration-300 ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`} style={{ animationDelay: `${i * 100}ms` }}>
                      <td className="px-6 py-4 font-mono text-[#6C5DD3] font-bold text-xs">{item.sku}</td>
                      <td className={`px-6 py-4 ${isDarkMode ? 'text-zinc-300' : 'text-[#1B1D21]'}`}>{item.description}</td>
                      <td className={`px-6 py-4 text-right font-bold ${isDarkMode ? 'text-white' : 'text-[#1B1D21]'}`}>{item.quantity}</td>
                    </tr>
                  )) : Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4"><SkeletonPulse className="w-16 h-4" /></td>
                      <td className="px-6 py-4"><SkeletonPulse className="w-48 h-4" /></td>
                      <td className="px-6 py-4 text-right"><SkeletonPulse className="w-8 h-4 ml-auto" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Pricing Strategy */}
          <section className={`p-6 rounded-2xl border space-y-4 shadow-sm ${isDarkMode ? 'bg-[#141414] border-white/5' : 'bg-white border-slate-200/60'}`}>
            <div className={`flex items-center gap-2 font-bold uppercase tracking-widest text-[10px] ${isDarkMode ? 'text-zinc-500' : 'text-[#808191]'}`}>
              <TrendingUp className="w-4 h-4 text-[#6C5DD3]" />
              Pricing Strategy
            </div>
            {dossier ? (
              <div className="flex items-start gap-8 animate-in fade-in">
                <div className="flex-1">
                  <div className={`text-xs font-semibold mb-1 ${isDarkMode ? 'text-zinc-500' : 'text-[#808191]'}`}>Strategy Logic</div>
                  <div className={`text-sm leading-relaxed font-medium ${isDarkMode ? 'text-zinc-300' : 'text-[#1B1D21]'}`}>{dossier.pricingStrategy.logic}</div>
                </div>
                <div className={`flex-shrink-0 text-right border-l pl-8 ${isDarkMode ? 'border-white/10' : 'border-slate-100'}`}>
                  <div className={`text-xs font-semibold mb-1 ${isDarkMode ? 'text-zinc-500' : 'text-[#808191]'}`}>Max Discount</div>
                  <div className="text-[#6C5DD3] text-3xl font-bold">{dossier.pricingStrategy.discount}%</div>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-8">
                <SkeletonPulse className="flex-1 h-12" />
                <SkeletonPulse className="w-24 h-12" />
              </div>
            )}
          </section>
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-1 space-y-6">

          {/* Account Intelligence */}
          <section className={`p-6 rounded-2xl border space-y-5 shadow-sm ${isDarkMode ? 'bg-[#141414] border-white/5' : 'bg-white border-slate-200/60'}`}>
            <div className={`flex items-center justify-between font-bold uppercase tracking-widest text-[10px] ${isDarkMode ? 'text-zinc-500' : 'text-[#808191]'}`}>
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-[#6C5DD3]" />
                Account Intel
              </div>
              {dossier?.isEnriched && (
                <span className="flex items-center gap-1 text-[#10B981] bg-[#10B981]/10 px-1.5 py-0.5 rounded border border-[#10B981]/20">
                  <ShieldCheck className="w-3 h-3" /> VERIFIED
                </span>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <div className={`flex items-center gap-2 font-bold text-lg mb-1 ${isDarkMode ? 'text-white' : 'text-[#1B1D21]'}`}>
                  <Building className={`w-4 h-4 ${isDarkMode ? 'text-zinc-500' : 'text-[#808191]'}`} />
                  {dossier?.enrichedCompany?.name || displayAccountName}
                </div>

                {/* Company Links/Info */}
                <div className="pl-6 space-y-2 mt-2">
                  {dossier ? (
                    <>
                      <a href={dossier.enrichedCompany?.domain ? `https://${dossier.enrichedCompany.domain}` : '#'} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 text-xs hover:text-[#6C5DD3] transition-colors ${isDarkMode ? 'text-zinc-400' : 'text-[#50515e]'}`}>
                        <Globe className="w-3.5 h-3.5" />
                        {dossier.enrichedCompany?.domain || dossier.targetWebsite || 'Website Unavailable'}
                      </a>
                      {(dossier.enrichedCompany?.linkedinUrl || dossier.targetLinkedin) && (
                        <a href={dossier.enrichedCompany?.linkedinUrl || dossier.targetLinkedin} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 text-xs hover:text-[#6C5DD3] transition-colors ${isDarkMode ? 'text-zinc-400' : 'text-[#50515e]'}`}>
                          <Linkedin className="w-3.5 h-3.5" />
                          LinkedIn Profile
                        </a>
                      )}
                      {dossier.enrichedCompany?.employeeCount && (
                        <div className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-[#808191]'}`}>
                          👥 {dossier.enrichedCompany.employeeCount.toLocaleString()} employees
                        </div>
                      )}
                      {dossier.enrichedCompany?.revenue && (
                        <div className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-[#808191]'}`}>
                          💰 {dossier.enrichedCompany.revenue}
                        </div>
                      )}
                    </>
                  ) : <SkeletonPulse className="w-32 h-4" />}
                </div>
              </div>

              <div className={`h-px ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`} />

              {/* Source Link */}
              <a href={signal.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs font-bold text-[#6C5DD3] hover:underline">
                <ExternalLink className="w-3.5 h-3.5" />
                Source: {signal.sourceTitle}
              </a>
            </div>
          </section>

          {/* Stakeholders */}
          <section className={`p-6 rounded-2xl border space-y-4 shadow-sm ${isDarkMode ? 'bg-[#141414] border-white/5' : 'bg-white border-slate-200/60'}`}>
            <div className={`font-bold uppercase tracking-widest text-[10px] mb-2 ${isDarkMode ? 'text-zinc-500' : 'text-[#808191]'}`}>
              Stakeholders
            </div>

            {dossier?.enrichedContacts && dossier.enrichedContacts.length > 0 ? (
              <div className="space-y-3">
                {dossier.enrichedContacts.map((contact, idx) => (
                  <div key={idx} className={`p-3 rounded-xl border ${contact.isPrimary
                    ? isDarkMode ? 'bg-[#6C5DD3]/10 border-[#6C5DD3]/20' : 'bg-[#6C5DD3]/5 border-[#6C5DD3]/10'
                    : isDarkMode ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'
                    }`}>
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <div className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-[#1B1D21]'}`}>{contact.name}</div>
                        <div className={`text-[10px] ${isDarkMode ? 'text-zinc-400' : 'text-[#50515e]'}`}>{contact.title}</div>
                      </div>
                      {contact.isPrimary && (
                        <span className="text-[9px] font-black text-[#6C5DD3] bg-[#6C5DD3]/10 border border-[#6C5DD3]/20 px-1.5 py-0.5 rounded">KEY</span>
                      )}
                    </div>

                    <div className="space-y-1 mt-2">
                      {contact.email && (
                        <a href={`mailto:${contact.email}`} className={`flex items-center gap-1.5 text-[10px] hover:text-[#6C5DD3] transition-colors ${isDarkMode ? 'text-zinc-500' : 'text-[#808191]'}`}>
                          <Mail className="w-3 h-3" /> {contact.email}
                        </a>
                      )}
                      {contact.linkedinUrl && (
                        <a href={contact.linkedinUrl} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-1.5 text-[10px] hover:text-[#6C5DD3] transition-colors ${isDarkMode ? 'text-zinc-500' : 'text-[#808191]'}`}>
                          <Linkedin className="w-3 h-3" /> LinkedIn Profile
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                  <div className="flex items-center gap-3">
                    <User className={`w-8 h-8 p-1.5 rounded-full ${isDarkMode ? 'bg-zinc-800 text-zinc-500' : 'bg-white text-slate-400'}`} />
                    <div>
                      <div className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-[#1B1D21]'}`}>
                        {dossier?.keyPersonName || signal.decisionMaker || <SkeletonPulse className="w-24 h-4" />}
                      </div>
                      <div className={`text-[10px] ${isDarkMode ? 'text-zinc-500' : 'text-[#808191]'}`}>Target Executive</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Battlecard */}
          <section className={`p-6 rounded-2xl border space-y-5 relative overflow-hidden shadow-sm ${isDarkMode ? 'bg-[#141414] border-white/5' : 'bg-white border-slate-200/60'}`}>
            <div className={`flex items-center gap-2 font-bold uppercase tracking-widest text-[10px] ${isDarkMode ? 'text-zinc-500' : 'text-[#808191]'}`}>
              <Swords className="w-4 h-4 text-[#6C5DD3]" />
              Competitive Edge
            </div>

            {dossier ? (
              <div className="space-y-5 animate-in fade-in">
                <div>
                  <div className="text-[10px] font-black text-[#FF5F5F] uppercase mb-1 tracking-wide flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" /> Their Weakness
                  </div>
                  <p className={`text-xs leading-relaxed italic ${isDarkMode ? 'text-zinc-300' : 'text-[#50515e]'}`}>"{dossier.battlecard.competitorWeakness}"</p>
                </div>
                <div className={`h-px ${isDarkMode ? 'bg-white/5' : 'bg-slate-100'}`} />
                <div>
                  <div className="text-[10px] font-black text-[#10B981] uppercase mb-1 tracking-wide flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Our Win Angle
                  </div>
                  <p className={`text-xs font-semibold leading-relaxed ${isDarkMode ? 'text-zinc-200' : 'text-[#1B1D21]'}`}>"{dossier.battlecard.ourEdge}"</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <SkeletonPulse className="w-full h-10" />
                <SkeletonPulse className="w-full h-10" />
              </div>
            )}
          </section>

        </div>
      </div>

      {/* Floating Action Bar (Pill Style) */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-8 duration-700">
        <div className={`flex items-center gap-3 p-2 pl-4 rounded-full border shadow-xl backdrop-blur-md ${isDarkMode ? 'bg-[#141414]/90 border-white/10' : 'bg-white/90 border-slate-200'}`}>
          <div className={`text-xs font-bold mr-2 ${isDarkMode ? 'text-zinc-400' : 'text-[#808191]'}`}>
            {dossier ? 'Action Ready' : 'Processing...'}
          </div>

          <button
            disabled={!dossier}
            className={`px-5 py-2.5 rounded-full text-xs font-bold border transition-all flex items-center gap-2 ${isDarkMode
                ? 'border-white/10 hover:bg-white/5 text-white disabled:opacity-50'
                : 'border-slate-200 hover:bg-slate-50 text-[#1B1D21] disabled:opacity-50'
              }`}
          >
            <MessageSquare className="w-3.5 h-3.5" /> Email Briefing
          </button>

          <button
            disabled={!dossier}
            className="px-6 py-2.5 bg-[#6C5DD3] hover:bg-[#5A4DBF] text-white rounded-full text-xs font-bold transition-all shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Push to CRM <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

    </div>
  );
};

export default OpportunitiesView;
