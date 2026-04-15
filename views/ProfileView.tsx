
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Target, Zap, Award, BarChart3, ShieldOff, MessageSquare, Globe, TrendingUp,
  ChevronDown, ChevronUp, Plus, X, Save, CheckCircle2, Info
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import {
  BusinessProfile,
  ICPSection,
  ProblemSolutionFitSection,
  USPSection,
  DealCharacteristicsSection,
  ExclusionsSection,
  SalesApproachSection,
  DataSourcePreferencesSection,
  SuccessMetricsSection,
  BestCustomerExample,
  CompetitorEntry,
} from '../types';
import { getVL } from '../utils/vesper';

// ============ COMPLETION RING ============

const CompletionRing: React.FC<{ percent: number; size?: number }> = ({ percent, size = 36 }) => {
  const { isDarkMode } = useTheme();
  const vl = getVL(isDarkMode);
  const r = (size - 4) / 2;
  const circ = 2 * Math.PI * r;
  const filled = circ * (percent / 100);
  const color = percent === 0 ? vl.textMuted : percent < 50 ? '#f59e0b' : percent < 100 ? vl.primary : '#10B981';
  return (
    <svg width={size} height={size} className="flex-shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={3} style={{ color: vl.border }} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={3}
        strokeDasharray={`${filled} ${circ - filled}`} strokeDashoffset={circ / 4}
        strokeLinecap="round" className="transition-all duration-700" />
      <text x="50%" y="50%" textAnchor="middle" dy=".35em" fill={color} fontSize={size * 0.28} fontWeight="bold">
        {percent}%
      </text>
    </svg>
  );
};

// ============ REUSABLE FIELD COMPONENTS ============

const ArrayField: React.FC<{
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  isDarkMode: boolean;
}> = ({ items, onChange, placeholder, isDarkMode }) => {
  const vl = getVL(isDarkMode);
  const add = () => onChange([...items, '']);
  const remove = (i: number) => { if (items.length > 1) onChange(items.filter((_, idx) => idx !== i)); else onChange(['']); };
  const update = (i: number, v: string) => { const n = [...items]; n[i] = v; onChange(n); };
  
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <input 
            value={item} 
            onChange={e => update(i, e.target.value)} 
            placeholder={placeholder} 
            className="w-full px-3 py-2 rounded-[4px] text-[13px] border transition-all focus:outline-none focus:border-[#635BFF]"
            style={{ background: vl.surfaceMuted, borderColor: vl.borderStrong, color: vl.textMain }}
          />
          <button 
            onClick={() => remove(i)} 
            className="p-1.5 rounded-[4px] transition-colors border border-transparent hover:border-red-500/20"
            style={{ color: vl.textMuted }}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      <button 
        onClick={add} 
        className="flex items-center gap-1.5 text-xs font-bold transition-colors"
        style={{ color: vl.primary }}
      >
        <Plus className="w-3.5 h-3.5" /> Add another
      </button>
    </div>
  );
};

const TextField: React.FC<{
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  isDarkMode: boolean;
}> = ({ value, onChange, placeholder, multiline, isDarkMode }) => {
  const vl = getVL(isDarkMode);
  const cls = "w-full px-3 py-2 rounded-[4px] text-[13px] border transition-all focus:outline-none focus:border-[#635BFF]";
  const style = { background: vl.surfaceMuted, borderColor: vl.borderStrong, color: vl.textMain };
  if (multiline) return <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3} className={`${cls} resize-none`} style={style} />;
  return <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={cls} style={style} />;
};

