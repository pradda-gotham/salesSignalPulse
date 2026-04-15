import React, { useState } from 'react';
import { X, Newspaper, Package, Calculator, AlertTriangle, ChevronDown, ChevronUp, Info, ShieldCheck, Lightbulb } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { EstimationAuditTrail, AuditablePrice } from '../types';
import { priceValue, priceSource } from '../utils/normalizeDossier';
import { getVL } from '../utils/vesper';

interface EstimationBreakdownModalProps {
  auditTrail: EstimationAuditTrail;
  estimatedValue: number | AuditablePrice;
  onClose: () => void;
}

const ConfidenceBadge: React.FC<{ confidence: string }> = ({ confidence }) => {
  const config = confidence === 'high'
    ? { bg: '#10B98110', color: '#10B981', border: '#10B98120', label: 'HIGH' }
    : confidence === 'medium'
      ? { bg: '#EAB30810', color: '#EAB308', border: '#EAB30820', label: 'MED' }
      : { bg: '#EF444410', color: '#EF4444', border: '#EF444420', label: 'LOW' };
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded-[4px] text-[9px] font-bold uppercase tracking-wider border label-caps tracking-widest" style={{ background: config.bg, color: config.color, borderColor: config.border }}>
      {config.label}
    </span>
  );
};

const SourceBadge: React.FC<{ source: string }> = ({ source }) => {
  const config = source === 'catalog'
    ? { label: 'CATALOG', bg: '#10B98110', color: '#10B981', border: '#10B98120' }
    : source === 'rate_card'
      ? { label: 'RATE CARD', bg: '#3B82F610', color: '#3B82F6', border: '#3B82F620' }
      : source === 'manual'
        ? { label: 'MANUAL', bg: '#06B6D410', color: '#06B6D4', border: '#06B6D420' }
        : { label: 'AI EST.', bg: '#EAB30810', color: '#EAB308', border: '#EAB30820' };
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded-[4px] text-[9px] font-bold uppercase tracking-wider border label-caps tracking-widest" style={{ background: config.bg, color: config.color, borderColor: config.border }}>
      {config.label}
    </span>
  );
};

