import React, { useState } from 'react';
import { supabase } from '../src/lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Building2, Globe, Briefcase, MapPin, Package, Users, Loader2, CheckCircle2, ArrowRight, Plus, X } from 'lucide-react';

interface SetupOrgViewProps {
    onComplete: () => void;
}

export const SetupOrgView: React.FC<SetupOrgViewProps> = ({ onComplete }) => {
    const { user, refreshProfile } = useAuth();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state - matching BusinessProfile type
    const [orgName, setOrgName] = useState('');
    const [sector, setSector] = useState('');
    const [websiteUrl, setWebsiteUrl] = useState('');
    const [locations, setLocations] = useState<string[]>(['']);
    const [products, setProducts] = useState<string[]>(['']);
    const [targetGroups, setTargetGroups] = useState<string[]>(['']);

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

            await refreshProfile();
            setStep(2);
            setTimeout(onComplete, 2000);

        } catch (err) {
            console.error('[SetupOrg] Error:', err);
            setError(err instanceof Error ? err.message : 'Failed to create organization');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F7F7F9] flex items-center justify-center p-6">
            <div className="w-full max-w-2xl">
                {step === 1 && (
                    <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-xl animate-in fade-in duration-500">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-[#6C5DD3]/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#6C5DD3]/20">
                                <Building2 className="w-8 h-8 text-[#6C5DD3]" />
                            </div>
                            <h1 className="text-2xl font-black text-[#1B1D21] mb-1">
                                Set Up Your Organization
                            </h1>
                            <p className="text-[#808191] text-sm">
                                Configure your sales intelligence engine
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Row 1: Org Name & Industry */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="flex items-center gap-1.5 text-xs font-semibold text-[#1B1D21]">
                                        <Building2 className="w-3.5 h-3.5 text-[#6C5DD3]" />
                                        Organization Name <span className="text-[#6C5DD3]">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={orgName}
                                        onChange={(e) => setOrgName(e.target.value)}
                                        placeholder="Acme Corporation"
                                        required
                                        className="w-full px-3 py-2.5 bg-[#F7F7F9] border border-gray-200 rounded-lg text-sm text-[#1B1D21] placeholder-[#808191] focus:outline-none focus:border-[#6C5DD3] focus:ring-2 focus:ring-[#6C5DD3]/20 transition-all"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="flex items-center gap-1.5 text-xs font-semibold text-[#1B1D21]">
                                        <Briefcase className="w-3.5 h-3.5 text-[#6C5DD3]" />
                                        Industry
                                    </label>
                                    <select
                                        value={sector}
                                        onChange={(e) => setSector(e.target.value)}
                                        className="w-full px-3 py-2.5 bg-[#F7F7F9] border border-gray-200 rounded-lg text-sm text-[#1B1D21] focus:outline-none focus:border-[#6C5DD3] focus:ring-2 focus:ring-[#6C5DD3]/20 transition-all appearance-none cursor-pointer"
                                        style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23808191' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.75rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.25em 1.25em' }}
                                    >
                                        <option value="" className="bg-white">Select industry...</option>
                                        {sectors.map(s => (
                                            <option key={s} value={s} className="bg-white">{s}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Products/Services */}
                            <div className="space-y-1.5">
                                <label className="flex items-center gap-1.5 text-xs font-semibold text-[#1B1D21]">
                                    <Package className="w-3.5 h-3.5 text-[#6C5DD3]" />
                                    Your Products/Services <span className="text-[#6C5DD3]">*</span>
                                </label>
                                <p className="text-xs text-[#808191]">What do you sell? These will be matched to opportunities.</p>
                                <div className="space-y-2">
                                    {products.map((product, idx) => (
                                        <div key={idx} className="flex gap-2">
                                            <input
                                                type="text"
                                                value={product}
                                                onChange={(e) => updateItem(setProducts, products, idx, e.target.value)}
                                                placeholder="e.g., Excavators, Software Licenses, Consulting"
                                                className="flex-1 px-3 py-2.5 bg-[#F7F7F9] border border-gray-200 rounded-lg text-sm text-[#1B1D21] placeholder-[#808191] focus:outline-none focus:border-[#6C5DD3] focus:ring-2 focus:ring-[#6C5DD3]/20 transition-all"
                                            />
                                            {products.length > 1 && (
                                                <button type="button" onClick={() => removeItem(setProducts, products, idx)} className="px-2 text-gray-400 hover:text-red-500">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <button type="button" onClick={() => addItem(setProducts, products)} className="flex items-center gap-1 text-xs text-[#6C5DD3] font-medium hover:underline">
                                    <Plus className="w-3.5 h-3.5" /> Add product
                                </button>
                            </div>

                            {/* Target Groups */}
                            <div className="space-y-1.5">
                                <label className="flex items-center gap-1.5 text-xs font-semibold text-[#1B1D21]">
                                    <Users className="w-3.5 h-3.5 text-[#6C5DD3]" />
                                    Target Customer Groups
                                </label>
                                <p className="text-xs text-[#808191]">Who are your ideal customers?</p>
                                <div className="space-y-2">
                                    {targetGroups.map((group, idx) => (
                                        <div key={idx} className="flex gap-2">
                                            <input
                                                type="text"
                                                value={group}
                                                onChange={(e) => updateItem(setTargetGroups, targetGroups, idx, e.target.value)}
                                                placeholder="e.g., Construction Companies, Hospitals, Government"
                                                className="flex-1 px-3 py-2.5 bg-[#F7F7F9] border border-gray-200 rounded-lg text-sm text-[#1B1D21] placeholder-[#808191] focus:outline-none focus:border-[#6C5DD3] focus:ring-2 focus:ring-[#6C5DD3]/20 transition-all"
                                            />
                                            {targetGroups.length > 1 && (
                                                <button type="button" onClick={() => removeItem(setTargetGroups, targetGroups, idx)} className="px-2 text-gray-400 hover:text-red-500">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <button type="button" onClick={() => addItem(setTargetGroups, targetGroups)} className="flex items-center gap-1 text-xs text-[#6C5DD3] font-medium hover:underline">
                                    <Plus className="w-3.5 h-3.5" /> Add target group
                                </button>
                            </div>

                            {/* Locations */}
                            <div className="space-y-1.5">
                                <label className="flex items-center gap-1.5 text-xs font-semibold text-[#1B1D21]">
                                    <MapPin className="w-3.5 h-3.5 text-[#6C5DD3]" />
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
                                            className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-all ${locations.includes(loc)
                                                    ? 'bg-[#6C5DD3] text-white border-[#6C5DD3]'
                                                    : 'bg-white text-[#808191] border-gray-200 hover:border-[#6C5DD3] hover:text-[#6C5DD3]'
                                                }`}
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
                                                className="flex-1 px-3 py-2.5 bg-[#F7F7F9] border border-gray-200 rounded-lg text-sm text-[#1B1D21] placeholder-[#808191] focus:outline-none focus:border-[#6C5DD3] focus:ring-2 focus:ring-[#6C5DD3]/20 transition-all"
                                            />
                                            {locations.length > 1 && (
                                                <button type="button" onClick={() => removeItem(setLocations, locations, idx)} className="px-2 text-gray-400 hover:text-red-500">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <button type="button" onClick={() => addItem(setLocations, locations)} className="flex items-center gap-1 text-xs text-[#6C5DD3] font-medium hover:underline">
                                    <Plus className="w-3.5 h-3.5" /> Add location
                                </button>
                            </div>

                            {/* Website */}
                            <div className="space-y-1.5">
                                <label className="flex items-center gap-1.5 text-xs font-semibold text-[#1B1D21]">
                                    <Globe className="w-3.5 h-3.5 text-[#6C5DD3]" />
                                    Company Website
                                </label>
                                <input
                                    type="url"
                                    value={websiteUrl}
                                    onChange={(e) => setWebsiteUrl(e.target.value)}
                                    placeholder="https://www.yourcompany.com"
                                    className="w-full px-3 py-2.5 bg-[#F7F7F9] border border-gray-200 rounded-lg text-sm text-[#1B1D21] placeholder-[#808191] focus:outline-none focus:border-[#6C5DD3] focus:ring-2 focus:ring-[#6C5DD3]/20 transition-all"
                                />
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs text-center">
                                    {error}
                                </div>
                            )}

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3.5 bg-[#6C5DD3] hover:bg-[#5B4EC2] text-white font-bold rounded-xl transition-all duration-200 shadow-lg shadow-[#6C5DD3]/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        Get Started
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                )}

                {step === 2 && (
                    <div className="bg-white border border-gray-200 rounded-3xl p-10 shadow-xl animate-in fade-in duration-500 text-center">
                        <div className="w-20 h-20 bg-[#6C5DD3]/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-[#6C5DD3]/20">
                            <CheckCircle2 className="w-10 h-10 text-[#6C5DD3]" />
                        </div>
                        <h2 className="text-2xl font-black text-[#1B1D21] mb-2">
                            Welcome aboard! 🎉
                        </h2>
                        <p className="text-[#808191]">
                            <span className="text-[#6C5DD3] font-semibold">{orgName}</span> is ready to discover opportunities
                        </p>
                        <div className="flex items-center justify-center gap-2 text-[#808191] text-sm mt-4">
                            <Loader2 className="w-4 h-4 animate-spin text-[#6C5DD3]" />
                            Redirecting to Strategy...
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
