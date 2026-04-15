import React, { useState } from 'react';
import { X, Globe } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { getVL } from '../utils/vesper';

interface TrackWebsiteModalProps {
  onClose: () => void;
  onAdd: (website: { url: string; purpose?: string; target_keywords?: string }) => void;
}

export const TrackWebsiteModal: React.FC<TrackWebsiteModalProps> = ({ onClose, onAdd }) => {
  const { isDarkMode } = useTheme();
  const vl = getVL(isDarkMode);
  
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
      <div className="w-full max-w-2xl rounded-[6px] shadow-xl border overflow-hidden vl-card" style={{ background: vl.surface, borderColor: vl.border }}>
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: vl.borderStrong }}>
          <div>
            <h2 className="text-2xl font-semibold" style={{ fontFamily: "'Newsreader', Georgia, serif", color: vl.textMain }}>Track Website</h2>
            <p className="text-[13px] mt-1" style={{ color: vl.textBody }}>Monitor a specific URL for sales opportunities.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-[4px] transition-colors hover:text-red-500" style={{ color: vl.textMuted }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest mb-2 label-caps" style={{ color: vl.textMuted }}>Website URL *</label>
              <input
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/news"
                className="w-full px-4 py-2.5 rounded-[4px] text-[13px] border focus:outline-none focus:border-[#635BFF] transition-all"
                style={{ background: vl.surfaceMuted, borderColor: vl.borderStrong, color: vl.textMain }}
              />
            </div>
            
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest mb-2 label-caps" style={{ color: vl.textMuted }}>Tracking Purpose</label>
              <input
                type="text"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="e.g. Monitor Competitor Pricing or Track New Hires"
                className="w-full px-4 py-2.5 rounded-[4px] text-[13px] border focus:outline-none focus:border-[#635BFF] transition-all"
                style={{ background: vl.surfaceMuted, borderColor: vl.borderStrong, color: vl.textMain }}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest mb-2 label-caps" style={{ color: vl.textMuted }}>Target Keywords / Instructions</label>
              <textarea
                value={targetKeywords}
                onChange={(e) => setTargetKeywords(e.target.value)}
                placeholder="Tell Leadpulse exactly what to flag. e.g., 'Flag any mentions of structural upgrades or expansion projects.'"
                rows={3}
                className="w-full px-4 py-2.5 rounded-[4px] text-[13px] border focus:outline-none focus:border-[#635BFF] transition-all resize-none"
                style={{ background: vl.surfaceMuted, borderColor: vl.borderStrong, color: vl.textMain }}
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t mt-4" style={{ borderColor: vl.borderStrong, paddingTop: '20px' }}>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-[4px] text-[11px] font-bold uppercase transition-colors label-caps tracking-wider"
              style={{ color: vl.textMuted, background: vl.chipBg }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex items-center gap-2 px-6 py-2.5 text-xs font-bold label-caps tracking-wider"
            >
              <Globe className="w-4 h-4" /> Start Tracking
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
