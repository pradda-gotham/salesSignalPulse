import React, { useState } from 'react';
import { X, Newspaper, Package, Calculator, AlertTriangle, ChevronDown, ChevronUp, Info, ShieldCheck, Lightbulb } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { EstimationAuditTrail, AuditablePrice } from '../types';
import { priceValue, priceSource } from '../utils/normalizeDossier';

interface EstimationBreakdownModalProps {
  auditTrail: EstimationAuditTrail;
  estimatedValue: number | AuditablePrice;
  onClose: () => void;
}

const ConfidenceBadge: React.FC<{ confidence: string }> = ({ confidence }) => {
  const config = confidence === 'high'
    ? { bg: 'bg-green-500/10 text-green-600 border-green-500/20', label: 'HIGH' }
    : confidence === 'medium'
      ? { bg: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20', label: 'MED' }
      : { bg: 'bg-red-500/10 text-red-500 border-red-500/20', label: 'LOW' };
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${config.bg}`}>
      {config.label}
    </span>
  );
};

const SourceBadge: React.FC<{ source: string }> = ({ source }) => {
  const config = source === 'catalog'
    ? { label: 'CATALOG', bg: 'bg-green-500/10 text-green-600 border-green-500/20' }
    : source === 'rate_card'
      ? { label: 'RATE CARD', bg: 'bg-blue-500/10 text-blue-600 border-blue-500/20' }
      : source === 'manual'
        ? { label: 'MANUAL', bg: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20' }
        : { label: 'AI EST.', bg: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' };
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${config.bg}`}>
      {config.label}
    </span>
  );
};

