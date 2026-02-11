
import React, { useState } from 'react';
import { Search, Loader2, Check, Edit2, Globe, Building2, Package, Users, Compass, Save, X, Activity } from 'lucide-react';
import { BusinessProfile } from '../types';
import { geminiService } from '../services/geminiService';
import { useTheme } from '../contexts/ThemeContext';

interface OnboardingViewProps {
  onVerified: (profile: BusinessProfile) => void;
  autoPilotMode?: boolean;
}

const OnboardingView: React.FC<OnboardingViewProps> = ({ onVerified, autoPilotMode = false }) => {
  const { isDarkMode } = useTheme();
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState('');

  const handleAnalyze = async () => {
    if (!url) return;
    setIsAnalyzing(true);
    try {
      const data = await geminiService.profileBusiness(url);

      const newProfile = {
        ...data as BusinessProfile,
        name: (data as any).name || "Company Name",
        website: url,
        isVerified: false
      };

      if (autoPilotMode) {
        // Skip review screen and proceed immediately
        onVerified({ ...newProfile, isVerified: true });
      } else {
        // Show review screen (default behavior)
        setProfile(newProfile);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to profile business. Please check the console for details and ensure your API key is valid.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const startEditing = (field: string, initialValue: string) => {
    setEditingField(field);
    setTempValue(initialValue);
  };

  const saveEdit = (field: keyof BusinessProfile) => {
    if (!profile) return;

    let updatedValue: any = tempValue;
    // Handle array fields
    if (['products', 'targetGroups', 'geography'].includes(field as string)) {
      updatedValue = tempValue.split(',').map(s => s.trim()).filter(s => s.length > 0);
    }

    setProfile({
      ...profile,
      [field]: updatedValue
    });
    setEditingField(null);
  };

  const cancelEdit = () => {
    setEditingField(null);
  };

  if (isAnalyzing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-in fade-in duration-500 px-4">
        <div className="relative mb-8">
          <Loader2 className="w-16 h-16 text-[#6C5DD3] animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Activity className="w-8 h-8 text-[#6C5DD3] animate-pulse" />
          </div>
        </div>
        <div className="space-y-3">
          <h2 className={`text-3xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Profiling Market Presence...</h2>
          <p className={`text-lg max-w-lg mx-auto leading-relaxed ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>
            Gemini Flash is analyzing <span className="text-[#6C5DD3] font-bold">{url}</span> to extract your product catalog, industry positioning, and primary target segments.
          </p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-700">
        <div className="w-16 h-16 bg-[#6C5DD3] rounded-2xl flex items-center justify-center shadow-2xl shadow-orange-500/30 mb-8">
          <Compass className="w-8 h-8 text-white" />
        </div>
        <h1 className={`text-5xl font-black tracking-tight mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>SalesPulse Onboarding</h1>
        <p className={`text-xl max-w-xl mb-10 font-medium ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>
          Input your company URL to bootstrap your <span className="text-[#6C5DD3]">Autonomous Market Intelligence</span> engine.
        </p>

        <div className="w-full max-w-2xl relative group">
          <input
            type="text"
            placeholder="https://your-company.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
            className={`w-full border-2 rounded-2xl py-4 pl-6 pr-40 text-lg focus:outline-none focus:border-[#6C5DD3] transition-all shadow-xl ${isDarkMode
              ? 'bg-[#141414] border-white/5 text-white'
              : 'bg-white border-gray-200 text-gray-900'
              }`}
          />
          <button
            onClick={handleAnalyze}
            disabled={!url}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#6C5DD3] hover:bg-[#6C5DD3] disabled:bg-zinc-800 disabled:text-zinc-500 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-lg"
          >
            <Search className="w-4 h-4" />
            Profile Now
          </button>
        </div>
      </div>
    );
  }

  const calibrationItems = [
    { label: 'Industry', key: 'industry' as keyof BusinessProfile, val: profile.industry, icon: Building2 },
    { label: 'Products', key: 'products' as keyof BusinessProfile, val: profile.products.join(', '), icon: Package },
    { label: 'Targets', key: 'targetGroups' as keyof BusinessProfile, val: profile.targetGroups.join(', '), icon: Users },
    { label: 'Reach', key: 'geography' as keyof BusinessProfile, val: profile.geography.join(', '), icon: Globe },
  ];

  return (
    <div className="max-w-4xl mx-auto py-4 animate-in slide-in-from-bottom-8 duration-500">
      <div className="mb-10 flex items-center gap-5">
        <div className="w-12 h-12 rounded-xl bg-[#6C5DD3]/10 flex items-center justify-center text-[#6C5DD3]"><Building2 className="w-6 h-6" /></div>
        <div>
          <h2 className={`text-4xl font-black mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Calibration Phase</h2>
          <p className={`text-base ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>Verify and refine extracted business intelligence before strategy mapping.</p>
        </div>
      </div>

      <div className="grid gap-4">
        {calibrationItems.map((item) => (
          <div key={item.label} className={`border rounded-2xl p-6 flex items-center justify-between group hover:border-[#6C5DD3]/40 transition-all ${isDarkMode ? 'bg-[#141414] border-white/5' : 'bg-white border-gray-200'
            }`}>
            <div className="flex items-center gap-5 flex-1 mr-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors flex-shrink-0 ${isDarkMode
                ? 'bg-zinc-800 text-zinc-500 group-hover:text-[#6C5DD3]'
                : 'bg-gray-100 text-gray-500 group-hover:text-[#6C5DD3]'
                }`}>
                <item.icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-1">{item.label}</div>
                {editingField === item.key ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      autoFocus
                      type="text"
                      value={tempValue}
                      onChange={(e) => setTempValue(e.target.value)}
                      className={`w-full border border-[#6C5DD3]/50 rounded-lg px-3 py-1.5 text-lg font-bold focus:outline-none ${isDarkMode
                        ? 'bg-black/40 text-white'
                        : 'bg-gray-50 text-gray-900'
                        }`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit(item.key);
                        if (e.key === 'Escape') cancelEdit();
                      }}
                    />
                  </div>
                ) : (
                  <div className={`text-lg font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{item.val}</div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {editingField === item.key ? (
                <>
                  <button
                    onClick={() => saveEdit(item.key)}
                    className="p-2 bg-[#6C5DD3]/20 hover:bg-[#6C5DD3]/40 rounded-lg text-[#6C5DD3] transition-all"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="p-2 bg-red-600/10 hover:bg-red-600/20 rounded-lg text-red-400 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => startEditing(item.key, item.val)}
                  className={`p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100 ${isDarkMode
                    ? 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-900'
                    }`}
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 flex justify-end">
        <button
          onClick={() => onVerified({ ...profile, isVerified: true })}
          disabled={editingField !== null}
          className="flex items-center gap-3 bg-[#6C5DD3] hover:bg-[#6C5DD3] disabled:bg-zinc-800 disabled:text-zinc-500 disabled:shadow-none text-white px-8 py-4 rounded-2xl font-black text-lg transition-all shadow-lg shadow-orange-500/20 active:scale-95"
        >
          <Check className="w-6 h-6 stroke-[3]" />
          Calibrate & Proceed
        </button>
      </div>
    </div>
  );
};

export default OnboardingView;
