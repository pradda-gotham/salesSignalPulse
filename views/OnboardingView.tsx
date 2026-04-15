import React, { useState } from 'react';
import { Search, Loader2, Check, Edit2, Globe, Building2, Package, Users, Compass, Save, X, Activity } from 'lucide-react';
import { BusinessProfile } from '../types';
import { geminiService } from '../services/geminiService';
import { useTheme } from '../contexts/ThemeContext';
import { getVL } from '../utils/vesper';

interface OnboardingViewProps {
  onVerified: (profile: BusinessProfile) => void;
  autoPilotMode?: boolean;
}

const OnboardingView: React.FC<OnboardingViewProps> = ({ onVerified, autoPilotMode = false }) => {
  const { isDarkMode } = useTheme();
  const vl = getVL(isDarkMode);
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
          <Loader2 className="w-16 h-16 animate-spin" style={{ color: vl.primary }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <Activity className="w-8 h-8 animate-pulse" style={{ color: vl.primary }} />
          </div>
        </div>
        <div className="space-y-3">
          <h2 className="text-3xl font-semibold" style={{ fontFamily: "'Newsreader', Georgia, serif", color: vl.textMain }}>Profiling Market Presence...</h2>
          <p className="text-[13px] max-w-lg mx-auto leading-relaxed" style={{ color: vl.textBody }}>
            Leadpulse is analyzing <span className="font-bold" style={{ color: vl.primary }}>{url}</span> to extract your product catalog, industry positioning, and primary target segments.
          </p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-700">
        <div className="w-16 h-16 rounded-[4px] flex items-center justify-center shadow-lg mb-8" style={{ background: vl.primarySoft, color: vl.primary }}>
          <Compass className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-semibold tracking-tight mb-4" style={{ fontFamily: "'Newsreader', Georgia, serif", color: vl.textMain }}>Leadpulse Onboarding</h1>
        <p className="text-[13px] max-w-xl mb-10 font-medium" style={{ color: vl.textBody }}>
          Input your company URL to bootstrap your <span className="font-bold" style={{ color: vl.primary }}>Autonomous Market Intelligence</span> engine.
        </p>

        <div className="w-full max-w-2xl relative group">
          <input
            type="text"
            placeholder="https://your-company.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
            className="w-full border rounded-[6px] py-4 pl-6 pr-40 text-sm focus:outline-none focus:border-[#635BFF] transition-all shadow-md"
            style={{ background: vl.surface, borderColor: vl.borderStrong, color: vl.textMain }}
          />
          <button
            onClick={handleAnalyze}
            disabled={!url}
            className="absolute right-2 top-1/2 -translate-y-1/2 btn-primary flex items-center gap-2 px-6 py-2.5 text-xs font-bold disabled:opacity-50"
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
        <div className="w-12 h-12 rounded-[4px] flex items-center justify-center border" style={{ background: vl.primarySoft, color: vl.primary, borderColor: isDarkMode ? 'rgba(99,91,255,0.2)' : 'rgba(99,91,255,0.1)' }}><Building2 className="w-6 h-6" /></div>
        <div>
          <h2 className="text-3xl font-semibold mb-1" style={{ fontFamily: "'Newsreader', Georgia, serif", color: vl.textMain }}>Calibration Phase</h2>
          <p className="text-[13px]" style={{ color: vl.textBody }}>Verify and refine extracted business intelligence before strategy mapping.</p>
        </div>
      </div>

      <div className="grid gap-4">
        {calibrationItems.map((item) => (
          <div key={item.label} className="border rounded-[6px] p-6 flex items-center justify-between group transition-all vl-card hover-row hover:border-[#635BFF]" style={{ background: vl.surface, borderColor: vl.border }}>
            <div className="flex items-center gap-5 flex-1 mr-4">
              <div className="w-12 h-12 rounded-[4px] flex items-center justify-center transition-colors flex-shrink-0 border group-hover:border-[#635BFF]/30" style={{ background: vl.chipBg, color: vl.textMuted, borderColor: vl.borderStrong }}>
                <item.icon className="w-5 h-5 group-hover:text-[#635BFF] transition-colors" />
              </div>
              <div className="flex-1">
                <div className="text-[9px] font-bold uppercase tracking-widest mb-1 label-caps" style={{ color: vl.textMuted }}>{item.label}</div>
                {editingField === item.key ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      autoFocus
                      type="text"
                      value={tempValue}
                      onChange={(e) => setTempValue(e.target.value)}
                      className="w-full border rounded-[4px] px-3 py-1.5 text-[13px] font-bold focus:outline-none focus:border-[#635BFF]"
                      style={{ background: vl.surfaceMuted, borderColor: vl.borderStrong, color: vl.textMain }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit(item.key);
                        if (e.key === 'Escape') cancelEdit();
                      }}
                    />
                  </div>
                ) : (
                  <div className="text-[15px] font-bold tracking-tight" style={{ color: vl.textMain }}>{item.val}</div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {editingField === item.key ? (
                <>
                  <button
                    onClick={() => saveEdit(item.key)}
                    className="p-2 rounded-[4px] transition-all hover:bg-[#635BFF] hover:text-white"
                    style={{ background: vl.primarySoft, color: vl.primary }}
                  >
                    <Save className="w-4 h-4" />
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="p-2 rounded-[4px] transition-all hover:bg-red-500 hover:text-white"
                    style={{ background: '#EF444420', color: '#EF4444' }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => startEditing(item.key, item.val)}
                  className="p-2 rounded-[4px] transition-all opacity-0 group-hover:opacity-100 hover:bg-[#635BFF] hover:text-white"
                  style={{ background: vl.chipBg, color: vl.textMuted }}
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
          className="btn-primary flex items-center gap-3 px-8 py-3.5 text-xs font-bold disabled:opacity-50"
        >
          <Check className="w-5 h-5 stroke-[3]" />
          Calibrate & Proceed
        </button>
      </div>
    </div>
  );
};

export default OnboardingView;