const EstimationBreakdownModal: React.FC<EstimationBreakdownModalProps> = ({ auditTrail, estimatedValue, onClose }) => {
  const { isDarkMode } = useTheme();
  const [expandedLines, setExpandedLines] = useState<Set<number>>(new Set([0]));

  const toggleLine = (idx: number) => {
    setExpandedLines(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const pi = auditTrail.projectIntelligence;
  const cardBg = isDarkMode ? 'bg-[#141414] border-white/5' : 'bg-white border-slate-200/60';
  const sectionTitle = `flex items-center gap-2 font-bold uppercase tracking-widest text-[10px] mb-3 ${isDarkMode ? 'text-zinc-500' : 'text-[#808191]'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-8 px-4" onClick={onClose}>
      <div
        className={`w-full max-w-3xl rounded-2xl border shadow-2xl ${cardBg} animate-in fade-in zoom-in-95 duration-300`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`}>
          <div>
            <h2 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-[#1B1D21]'}`}>Estimation Breakdown</h2>
            <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-zinc-500' : 'text-[#808191]'}`}>
              How we calculated ${priceValue(estimatedValue).toLocaleString()} estimated opportunity
            </p>
          </div>
          <button onClick={onClose} className={`p-2 rounded-xl transition-colors ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">

          {/* ===== SIGNAL INTELLIGENCE ===== */}
          <section>
            <div className={sectionTitle}>
              <Newspaper className="w-4 h-4 text-[#6C5DD3]" />
              Signal Intelligence
            </div>
            <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-white/[0.02] border-white/5' : 'bg-slate-50 border-slate-100'}`}>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className={isDarkMode ? 'text-zinc-500' : 'text-[#808191]'}>Industry:</span>
                  <span className={`ml-2 font-medium ${isDarkMode ? 'text-white' : 'text-[#1B1D21]'}`}>{pi.industry}</span>
                </div>
                <div>
                  <span className={isDarkMode ? 'text-zinc-500' : 'text-[#808191]'}>Project Type:</span>
                  <span className={`ml-2 font-medium ${isDarkMode ? 'text-white' : 'text-[#1B1D21]'}`}>{pi.projectType}</span>
                </div>
                {pi.location && (
                  <div>
                    <span className={isDarkMode ? 'text-zinc-500' : 'text-[#808191]'}>Location:</span>
                    <span className={`ml-2 font-medium ${isDarkMode ? 'text-white' : 'text-[#1B1D21]'}`}>{pi.location}</span>
                  </div>
                )}
                {pi.timeline && (
                  <div>
                    <span className={isDarkMode ? 'text-zinc-500' : 'text-[#808191]'}>Timeline:</span>
                    <span className={`ml-2 font-medium ${isDarkMode ? 'text-white' : 'text-[#1B1D21]'}`}>{pi.timeline}</span>
                  </div>
                )}
                {pi.totalBudget && (
                  <div className="col-span-2">
                    <span className={isDarkMode ? 'text-zinc-500' : 'text-[#808191]'}>Project Budget:</span>
                    <span className={`ml-2 font-bold text-[#6C5DD3]`}>
                      {pi.totalBudget.currency} ${pi.totalBudget.value.toLocaleString()}
                    </span>
                    <span className={`ml-1 text-[10px] ${isDarkMode ? 'text-zinc-600' : 'text-[#aaa]'}`}>({pi.totalBudget.source})</span>
                  </div>
                )}
              </div>

              {/* Scale Metrics */}
              {pi.scaleMetrics.length > 0 && (
                <div className={`mt-3 pt-3 border-t ${isDarkMode ? 'border-white/5' : 'border-slate-200/60'}`}>
                  <div className={`text-[10px] font-semibold uppercase mb-2 ${isDarkMode ? 'text-zinc-500' : 'text-[#808191]'}`}>Extracted Scale Metrics</div>
                  <div className="flex flex-wrap gap-2">
                    {pi.scaleMetrics.map((m, i) => (
                      <div key={i} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`} title={m.source}>
                        <span className="font-bold text-[#6C5DD3]">{m.value}</span>
                        <span className={isDarkMode ? 'text-zinc-400' : 'text-[#50515e]'}>{m.unit}</span>
                        <ConfidenceBadge confidence={m.confidence} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ===== PRODUCT MAPPING (BOM) ===== */}
          <section>
            <div className={sectionTitle}>
              <Package className="w-4 h-4 text-[#6C5DD3]" />
              Product Mapping — Bill of Materials
            </div>
            <div className={`rounded-xl border overflow-hidden ${isDarkMode ? 'border-white/5' : 'border-slate-200/60'}`}>
              <table className="w-full text-left text-sm">
                <thead className={`font-bold uppercase tracking-wider text-[10px] border-b ${isDarkMode ? 'bg-white/5 text-zinc-500 border-white/5' : 'bg-slate-50/50 text-[#808191] border-slate-100'}`}>
                  <tr>
                    <th className="px-4 py-3 w-8"></th>
                    <th className="px-4 py-3">SKU</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3 text-right">Qty</th>
                    <th className="px-4 py-3 text-right">Rate</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3 text-center">Source</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? 'divide-white/5' : 'divide-slate-100'}`}>
                  {auditTrail.bundleDerivation.map((item, idx) => {
                    const isExpanded = expandedLines.has(idx);
                    return (
                      <React.Fragment key={idx}>
                        <tr
                          className={`cursor-pointer transition-colors ${isDarkMode ? 'hover:bg-white/[0.03]' : 'hover:bg-slate-50/70'}`}
                          onClick={() => toggleLine(idx)}
                        >
                          <td className="px-4 py-3">
                            {isExpanded
                              ? <ChevronUp className={`w-3.5 h-3.5 ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`} />
                              : <ChevronDown className={`w-3.5 h-3.5 ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`} />
                            }
                          </td>
                          <td className="px-4 py-3 font-mono text-[#6C5DD3] font-bold text-xs">{item.sku}</td>
                          <td className={`px-4 py-3 ${isDarkMode ? 'text-zinc-300' : 'text-[#1B1D21]'}`}>{item.description}</td>
                          <td className={`px-4 py-3 text-right font-bold ${isDarkMode ? 'text-white' : 'text-[#1B1D21]'}`}>{item.quantity}</td>
                          <td className="px-4 py-3 text-right font-mono text-xs">
                            {item.unitPrice.value > 0
                              ? `$${item.unitPrice.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                              : <span className={isDarkMode ? 'text-zinc-600' : 'text-slate-300'}>N/A</span>
                            }
                          </td>
                          <td className={`px-4 py-3 text-right font-mono font-bold text-xs ${isDarkMode ? 'text-white' : 'text-[#1B1D21]'}`}>
                            {item.lineTotal > 0
                              ? `$${item.lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                              : '—'
                            }
                          </td>
                          <td className="px-4 py-3 text-center">
                            <SourceBadge source={item.unitPrice.source} />
                          </td>
                        </tr>
                        {/* Expanded reasoning row */}
                        {isExpanded && (
                          <tr className={isDarkMode ? 'bg-[#6C5DD3]/5' : 'bg-[#6C5DD3]/[0.02]'}>
                            <td></td>
                            <td colSpan={6} className="px-4 py-3">
                              <div className="space-y-2">
                                {/* Reasoning */}
                                <div className="flex items-start gap-2">
                                  <Lightbulb className="w-3.5 h-3.5 text-[#6C5DD3] mt-0.5 flex-shrink-0" />
                                  <div>
                                    <div className={`text-[10px] font-semibold uppercase mb-0.5 ${isDarkMode ? 'text-zinc-500' : 'text-[#808191]'}`}>AI Reasoning</div>
                                    <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-zinc-300' : 'text-[#50515e]'}`}>
                                      {item.derivation.reasoning}
                                    </p>
                                  </div>
                                </div>
                                {/* Formula */}
                                <div className="flex items-start gap-2">
                                  <Calculator className="w-3.5 h-3.5 text-[#00C4FF] mt-0.5 flex-shrink-0" />
                                  <div>
                                    <div className={`text-[10px] font-semibold uppercase mb-0.5 ${isDarkMode ? 'text-zinc-500' : 'text-[#808191]'}`}>Formula</div>
                                    <p className={`text-xs font-mono ${isDarkMode ? 'text-zinc-300' : 'text-[#1B1D21]'}`}>
                                      {item.derivation.formula} = {item.quantity}
                                    </p>
                                  </div>
                                </div>
                                {/* Confidence + Price source */}
                                <div className="flex items-center gap-4 text-xs">
                                  <div className="flex items-center gap-1.5">
                                    <span className={isDarkMode ? 'text-zinc-500' : 'text-[#808191]'}>Qty Confidence:</span>
                                    <ConfidenceBadge confidence={item.derivation.confidence} />
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span className={isDarkMode ? 'text-zinc-500' : 'text-[#808191]'}>Price:</span>
                                    <span className={isDarkMode ? 'text-zinc-400' : 'text-[#50515e]'}>{item.unitPrice.sourceDetail}</span>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* ===== CALCULATION SUMMARY ===== */}
          <section>
            <div className={sectionTitle}>
              <Calculator className="w-4 h-4 text-[#6C5DD3]" />
              Deterministic Calculation
            </div>
            <div className={`p-4 rounded-xl border space-y-3 ${isDarkMode ? 'bg-white/[0.02] border-white/5' : 'bg-slate-50 border-slate-100'}`}>
              <div className="flex justify-between text-sm">
                <span className={isDarkMode ? 'text-zinc-400' : 'text-[#808191]'}>Bundle Subtotal ({auditTrail.bundleDerivation.length} items)</span>
                <span className={`font-mono font-bold ${isDarkMode ? 'text-zinc-200' : 'text-[#1B1D21]'}`}>
                  ${auditTrail.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              {auditTrail.discount.percent > 0 && (
                <div className="flex justify-between text-sm">
                  <div>
                    <span className={isDarkMode ? 'text-zinc-400' : 'text-[#808191]'}>Discount ({auditTrail.discount.percent}%)</span>
                    {auditTrail.discount.reasoning && (
                      <p className={`text-[10px] mt-0.5 max-w-md ${isDarkMode ? 'text-zinc-600' : 'text-[#aaa]'}`}>
                        {auditTrail.discount.reasoning}
                      </p>
                    )}
                  </div>
                  <span className="font-mono font-bold text-red-400">
                    -${(auditTrail.subtotal * auditTrail.discount.percent / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
              <div className={`h-px ${isDarkMode ? 'bg-white/10' : 'bg-slate-200'}`} />
              <div className={`flex justify-between items-center p-3 -mx-1 rounded-xl ${isDarkMode ? 'bg-[#6C5DD3]/10' : 'bg-[#6C5DD3]/5'}`}>
                <span className="text-sm font-bold text-[#6C5DD3]">Estimated Opportunity</span>
                <span className={`text-xl font-mono font-black ${isDarkMode ? 'text-white' : 'text-[#1B1D21]'}`}>
                  ${auditTrail.estimatedValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              {/* Source breakdown bar */}
              <div className="space-y-1.5">
                <div className={`text-[10px] font-semibold ${isDarkMode ? 'text-zinc-500' : 'text-[#808191]'}`}>Price Source Breakdown</div>
                <div className="flex h-2 rounded-full overflow-hidden">
                  {auditTrail.sourceBreakdown.catalogPercent > 0 && (
                    <div className="bg-green-500" style={{ width: `${auditTrail.sourceBreakdown.catalogPercent}%` }} title={`Catalog: ${auditTrail.sourceBreakdown.catalogPercent}%`} />
                  )}
                  {auditTrail.sourceBreakdown.rateCardPercent > 0 && (
                    <div className="bg-blue-500" style={{ width: `${auditTrail.sourceBreakdown.rateCardPercent}%` }} title={`Rate Card: ${auditTrail.sourceBreakdown.rateCardPercent}%`} />
                  )}
                  {auditTrail.sourceBreakdown.aiEstimatePercent > 0 && (
                    <div className="bg-yellow-500" style={{ width: `${auditTrail.sourceBreakdown.aiEstimatePercent}%` }} title={`AI Estimate: ${auditTrail.sourceBreakdown.aiEstimatePercent}%`} />
                  )}
                </div>
                <div className="flex items-center gap-4 text-[10px]">
                  {auditTrail.sourceBreakdown.catalogPercent > 0 && (
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> Catalog {auditTrail.sourceBreakdown.catalogPercent}%</span>
                  )}
                  {auditTrail.sourceBreakdown.rateCardPercent > 0 && (
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Rate Card {auditTrail.sourceBreakdown.rateCardPercent}%</span>
                  )}
                  {auditTrail.sourceBreakdown.aiEstimatePercent > 0 && (
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500" /> AI Est. {auditTrail.sourceBreakdown.aiEstimatePercent}%</span>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* ===== ASSUMPTIONS ===== */}
          {auditTrail.assumptions.length > 0 && (
            <section>
              <div className={sectionTitle}>
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                Key Assumptions ({auditTrail.assumptions.length})
              </div>
              <div className={`rounded-xl border overflow-hidden ${isDarkMode ? 'border-white/5' : 'border-slate-200/60'}`}>
                <table className="w-full text-left text-xs">
                  <thead className={`font-bold uppercase tracking-wider text-[10px] border-b ${isDarkMode ? 'bg-white/5 text-zinc-500 border-white/5' : 'bg-slate-50/50 text-[#808191] border-slate-100'}`}>
                    <tr>
                      <th className="px-4 py-2">Category</th>
                      <th className="px-4 py-2">Assumption</th>
                      <th className="px-4 py-2 text-center">Confidence</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDarkMode ? 'divide-white/5' : 'divide-slate-50'}`}>
                    {auditTrail.assumptions.map((a, i) => (
                      <tr key={i}>
                        <td className={`px-4 py-2.5 ${isDarkMode ? 'text-zinc-400' : 'text-[#808191]'}`}>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold ${isDarkMode ? 'bg-white/5' : 'bg-gray-100'}`}>{a.category}</span>
                        </td>
                        <td className={`px-4 py-2.5 ${isDarkMode ? 'text-zinc-300' : 'text-[#50515e]'}`}>{a.statement}</td>
                        <td className="px-4 py-2.5 text-center"><ConfidenceBadge confidence={a.confidence} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>

        {/* Footer */}
        <div className={`px-6 py-4 border-t flex items-center justify-between ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`}>
          <div className={`flex items-center gap-2 text-[10px] ${isDarkMode ? 'text-zinc-600' : 'text-[#aaa]'}`}>
            <ShieldCheck className="w-3.5 h-3.5" />
            Glass Box AI — All math computed deterministically from catalog prices
          </div>
          <button onClick={onClose} className="px-4 py-2 bg-[#6C5DD3] hover:bg-[#5B4EC2] text-white rounded-xl text-sm font-medium transition-all">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default EstimationBreakdownModal;
