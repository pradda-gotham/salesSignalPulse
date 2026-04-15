
import React, { useState } from 'react';
import { Rocket, ChevronRight, SkipForward, Target, Zap, ShieldOff, BarChart3, Info, Plus, X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { BusinessProfile } from '../types';

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
  const [localProfile, setLocalProfile] = useState(profile);

  const update = (patch: Partial<BusinessProfile>) => {
    const updated = { ...localProfile, ...patch };
    setLocalProfile(updated);
    onSave(updated);
  };

  const inputCls = `w-full px-3 py-2 rounded-xl text-sm border transition-all focus:outline-none focus:ring-2 focus:ring-[#6C5DD3]/30 focus:border-[#6C5DD3] ${isDarkMode ? 'bg-white/5 border-white/10 text-white placeholder-zinc-600' : 'bg-white border-slate-200 text-[#1B1D21] placeholder-slate-400'}`;
  const cardCls = `p-5 rounded-2xl border ${isDarkMode ? 'bg-[#141414] border-white/5' : 'bg-white border-slate-200/60'}`;

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
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#6C5DD3]/10 mb-4">
          <Rocket className="w-8 h-8 text-[#6C5DD3]" />
        </div>
        <h2 className={`text-3xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-[#1B1D21]'}`}>
          Supercharge Your Results
        </h2>
        <p className={`text-sm mt-2 max-w-md mx-auto ${isDarkMode ? 'text-zinc-500' : 'text-[#808191]'}`}>
          Answer a few quick questions to dramatically improve signal accuracy. Everything is optional — you can refine later in your Profile tab.
        </p>
      </div>

      <div className="space-y-6">

        {/* 1. Buying Triggers — highest impact */}
        <div className={cardCls}>
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-[#6C5DD3]" />
            <span className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-[#1B1D21]'}`}>What events trigger a sale?</span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#6C5DD3]/10 text-[#6C5DD3] border border-[#6C5DD3]/20">HIGHEST IMPACT</span>
          </div>
          <p className={`text-xs mb-3 ${isDarkMode ? 'text-zinc-500' : 'text-[#808191]'}`}>
            Select events that typically lead your customers to buy. This directly powers signal detection.
          </p>
          <div className="flex flex-wrap gap-2">
            {chipOptions.map(opt => (
              <button key={opt} onClick={() => toggleTrigger(opt)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  buyingTriggers.includes(opt)
                    ? 'bg-[#6C5DD3]/10 text-[#6C5DD3] border-[#6C5DD3]/30'
                    : isDarkMode ? 'bg-white/5 text-zinc-400 border-white/10 hover:border-white/20' : 'bg-white text-[#808191] border-slate-200 hover:border-slate-300'
                }`}>
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Buyer Titles */}
        <div className={cardCls}>
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-4 h-4 text-[#6C5DD3]" />
            <span className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-[#1B1D21]'}`}>Who is your typical buyer?</span>
          </div>
          <p className={`text-xs mb-3 ${isDarkMode ? 'text-zinc-500' : 'text-[#808191]'}`}>
            Job titles of the people who make buying decisions.
          </p>
          <div className="space-y-2">
            {buyerTitles.map((title, i) => (
              <div key={i} className="flex items-center gap-2">
                <input value={title} onChange={e => {
                  const next = [...buyerTitles];
                  next[i] = e.target.value;
                  update({ icp: { ...localProfile.icp, typicalBuyerTitles: next } });
                }} placeholder="e.g. CFO, Head of Operations, CTO" className={inputCls} />
                {buyerTitles.length > 1 && (
                  <button onClick={() => update({ icp: { ...localProfile.icp, typicalBuyerTitles: buyerTitles.filter((_, idx) => idx !== i) } })}
                    className={`p-1.5 rounded-lg ${isDarkMode ? 'hover:bg-white/10 text-zinc-500' : 'hover:bg-red-50 text-slate-400'}`}>
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
            <button onClick={() => update({ icp: { ...localProfile.icp, typicalBuyerTitles: [...buyerTitles, ''] } })}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#6C5DD3] hover:text-[#5B4EC2]">
              <Plus className="w-3.5 h-3.5" /> Add another
            </button>
          </div>
        </div>

        {/* 3. Average Deal Size */}
        <div className={cardCls}>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-4 h-4 text-[#6C5DD3]" />
            <span className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-[#1B1D21]'}`}>Average deal size?</span>
          </div>
          <p className={`text-xs mb-3 ${isDarkMode ? 'text-zinc-500' : 'text-[#808191]'}`}>
            Grounds opportunity estimates in reality instead of AI guesses.
          </p>
          <select value={localProfile.dealCharacteristics?.avgDealSize || ''}
            onChange={e => update({ dealCharacteristics: { ...localProfile.dealCharacteristics, avgDealSize: e.target.value } })}
            className={inputCls}>
            <option value="">Select range</option>
            <option value="<$5K">Under $5K</option>
            <option value="$5K-$25K">$5K - $25K</option>
            <option value="$25K-$100K">$25K - $100K</option>
            <option value="$100K-$500K">$100K - $500K</option>
            <option value="$500K+">$500K+</option>
          </select>
        </div>

        {/* 4. Exclusions */}
        <div className={cardCls}>
          <div className="flex items-center gap-2 mb-1">
            <ShieldOff className="w-4 h-4 text-[#6C5DD3]" />
            <span className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-[#1B1D21]'}`}>Who should we exclude?</span>
          </div>
          <p className={`text-xs mb-3 ${isDarkMode ? 'text-zinc-500' : 'text-[#808191]'}`}>
            Industries or segments to skip — cuts irrelevant signals by 30%+.
          </p>
          <div className="space-y-2">
            {excludedIndustries.map((ind, i) => (
              <div key={i} className="flex items-center gap-2">
                <input value={ind} onChange={e => {
                  const next = [...excludedIndustries];
                  next[i] = e.target.value;
                  update({ exclusions: { ...localProfile.exclusions, excludedIndustries: next } });
                }} placeholder="e.g. Government, Non-profit" className={inputCls} />
                {excludedIndustries.length > 1 && (
                  <button onClick={() => update({ exclusions: { ...localProfile.exclusions, excludedIndustries: excludedIndustries.filter((_, idx) => idx !== i) } })}
                    className={`p-1.5 rounded-lg ${isDarkMode ? 'hover:bg-white/10 text-zinc-500' : 'hover:bg-red-50 text-slate-400'}`}>
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
            <button onClick={() => update({ exclusions: { ...localProfile.exclusions, excludedIndustries: [...excludedIndustries, ''] } })}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#6C5DD3] hover:text-[#5B4EC2]">
              <Plus className="w-3.5 h-3.5" /> Add another
            </button>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between mt-10">
        <button onClick={onSkip}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${isDarkMode ? 'text-zinc-500 hover:text-white hover:bg-white/5' : 'text-[#808191] hover:text-[#1B1D21] hover:bg-slate-100'}`}>
          <SkipForward className="w-4 h-4" /> Skip for now
        </button>
        <button onClick={onContinue}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#6C5DD3] hover:bg-[#5B4EC2] text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-[#6C5DD3]/20">
          Continue <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <p className={`text-center text-[10px] mt-4 ${isDarkMode ? 'text-zinc-600' : 'text-[#aaa]'}`}>
        You can always refine these in the Profile tab later.
      </p>
    </div>
  );
};
