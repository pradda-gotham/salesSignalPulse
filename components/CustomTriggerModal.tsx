import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { SalesTrigger } from '../types';

interface CustomTriggerModalProps {
  onClose: () => void;
  onAdd: (trigger: SalesTrigger) => void;
}

export const CustomTriggerModal: React.FC<CustomTriggerModalProps> = ({ onClose, onAdd }) => {
  const { isDarkMode } = useTheme();
  
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
      <div className={`w-full max-w-2xl rounded-2xl shadow-xl border overflow-hidden ${isDarkMode ? 'bg-[#141414] border-white/10' : 'bg-white border-slate-200'}`}>
        <div className={`flex items-center justify-between p-6 border-b ${isDarkMode ? 'border-white/10' : 'border-slate-100'}`}>
          <div>
            <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-[#1B1D21]'}`}>Create Custom Trigger</h2>
            <p className={`text-sm mt-1 ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}>Define a new market event or signal to hunt for.</p>
          </div>
          <button onClick={onClose} className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-white/10 text-zinc-400 hover:text-white' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-600'}`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-4">
            <div>
              <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-zinc-500' : 'text-slate-500'}`}>Target Product/Service *</label>
              <input
                type="text"
                required
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                placeholder="e.g. HVAC Installation"
                className={`w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-[#6C5DD3]/50 focus:border-[#6C5DD3] transition-all outline-none ${isDarkMode ? 'bg-black/50 border-white/10 text-white placeholder:text-zinc-600' : 'bg-white border-slate-200 text-[#1B1D21] placeholder:text-slate-400'}`}
              />
            </div>
            
            <div>
              <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-zinc-500' : 'text-slate-500'}`}>Trigger Event *</label>
              <input
                type="text"
                required
                value={event}
                onChange={(e) => setEvent(e.target.value)}
                placeholder="e.g. New Commercial Real Estate project announced"
                className={`w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-[#6C5DD3]/50 focus:border-[#6C5DD3] transition-all outline-none ${isDarkMode ? 'bg-black/50 border-white/10 text-white placeholder:text-zinc-600' : 'bg-white border-slate-200 text-[#1B1D21] placeholder:text-slate-400'}`}
              />
            </div>

            <div>
              <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-zinc-500' : 'text-slate-500'}`}>Data Source / Signal Type *</label>
              <input
                type="text"
                required
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="e.g. Building Permits, Press Releases"
                className={`w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-[#6C5DD3]/50 focus:border-[#6C5DD3] transition-all outline-none ${isDarkMode ? 'bg-black/50 border-white/10 text-white placeholder:text-zinc-600' : 'bg-white border-slate-200 text-[#1B1D21] placeholder:text-slate-400'}`}
              />
            </div>

            <div>
              <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-zinc-500' : 'text-slate-500'}`}>Relevance Logic *</label>
              <textarea
                required
                value={logic}
                onChange={(e) => setLogic(e.target.value)}
                placeholder="Explain why this event is a buying signal (e.g. 'A new building will require an HVAC system installed within the next 12 months.')"
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
              <Plus className="w-4 h-4" /> Save Trigger
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
