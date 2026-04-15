import React, { useState, useEffect } from 'react';
import { Mail, Save, Bell, Shield, User, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase as supabaseClient } from '../src/lib/supabase';
import { useTheme } from '../contexts/ThemeContext';
import { getVL } from '../utils/vesper';

export interface AppSettings {
    emailRecipients: string;
    autoSendDossier: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
    emailRecipients: '',
    autoSendDossier: true
};

const SettingsView: React.FC = () => {
    const { userProfile, organization, signOut, refreshProfile } = useAuth();
    const { isDarkMode } = useTheme();
    const vl = getVL(isDarkMode);
    
    const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
    const [isSaving, setIsSaving] = useState(false);
    const [hasLoaded, setHasLoaded] = useState(false);

    // Load settings from User Profile (Cloud) or LocalStorage (Fallback)
    useEffect(() => {
        if (userProfile && !hasLoaded) {
            if (userProfile.settings) {
                setSettings({ ...DEFAULT_SETTINGS, ...userProfile.settings });
            } else {
                // Fallback to local storage if no cloud settings yet (migration path)
                const local = localStorage.getItem('pulse_settings');
                if (local) {
                    try {
                        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(local) });
                    } catch (e) {
                        setSettings(DEFAULT_SETTINGS);
                    }
                }
            }
            setHasLoaded(true);
        }
    }, [userProfile, hasLoaded]);

    const handleSave = async () => {
        if (!userProfile) return;
        setIsSaving(true);

        try {
            // 1. Update User in Supabase
            const { error } = await supabaseClient
                .from('users')
                .update({
                    settings: settings,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userProfile.id);

            if (error) throw error;

            // 2. Persist to LocalStorage as backup/fast-read
            localStorage.setItem('pulse_settings', JSON.stringify(settings));

            // 3. Refresh Context
            await refreshProfile();

            // Visual feedback
            setTimeout(() => setIsSaving(false), 500);

        } catch (error) {
            console.error('[Settings] Save failed:', error);
            alert('Failed to save settings. Please try again.');
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 animate-in fade-in duration-500">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight" style={{ fontFamily: "'Newsreader', Georgia, serif", color: vl.textMain }}>System Settings</h1>
                    <p className="text-[13px] mt-1" style={{ color: vl.textBody }}>Configure your automation preferences and account details.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="btn-primary flex items-center gap-2 px-6 py-2.5 text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSaving ? (
                        <>Saving...</>
                    ) : (
                        <>
                            <Save className="w-4 h-4" /> Save Changes
                        </>
                    )}
                </button>
            </div>

            <div className="grid gap-6">
                {/* Notification Settings */}
                <section className="border rounded-[6px] p-6 vl-card" style={{ background: vl.surface, borderColor: vl.border }}>
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-10 h-10 rounded-[4px] flex items-center justify-center" style={{ background: vl.primarySoft, color: vl.primary }}>
                            <Bell className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold" style={{ color: vl.textMain }}>Notifications & Alerts</h2>
                            <p className="text-xs" style={{ color: vl.textMuted }}>Manage how and when you receive intelligence updates.</p>
                        </div>
                    </div>

                    <div className="space-y-6 pl-14">
                        <div className="space-y-3">
                            <label className="block text-[11px] font-bold label-caps" style={{ color: vl.textMuted }}>
                                Dossier Email Recipients
                            </label>

                            {/* Email List (Chips) */}
                            <div className="flex flex-wrap gap-2 mb-2">
                                {settings.emailRecipients.split(',').map(e => e.trim()).filter(Boolean).map((email, idx) => (
                                    <div key={idx} className="flex items-center gap-1 pl-3 pr-2 py-1.5 rounded-[4px] text-[11px] font-bold border" style={{ background: vl.chipBg, color: vl.textMain, borderColor: vl.borderStrong }}>
                                        <span>{email}</span>
                                        <button
                                            onClick={() => {
                                                const current = settings.emailRecipients.split(',').map(e => e.trim()).filter(Boolean);
                                                const newEmails = current.filter((_, i) => i !== idx).join(',');
                                                setSettings({ ...settings, emailRecipients: newEmails });
                                            }}
                                            className="p-0.5 rounded-[2px]" style={{ color: vl.textMuted }}
                                        >
                                            <X className="w-3 h-3 hover:text-red-500 transition-colors" />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Add Email Input */}
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: vl.textMuted }} />
                                    <input
                                        type="email"
                                        id="email-input"
                                        placeholder="Add recipient email..."
                                        className="w-full border rounded-[4px] py-3 pl-10 pr-4 text-[13px] focus:outline-none focus:border-[#635BFF] transition-colors"
                                        style={{ background: vl.surfaceMuted, borderColor: vl.borderStrong, color: vl.textMain }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                const input = e.currentTarget;
                                                const val = input.value.trim();
                                                if (val && val.includes('@')) {
                                                    const current = settings.emailRecipients.split(',').map(e => e.trim()).filter(Boolean);
                                                    if (!current.includes(val)) {
                                                        const newEmails = [...current, val].join(',');
                                                        setSettings({ ...settings, emailRecipients: newEmails });
                                                        input.value = '';
                                                    }
                                                }
                                            }
                                        }}
                                    />
                                </div>
                                <button
                                    onClick={() => {
                                        const input = document.getElementById('email-input') as HTMLInputElement;
                                        const val = input?.value.trim();
                                        if (val && val.includes('@')) {
                                            const current = settings.emailRecipients.split(',').map(e => e.trim()).filter(Boolean);
                                            if (!current.includes(val)) {
                                                const newEmails = [...current, val].join(',');
                                                setSettings({ ...settings, emailRecipients: newEmails });
                                                input.value = '';
                                            }
                                        }
                                    }}
                                    className="px-4 border rounded-[4px] font-bold text-xl transition-colors hover:border-[#635BFF]"
                                    style={{ background: vl.surfaceMuted, color: vl.textMuted, borderColor: vl.borderStrong }}
                                >
                                    +
                                </button>
                            </div>
                            <p className="text-[11px]" style={{ color: vl.textBody }}>
                                Add emails of team members who should receive instant deal briefings.
                            </p>
                        </div>

                        <div className="flex items-center justify-between py-4 border-t" style={{ borderColor: vl.borderStrong }}>
                            <div className="space-y-1">
                                <div className="font-bold text-[13px]" style={{ color: vl.textMain }}>Auto-Send on View</div>
                                <p className="text-[11px]" style={{ color: vl.textMuted }}>Automatically trigger the email when a dossier is generated.</p>
                            </div>
                            <button
                                onClick={() => setSettings({ ...settings, autoSendDossier: !settings.autoSendDossier })}
                                className={`w-10 h-5 rounded-full transition-colors relative ${settings.autoSendDossier ? 'bg-[#635BFF]' : 'bg-transparent border'
                                    }`}
                                style={!settings.autoSendDossier ? { borderColor: vl.borderStrong } : {}}
                            >
                                <div
                                    className={`absolute top-[2px] left-[2px] w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${settings.autoSendDossier ? 'translate-x-5' : 'translate-x-0'
                                        }`}
                                />
                            </button>
                        </div>
                    </div>
                </section>

                {/* Account Info (Read Only) */}
                <section className="border rounded-[6px] p-6 vl-card" style={{ background: vl.surface, borderColor: vl.border }}>
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-10 h-10 rounded-[4px] flex items-center justify-center" style={{ background: vl.chipBg, color: vl.textMuted }}>
                            <User className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold" style={{ color: vl.textMain }}>Account Details</h2>
                            <p className="text-xs" style={{ color: vl.textMuted }}>Your workspace configuration.</p>
                        </div>
                    </div>

                    <div className="space-y-4 pl-14">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-[4px] border" style={{ background: vl.surfaceMuted, borderColor: vl.borderStrong }}>
                                <div className="text-[10px] uppercase font-bold tracking-wider mb-1" style={{ color: vl.textMuted }}>Email</div>
                                <div className="text-[13px] font-bold" style={{ color: vl.textMain }}>{userProfile?.email}</div>
                            </div>
                            <div className="p-4 rounded-[4px] border" style={{ background: vl.surfaceMuted, borderColor: vl.borderStrong }}>
                                <div className="text-[10px] uppercase font-bold tracking-wider mb-1" style={{ color: vl.textMuted }}>Organization</div>
                                <div className="text-[13px] font-bold" style={{ color: vl.textMain }}>{organization?.name}</div>
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                onClick={signOut}
                                className="text-[#EF4444] text-[13px] font-bold flex items-center gap-2 hover:underline"
                            >
                                <X className="w-4 h-4" />
                                Sign Out of Workspace
                            </button>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export const getSettings = (userProfile?: { settings?: Partial<AppSettings> } | null): AppSettings => {
    // Cloud-first: If userProfile is provided and has settings, use those
    if (userProfile?.settings) {
        return { ...DEFAULT_SETTINGS, ...userProfile.settings };
    }

    // Fallback to localStorage for synchronous access or when profile not available
    const saved = localStorage.getItem('pulse_settings');
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
};

export default SettingsView;
