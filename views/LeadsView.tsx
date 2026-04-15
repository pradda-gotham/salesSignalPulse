
import React, { useState } from 'react';
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
  Phone,
  Info
} from 'lucide-react';
import { DealDossier, MarketSignal, AuditablePrice } from '../types';
import { priceValue, priceSource, priceConfidence } from '../utils/normalizeDossier';
import { useTheme } from '../contexts/ThemeContext';
import EstimationBreakdownModal from '../components/EstimationBreakdownModal';
import { getVL } from '../utils/vesper';

interface LeadsViewProps {
  signal: MarketSignal | null;
  dossier: DealDossier | null;
  isLoading: boolean;
  error?: string | null;
  onRetry: () => void;
  onBack: () => void;
}

const SkeletonPulse: React.FC<{ className?: string }> = ({ className }) => {
  const { isDarkMode } = useTheme();
  const vl = getVL(isDarkMode);
  return (
    <div className={`animate-pulse ${className}`} style={{ background: vl.chipBg, borderRadius: '4px' }} />
  );
};

const SourceBadge: React.FC<{ source: string; confidence?: number }> = ({ source, confidence }) => {
  const config = source === 'catalog'
    ? { label: 'CATALOG', bg: 'bg-green-500/10 text-green-600 border-green-500/20' }
    : source === 'rate_card'
      ? { label: 'RATE CARD', bg: 'bg-blue-500/10 text-blue-600 border-blue-500/20' }
      : source === 'manual'
        ? { label: 'MANUAL', bg: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20' }
        : { label: 'AI EST.', bg: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' };

  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] text-[9px] font-bold uppercase tracking-wider border ${config.bg}`} title={confidence ? `${confidence}% confidence` : undefined}>
      {config.label}
    </span>
  );
};

const LeadsView: React.FC<LeadsViewProps> = ({ signal, dossier, isLoading, error, onRetry, onBack }) => {
  const { isDarkMode } = useTheme();
  const vl = getVL(isDarkMode);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const hasAuditTrail = !!(dossier?.auditTrail);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center animate-in fade-in duration-500 px-4">
        <div className="w-16 h-16 rounded-[6px] bg-red-500/10 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold mb-2" style={{ fontFamily: "'Newsreader', Georgia, serif", color: vl.textMain }}>Dossier Generation Failed</h2>
          <p className="max-w-md mx-auto text-[13px]" style={{ color: vl.textBody }}>
            {error || "An unexpected error occurred during intelligence gathering."}
          </p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={onBack} 
            className="px-6 py-2.5 rounded-[6px] font-bold text-xs transition-all border"
            style={{ background: vl.surface, color: vl.textMain, borderColor: vl.borderStrong }}
          >
            Back to Signals
          </button>
          <button 
            onClick={onRetry} 
            className="btn-primary px-6 py-2.5 text-xs font-bold flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

  if (!signal) {
    return (
      <div className="text-center py-32 animate-in fade-in">
        <div 
          className="w-16 h-16 rounded-[6px] flex items-center justify-center mx-auto mb-6 border"
          style={{ background: vl.chipBg, borderColor: vl.borderStrong }}
        >
          <Target className="w-8 h-8" style={{ color: vl.textMuted }} />
        </div>
        <h3 className="text-xl font-semibold mb-2" style={{ fontFamily: "'Newsreader', Georgia, serif", color: vl.textMain }}>No Signal Selected</h3>
        <p className="text-[13px] mb-8" style={{ color: vl.textBody }}>Select a signal from the Market Pulse to generate a strategic Dossier.</p>
        <button 
          onClick={onBack} 
          className="px-8 py-3 rounded-[6px] font-bold text-xs border transition-all"
          style={{ background: vl.surface, color: vl.textMain, borderColor: vl.borderStrong }}
        >
          Return to Market Pulse
        </button>
      </div>
    );
  }

  const displayAccountName = dossier?.accountName || signal.headline.split(':')[0] || "Target Account";
  const displaySummary = dossier?.executiveSummary || signal.summary;
  const isPending = !dossier && isLoading;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in slide-in-from-right duration-500 pb-40">

      {/* Back Navigation */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-xs font-semibold transition-colors group mb-2"
        style={{ color: vl.textBody }}
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Signals
      </button>

      {/* Header Section */}
      <div className="flex items-start justify-between border-b pb-8" style={{ borderColor: vl.border }}>
        <div className="space-y-4 flex-1">
          <div className="flex items-center gap-3">
            {/* Status Badge */}
            <div 
              className="px-2.5 py-0.5 rounded-[4px] text-[10px] font-bold uppercase tracking-wider border flex items-center gap-2"
              style={{ background: vl.primarySoft, color: vl.primary, borderColor: isDarkMode ? 'rgba(99,91,255,0.2)' : 'rgba(99,91,255,0.1)' }}
            >
              {isPending && <Loader2 className="w-3 h-3 animate-spin" />}
              {isPending ? 'Gathering Intelligence...' : 'Strategic Dossier Ready'}
            </div>

            {/* Confidence Badge */}
            {dossier ? (
              <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-[4px] text-[10px] font-bold uppercase tracking-wider border animate-in fade-in ${dossier.confidence === 'High'
                ? 'bg-green-500/10 text-green-600 border-green-500/20'
                : 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
                }`}>
                <ShieldCheck className="w-3 h-3" />
                {dossier.confidence} Confidence
              </div>
            ) : <SkeletonPulse className="w-24 h-5 rounded-full" />}
          </div>

          <div>
            <h1 
              className="text-4xl font-semibold tracking-tight mb-2"
              style={{ fontFamily: "'Newsreader', Georgia, serif", color: vl.textMain }}
            >
              {displayAccountName}
            </h1>
            <div className="flex items-center gap-2 text-[15px] italic" style={{ color: vl.textBody }}>
              <span className="opacity-60">Signal Detected:</span>
              <span style={{ color: vl.textMain }}>“{signal.headline}”</span>
            </div>
          </div>
        </div>

        {/* Est. Opportunity Metric */}
        <div className="text-right min-w-[140px]">
          <div className="label-caps mb-2" style={{ color: vl.textMuted }}>
            Est. Opportunity
          </div>
          {dossier ? (
            <div className="group relative inline-block">
              <div
                className={`flex flex-col items-end transition-opacity ${hasAuditTrail ? 'cursor-pointer group-hover:opacity-80' : 'cursor-help'}`}
                onClick={hasAuditTrail ? () => setShowBreakdown(true) : undefined}
              >
                <div className="text-4xl font-mono font-bold flex items-center justify-end" style={{ color: vl.textMain }}>
                  <span style={{ color: vl.primary }} className="mr-1">$</span>
                  {(priceValue(dossier.pricingStrategy.estimatedValue) / 1000).toFixed(0)}k
                </div>
                <div className="mt-1 flex items-center gap-2 justify-end">
                  <SourceBadge
                    source={priceSource(dossier.pricingStrategy.estimatedValue)}
                    confidence={priceConfidence(dossier.pricingStrategy.estimatedValue)}
                  />
                  {hasAuditTrail && (
                    <span className="flex items-center gap-1 text-[9px] font-bold hover:underline cursor-pointer" style={{ color: vl.primary }}>
                      <Info className="w-3 h-3" /> View Breakdown
                    </span>
                  )}
                </div>
              </div>

              {/* Advanced Calculation Popover */}
              <div 
                className="absolute top-full right-0 mt-2 hidden group-hover:block w-[360px] z-50 p-6 rounded-[6px] border shadow-xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200 text-left"
                style={{ background: vl.surface, borderColor: vl.border }}
              >
                <div className="label-caps mb-2" style={{ color: vl.primary }}>
                  Process Transparency
                </div>
                <h4 className="text-sm font-bold mb-4" style={{ color: vl.textMain }}>
                  Bottom-Up AI Scope Modeling
                </h4>

                <div className="space-y-4">
                  <div>
                    <p className="text-xs leading-relaxed" style={{ color: vl.textBody }}>
                      Leadpulse bypassed gross project values to synthesize a purely addressable Component Bill of Materials using explicit project assumptions derived from the signal footprint.
                    </p>
                  </div>

                  {dossier.assumptions?.length > 0 && (
                    <div className="p-3 rounded-[4px] border" style={{ background: vl.surfaceMuted, borderColor: vl.borderStrong }}>
                      <div className="label-caps mb-2" style={{ color: vl.textMuted }}>Driven by Context</div>
                      <ul className="space-y-1.5 list-none p-0 m-0">
                        {dossier.assumptions.slice(0, 2).map((asm, idx) => (
                          <li key={idx} className="text-xs flex gap-2" style={{ color: vl.textBody }}>
                            <span className="font-bold mt-0.5" style={{ color: vl.primary }}>•</span>
                            <span className="leading-relaxed">{asm}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="border-t pt-4" style={{ borderColor: vl.border }}>
                    {(() => {
                      const subtotal = dossier.recommendedBundle.reduce((sum, b) => sum + (b.lineTotal ?? (b.quantity * priceValue(b.unitPrice))), 0);
                      const discountPct = priceValue(dossier.pricingStrategy.discount);
                      const discountAmt = subtotal * (discountPct / 100);
                      const finalValue = priceValue(dossier.pricingStrategy.estimatedValue);
                      
                      return (
                        <div className="space-y-2.5 font-mono text-xs">
                          <div className="flex justify-between items-center">
                            <span style={{ color: vl.textMuted }}>Catalog Match Value:</span>
                            <span className="font-bold" style={{ color: vl.textMain }}>${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </div>
                          
                          {discountPct > 0 && (
                            <div className="flex justify-between items-start text-red-500/80 gap-4 mt-2">
                              <span className="flex-1 text-[11px] leading-tight" title={dossier.pricingStrategy.logic}>
                                Applied Strategy ({discountPct.toFixed(2)}%)<br/>
                                <span className="text-[9px] italic opacity-70 block mt-0.5 truncate">{dossier.pricingStrategy.logic}</span>
                              </span>
                              <span className="font-bold">-${discountAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                          )}
                          
                          <div className="h-px my-3" style={{ background: vl.borderStrong }} />
                          
                          <div className="flex justify-between items-center">
                            <span className="label-caps" style={{ color: vl.textMuted }}>Net Addressable</span>
                            <span className="text-[15px] font-bold" style={{ color: vl.primary }}>
                              ${finalValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          ) : <SkeletonPulse className="w-32 h-10 ml-auto" />}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 mt-6">
        {/* Main Content (Left Column) */}
        <div className="lg:col-span-2 space-y-8">

          {/* Executive Summary */}
          <section className="space-y-3">
            <div className="label-caps flex items-center gap-2" style={{ color: vl.textMuted }}>
              <FileText className="w-4 h-4" style={{ color: vl.primary }} />
              Strategic Briefing
            </div>
            <div 
              className="p-6 rounded-[6px] border text-[14px] leading-relaxed relative overflow-hidden vl-card"
              style={{ background: vl.surface, borderColor: vl.border, color: vl.textBody }}
            >
              {displaySummary}
              {isPending && (
                <div 
                  className="absolute inset-0 flex items-center justify-center backdrop-blur-sm z-10"
                  style={{ background: isDarkMode ? 'rgba(20,20,20,0.8)' : 'rgba(255,255,255,0.8)' }}
                >
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-6 h-6 animate-spin" style={{ color: vl.primary }} />
                    <span className="label-caps animate-pulse" style={{ color: vl.primary }}>Analyzing Opportunity...</span>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Recommended Bundle */}
          <section className="space-y-3">
            <div className="label-caps flex items-center gap-2" style={{ color: vl.textMuted }}>
              <Package className="w-4 h-4" style={{ color: vl.primary }} />
              Product Configuration
            </div>
            <div className="overflow-hidden rounded-[6px] border vl-card" style={{ borderColor: vl.border }}>
              <table className="w-full text-left text-sm border-collapse">
                <thead className="label-caps border-b" style={{ background: vl.tableHeader, color: vl.textMuted, borderColor: vl.border }}>
                  <tr>
                    <th className="px-5 py-3.5 font-bold">SKU</th>
                    <th className="px-5 py-3.5 font-bold">Description</th>
                    <th className="px-5 py-3.5 font-bold text-right">Qty</th>
                    <th className="px-5 py-3.5 font-bold text-right">Unit Price</th>
                    <th className="px-5 py-3.5 font-bold text-right">Line Total</th>
                    <th className="px-5 py-3.5 font-bold text-center">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ divideColor: vl.border }}>
                  {dossier ? dossier.recommendedBundle.map((item, i) => {
                    const up = priceValue(item.unitPrice);
                    const lt = item.lineTotal ?? (item.quantity * up);
                    const src = priceSource(item.unitPrice);
                    const conf = priceConfidence(item.unitPrice);
                    return (
                      <tr key={i} className="animate-in fade-in transition-colors hover-row" style={{ animationDelay: `${i * 100}ms` }}>
                        <td className="px-5 py-3.5 font-mono font-bold text-xs" style={{ color: vl.primary }}>{item.sku}</td>
                        <td className="px-5 py-3.5 text-[13px]" style={{ color: vl.textMain }}>{item.description}</td>
                        <td className="px-5 py-3.5 text-right font-bold text-[13px]" style={{ color: vl.textMain }}>{item.quantity}</td>
                        <td className="px-5 py-3.5 text-right font-mono text-xs" style={{ color: vl.textBody }}>
                          {up > 0 ? `$${up.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono font-bold text-xs" style={{ color: vl.textMain }}>
                          {lt > 0 ? `$${lt.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          {up > 0 ? <SourceBadge source={src} confidence={conf} /> : null}
                        </td>
                      </tr>
                    );
                  }) : Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="border-b" style={{ borderColor: vl.borderStrong }}>
                      <td className="px-5 py-4"><SkeletonPulse className="w-12 h-3.5" /></td>
                      <td className="px-5 py-4"><SkeletonPulse className="w-40 h-3.5" /></td>
                      <td className="px-5 py-4 text-right"><SkeletonPulse className="w-8 h-3.5 ml-auto" /></td>
                      <td className="px-5 py-4 text-right"><SkeletonPulse className="w-16 h-3.5 ml-auto" /></td>
                      <td className="px-5 py-4 text-right"><SkeletonPulse className="w-16 h-3.5 ml-auto" /></td>
                      <td className="px-5 py-4"><SkeletonPulse className="w-12 h-3.5 mx-auto" /></td>
                    </tr>
                  ))}
                </tbody>
                
                {/* Bundle Summary Footer */}
                {dossier && dossier.recommendedBundle.some(b => priceValue(b.unitPrice) > 0) && (
                  <tfoot className="border-t" style={{ borderColor: vl.border, background: vl.surfaceMuted }}>
                    <tr>
                      <td colSpan={4} className="px-5 py-3 text-right text-xs font-semibold" style={{ color: vl.textMuted }}>Subtotal</td>
                      <td className="px-5 py-3 text-right font-mono font-bold text-xs" style={{ color: vl.textMain }}>
                        ${dossier.recommendedBundle.reduce((sum, b) => sum + (b.lineTotal ?? (b.quantity * priceValue(b.unitPrice))), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td />
                    </tr>
                    {priceValue(dossier.pricingStrategy.discount) > 0 && (
                      <tr>
                        <td colSpan={4} className="px-5 py-3 text-right text-xs font-semibold" style={{ color: vl.textMuted }}>
                          Discount ({priceValue(dossier.pricingStrategy.discount).toFixed(2)}%)
                        </td>
                        <td className="px-5 py-3 text-right font-mono font-bold text-xs text-red-500">
                          -${(dossier.recommendedBundle.reduce((sum, b) => sum + (b.lineTotal ?? (b.quantity * priceValue(b.unitPrice))), 0) * priceValue(dossier.pricingStrategy.discount) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td />
                      </tr>
                    )}
                    <tr className="border-t" style={{ borderColor: vl.borderStrong }}>
                      <td colSpan={4} className="px-5 py-3.5 text-right text-xs font-bold" style={{ color: vl.textMain }}>Estimated Value</td>
                      <td className="px-5 py-3.5 text-right font-mono font-bold text-[14px]" style={{ color: vl.primary }}>
                        ${priceValue(dossier.pricingStrategy.estimatedValue).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <SourceBadge source={priceSource(dossier.pricingStrategy.estimatedValue)} confidence={priceConfidence(dossier.pricingStrategy.estimatedValue)} />
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
              {/* Glass Box CTA */}
              {hasAuditTrail && (
                <div className="px-5 py-3 flex items-center justify-between border-t" style={{ borderColor: vl.borderStrong, background: vl.surface }}>
                  <div className="flex items-center gap-2 text-[10px] font-semibold" style={{ color: vl.textMuted }}>
                    <ShieldCheck className="w-3.5 h-3.5" style={{ color: vl.primary }} />
                    Glass Box AI — Deterministically computed
                  </div>
                  <button
                    onClick={() => setShowBreakdown(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] text-[10px] font-bold transition-all border"
                    style={{ color: vl.primary, background: vl.primarySoft, borderColor: isDarkMode ? 'rgba(99,91,255,0.2)' : 'rgba(99,91,255,0.1)' }}
                  >
                    <Info className="w-3 h-3" />
                    How did we calculate this?
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Pricing Strategy */}
          <section className="p-6 rounded-[6px] border space-y-4 vl-card" style={{ borderColor: vl.border }}>
            <div className="label-caps flex items-center gap-2" style={{ color: vl.textMuted }}>
              <TrendingUp className="w-4 h-4" style={{ color: vl.primary }} />
              Pricing Strategy
            </div>
            {dossier ? (
              <div className="flex items-start gap-8 animate-in fade-in mt-4">
                <div className="flex-1">
                  <div className="label-caps mb-1" style={{ color: vl.textMuted }}>Strategy Logic</div>
                  <div className="text-[13px] leading-relaxed font-medium" style={{ color: vl.textMain }}>{dossier.pricingStrategy.logic}</div>
                  {dossier.pricingStrategy.derivation && (
                    <div className="mt-3">
                      <SourceBadge source={dossier.pricingStrategy.derivation === 'catalog_sum' ? 'catalog' : dossier.pricingStrategy.derivation === 'hybrid' ? 'catalog' : 'ai_estimate'} />
                      <span className="ml-2 text-[10px]" style={{ color: vl.textMuted }}>
                        {dossier.pricingStrategy.derivation === 'catalog_sum' ? 'Based on catalog pricing' : dossier.pricingStrategy.derivation === 'hybrid' ? 'Partially catalog-based' : 'AI estimate — set up catalog for accurate pricing'}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-shrink-0 text-right border-l pl-8" style={{ borderColor: vl.border }}>
                  <div className="label-caps mb-1" style={{ color: vl.textMuted }}>Max Discount</div>
                  <div className="text-2xl font-bold" style={{ color: vl.primary }}>{priceValue(dossier.pricingStrategy.discount).toFixed(2)}%</div>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-8 mt-4">
                <SkeletonPulse className="flex-1 h-12" />
                <SkeletonPulse className="w-24 h-12" />
              </div>
            )}
          </section>
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-1 space-y-6">

          {/* Account Intelligence */}
          <section className="p-6 rounded-[6px] border space-y-4 vl-card" style={{ borderColor: vl.border }}>
            <div className="flex items-center justify-between label-caps" style={{ color: vl.textMuted }}>
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4" style={{ color: vl.primary }} />
                Account Intel
              </div>
              {dossier?.isEnriched && (
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] border bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20">
                  <ShieldCheck className="w-3 h-3" /> VERIFIED
                </span>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 font-bold text-base mb-1" style={{ color: vl.textMain }}>
                  <Building className="w-4 h-4" style={{ color: vl.textMuted }} />
                  {dossier?.enrichedCompany?.name || displayAccountName}
                </div>

                {/* Company Links/Info */}
                <div className="pl-6 space-y-2 mt-2">
                  {dossier ? (
                    <>
                      <a href={dossier.enrichedCompany?.domain ? `https://${dossier.enrichedCompany.domain}` : '#'} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[12px] hover:underline" style={{ color: vl.textBody }}>
                        <Globe className="w-3.5 h-3.5" />
                        {dossier.enrichedCompany?.domain || dossier.targetWebsite || 'Website Unavailable'}
                      </a>
                      {(dossier.enrichedCompany?.linkedinUrl || dossier.targetLinkedin) && (
                        <a href={dossier.enrichedCompany?.linkedinUrl || dossier.targetLinkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[12px] hover:underline" style={{ color: vl.textBody }}>
                          <Linkedin className="w-3.5 h-3.5" />
                          LinkedIn Profile
                        </a>
                      )}
                      {dossier.enrichedCompany?.employeeCount && (
                        <div className="text-[12px]" style={{ color: vl.textBody }}>
                          👥 {dossier.enrichedCompany.employeeCount.toLocaleString()} employees
                        </div>
                      )}
                      {dossier.enrichedCompany?.revenue && (
                        <div className="text-[12px]" style={{ color: vl.textBody }}>
                          💰 {dossier.enrichedCompany.revenue}
                        </div>
                      )}
                    </>
                  ) : <SkeletonPulse className="w-32 h-4" />}
                </div>
              </div>

              <div className="h-px w-full" style={{ background: vl.border }} />

              {/* Source Link */}
              {signal.sourceUrl ? (
                <a href={signal.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[12px] font-bold hover:underline" style={{ color: vl.primary }}>
                  <ExternalLink className="w-3.5 h-3.5" />
                  Source: {signal.sourceTitle}
                </a>
              ) : (
                <div className="flex items-center gap-2 text-[12px] font-bold" style={{ color: vl.textMuted }}>
                  <ExternalLink className="w-3.5 h-3.5 opacity-50" />
                  Source: {signal.sourceTitle} (Unpublished)
                </div>
              )}
            </div>
          </section>

          {/* Stakeholders */}
          <section className="p-6 rounded-[6px] border space-y-4 vl-card" style={{ borderColor: vl.border }}>
            <div className="label-caps mb-2" style={{ color: vl.textMuted }}>
              Stakeholders
            </div>

            {dossier?.enrichedContacts && dossier.enrichedContacts.length > 0 ? (
              <div className="space-y-3">
                {dossier.enrichedContacts.map((contact, idx) => (
                  <div key={idx} className="p-3 rounded-[4px] border" style={{ 
                    background: contact.isPrimary ? vl.primarySoft : vl.surfaceMuted, 
                    borderColor: contact.isPrimary ? (isDarkMode ? 'rgba(99,91,255,0.2)' : 'rgba(99,91,255,0.1)') : vl.borderStrong 
                  }}>
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <div className="text-[13px] font-bold" style={{ color: vl.textMain }}>{contact.name}</div>
                        <div className="text-[11px]" style={{ color: vl.textMuted }}>{contact.title}</div>
                      </div>
                      {contact.isPrimary && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-[4px] border" style={{ color: vl.primary, background: vl.primarySoft, borderColor: isDarkMode ? 'rgba(99,91,255,0.2)' : 'rgba(99,91,255,0.1)' }}>KEY</span>
                      )}
                    </div>

                    <div className="space-y-1.5 mt-2.5">
                      {contact.email && (
                        <a href={`mailto:${contact.email}`} className="flex items-center gap-1.5 text-[11px] hover:underline" style={{ color: vl.textBody }}>
                          <Mail className="w-3.5 h-3.5" /> {contact.email}
                        </a>
                      )}
                      {contact.linkedinUrl && (
                        <a href={contact.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[11px] hover:underline" style={{ color: vl.textBody }}>
                          <Linkedin className="w-3.5 h-3.5" /> LinkedIn Profile
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-4 rounded-[4px] border flex items-center gap-3" style={{ background: vl.surfaceMuted, borderColor: vl.borderStrong }}>
                  <User className="w-8 h-8 p-1.5 rounded-[4px]" style={{ background: vl.chipBg, color: vl.textMuted }} />
                  <div>
                    <div className="text-[13px] font-bold" style={{ color: vl.textMain }}>
                      {dossier?.keyPersonName || signal.decisionMaker || <SkeletonPulse className="w-24 h-4" />}
                    </div>
                    <div className="text-[11px]" style={{ color: vl.textMuted }}>Target Executive</div>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Battlecard */}
          <section className="p-6 rounded-[6px] border space-y-4 vl-card" style={{ borderColor: vl.border }}>
            <div className="label-caps flex items-center gap-2" style={{ color: vl.textMuted }}>
              <Swords className="w-4 h-4" style={{ color: vl.primary }} />
              Competitive Edge
            </div>

            {dossier ? (
              <div className="space-y-5 animate-in fade-in mt-4">
                <div>
                  <div className="text-[10px] font-black uppercase mb-1 tracking-wider flex items-center gap-1 text-[#EF4444]">
                    <ShieldAlert className="w-3 h-3" /> Their Weakness
                  </div>
                  <p className="text-[12px] leading-relaxed italic" style={{ color: vl.textBody }}>"{dossier.battlecard.competitorWeakness}"</p>
                </div>
                <div className="h-px w-full" style={{ background: vl.borderStrong }} />
                <div>
                  <div className="text-[10px] font-black uppercase mb-1 tracking-wider flex items-center gap-1 text-[#10B981]">
                    <ShieldCheck className="w-3 h-3" /> Our Win Angle
                  </div>
                  <p className="text-[13px] font-semibold leading-relaxed" style={{ color: vl.textMain }}>"{dossier.battlecard.ourEdge}"</p>
                </div>
              </div>
            ) : (
               <div className="space-y-4 mt-4">
                <SkeletonPulse className="w-full h-10" />
                <SkeletonPulse className="w-full h-10" />
              </div>
            )}
          </section>

        </div>
      </div>

      {/* Floating Action Bar */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-8 duration-700">
        <div 
          className="flex items-center gap-3 p-2 pl-5 rounded-[6px] border shadow-2xl backdrop-blur-md"
          style={{ background: isDarkMode ? 'rgba(20,20,20,0.95)' : 'rgba(255,255,255,0.95)', borderColor: vl.border }}
        >
          <div className="label-caps mr-2" style={{ color: vl.textMuted }}>
            {dossier ? 'Action Ready' : 'Processing...'}
          </div>

          <button
            disabled={!dossier}
            className="px-5 py-2.5 rounded-[4px] text-xs font-bold border transition-all flex items-center gap-2 disabled:opacity-50"
            style={{ borderColor: vl.borderStrong, color: vl.textMain, background: vl.surface }}
          >
            <MessageSquare className="w-3.5 h-3.5" /> Email Briefing
          </button>

          <button
            disabled={!dossier}
            className="btn-primary px-6 py-2.5 rounded-[4px] text-xs font-bold transition-all shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Push to CRM <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Glass Box Estimation Breakdown Modal */}
      {showBreakdown && dossier?.auditTrail && (
        <EstimationBreakdownModal
          auditTrail={dossier.auditTrail}
          estimatedValue={dossier.pricingStrategy.estimatedValue}
          onClose={() => setShowBreakdown(false)}
        />
      )}

    </div>
  );
};

export default LeadsView;
