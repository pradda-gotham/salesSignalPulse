import React, { useState } from 'react';
import { supabase } from '../src/lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Building2, Globe, Briefcase, MapPin, Package, Users, Loader2, CheckCircle2, ArrowRight, Plus, X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { getVL } from '../utils/vesper';

import { BusinessProfile } from '../types';

interface SetupOrgViewProps {
    onComplete: (profile: BusinessProfile) => void;
    initialProfile?: BusinessProfile | null;
}

export const SetupOrgView: React.FC<SetupOrgViewProps> = ({ onComplete, initialProfile }) => {
    const { user, refreshProfile } = useAuth();
    const { isDarkMode } = useTheme();
    const vl = getVL(isDarkMode);
    
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state - matching BusinessProfile type
    const [orgName, setOrgName] = useState(initialProfile?.name || '');
    const [sector, setSector] = useState(initialProfile?.industry || '');
    const [websiteUrl, setWebsiteUrl] = useState(initialProfile?.website || '');
    const [locations, setLocations] = useState<string[]>(initialProfile?.geography && initialProfile.geography.length > 0 ? initialProfile.geography : ['']);
    const [products, setProducts] = useState<string[]>(initialProfile?.products && initialProfile.products.length > 0 ? initialProfile.products : ['']);
    const [targetGroups, setTargetGroups] = useState<string[]>(initialProfile?.targetGroups && initialProfile.targetGroups.length > 0 ? initialProfile.targetGroups : ['']);

    const sectors = [
        'Construction & Infrastructure',
        'Manufacturing',
        'Technology & Software',
        'Healthcare & Medical',
        'Finance & Banking',
        'Retail & E-commerce',
        'Real Estate',
        'Energy & Utilities',
        'Transportation & Logistics',
        'Professional Services',
        'Other'
    ];

    const popularLocations = [
        'NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'NT', 'ACT'
    ];

    // Generic array field handlers
    const addItem = (setter: React.Dispatch<React.SetStateAction<string[]>>, items: string[]) => {
        setter([...items, '']);
    };

    const removeItem = (setter: React.Dispatch<React.SetStateAction<string[]>>, items: string[], index: number) => {
        if (items.length > 1) {
            setter(items.filter((_, i) => i !== index));
        }
    };

    const updateItem = (setter: React.Dispatch<React.SetStateAction<string[]>>, items: string[], index: number, value: string) => {
        const updated = [...items];
        updated[index] = value;
        setter(updated);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            setError('No authenticated user found');
            return;
        }

        if (!orgName.trim()) {
            setError('Organization name is required');
            return;
        }

        // Filter out empty values
        const validLocations = locations.filter(loc => loc.trim());
        const validProducts = products.filter(p => p.trim());
        const validTargetGroups = targetGroups.filter(t => t.trim());

        // Require at least one product for signal hunting to work
        if (validProducts.length === 0) {
            setError('Please add at least one product or service');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const orgId = crypto.randomUUID();

            // Build complete business profile matching BusinessProfile type
            const businessProfile = {
                id: orgId,
                name: orgName.trim(),
                industry: sector || 'Other',
                products: validProducts,
                targetGroups: validTargetGroups.length > 0 ? validTargetGroups : ['General'],
                geography: validLocations.length > 0 ? validLocations : ['Global'],
                website: websiteUrl.trim() || '',
            };

            // Create organization with all fields
            const { error: orgError } = await supabase
                .from('organizations')
                .insert({
                    id: orgId,
                    name: orgName.trim(),
                    website_url: websiteUrl.trim() || null,
                    business_profile: businessProfile,
                    onboarding_status: 'complete',
                });

            if (orgError) {
                console.error('[SetupOrg] Org insert error:', orgError);
                throw new Error(`Organization: ${orgError.message}`);
            }

            console.log('[SetupOrg] Organization created:', orgId);

            // Link user to organization
            const { error: userError } = await supabase
                .from('users')
                .upsert({
                    id: user.id,
                    org_id: orgId,
                    email: user.email!,
                }, {
                    onConflict: 'id'
                });

            if (userError) {
                console.error('[SetupOrg] User update error:', userError);
                throw new Error(`User profile: ${userError.message}`);
            }

            console.log('[SetupOrg] User linked to organization');

            setStep(2);
            // Brief UI delay to show success, then hand control to orchestrator for calibration
            // NOTE: Do NOT call refreshProfile() here — it would unmount the orchestrator
            // before calibration can run. App.tsx will refresh auth after calibration completes.
            setTimeout(() => onComplete(businessProfile as BusinessProfile), 1500);

        } catch (err) {
            console.error('[SetupOrg] Error:', err);
            setError(err instanceof Error ? err.message : 'Failed to create organization');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6" style={{ background: vl.bg }}>
            <div className="w-full max-w-2xl">
                {step === 1 && (
                    <div className="p-8 vl-card border rounded-[6px] shadow-sm animate-in fade-in duration-500" style={{ background: vl.surface, borderColor: vl.border }}>
                        {/* Header */}
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 rounded-[4px] flex items-center justify-center mx-auto mb-4 border" style={{ background: vl.primarySoft, borderColor: isDarkMode ? 'rgba(99,91,255,0.2)' : 'rgba(99,91,255,0.1)' }}>
                                <Building2 className="w-8 h-8" style={{ color: vl.primary }} />
                            </div>
                            <h1 className="text-3xl font-semibold mb-1 tracking-tight" style={{ fontFamily: "'Newsreader', Georgia, serif", color: vl.textMain }}>
                                Set Up Your Organization
                            </h1>
                            <p className="text-[13px]" style={{ color: vl.textBody }}>
                                Configure your sales intelligence engine
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Row 1: Org Name & Industry */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="flex items-center gap-1.5 text-[11px] font-bold label-caps" style={{ color: vl.textMuted }}>
                                        <Building2 className="w-3.5 h-3.5" style={{ color: vl.primary }} />
                                        Organization Name <span style={{ color: vl.primary }}>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={orgName}
                                        onChange={(e) => setOrgName(e.target.value)}
                                        placeholder="Acme Corporation"
                                        required
                                        className="w-full px-3 py-2.5 rounded-[4px] border text-[13px] focus:outline-none focus:border-[#635BFF] transition-all"
                                        style={{ background: vl.surfaceMuted, borderColor: vl.borderStrong, color: vl.textMain }}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="flex items-center gap-1.5 text-[11px] font-bold label-caps" style={{ color: vl.textMuted }}>
                                        <Briefcase className="w-3.5 h-3.5" style={{ color: vl.primary }} />
                                        Industry
                                    </label>
                                    <select
                                        value={sector}
                                        onChange={(e) => setSector(e.target.value)}
                                        className="w-full px-3 py-2.5 rounded-[4px] border text-[13px] focus:outline-none focus:border-[#635BFF] transition-all appearance-none cursor-pointer"
                                        style={{ background: vl.surfaceMuted, borderColor: vl.borderStrong, color: vl.textMain, backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='${isDarkMode ? '%23A1A1AA' : '%2352525B'}' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.75rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.25em 1.25em' }}
                                    >
                                        <option value="" style={{ background: vl.surface, color: vl.textMain }}>Select industry...</option>
                                        {sectors.map(s => (
                                            <option key={s} value={s} style={{ background: vl.surface, color: vl.textMain }}>{s}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Products/Services */}
                            <div className="space-y-1.5">
                                <label className="flex items-center gap-1.5 text-[11px] font-bold label-caps" style={{ color: vl.textMuted }}>
                                    <Package className="w-3.5 h-3.5" style={{ color: vl.primary }} />
                                    Your Products/Services <span style={{ color: vl.primary }}>*</span>
                                </label>
                                <p className="text-[11px]" style={{ color: vl.textBody }}>What do you sell? These will be matched to leads.</p>
                                <div className="space-y-2">
                                    {products.map((product, idx) => (
                                        <div key={idx} className="flex gap-2">
                                            <input
                                                type="text"
                                                value={product}
                                                onChange={(e) => updateItem(setProducts, products, idx, e.target.value)}
                                                placeholder="e.g., Excavators, Software Licenses, Consulting"
                                                className="flex-1 px-3 py-2.5 rounded-[4px] border text-[13px] focus:outline-none focus:border-[#635BFF] transition-all"
                                                style={{ background: vl.surfaceMuted, borderColor: vl.borderStrong, color: vl.textMain }}
                                            />
                                            {products.length > 1 && (
                                                <button type="button" onClick={() => removeItem(setProducts, products, idx)} className="px-2 transition-colors hover:text-red-500" style={{ color: vl.textMuted }}>
                                                    <X className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <button type="button" onClick={() => addItem(setProducts, products)} className="flex items-center gap-1 text-[11px] font-bold hover:underline" style={{ color: vl.primary }}>
                                    <Plus className="w-3.5 h-3.5" /> Add product
                                </button>
                            </div>

                            {/* Target Groups */}
                            <div className="space-y-1.5">
                                <label className="flex items-center gap-1.5 text-[11px] font-bold label-caps" style={{ color: vl.textMuted }}>
                                    <Users className="w-3.5 h-3.5" style={{ color: vl.primary }} />
                                    Target Customer Groups
                                </label>
                                <p className="text-[11px]" style={{ color: vl.textBody }}>Who are your ideal customers?</p>
                                <div className="space-y-2">
                                    {targetGroups.map((group, idx) => (
                                        <div key={idx} className="flex gap-2">
                                            <input
                                                type="text"
                                                value={group}
                                                onChange={(e) => updateItem(setTargetGroups, targetGroups, idx, e.target.value)}
                                                placeholder="e.g., Construction Companies, Hospitals, Government"
                                                className="flex-1 px-3 py-2.5 rounded-[4px] border text-[13px] focus:outline-none focus:border-[#635BFF] transition-all"
                                                style={{ background: vl.surfaceMuted, borderColor: vl.borderStrong, color: vl.textMain }}
                                            />
                                            {targetGroups.length > 1 && (
                                                <button type="button" onClick={() => removeItem(setTargetGroups, targetGroups, idx)} className="px-2 transition-colors hover:text-red-500" style={{ color: vl.textMuted }}>
                                                    <X className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <button type="button" onClick={() => addItem(setTargetGroups, targetGroups)} className="flex items-center gap-1 text-[11px] font-bold hover:underline" style={{ color: vl.primary }}>
                                    <Plus className="w-3.5 h-3.5" /> Add target group
                                </button>
                            </div>

                            {/* Locations */}
                            <div className="space-y-1.5">
                                <label className="flex items-center gap-1.5 text-[11px] font-bold label-caps" style={{ color: vl.textMuted }}>
                                    <MapPin className="w-3.5 h-3.5" style={{ color: vl.primary }} />
                                    Target Locations
                                </label>
                                <div className="flex flex-wrap gap-1.5 mb-2">
                                    {popularLocations.map(loc => (
                                        <button
                                            key={loc}
                                            type="button"
                                            onClick={() => {
                                                if (!locations.includes(loc)) {
                                                    const emptyIdx = locations.findIndex(l => !l.trim());
                                                    if (emptyIdx >= 0) {
                                                        updateItem(setLocations, locations, emptyIdx, loc);
                                                    } else {
                                                        setLocations([...locations, loc]);
                                                    }
                                                }
                                            }}
                                            className="px-2.5 py-1 text-[11px] font-bold rounded-[4px] border transition-all label-caps tracking-wider"
                                            style={locations.includes(loc)
                                                ? { background: vl.primarySoft, color: vl.primary, borderColor: isDarkMode ? 'rgba(99,91,255,0.2)' : 'rgba(99,91,255,0.1)' }
                                                : { background: vl.chipBg, color: vl.textMuted, borderColor: vl.borderStrong }
                                            }
                                        >
                                            {loc}
                                        </button>
                                    ))}
                                </div>
                                <div className="space-y-2">
                                    {locations.map((loc, idx) => (
                                        <div key={idx} className="flex gap-2">
                                            <input
                                                type="text"
                                                value={loc}
                                                onChange={(e) => updateItem(setLocations, locations, idx, e.target.value)}
                                                placeholder="e.g., California, UK, Singapore"
                                                className="flex-1 px-3 py-2.5 rounded-[4px] border text-[13px] focus:outline-none focus:border-[#635BFF] transition-all"
                                                style={{ background: vl.surfaceMuted, borderColor: vl.borderStrong, color: vl.textMain }}
                                            />
                                            {locations.length > 1 && (
                                                <button type="button" onClick={() => removeItem(setLocations, locations, idx)} className="px-2 transition-colors hover:text-red-500" style={{ color: vl.textMuted }}>
                                                    <X className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <button type="button" onClick={() => addItem(setLocations, locations)} className="flex items-center gap-1 text-[11px] font-bold hover:underline" style={{ color: vl.primary }}>
                                    <Plus className="w-3.5 h-3.5" /> Add location
                                </button>
                            </div>

                            {/* Website */}
                            <div className="space-y-1.5">
                                <label className="flex items-center gap-1.5 text-[11px] font-bold label-caps" style={{ color: vl.textMuted }}>
                                    <Globe className="w-3.5 h-3.5" style={{ color: vl.primary }} />
                                    Company Website
                                </label>
                                <input
                                    type="url"
                                    value={websiteUrl}
                                    onChange={(e) => setWebsiteUrl(e.target.value)}
                                    placeholder="https://www.yourcompany.com"
                                    className="w-full px-3 py-2.5 rounded-[4px] border text-[13px] focus:outline-none focus:border-[#635BFF] transition-all"
                                    style={{ background: vl.surfaceMuted, borderColor: vl.borderStrong, color: vl.textMain }}
                                />
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="px-3 py-2 rounded-[4px] border text-[11px] text-center font-bold" style={{ background: '#EF444410', color: '#EF4444', borderColor: '#EF444430' }}>
                                    {error}
                                </div>
                            )}

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary w-full py-3 text-[13px] font-bold flex items-center justify-center gap-2 mt-4"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        Get Started
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                )}

                {step === 2 && (
                    <div className="p-10 border rounded-[6px] shadow-sm animate-in fade-in duration-500 text-center vl-card" style={{ background: vl.surface, borderColor: vl.border }}>
                        <div className="w-20 h-20 rounded-[4px] flex items-center justify-center mx-auto mb-6 border" style={{ background: vl.primarySoft, borderColor: isDarkMode ? 'rgba(99,91,255,0.2)' : 'rgba(99,91,255,0.1)' }}>
                            <CheckCircle2 className="w-10 h-10" style={{ color: vl.primary }} />
                        </div>
                        <h2 className="text-3xl font-semibold mb-2 tracking-tight" style={{ fontFamily: "'Newsreader', Georgia, serif", color: vl.textMain }}>
                            Welcome aboard! 🎉
                        </h2>
                        <p className="text-[13px]" style={{ color: vl.textBody }}>
                            <span className="font-bold" style={{ color: vl.primary }}>{orgName}</span> is ready to discover leads
                        </p>
                        <div className="flex items-center justify-center gap-2 text-[11px] font-bold mt-4" style={{ color: vl.textMuted }}>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: vl.primary }} />
                            Redirecting to Setup...
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
