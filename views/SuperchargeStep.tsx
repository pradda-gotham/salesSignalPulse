import React, { useState } from 'react';
import { Rocket, ChevronRight, SkipForward, Target, Zap, ShieldOff, BarChart3, Info, Plus, X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { BusinessProfile } from '../types';
import { getVL } from '../utils/vesper';

interface SuperchargeStepProps {
  profile: BusinessProfile;
  onSave: (profile: BusinessProfile) => void;
  onContinue: () => void;
  onSkip: () => void;
}

const chipOptions = [
  'Hiring surge', 'New funding', 'Expansion', 'Regulation changes',
  'New product launch', 'Cost pressure', 'Leadership change',
  'Technology migration', 'M&A activity', 'Compliance deadline'
];

export const SuperchargeStep: React.FC<SuperchargeStepProps> = ({ profile, onSave, onContinue, onSkip }) => {
  const { isDarkMode } = useTheme();
  const vl = getVL(isDarkMode);
  const [localProfile, setLocalProfile] = useState(profile);

  const update = (patch: Partial<BusinessProfile>) => {
    const updated = { ...localProfile, ...patch };
    setLocalProfile(updated);
    onSave(updated);
  };

  const buyingTriggers = localProfile.problemSolutionFit?.buyingTriggers || [];
  const toggleTrigger = (t: string) => {
    const next = buyingTriggers.includes(t) ? buyingTriggers.filter(x => x !== t) : [...buyingTriggers, t];
    update({ problemSolutionFit: { ...localProfile.problemSolutionFit, buyingTriggers: next } });
  };

  const excludedIndustries = localProfile.exclusions?.excludedIndustries || [''];
  const buyerTitles = localProfile.icp?.typicalBuyerTitles || [''];

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 animate-in fade-in duration-500">

      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-[4px] mb-4 border" style={{ background: vl.primarySoft, borderColor: isDarkMode ? 'rgba(99,91,255,0.2)' : 'rgba(99,91,255,0.1)' }}>
          <Rocket className="w-8 h-8" style={{ color: vl.primary }} />
        </div>
        <h2 className="text-3xl font-semibold tracking-tight" style={{ fontFamily: "'Newsreader', Georgia, serif", color: vl.textMain }}>
          Supercharge Your Results
        </h2>
        <p className="text-[13px] mt-2 max-w-md mx-auto" style={{ color: vl.textBody }}>
          Answer a few quick questions to dramatically improve signal accuracy. Everything is optional — you can refine later in your Profile tab.
        </p>
      </div>

      <div className="space-y-6">

        {/* 1. Buying Triggers — highest impact */}
        <div className="p-6 rounded-[6px] border vl-card" style={{ background: vl.surface, borderColor: vl.border }}>
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4" style={{ color: vl.primary }} />
            <span className="text-[13px] font-bold" style={{ color: vl.textMain }}>What events trigger a sale?</span>
            <span className="px-1.5 py-0.5 rounded-[4px] text-[9px] font-bold border label-caps tracking-wider" style={{ background: vl.primarySoft, color: vl.primary, borderColor: isDarkMode ? 'rgba(99,91,255,0.2)' : 'rgba(99,91,255,0.1)' }}>HIGHEST IMPACT</span>
          </div>
          <p className="text-[11px] mb-3" style={{ color: vl.textBody }}>
            Select events that typically lead your customers to buy. This directly powers signal detection.
          </p>
          <div className="flex flex-wrap gap-2">
            {chipOptions.map(opt => {
              const isActive = buyingTriggers.includes(opt);
              return (
                <button key={opt} onClick={() => toggleTrigger(opt)}
                  className="px-3 py-1.5 rounded-[4px] text-[11px] font-bold border transition-all label-caps"
                  style={{
                    background: isActive ? vl.primarySoft : vl.chipBg,
                    color: isActive ? vl.primary : vl.textMuted,
                    borderColor: isActive ? (isDarkMode ? 'rgba(99,91,255,0.2)' : 'rgba(99,91,255,0.1)') : vl.borderStrong
                  }}>
                  {opt}
                </button>
              )
            })}
          </div>
        </div>

        {/* 2. Buyer Titles */}
        <div className="p-6 rounded-[6px] border vl-card" style={{ background: vl.surface, borderColor: vl.border }}>
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-4 h-4" style={{ color: vl.primary }} />
            <span className="text-[13px] font-bold" style={{ color: vl.textMain }}>Who is your typical buyer?</span>
          </div>
          <p className="text-[11px] mb-3" style={{ color: vl.textBody }}>
            Job titles of the people who make buying decisions.
          </p>
          <div className="space-y-2">
            {buyerTitles.map((title, i) => (
              <div key={i} className="flex items-center gap-2">
                <input value={title} onChange={e => {
                  const next = [...buyerTitles];
                  next[i] = e.target.value;
                  update({ icp: { ...localProfile.icp, typicalBuyerTitles: next } });
                }} placeholder="e.g. CFO, Head of Operations, CTO" className="w-full px-3 py-2 rounded-[4px] text-[13px] border focus:outline-none focus:border-[#635BFF] transition-all" style={{ background: vl.surfaceMuted, borderColor: vl.borderStrong, color: vl.textMain }} />
                {buyerTitles.length > 1 && (
                  <button onClick={() => update({ icp: { ...localProfile.icp, typicalBuyerTitles: buyerTitles.filter((_, idx) => idx !== i) } })}
                    className="p-1.5 rounded-[4px] transition-colors hover:text-red-500" style={{ color: vl.textMuted }}>
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
            <button onClick={() => update({ icp: { ...localProfile.icp, typicalBuyerTitles: [...buyerTitles, ''] } })}
              className="flex items-center gap-1.5 text-[11px] font-bold hover:underline label-caps tracking-wider mt-1" style={{ color: vl.primary }}>
              <Plus className="w-3 h-3" /> Add another
            </button>
          </div>
        </div>

        {/* 3. Average Deal Size */}
        <div className="p-6 rounded-[6px] border vl-card" style={{ background: vl.surface, borderColor: vl.border }}>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-4 h-4" style={{ color: vl.primary }} />
            <span className="text-[13px] font-bold" style={{ color: vl.textMain }}>Average deal size?</span>
          </div>
          <p className="text-[11px] mb-3" style={{ color: vl.textBody }}>
            Grounds opportunity estimates in reality instead of AI guesses.
          </p>
          <select value={localProfile.dealCharacteristics?.avgDealSize || ''}
            onChange={e => update({ dealCharacteristics: { ...localProfile.dealCharacteristics, avgDealSize: e.target.value } })}
            className="w-full px-3 py-2 rounded-[4px] text-[13px] border focus:outline-none focus:border-[#635BFF] transition-all" style={{ background: vl.surfaceMuted, borderColor: vl.borderStrong, color: vl.textMain }}>
            <option value="">Select range</option>
            <option value="<$5K">Under $5K</option>
            <option value="$5K-$25K">$5K - $25K</option>
            <option value="$25K-$100K">$25K - $100K</option>
            <option value="$100K-$500K">$100K - $500K</option>
            <option value="$500K+">$500K+</option>
          </select>
        </div>

        {/* 4. Exclusions */}
        <div className="p-6 rounded-[6px] border vl-card" style={{ background: vl.surface, borderColor: vl.border }}>
          <div className="flex items-center gap-2 mb-1">
            <ShieldOff className="w-4 h-4" style={{ color: vl.primary }} />
            <span className="text-[13px] font-bold" style={{ color: vl.textMain }}>Who should we exclude?</span>
          </div>
          <p className="text-[11px] mb-3" style={{ color: vl.textBody }}>
            Industries or segments to skip — cuts irrelevant signals by 30%+.
          </p>
          <div className="space-y-2">
            {excludedIndustries.map((ind, i) => (
              <div key={i} className="flex items-center gap-2">
                <input value={ind} onChange={e => {
                  const next = [...excludedIndustries];
                  next[i] = e.target.value;
                  update({ exclusions: { ...localProfile.exclusions, excludedIndustries: next } });
                }} placeholder="e.g. Government, Non-profit" className="w-full px-3 py-2 rounded-[4px] text-[13px] border focus:outline-none focus:border-[#635BFF] transition-all" style={{ background: vl.surfaceMuted, borderColor: vl.borderStrong, color: vl.textMain }} />
                {excludedIndustries.length > 1 && (
                  <button onClick={() => update({ exclusions: { ...localProfile.exclusions, excludedIndustries: excludedIndustries.filter((_, idx) => idx !== i) } })}
                    className="p-1.5 rounded-[4px] transition-colors hover:text-red-500" style={{ color: vl.textMuted }}>
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
            <button onClick={() => update({ exclusions: { ...localProfile.exclusions, excludedIndustries: [...excludedIndustries, ''] } })}
              className="flex items-center gap-1.5 text-[11px] font-bold hover:underline label-caps tracking-wider mt-1" style={{ color: vl.primary }}>
              <Plus className="w-3 h-3" /> Add another
            </button>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between mt-10">
        <button onClick={onSkip}
          className="flex items-center gap-2 px-5 py-2.5 rounded-[4px] text-[11px] font-bold uppercase transition-all label-caps tracking-wider hover:bg-[#635BFF]/10" style={{ color: vl.textMuted }}>
          <SkipForward className="w-4 h-4" /> Skip for now
        </button>
        <button onClick={onContinue}
          className="btn-primary flex items-center gap-2 px-6 py-2.5 text-xs font-bold label-caps tracking-wider">
          Continue <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <p className="text-center text-[10px] mt-4" style={{ color: vl.textMuted }}>
        You can always refine these in the Profile tab later.
      </p>
    </div>
  );
};
