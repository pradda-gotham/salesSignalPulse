import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { SalesTrigger } from '../types';
import { getVL } from '../utils/vesper';

interface CustomTriggerModalProps {
  onClose: () => void;
  onAdd: (trigger: SalesTrigger) => void;
}

export const CustomTriggerModal: React.FC<CustomTriggerModalProps> = ({ onClose, onAdd }) => {
  const { isDarkMode } = useTheme();
  const vl = getVL(isDarkMode);
  
  const [product, setProduct] = useState('');
  const [event, setEvent] = useState('');
  const [source, setSource] = useState('');
  const [logic, setLogic] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !event || !source || !logic) return;

    const newTrigger: SalesTrigger = {
      id: `custom-${Date.now()}`,
      product,
      event,
      source,
      logic,
      triggerType: 'active',
      status: 'Approved',
    };

    onAdd(newTrigger);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in transition-all">
      <div className="w-full max-w-2xl rounded-[6px] shadow-xl border overflow-hidden vl-card" style={{ background: vl.surface, borderColor: vl.border }}>
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: vl.borderStrong }}>
          <div>
            <h2 className="text-2xl font-semibold" style={{ fontFamily: "'Newsreader', Georgia, serif", color: vl.textMain }}>Create Custom Trigger</h2>
            <p className="text-[13px] mt-1" style={{ color: vl.textBody }}>Define a new market event or signal to hunt for.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-[4px] transition-colors hover:text-red-500" style={{ color: vl.textMuted }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest mb-2 label-caps" style={{ color: vl.textMuted }}>Target Product/Service *</label>
              <input
                type="text"
                required
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                placeholder="e.g. HVAC Installation"
                className="w-full px-4 py-2.5 rounded-[4px] text-[13px] border focus:outline-none focus:border-[#635BFF] transition-all"
                style={{ background: vl.surfaceMuted, borderColor: vl.borderStrong, color: vl.textMain }}
              />
            </div>
            
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest mb-2 label-caps" style={{ color: vl.textMuted }}>Trigger Event *</label>
              <input
                type="text"
                required
                value={event}
                onChange={(e) => setEvent(e.target.value)}
                placeholder="e.g. New Commercial Real Estate project announced"
                className="w-full px-4 py-2.5 rounded-[4px] text-[13px] border focus:outline-none focus:border-[#635BFF] transition-all"
                style={{ background: vl.surfaceMuted, borderColor: vl.borderStrong, color: vl.textMain }}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest mb-2 label-caps" style={{ color: vl.textMuted }}>Data Source / Signal Type *</label>
              <input
                type="text"
                required
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="e.g. Building Permits, Press Releases"
                className="w-full px-4 py-2.5 rounded-[4px] text-[13px] border focus:outline-none focus:border-[#635BFF] transition-all"
                style={{ background: vl.surfaceMuted, borderColor: vl.borderStrong, color: vl.textMain }}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest mb-2 label-caps" style={{ color: vl.textMuted }}>Relevance Logic *</label>
              <textarea
                required
                value={logic}
                onChange={(e) => setLogic(e.target.value)}
                placeholder="Explain why this event is a buying signal (e.g. 'A new building will require an HVAC system installed within the next 12 months.')"
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
              <Plus className="w-4 h-4" /> Save Trigger
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