const SelectField: React.FC<{
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  isDarkMode: boolean;
}> = ({ value, onChange, options, placeholder, isDarkMode }) => {
  const vl = getVL(isDarkMode);
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full px-3 py-2 rounded-[4px] text-[13px] font-semibold border transition-all focus:outline-none focus:border-[#635BFF]"
      style={{ background: vl.surfaceMuted, borderColor: vl.borderStrong, color: vl.textMain }}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
};

const FieldLabel: React.FC<{ label: string; hint?: string; isDarkMode: boolean }> = ({ label, hint, isDarkMode }) => {
  const vl = getVL(isDarkMode);
  return (
    <div className="mb-1.5">
      <label className="text-[11px] font-bold label-caps" style={{ color: vl.textMuted }}>{label}</label>
      {hint && <p className="text-[10px] mt-0.5" style={{ color: vl.textBody }}>{hint}</p>}
    </div>
  );
};

const ChipSelect: React.FC<{
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  isDarkMode: boolean;
}> = ({ options, selected, onChange, isDarkMode }) => {
  const vl = getVL(isDarkMode);
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => {
        const isActive = selected.includes(opt);
        return (
          <button 
            key={opt} 
            onClick={() => onChange(isActive ? selected.filter(s => s !== opt) : [...selected, opt])}
            className="px-3 py-1.5 rounded-[4px] text-[11px] font-bold border transition-all label-caps"
            style={{
              background: isActive ? vl.primarySoft : vl.chipBg,
              color: isActive ? vl.primary : vl.textMuted,
              borderColor: isActive ? (isDarkMode ? 'rgba(99,91,255,0.2)' : 'rgba(99,91,255,0.1)') : vl.borderStrong
            }}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
};

// ============ SECTION DEFINITIONS ============

interface SectionDef {
  id: string;
  title: string;
  icon: React.FC<{ className?: string, style?: any }>;
  aiImpact: string;
  nudge: string;
}

const SECTIONS: SectionDef[] = [
  { id: 'icp', title: 'Ideal Customer Profile', icon: Target, aiImpact: 'Signal Filtering, Lead Scoring', nudge: 'Helps filter out irrelevant signals and score leads that match your sweet spot.' },
  { id: 'problemSolutionFit', title: 'Problem-Solution Fit', icon: Zap, aiImpact: 'Signal Detection, Trigger Engine', nudge: 'Buying triggers are the #1 input to signal detection quality.' },
  { id: 'usp', title: 'Unique Selling Proposition', icon: Award, aiImpact: 'Battlecards, Call Scripts', nudge: 'Your differentiators power competitive battlecards in every dossier.' },
  { id: 'dealCharacteristics', title: 'Deal Characteristics', icon: BarChart3, aiImpact: 'Deal Sizing, Confidence Scoring', nudge: 'Average deal size grounds opportunity estimates in reality instead of AI guesses.' },
  { id: 'exclusions', title: 'Exclusions & Red Flags', icon: ShieldOff, aiImpact: 'Noise Reduction', nudge: 'Telling us who NOT to target can cut irrelevant signals by 30%+.' },
  { id: 'salesApproach', title: 'Sales Approach', icon: MessageSquare, aiImpact: 'Outreach Scripts, Email Tone', nudge: 'Controls the tone and channel of AI-generated outreach scripts.' },
  { id: 'dataSources', title: 'Data Sources & Monitoring', icon: Globe, aiImpact: 'Signal Sources, Competitor Tracking', nudge: 'Tell us where to look and which competitors to watch.' },
  { id: 'successMetrics', title: 'Success Metrics', icon: TrendingUp, aiImpact: 'Quality Thresholds', nudge: 'Defines what a "good lead" looks like so we can optimize signal quality.' },
];

// ============ COMPLETION CALC ============

function sectionCompletion(sectionId: string, profile: BusinessProfile): number {
  const filled = (arr?: string[]) => arr?.filter(Boolean).length || 0;
  const has = (v?: string | number) => v !== undefined && v !== null && v !== '';

  switch (sectionId) {
    case 'icp': {
      const s = profile.icp;
      if (!s) return 0;
      const total = 8;
      let count = 0;
      if (filled(s.priorityIndustries)) count++;
      if (has(s.companySize)) count++;
      if (has(s.revenueRange)) count++;
      if (filled(s.typicalBuyerTitles)) count++;
      if (has(s.customerType)) count++;
      if (has(s.companyStagePreference)) count++;
      if (s.bestCustomers?.length) count++;
      if (has(s.bestCustomerRevenuePercent)) count++;
      return Math.round((count / total) * 100);
    }
    case 'problemSolutionFit': {
      const s = profile.problemSolutionFit;
      if (!s) return 0;
      const total = 3;
      let count = 0;
      if (filled(s.painPoints)) count++;
      if (filled(s.buyingTriggers)) count++;
      if (filled(s.readinessSignals)) count++;
      return Math.round((count / total) * 100);
    }
    case 'usp': {
      const s = profile.usp;
      if (!s) return 0;
      const total = 5;
      let count = 0;
      if (has(s.whyChooseUs)) count++;
      if (has(s.uniqueStrength)) count++;
      if (has(s.customerFeedback)) count++;
      if (filled(s.proofPoints)) count++;
      if (filled(s.measurableOutcomes)) count++;
      return Math.round((count / total) * 100);
    }
    case 'dealCharacteristics': {
      const s = profile.dealCharacteristics;
      if (!s) return 0;
      const total = 7;
      let count = 0;
      if (has(s.avgDealSize)) count++;
      if (has(s.typicalSalesCycle)) count++;
      if (has(s.salesMotion)) count++;
      if (filled(s.highProbabilityIndustries)) count++;
      if (filled(s.highProbabilityBuyerRoles)) count++;
      if (filled(s.highProbabilityCompanyStages)) count++;
      if (s.competitors?.length) count++;
      return Math.round((count / total) * 100);
    }
    case 'exclusions': {
      const s = profile.exclusions;
      if (!s) return 0;
      const total = 4;
      let count = 0;
      if (filled(s.excludedIndustries)) count++;
      if (filled(s.excludedCompanySizes)) count++;
      if (filled(s.excludedRegions)) count++;
      if (filled(s.redFlags)) count++;
      return Math.round((count / total) * 100);
    }
    case 'salesApproach': {
      const s = profile.salesApproach;
      if (!s) return 0;
      const total = 5;
      let count = 0;
      if (filled(s.primaryChannels)) count++;
      if (has(s.bestMessaging)) count++;
      if (filled(s.commonObjections)) count++;
      if (has(s.whatConvinces)) count++;
      if (has(s.toneOfVoice)) count++;
      return Math.round((count / total) * 100);
    }
    case 'dataSources': {
      const s = profile.dataSources;
      if (!s) return 0;
      const total = 4;
      let count = 0;
      if (filled(s.currentLeadSources)) count++;
      if (filled(s.trustedSources)) count++;
      if (filled(s.monitoredWebsites)) count++;
      if (filled(s.monitoredCompetitors)) count++;
      return Math.round((count / total) * 100);
    }
    case 'successMetrics': {
      const s = profile.successMetrics;
      if (!s) return 0;
      const total = 3;
      let count = 0;
      if (has(s.goodLeadDefinition)) count++;
      if (has(s.expectedConversionRate)) count++;
      if (has(s.volumeVsQuality)) count++;
      return Math.round((count / total) * 100);
    }
    default: return 0;
  }
}

// ============ SECTION FORM BODIES ============

interface SectionFormProps {
  profile: BusinessProfile;
  onChange: (profile: BusinessProfile) => void;
  isDarkMode: boolean;
}

const ICPForm: React.FC<SectionFormProps> = ({ profile, onChange, isDarkMode }) => {
  const vl = getVL(isDarkMode);
  const s = profile.icp || {};
  const set = (patch: Partial<ICPSection>) => onChange({ ...profile, icp: { ...s, ...patch } });

  return (
    <div className="space-y-5">
      <div>
        <FieldLabel label="Priority Industries" hint="Which industries do you want more of?" isDarkMode={isDarkMode} />
        <ArrayField items={s.priorityIndustries?.length ? s.priorityIndustries : ['']} onChange={v => set({ priorityIndustries: v })} placeholder="e.g. Healthcare, Construction" isDarkMode={isDarkMode} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel label="Company Size" isDarkMode={isDarkMode} />
          <SelectField value={s.companySize || ''} onChange={v => set({ companySize: v })} isDarkMode={isDarkMode}
            placeholder="Select range"
            options={[
              { value: '1-50', label: '1-50 employees' },
              { value: '50-200', label: '50-200 employees' },
              { value: '200-1000', label: '200-1,000 employees' },
              { value: '1000-5000', label: '1,000-5,000 employees' },
              { value: '5000+', label: '5,000+ employees' },
            ]} />
        </div>
        <div>
          <FieldLabel label="Revenue Range" isDarkMode={isDarkMode} />
          <SelectField value={s.revenueRange || ''} onChange={v => set({ revenueRange: v })} isDarkMode={isDarkMode}
            placeholder="Select range"
            options={[
              { value: '$1M-$5M', label: '$1M - $5M' },
              { value: '$5M-$50M', label: '$5M - $50M' },
              { value: '$50M-$500M', label: '$50M - $500M' },
              { value: '$500M+', label: '$500M+' },
            ]} />
        </div>
      </div>
      <div>
        <FieldLabel label="Typical Buyer Titles" hint="Who is the decision-maker?" isDarkMode={isDarkMode} />
        <ArrayField items={s.typicalBuyerTitles?.length ? s.typicalBuyerTitles : ['']} onChange={v => set({ typicalBuyerTitles: v })} placeholder="e.g. CFO, Head of Operations" isDarkMode={isDarkMode} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel label="Customer Type" isDarkMode={isDarkMode} />
          <SelectField value={s.customerType || ''} onChange={v => set({ customerType: v as ICPSection['customerType'] })} isDarkMode={isDarkMode}
            placeholder="Select type"
            options={[
              { value: 'B2B', label: 'B2B' },
              { value: 'B2C', label: 'B2C' },
              { value: 'Both', label: 'Both' },
            ]} />
        </div>
        <div>
          <FieldLabel label="Company Stage Preference" isDarkMode={isDarkMode} />
          <SelectField value={s.companyStagePreference || ''} onChange={v => set({ companyStagePreference: v as ICPSection['companyStagePreference'] })} isDarkMode={isDarkMode}
            placeholder="Select preference"
            options={[
              { value: 'new', label: 'New businesses' },
              { value: 'established', label: 'Established companies' },
              { value: 'fast_growing', label: 'Fast-growing companies' },
              { value: 'stable', label: 'Stable companies' },
              { value: 'no_preference', label: 'No preference' },
            ]} />
        </div>
      </div>
      <div>
        <FieldLabel label="Best Customers" hint="Describe your top 3 best customers and why they're ideal" isDarkMode={isDarkMode} />
        {(s.bestCustomers?.length ? s.bestCustomers : [{ name: '', whyIdeal: '' }]).map((c, i) => (
          <div key={i} className="p-3 rounded-[6px] border mb-2" style={{ background: vl.surfaceMuted, borderColor: vl.borderStrong }}>
            <div className="flex gap-2 items-start">
              <div className="flex-1 space-y-2">
                <input value={c.name} onChange={e => {
                  const list = [...(s.bestCustomers || [{ name: '', whyIdeal: '' }])];
                  list[i] = { ...list[i], name: e.target.value };
                  set({ bestCustomers: list });
                }} placeholder="Customer name" className="w-full px-3 py-2 rounded-[4px] text-[13px] border focus:outline-none focus:border-[#635BFF]" style={{ background: vl.surface, borderColor: vl.borderStrong, color: vl.textMain }} />
                <input value={c.whyIdeal} onChange={e => {
                  const list = [...(s.bestCustomers || [{ name: '', whyIdeal: '' }])];
                  list[i] = { ...list[i], whyIdeal: e.target.value };
                  set({ bestCustomers: list });
                }} placeholder="Why are they ideal?" className="w-full px-3 py-2 rounded-[4px] text-[13px] border focus:outline-none focus:border-[#635BFF]" style={{ background: vl.surface, borderColor: vl.borderStrong, color: vl.textMain }} />
              </div>
              {(s.bestCustomers?.length || 1) > 1 && (
                <button onClick={() => set({ bestCustomers: (s.bestCustomers || []).filter((_, idx) => idx !== i) })}
                  className="p-1.5 rounded-[4px] mt-1 hover:border-red-500/20" style={{ color: vl.textMuted }}>
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
        {(s.bestCustomers?.length || 1) < 3 && (
          <button onClick={() => set({ bestCustomers: [...(s.bestCustomers || []), { name: '', whyIdeal: '' }] })}
            className="flex items-center gap-1.5 text-xs font-bold transition-colors" style={{ color: vl.primary }}>
            <Plus className="w-3.5 h-3.5" /> Add customer example
          </button>
        )}
      </div>
      <div>
        <FieldLabel label="Revenue from Best-Fit Customers" hint="What % of revenue comes from ideal customers?" isDarkMode={isDarkMode} />
        <div className="flex items-center gap-3">
          <input type="range" min={0} max={100} value={s.bestCustomerRevenuePercent ?? 0}
            onChange={e => set({ bestCustomerRevenuePercent: Number(e.target.value) })}
            className="flex-1" />
          <span className="text-sm font-bold min-w-[40px] text-right" style={{ color: vl.textMain }}>{s.bestCustomerRevenuePercent ?? 0}%</span>
        </div>
      </div>
    </div>
  );
};

const ProblemSolutionForm: React.FC<SectionFormProps> = ({ profile, onChange, isDarkMode }) => {
  const s = profile.problemSolutionFit || {};
  const set = (patch: Partial<ProblemSolutionFitSection>) => onChange({ ...profile, problemSolutionFit: { ...s, ...patch } });

  return (
    <div className="space-y-5">
      <div>
        <FieldLabel label="Pain Points" hint="What key problems do you solve for customers?" isDarkMode={isDarkMode} />
        <ArrayField items={s.painPoints?.length ? s.painPoints : ['']} onChange={v => set({ painPoints: v })} placeholder="e.g. Manual compliance tracking, High employee turnover" isDarkMode={isDarkMode} />
      </div>
      <div>
        <FieldLabel label="Buying Triggers" hint="What events usually lead to a sale? This is the #1 driver for signal quality." isDarkMode={isDarkMode} />
        <ChipSelect
          options={['Hiring surge', 'New funding', 'Expansion', 'Regulation changes', 'New product launch', 'Cost pressure', 'Leadership change', 'Technology migration', 'M&A activity', 'Compliance deadline']}
          selected={s.buyingTriggers || []}
          onChange={v => set({ buyingTriggers: v })}
          isDarkMode={isDarkMode}
        />
        <div className="mt-2">
          <ArrayField items={(s.buyingTriggers || []).filter(t => !['Hiring surge', 'New funding', 'Expansion', 'Regulation changes', 'New product launch', 'Cost pressure', 'Leadership change', 'Technology migration', 'M&A activity', 'Compliance deadline'].includes(t)).length ? (s.buyingTriggers || []).filter(t => !['Hiring surge', 'New funding', 'Expansion', 'Regulation changes', 'New product launch', 'Cost pressure', 'Leadership change', 'Technology migration', 'M&A activity', 'Compliance deadline'].includes(t)) : ['']}
            onChange={custom => {
              const chipOpts = ['Hiring surge', 'New funding', 'Expansion', 'Regulation changes', 'New product launch', 'Cost pressure', 'Leadership change', 'Technology migration', 'M&A activity', 'Compliance deadline'];
              const chipSelected = (s.buyingTriggers || []).filter(t => chipOpts.includes(t));
              set({ buyingTriggers: [...chipSelected, ...custom.filter(Boolean)] });
            }}
            placeholder="Add custom trigger..." isDarkMode={isDarkMode} />
        </div>
      </div>
      <div>
        <FieldLabel label="Readiness Signals" hint="What signals indicate a company is ready to buy?" isDarkMode={isDarkMode} />
        <ArrayField items={s.readinessSignals?.length ? s.readinessSignals : ['']} onChange={v => set({ readinessSignals: v })} placeholder="e.g. Published an RFP, Mentioned budget in earnings call" isDarkMode={isDarkMode} />
      </div>
    </div>
  );
};

const USPForm: React.FC<SectionFormProps> = ({ profile, onChange, isDarkMode }) => {
  const s = profile.usp || {};
  const set = (patch: Partial<USPSection>) => onChange({ ...profile, usp: { ...s, ...patch } });

  return (
    <div className="space-y-5">
      <div>
        <FieldLabel label="Why Customers Choose You" hint="Over competitors, what makes you the pick?" isDarkMode={isDarkMode} />
        <TextField value={s.whyChooseUs || ''} onChange={v => set({ whyChooseUs: v })} placeholder="e.g. Fastest implementation time in the industry" multiline isDarkMode={isDarkMode} />
      </div>
      <div>
        <FieldLabel label="Unique Strength" hint="What do you do better than anyone else?" isDarkMode={isDarkMode} />
        <TextField value={s.uniqueStrength || ''} onChange={v => set({ uniqueStrength: v })} placeholder="e.g. Only solution with real-time compliance monitoring" isDarkMode={isDarkMode} />
      </div>
      <div>
        <FieldLabel label="Customer Feedback" hint="What do customers say after buying?" isDarkMode={isDarkMode} />
        <TextField value={s.customerFeedback || ''} onChange={v => set({ customerFeedback: v })} placeholder="e.g. 'Cut our reporting time by 60%'" multiline isDarkMode={isDarkMode} />
      </div>
      <div>
        <FieldLabel label="Proof Points" hint="Case studies, ROI metrics, testimonials" isDarkMode={isDarkMode} />
        <ArrayField items={s.proofPoints?.length ? s.proofPoints : ['']} onChange={v => set({ proofPoints: v })} placeholder="e.g. 200+ enterprise customers, 98% retention rate" isDarkMode={isDarkMode} />
      </div>
      <div>
        <FieldLabel label="Measurable Outcomes" hint="What measurable results do you deliver?" isDarkMode={isDarkMode} />
        <ArrayField items={s.measurableOutcomes?.length ? s.measurableOutcomes : ['']} onChange={v => set({ measurableOutcomes: v })} placeholder="e.g. 30% cost reduction in first year" isDarkMode={isDarkMode} />
      </div>
    </div>
  );
};

const DealForm: React.FC<SectionFormProps> = ({ profile, onChange, isDarkMode }) => {
  const vl = getVL(isDarkMode);
  const s = profile.dealCharacteristics || {};
  const set = (patch: Partial<DealCharacteristicsSection>) => onChange({ ...profile, dealCharacteristics: { ...s, ...patch } });

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel label="Average Deal Size" isDarkMode={isDarkMode} />
          <SelectField value={s.avgDealSize || ''} onChange={v => set({ avgDealSize: v })} isDarkMode={isDarkMode}
            placeholder="Select range"
            options={[
              { value: '<$5K', label: 'Under $5K' },
              { value: '$5K-$25K', label: '$5K - $25K' },
              { value: '$25K-$100K', label: '$25K - $100K' },
              { value: '$100K-$500K', label: '$100K - $500K' },
              { value: '$500K+', label: '$500K+' },
            ]} />
        </div>
        <div>
          <FieldLabel label="Typical Sales Cycle" isDarkMode={isDarkMode} />
          <SelectField value={s.typicalSalesCycle || ''} onChange={v => set({ typicalSalesCycle: v })} isDarkMode={isDarkMode}
            placeholder="Select duration"
            options={[
              { value: '1-2 weeks', label: '1-2 weeks' },
              { value: '1-3 months', label: '1-3 months' },
              { value: '3-6 months', label: '3-6 months' },
              { value: '6-12 months', label: '6-12 months' },
              { value: '12+ months', label: '12+ months' },
            ]} />
        </div>
      </div>
      <div>
        <FieldLabel label="Sales Motion" isDarkMode={isDarkMode} />
        <ChipSelect
          options={['high_touch', 'low_touch', 'hybrid']}
          selected={s.salesMotion ? [s.salesMotion] : []}
          onChange={v => set({ salesMotion: (v[v.length - 1] || '') as DealCharacteristicsSection['salesMotion'] })}
          isDarkMode={isDarkMode} />
      </div>
      <div>
        <FieldLabel label="High-Probability Buyer Roles" hint="Which roles are most likely to close?" isDarkMode={isDarkMode} />
        <ArrayField items={s.highProbabilityBuyerRoles?.length ? s.highProbabilityBuyerRoles : ['']} onChange={v => set({ highProbabilityBuyerRoles: v })} placeholder="e.g. VP of Operations" isDarkMode={isDarkMode} />
      </div>
      <div>
        <FieldLabel label="Competitors" hint="Top competitors: why you win and lose against them" isDarkMode={isDarkMode} />
        {(s.competitors?.length ? s.competitors : [{ name: '', whyWeWin: '', whyWeLose: '' }]).map((c, i) => (
          <div key={i} className="p-3 rounded-[6px] border mb-2 space-y-2" style={{ background: vl.surfaceMuted, borderColor: vl.borderStrong }}>
            <div className="flex gap-2 items-center">
              <input value={c.name} onChange={e => {
                const list = [...(s.competitors || [{ name: '' }])];
                list[i] = { ...list[i], name: e.target.value };
                set({ competitors: list });
              }} placeholder="Competitor name" className="flex-1 px-3 py-2 rounded-[4px] text-[13px] border focus:outline-none focus:border-[#635BFF]" style={{ background: vl.surface, borderColor: vl.borderStrong, color: vl.textMain }} />
              {(s.competitors?.length || 1) > 1 && (
                <button onClick={() => set({ competitors: (s.competitors || []).filter((_, idx) => idx !== i) })}
                  className="p-1.5 rounded-[4px]" style={{ color: vl.textMuted }}>
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <input value={c.whyWeWin || ''} onChange={e => {
              const list = [...(s.competitors || [{ name: '' }])];
              list[i] = { ...list[i], whyWeWin: e.target.value };
              set({ competitors: list });
            }} placeholder="Why do you win against them?" className="w-full px-3 py-2 rounded-[4px] text-[13px] border focus:outline-none focus:border-[#635BFF]" style={{ background: vl.surface, borderColor: vl.borderStrong, color: vl.textMain }} />
            <input value={c.whyWeLose || ''} onChange={e => {
              const list = [...(s.competitors || [{ name: '' }])];
              list[i] = { ...list[i], whyWeLose: e.target.value };
              set({ competitors: list });
            }} placeholder="Why do you lose?" className="w-full px-3 py-2 rounded-[4px] text-[13px] border focus:outline-none focus:border-[#635BFF]" style={{ background: vl.surface, borderColor: vl.borderStrong, color: vl.textMain }} />
          </div>
        ))}
        {(s.competitors?.length || 1) < 5 && (
          <button onClick={() => set({ competitors: [...(s.competitors || []), { name: '' }] })}
            className="flex items-center gap-1.5 text-xs font-bold transition-colors" style={{ color: vl.primary }}>
            <Plus className="w-3.5 h-3.5" /> Add competitor
          </button>
        )}
      </div>
    </div>
  );
};

const ExclusionsForm: React.FC<SectionFormProps> = ({ profile, onChange, isDarkMode }) => {
  const s = profile.exclusions || {};
  const set = (patch: Partial<ExclusionsSection>) => onChange({ ...profile, exclusions: { ...s, ...patch } });

  return (
    <div className="space-y-5">
      <div>
        <FieldLabel label="Excluded Industries" hint="Industries you do NOT sell to" isDarkMode={isDarkMode} />
        <ArrayField items={s.excludedIndustries?.length ? s.excludedIndustries : ['']} onChange={v => set({ excludedIndustries: v })} placeholder="e.g. Government, Non-profit" isDarkMode={isDarkMode} />
      </div>
      <div>
        <FieldLabel label="Excluded Company Sizes" isDarkMode={isDarkMode} />
        <ChipSelect
          options={['Sole traders', '1-10 employees', '10-50 employees', '50-200 employees', '200+ employees', '1000+ employees']}
          selected={s.excludedCompanySizes || []}
          onChange={v => set({ excludedCompanySizes: v })}
          isDarkMode={isDarkMode} />
      </div>
      <div>
        <FieldLabel label="Excluded Regions" isDarkMode={isDarkMode} />
        <ArrayField items={s.excludedRegions?.length ? s.excludedRegions : ['']} onChange={v => set({ excludedRegions: v })} placeholder="e.g. International only, Exclude rural areas" isDarkMode={isDarkMode} />
      </div>
      <div>
        <FieldLabel label="Red Flags" hint="What are disqualifiers in a prospect?" isDarkMode={isDarkMode} />
        <ArrayField items={s.redFlags?.length ? s.redFlags : ['']} onChange={v => set({ redFlags: v })} placeholder="e.g. No budget allocated, Already locked into competitor" isDarkMode={isDarkMode} />
      </div>
    </div>
  );
};

const SalesApproachForm: React.FC<SectionFormProps> = ({ profile, onChange, isDarkMode }) => {
  const s = profile.salesApproach || {};
  const set = (patch: Partial<SalesApproachSection>) => onChange({ ...profile, salesApproach: { ...s, ...patch } });

  return (
    <div className="space-y-5">
      <div>
        <FieldLabel label="Primary Sales Channels" isDarkMode={isDarkMode} />
        <ChipSelect
          options={['Email', 'Cold calling', 'LinkedIn', 'Inbound', 'Referrals', 'Events', 'Partnerships']}
          selected={s.primaryChannels || []}
          onChange={v => set({ primaryChannels: v })}
          isDarkMode={isDarkMode} />
      </div>
      <div>
        <FieldLabel label="Tone of Voice" isDarkMode={isDarkMode} />
        <ChipSelect
          options={['Professional', 'Consultative', 'Friendly', 'Technical', 'Casual', 'Authoritative']}
          selected={s.toneOfVoice ? [s.toneOfVoice] : []}
          onChange={v => set({ toneOfVoice: v[v.length - 1] || '' })}
          isDarkMode={isDarkMode} />
      </div>
      <div>
        <FieldLabel label="Best Messaging" hint="What messaging resonates most with your customers?" isDarkMode={isDarkMode} />
        <TextField value={s.bestMessaging || ''} onChange={v => set({ bestMessaging: v })} placeholder="e.g. ROI-driven, emphasis on time savings" multiline isDarkMode={isDarkMode} />
      </div>
      <div>
        <FieldLabel label="Common Objections" hint="Objections you regularly face" isDarkMode={isDarkMode} />
        <ArrayField items={s.commonObjections?.length ? s.commonObjections : ['']} onChange={v => set({ commonObjections: v })} placeholder='e.g. "Too expensive", "Already have a solution"' isDarkMode={isDarkMode} />
      </div>
      <div>
        <FieldLabel label="What Convinces Customers" isDarkMode={isDarkMode} />
        <TextField value={s.whatConvinces || ''} onChange={v => set({ whatConvinces: v })} placeholder="e.g. Live demo showing 10x faster workflow" isDarkMode={isDarkMode} />
      </div>
    </div>
  );
};

const DataSourcesForm: React.FC<SectionFormProps> = ({ profile, onChange, isDarkMode }) => {
  const s = profile.dataSources || {};
  const set = (patch: Partial<DataSourcePreferencesSection>) => onChange({ ...profile, dataSources: { ...s, ...patch } });

  return (
    <div className="space-y-5">
      <div>
        <FieldLabel label="Current Lead Sources" hint="Where do you currently find leads?" isDarkMode={isDarkMode} />
        <ChipSelect
          options={['News sites', 'LinkedIn', 'Job boards', 'Industry portals', 'Trade shows', 'Referrals', 'Google Alerts', 'Conferences']}
          selected={s.currentLeadSources || []}
          onChange={v => set({ currentLeadSources: v })}
          isDarkMode={isDarkMode} />
      </div>
      <div>
        <FieldLabel label="Trusted Sources" hint="Sources you trust most for signal quality" isDarkMode={isDarkMode} />
        <ArrayField items={s.trustedSources?.length ? s.trustedSources : ['']} onChange={v => set({ trustedSources: v })} placeholder="e.g. AFR, TechCrunch, Industry association newsletters" isDarkMode={isDarkMode} />
      </div>
      <div>
        <FieldLabel label="Websites to Monitor" hint="Specific URLs you want watched for signals" isDarkMode={isDarkMode} />
        <ArrayField items={s.monitoredWebsites?.length ? s.monitoredWebsites : ['']} onChange={v => set({ monitoredWebsites: v })} placeholder="https://example.com" isDarkMode={isDarkMode} />
      </div>
      <div>
        <FieldLabel label="Competitors to Monitor" isDarkMode={isDarkMode} />
        <ArrayField items={s.monitoredCompetitors?.length ? s.monitoredCompetitors : ['']} onChange={v => set({ monitoredCompetitors: v })} placeholder="e.g. Acme Corp, RivalCo" isDarkMode={isDarkMode} />
      </div>
    </div>
  );
};

const SuccessMetricsForm: React.FC<SectionFormProps> = ({ profile, onChange, isDarkMode }) => {
  const s = profile.successMetrics || {};
  const set = (patch: Partial<SuccessMetricsSection>) => onChange({ ...profile, successMetrics: { ...s, ...patch } });

  return (
    <div className="space-y-5">
      <div>
        <FieldLabel label="Good Lead Definition" hint='What defines a "good lead" for you?' isDarkMode={isDarkMode} />
        <TextField value={s.goodLeadDefinition || ''} onChange={v => set({ goodLeadDefinition: v })} placeholder="e.g. A company actively seeking our type of solution with budget allocated" multiline isDarkMode={isDarkMode} />
      </div>
      <div>
        <FieldLabel label="Expected Conversion Rate" isDarkMode={isDarkMode} />
        <SelectField value={s.expectedConversionRate || ''} onChange={v => set({ expectedConversionRate: v })} isDarkMode={isDarkMode}
          placeholder="Select expected rate"
          options={[
            { value: '1-5%', label: '1-5%' },
            { value: '5-10%', label: '5-10%' },
            { value: '10-20%', label: '10-20%' },
            { value: '20-40%', label: '20-40%' },
            { value: '40%+', label: '40%+' },
          ]} />
      </div>
      <div>
        <FieldLabel label="Volume vs Quality" hint="What matters more to you?" isDarkMode={isDarkMode} />
        <ChipSelect
          options={['volume', 'quality', 'balanced']}
          selected={s.volumeVsQuality ? [s.volumeVsQuality] : []}
          onChange={v => set({ volumeVsQuality: (v[v.length - 1] || '') as SuccessMetricsSection['volumeVsQuality'] })}
          isDarkMode={isDarkMode} />
      </div>
    </div>
  );
};

const SECTION_FORMS: Record<string, React.FC<SectionFormProps>> = {
  icp: ICPForm,
  problemSolutionFit: ProblemSolutionForm,
  usp: USPForm,
  dealCharacteristics: DealForm,
  exclusions: ExclusionsForm,
  salesApproach: SalesApproachForm,
  dataSources: DataSourcesForm,
  successMetrics: SuccessMetricsForm,
};

// ============ MAIN PROFILE VIEW ============

interface ProfileViewProps {
  profile: BusinessProfile | null;
  onSave: (profile: BusinessProfile) => Promise<void>;
  isEmbedded?: boolean;
}

const ProfileView: React.FC<ProfileViewProps> = ({ profile: initialProfile, onSave, isEmbedded = false }) => {
  const { isDarkMode } = useTheme();
  const vl = getVL(isDarkMode);
  const [profile, setProfile] = useState<BusinessProfile>(initialProfile || { name: '', industry: '', products: [], targetGroups: [], geography: [], website: '' });
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Sync if parent profile changes
  useEffect(() => {
    if (initialProfile) setProfile(initialProfile);
  }, [initialProfile]);

  const handleChange = useCallback((updated: BusinessProfile) => {
    setProfile(updated);
    setSaveStatus('saving');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      await onSave(updated);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 1500);
  }, [onSave]);

  const toggle = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Overall completion
  const overallCompletion = Math.round(SECTIONS.reduce((sum, s) => sum + sectionCompletion(s.id, profile), 0) / SECTIONS.length);
  const filledSections = SECTIONS.filter(s => sectionCompletion(s.id, profile) > 0).length;

  return (
    <div className={`mx-auto pb-40 animate-in fade-in duration-500 flex flex-col ${isEmbedded ? 'max-w-full' : 'max-w-4xl'}`}>

      {/* Header (Hidden if embedded) */}
      {!isEmbedded && (
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight" style={{ fontFamily: "'Newsreader', Georgia, serif", color: vl.textMain }}>
              Business Intelligence Profile
            </h1>
            <p className="text-[13px] mt-1" style={{ color: vl.textBody }}>
              The more Leadpulse knows about your business, the sharper your signals become. All fields are optional.
            </p>
          </div>
        </div>
      )}

      {/* Embedded Save Status removed from block flow, moved to card below */}
      
      {!isEmbedded && (
        <div className="flex justify-end -mt-16 relative z-10 mb-4 pr-2">
          <div 
            className="flex items-center gap-2 px-3 py-1.5 rounded-[4px] text-[10px] font-bold border transition-all uppercase tracking-wider label-caps"
            style={{
              background: saveStatus === 'saving' ? '#F59E0B10' : saveStatus === 'saved' ? '#10B98110' : vl.chipBg,
              borderColor: saveStatus === 'saving' ? '#F59E0B30' : saveStatus === 'saved' ? '#10B98130' : vl.borderStrong,
              color: saveStatus === 'saving' ? '#F59E0B' : saveStatus === 'saved' ? '#10B981' : vl.textMuted
            }}
          >
            {saveStatus === 'saving' && <><Save className="w-3 h-3 animate-pulse" /> Saving...</>}
            {saveStatus === 'saved' && <><CheckCircle2 className="w-3 h-3" /> Saved</>}
            {saveStatus === 'idle' && <><Save className="w-3 h-3" /> Auto-save Active</>}
          </div>
        </div>
      )}

      {/* Container for main content */}
      <div className="space-y-6">
        {/* Overall Progress */}
        <div className="p-6 rounded-[6px] border flex items-center gap-6 vl-card relative" style={{ background: vl.surface, borderColor: vl.border }}>
          {isEmbedded && (
            <div className="absolute top-4 right-4 z-10">
              <div 
                className="flex items-center gap-2 px-3 py-1.5 rounded-[4px] text-[10px] font-bold border transition-all uppercase tracking-wider label-caps shadow-sm"
                style={{
                  background: saveStatus === 'saving' ? '#F59E0B10' : saveStatus === 'saved' ? '#10B98110' : vl.chipBg,
                  borderColor: saveStatus === 'saving' ? '#F59E0B30' : saveStatus === 'saved' ? '#10B98130' : vl.borderStrong,
                  color: saveStatus === 'saving' ? '#F59E0B' : saveStatus === 'saved' ? '#10B981' : vl.textMuted
                }}
              >
                {saveStatus === 'saving' && <><Save className="w-3 h-3 animate-pulse" /> Saving...</>}
                {saveStatus === 'saved' && <><CheckCircle2 className="w-3 h-3" /> Saved</>}
                {saveStatus === 'idle' && <><Save className="w-3 h-3" /> Auto-save Active</>}
              </div>
            </div>
          )}
        <CompletionRing percent={overallCompletion} size={64} />
        <div className="flex-1">
          <div className="text-[15px] font-bold" style={{ color: vl.textMain }}>
            Profile Intelligence: {overallCompletion}% complete
          </div>
          <p className="text-[13px] mt-0.5" style={{ color: vl.textMuted }}>
            {filledSections} of {SECTIONS.length} sections started
            {overallCompletion < 30 && ' — completing even 2-3 sections significantly improves signal accuracy'}
          </p>
          <div className="flex gap-1.5 mt-3">
            {SECTIONS.map(s => {
              const pct = sectionCompletion(s.id, profile);
              return (
                <div key={s.id} className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: vl.borderStrong }}>
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, backgroundColor: pct === 0 ? 'transparent' : pct < 50 ? '#f59e0b' : pct < 100 ? vl.primary : '#10B981' }} />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Accordion Sections */}
      <div className="space-y-4">
        {SECTIONS.map(section => {
          const isOpen = expanded.has(section.id);
          const pct = sectionCompletion(section.id, profile);
          const FormComponent = SECTION_FORMS[section.id];
          const Icon = section.icon;

          return (
            <div key={section.id} className={`rounded-[6px] border overflow-hidden transition-all duration-300 vl-card ${isOpen ? 'shadow-md' : ''}`} style={{ background: vl.surface, borderColor: vl.border }}>
              {/* Section Header */}
              <button
                onClick={() => toggle(section.id)}
                className="w-full px-6 py-4 flex items-center gap-4 transition-colors"
                style={{ background: isOpen ? vl.surface : 'transparent' }}
              >
                <CompletionRing percent={pct} size={36} />
                <Icon className="w-5 h-5 flex-shrink-0" style={{ color: vl.primary }} />
                <div className="flex-1 text-left">
                  <div className="text-[13px] font-bold" style={{ color: vl.textMain }}>{section.title}</div>
                  <div className="text-[11px] mt-0.5" style={{ color: vl.textMuted }}>
                    Powers: {section.aiImpact}
                  </div>
                </div>
                {pct === 0 && (
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[10px] font-bold border label-caps tracking-wider" style={{ background: vl.primarySoft, color: vl.primary, borderColor: isDarkMode ? 'rgba(99,91,255,0.2)' : 'rgba(99,91,255,0.1)' }}>
                    <Info className="w-3 h-3" /> Recommended
                  </span>
                )}
                {isOpen ? <ChevronUp className="w-5 h-5" style={{ color: vl.textMuted }} /> : <ChevronDown className="w-5 h-5" style={{ color: vl.textMuted }} />}
              </button>

              {/* Section Body */}
              {isOpen && (
                <div className="px-6 pb-6 border-t animate-in fade-in slide-in-from-top-2 duration-300" style={{ borderColor: vl.borderStrong }}>
                  {/* Nudge */}
                  {pct === 0 && (
                    <div className="mt-4 mb-5 p-3 rounded-[6px] text-xs font-medium flex items-start gap-2 border" style={{ background: vl.primarySoft, color: vl.textMain, borderColor: isDarkMode ? 'rgba(99,91,255,0.2)' : 'rgba(99,91,255,0.1)' }}>
                      <Info className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: vl.primary }} />
                      <span style={{ color: vl.primary }}>{section.nudge}</span>
                    </div>
                  )}
                  <div className="mt-4">
                    <FormComponent profile={profile} onChange={handleChange} isDarkMode={isDarkMode} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
};

export default ProfileView;
