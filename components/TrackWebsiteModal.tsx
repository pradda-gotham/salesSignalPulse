import React, { useState } from 'react';
import { X, Globe } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface TrackWebsiteModalProps {
  onClose: () => void;
  onAdd: (website: { url: string; purpose?: string; target_keywords?: string }) => void;
}

export const TrackWebsiteModal: React.FC<TrackWebsiteModalProps> = ({ onClose, onAdd }) => {
  const { isDarkMode } = useTheme();
  
  const [url, setUrl] = useState('');
  const [purpose, setPurpose] = useState('');
  const [targetKeywords, setTargetKeywords] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    onAdd({
      url,
      purpose,
      target_keywords: targetKeywords
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in transition-all">
      <div className={`w-full max-w-2xl rounded-2xl shadow-xl border overflow-hidden ${isDarkMode ? 'bg-[#141414] border-white/10' : 'bg-white border-slate-200'}`}>
        <div className={`flex items-center justify-between p-6 border-b ${isDarkMode ? 'border-white/10' : 'border-slate-100'}`}>
          <div>
            <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-[#1B1D21]'}`}>Track Website</h2>
            <p className={`text-sm mt-1 ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}>Monitor a specific URL for sales opportunities.</p>
          </div>
          <button onClick={onClose} className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-white/10 text-zinc-400 hover:text-white' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-600'}`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-4">
            <div>
              <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-zinc-500' : 'text-slate-500'}`}>Website URL *</label>
              <input
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/news"
                className={`w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-[#6C5DD3]/50 focus:border-[#6C5DD3] transition-all outline-none ${isDarkMode ? 'bg-black/50 border-white/10 text-white placeholder:text-zinc-600' : 'bg-white border-slate-200 text-[#1B1D21] placeholder:text-slate-400'}`}
              />
            </div>
            
            <div>
              <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-zinc-500' : 'text-slate-500'}`}>Tracking Purpose</label>
              <input
                type="text"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="e.g. Monitor Competitor Pricing or Track New Hires"
                className={`w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-[#6C5DD3]/50 focus:border-[#6C5DD3] transition-all outline-none ${isDarkMode ? 'bg-black/50 border-white/10 text-white placeholder:text-zinc-600' : 'bg-white border-slate-200 text-[#1B1D21] placeholder:text-slate-400'}`}
              />
            </div>

            <div>
              <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-zinc-500' : 'text-slate-500'}`}>Target Keywords / Instructions</label>
              <textarea
                value={targetKeywords}
                onChange={(e) => setTargetKeywords(e.target.value)}
                placeholder="Tell Leadpulse exactly what to flag. e.g., 'Flag any mentions of structural upgrades or expansion projects.'"
                rows={3}
                className={`w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-[#6C5DD3]/50 focus:border-[#6C5DD3] transition-all outline-none resize-none ${isDarkMode ? 'bg-black/50 border-white/10 text-white placeholder:text-zinc-600' : 'bg-white border-slate-200 text-[#1B1D21] placeholder:text-slate-400'}`}
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-colors ${isDarkMode ? 'text-zinc-300 hover:bg-white/5' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg text-sm font-bold bg-[#6C5DD3] hover:bg-[#5b4ec2] text-white flex items-center gap-2 transition-all shadow-sm shadow-[#6C5DD3]/20"
            >
              <Globe className="w-4 h-4" /> Start Tracking
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
