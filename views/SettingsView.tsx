import React, { useState, useEffect } from 'react';
import { Mail, Save, Bell, Shield, User, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase as supabaseClient } from '../src/lib/supabase';

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
    const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
    const [isSaving, setIsSaving] = useState(false);
    const [hasLoaded, setHasLoaded] = useState(false);

    // Load settings from User Profile (Cloud) or LocalStorage (Fallback)
    useEffect(() => {
        if (userProfile && !hasLoaded) {
            if (userProfile.settings) {
                console.log('[Settings] Loaded from Cloud Profile:', userProfile.settings);
                // Ensure defaults are merged in case of missing keys
                setSettings({ ...DEFAULT_SETTINGS, ...userProfile.settings });
            } else {
                // Fallback to local storage if no cloud settings yet (migration path)
                const local = localStorage.getItem('pulse_settings');
                if (local) {
                    console.log('[Settings] Migrating from LocalStorage:', local);
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
            console.log('[Settings] Saving to Supabase:', settings);

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
                    <h1 className="text-3xl font-black text-zinc-900 dark:text-white">System Settings</h1>
                    <p className="text-zinc-500 mt-1">Configure your automation preferences and account details.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white px-6 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/20"
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
                <section className="bg-white dark:bg-[#141414] border border-zinc-200 dark:border-white/5 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                            <Bell className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Notifications & Alerts</h2>
                            <p className="text-sm text-zinc-500">Manage how and when you receive intelligence updates.</p>
                        </div>
                    </div>

                    <div className="space-y-6 pl-14">
                        <div className="space-y-3">
                            <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300">
                                Dossier Email Recipients
                            </label>

                            {/* Email List (Chips) */}
                            <div className="flex flex-wrap gap-2 mb-2">
                                {settings.emailRecipients.split(',').map(e => e.trim()).filter(Boolean).map((email, idx) => (
                                    <div key={idx} className="flex items-center gap-1 pl-3 pr-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 rounded-full text-sm font-medium border border-orange-200 dark:border-orange-900/50">
                                        <span>{email}</span>
                                        <button
                                            onClick={() => {
                                                const current = settings.emailRecipients.split(',').map(e => e.trim()).filter(Boolean);
                                                const newEmails = current.filter((_, i) => i !== idx).join(',');
                                                setSettings({ ...settings, emailRecipients: newEmails });
                                            }}
                                            className="p-0.5 hover:bg-orange-200 dark:hover:bg-orange-800 rounded-full transition-colors"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Add Email Input */}
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                    <input
                                        type="email"
                                        id="email-input"
                                        placeholder="Add recipient email..."
                                        className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-orange-500 transition-colors"
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
                                    className="px-4 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-xl transition-colors font-bold text-xl"
                                >
                                    +
                                </button>
                            </div>
                            <p className="text-xs text-zinc-400">
                                Add emails of team members who should receive instant deal briefings.
                            </p>
                        </div>

                        <div className="flex items-center justify-between py-4 border-t border-dashed border-zinc-200 dark:border-white/5">
                            <div className="space-y-1">
                                <div className="font-bold text-zinc-900 dark:text-white">Auto-Send on View</div>
                                <p className="text-xs text-zinc-500">Automatically trigger the email when a dossier is generated.</p>
                            </div>
                            <button
                                onClick={() => setSettings({ ...settings, autoSendDossier: !settings.autoSendDossier })}
                                className={`w-12 h-7 rounded-full transition-colors relative ${settings.autoSendDossier ? 'bg-green-500' : 'bg-zinc-200 dark:bg-white/10'
                                    }`}
                            >
                                <div
                                    className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${settings.autoSendDossier ? 'translate-x-5' : 'translate-x-0'
                                        }`}
                                />
                            </button>
                        </div>
                    </div>
                </section>

                {/* Account Info (Read Only) */}
                <section className="bg-white dark:bg-[#141414] border border-zinc-200 dark:border-white/5 rounded-2xl p-6 shadow-sm opacity-75">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-10 h-10 rounded-full bg-zinc-500/10 flex items-center justify-center text-zinc-500">
                            <User className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Account Details</h2>
                            <p className="text-sm text-zinc-500">Your workspace configuration.</p>
                        </div>
                    </div>

                    <div className="space-y-4 pl-14">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-zinc-50 dark:bg-black/20 rounded-xl">
                                <div className="text-xs text-zinc-500 uppercase tracking-wider font-bold mb-1">Email</div>
                                <div className="font-medium text-zinc-900 dark:text-white">{userProfile?.email}</div>
                            </div>
                            <div className="p-4 bg-zinc-50 dark:bg-black/20 rounded-xl">
                                <div className="text-xs text-zinc-500 uppercase tracking-wider font-bold mb-1">Organization</div>
                                <div className="font-medium text-zinc-900 dark:text-white">{organization?.name}</div>
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                onClick={signOut}
                                className="text-red-500 hover:text-red-400 text-sm font-bold flex items-center gap-2 transition-colors"
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

export const getSettings = (): AppSettings => {
    // Helper to get settings synchronously from localStorage if needed (e.g. for initial app load)
    // The source of truth is now cloud, but we fallback to local for speed/offline.
    const saved = localStorage.getItem('pulse_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
};

export default SettingsView;