const EstimationBreakdownModal: React.FC<EstimationBreakdownModalProps> = ({ auditTrail, estimatedValue, onClose }) => {
  const { isDarkMode } = useTheme();
  const vl = getVL(isDarkMode);
  const [expandedLines, setExpandedLines] = useState<Set<number>>(new Set([0]));

  const toggleLine = (idx: number) => {
    setExpandedLines(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const pi = auditTrail.projectIntelligence;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-8 px-4" onClick={onClose}>
      <div
        className="w-full max-w-3xl rounded-[6px] border shadow-2xl animate-in fade-in zoom-in-95 duration-300 vl-card"
        style={{ background: vl.surface, borderColor: vl.border }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: vl.borderStrong }}>
          <div>
            <h2 className="text-2xl font-semibold" style={{ fontFamily: "'Newsreader', Georgia, serif", color: vl.textMain }}>Estimation Breakdown</h2>
            <p className="text-[13px] mt-0.5" style={{ color: vl.textBody }}>
              How we calculated ${priceValue(estimatedValue).toLocaleString()} estimated opportunity
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-[4px] transition-colors hover:text-red-500" style={{ color: vl.textMuted }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">

          {/* ===== SIGNAL INTELLIGENCE ===== */}
          <section>
            <div className="flex items-center gap-2 font-bold uppercase tracking-widest text-[11px] mb-3 label-caps" style={{ color: vl.textMuted }}>
              <Newspaper className="w-4 h-4" style={{ color: vl.primary }} />
              Signal Intelligence
            </div>
            <div className="p-4 rounded-[4px] border" style={{ background: vl.surfaceMuted, borderColor: vl.borderStrong }}>
              <div className="grid grid-cols-2 gap-3 text-[13px]">
                <div>
                  <span style={{ color: vl.textBody }}>Industry:</span>
                  <span className="ml-2 font-bold" style={{ color: vl.textMain }}>{pi.industry}</span>
                </div>
                <div>
                  <span style={{ color: vl.textBody }}>Project Type:</span>
                  <span className="ml-2 font-bold" style={{ color: vl.textMain }}>{pi.projectType}</span>
                </div>
                {pi.location && (
                  <div>
                    <span style={{ color: vl.textBody }}>Location:</span>
                    <span className="ml-2 font-bold" style={{ color: vl.textMain }}>{pi.location}</span>
                  </div>
                )}
                {pi.timeline && (
                  <div>
                    <span style={{ color: vl.textBody }}>Timeline:</span>
                    <span className="ml-2 font-bold" style={{ color: vl.textMain }}>{pi.timeline}</span>
                  </div>
                )}
                {pi.totalBudget && (
                  <div className="col-span-2">
                    <span style={{ color: vl.textBody }}>Project Budget:</span>
                    <span className="ml-2 font-bold font-mono" style={{ color: vl.primary }}>
                      {pi.totalBudget.currency} ${pi.totalBudget.value.toLocaleString()}
                    </span>
                    <span className="ml-1 text-[10px] label-caps tracking-widest" style={{ color: vl.textMuted }}>({pi.totalBudget.source})</span>
                  </div>
                )}
              </div>

              {/* Scale Metrics */}
              {pi.scaleMetrics.length > 0 && (
                <div className="mt-3 pt-3 border-t" style={{ borderColor: vl.borderStrong }}>
                  <div className="text-[10px] font-bold uppercase tracking-widest mb-2 label-caps" style={{ color: vl.textMuted }}>Extracted Scale Metrics</div>
                  <div className="flex flex-wrap gap-2">
                    {pi.scaleMetrics.map((m, i) => (
                      <div key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[4px] border text-[13px]" style={{ background: vl.surface, borderColor: vl.borderStrong }} title={m.source}>
                        <span className="font-bold" style={{ color: vl.primary }}>{m.value}</span>
                        <span style={{ color: vl.textBody }}>{m.unit}</span>
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
            <div className="flex items-center gap-2 font-bold uppercase tracking-widest text-[11px] mb-3 label-caps" style={{ color: vl.textMuted }}>
              <Package className="w-4 h-4" style={{ color: vl.primary }} />
              Product Mapping — Bill of Materials
            </div>
            <div className="rounded-[4px] border overflow-hidden" style={{ borderColor: vl.borderStrong }}>
              <table className="w-full text-left text-[13px]">
                <thead className="font-bold uppercase tracking-widest text-[10px] border-b label-caps" style={{ background: vl.surfaceMuted, color: vl.textMuted, borderColor: vl.borderStrong }}>
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
                <tbody className="divide-y" style={{ divideColor: vl.borderStrong }}>
                  {auditTrail.bundleDerivation.map((item, idx) => {
                    const isExpanded = expandedLines.has(idx);
                    return (
                      <React.Fragment key={idx}>
                        <tr
                          className="cursor-pointer transition-colors hover-row"
                          style={{ background: vl.surface }}
                          onClick={() => toggleLine(idx)}
                        >
                          <td className="px-4 py-3">
                            {isExpanded
                              ? <ChevronUp className="w-3.5 h-3.5" style={{ color: vl.textMuted }} />
                              : <ChevronDown className="w-3.5 h-3.5" style={{ color: vl.textMuted }} />
                            }
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-[11px]" style={{ color: vl.primary }}>{item.sku}</td>
                          <td className="px-4 py-3" style={{ color: vl.textMain }}>{item.description}</td>
                          <td className="px-4 py-3 text-right font-bold font-mono" style={{ color: vl.textMain }}>{item.quantity}</td>
                          <td className="px-4 py-3 text-right font-mono text-[11px]">
                            {item.unitPrice.value > 0
                              ? `$${item.unitPrice.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                              : <span style={{ color: vl.textMuted, opacity: 0.5 }}>N/A</span>
                            }
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-[11px]" style={{ color: vl.textMain }}>
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
                          <tr style={{ background: vl.primarySoft }}>
                            <td></td>
                            <td colSpan={6} className="px-4 py-3 border-l-2" style={{ borderLeftColor: vl.primary }}>
                              <div className="space-y-3">
                                {/* Reasoning */}
                                <div className="flex items-start gap-2">
                                  <Lightbulb className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: vl.primary }} />
                                  <div>
                                    <div className="text-[10px] font-bold uppercase tracking-widest mb-0.5 label-caps" style={{ color: vl.textMuted }}>AI Reasoning</div>
                                    <p className="text-[13px] leading-relaxed" style={{ color: vl.textBody }}>
                                      {item.derivation.reasoning}
                                    </p>
                                  </div>
                                </div>
                                {/* Formula */}
                                <div className="flex items-start gap-2">
                                  <Calculator className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-[#00C4FF]" />
                                  <div>
                                    <div className="text-[10px] font-bold uppercase tracking-widest mb-0.5 label-caps" style={{ color: vl.textMuted }}>Formula</div>
                                    <p className="text-[13px] font-mono font-bold" style={{ color: vl.textMain }}>
                                      {item.derivation.formula} = {item.quantity}
                                    </p>
                                  </div>
                                </div>
                                {/* Confidence + Price source */}
                                <div className="flex items-center gap-4 text-[11px]">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold label-caps tracking-widest" style={{ color: vl.textMuted }}>Qty Confidence:</span>
                                    <ConfidenceBadge confidence={item.derivation.confidence} />
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold label-caps tracking-widest" style={{ color: vl.textMuted }}>Price:</span>
                                    <span style={{ color: vl.textBody }}>{item.unitPrice.sourceDetail}</span>
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
            <div className="flex items-center gap-2 font-bold uppercase tracking-widest text-[11px] mb-3 label-caps" style={{ color: vl.textMuted }}>
              <Calculator className="w-4 h-4" style={{ color: vl.primary }} />
              Deterministic Calculation
            </div>
            <div className="p-4 rounded-[4px] border space-y-3" style={{ background: vl.surfaceMuted, borderColor: vl.borderStrong }}>
              <div className="flex justify-between text-[13px]">
                <span className="font-bold" style={{ color: vl.textBody }}>Bundle Subtotal ({auditTrail.bundleDerivation.length} items)</span>
                <span className="font-mono font-bold" style={{ color: vl.textMain }}>
                  ${auditTrail.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              {auditTrail.discount.percent > 0 && (
                <div className="flex justify-between text-[13px]">
                  <div>
                    <span className="font-bold" style={{ color: vl.textBody }}>Discount ({auditTrail.discount.percent}%)</span>
                    {auditTrail.discount.reasoning && (
                      <p className="text-[11px] mt-0.5 max-w-md" style={{ color: vl.textMuted }}>
                        {auditTrail.discount.reasoning}
                      </p>
                    )}
                  </div>
                  <span className="font-mono font-bold text-red-500">
                    -${(auditTrail.subtotal * auditTrail.discount.percent / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
              <div className="h-px w-full" style={{ background: vl.borderStrong }} />
              <div className="flex justify-between items-center p-3 -mx-1 rounded-[4px]" style={{ background: vl.primarySoft, border: `1px solid ${isDarkMode ? 'rgba(99,91,255,0.2)' : 'rgba(99,91,255,0.1)'}` }}>
                <span className="text-[13px] font-bold" style={{ color: vl.primary }}>Estimated Opportunity</span>
                <span className="text-xl font-mono font-bold" style={{ color: vl.textMain }}>
                  ${auditTrail.estimatedValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              {/* Source breakdown bar */}
              <div className="space-y-1.5 pt-2">
                <div className="text-[10px] font-bold uppercase tracking-widest label-caps" style={{ color: vl.textMuted }}>Price Source Breakdown</div>
                <div className="flex h-2 rounded-[2px] overflow-hidden bg-black/10">
                  {auditTrail.sourceBreakdown.catalogPercent > 0 && (
                    <div className="bg-[#10B981]" style={{ width: `${auditTrail.sourceBreakdown.catalogPercent}%` }} title={`Catalog: ${auditTrail.sourceBreakdown.catalogPercent}%`} />
                  )}
                  {auditTrail.sourceBreakdown.rateCardPercent > 0 && (
                    <div className="bg-[#3B82F6]" style={{ width: `${auditTrail.sourceBreakdown.rateCardPercent}%` }} title={`Rate Card: ${auditTrail.sourceBreakdown.rateCardPercent}%`} />
                  )}
                  {auditTrail.sourceBreakdown.aiEstimatePercent > 0 && (
                    <div className="bg-[#EAB308]" style={{ width: `${auditTrail.sourceBreakdown.aiEstimatePercent}%` }} title={`AI Estimate: ${auditTrail.sourceBreakdown.aiEstimatePercent}%`} />
                  )}
                </div>
                <div className="flex items-center gap-4 text-[10px] font-bold label-caps mt-1 tracking-wider" style={{ color: vl.textBody }}>
                  {auditTrail.sourceBreakdown.catalogPercent > 0 && (
                    <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" /> Catalog {auditTrail.sourceBreakdown.catalogPercent}%</span>
                  )}
                  {auditTrail.sourceBreakdown.rateCardPercent > 0 && (
                    <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" /> Rate Card {auditTrail.sourceBreakdown.rateCardPercent}%</span>
                  )}
                  {auditTrail.sourceBreakdown.aiEstimatePercent > 0 && (
                    <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#EAB308]" /> AI Est. {auditTrail.sourceBreakdown.aiEstimatePercent}%</span>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* ===== ASSUMPTIONS ===== */}
          {auditTrail.assumptions.length > 0 && (
            <section>
              <div className="flex items-center gap-2 font-bold uppercase tracking-widest text-[11px] mb-3 label-caps" style={{ color: vl.textMuted }}>
                <AlertTriangle className="w-4 h-4 text-[#EAB308]" />
                Key Assumptions ({auditTrail.assumptions.length})
              </div>
              <div className="rounded-[4px] border overflow-hidden" style={{ borderColor: vl.borderStrong }}>
                <table className="w-full text-left text-[13px]">
                  <thead className="font-bold uppercase tracking-widest text-[10px] border-b label-caps" style={{ background: vl.surfaceMuted, color: vl.textMuted, borderColor: vl.borderStrong }}>
                    <tr>
                      <th className="px-4 py-2">Category</th>
                      <th className="px-4 py-2">Assumption</th>
                      <th className="px-4 py-2 text-center">Confidence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ divideColor: vl.borderStrong, background: vl.surface }}>
                    {auditTrail.assumptions.map((a, i) => (
                      <tr key={i}>
                        <td className="px-4 py-2.5">
                          <span className="px-2 py-0.5 rounded-[4px] text-[9px] font-bold tracking-wider label-caps border" style={{ background: vl.chipBg, color: vl.textBody, borderColor: vl.borderStrong }}>{a.category}</span>
                        </td>
                        <td className="px-4 py-2.5" style={{ color: vl.textMain }}>{a.statement}</td>
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
        <div className="px-6 py-4 border-t flex items-center justify-between" style={{ borderColor: vl.borderStrong }}>
          <div className="flex items-center gap-2 text-[10px] font-bold label-caps tracking-wider" style={{ color: vl.textMuted }}>
            <ShieldCheck className="w-4 h-4" />
            Glass Box AI — All math computed deterministically from catalog prices
          </div>
          <button onClick={onClose} className="btn-primary w-fit px-6 py-2.5 text-xs font-bold label-caps tracking-wider">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default EstimationBreakdownModal;
