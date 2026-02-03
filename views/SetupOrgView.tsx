import React, { useState } from 'react';
import { supabase } from '../src/lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface SetupOrgViewProps {
    onComplete: () => void;
}

export const SetupOrgView: React.FC<SetupOrgViewProps> = ({ onComplete }) => {
    const { user, refreshProfile } = useAuth();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [orgName, setOrgName] = useState('');
    const [industry, setIndustry] = useState('');
    const [website, setWebsite] = useState('');
    const [userName, setUserName] = useState('');

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

        setLoading(true);
        setError(null);

        try {
            // Generate UUID for the org client-side
            const orgId = crypto.randomUUID();

            // Step 1: Create the organization
            const { error: orgError } = await supabase
                .from('organizations')
                .insert({
                    id: orgId,
                    name: orgName.trim(),
                    industry: industry?.toLowerCase() || null,
                    website: website || null,
                });

            if (orgError) {
                console.error('[SetupOrg] Org insert error:', orgError);
                throw new Error(`Organization: ${orgError.message}`);
            }

            console.log('[SetupOrg] Organization created:', orgId);

            // Step 2: Create the user profile linked to this org
            const { error: userError } = await supabase
                .from('users')
                .insert({
                    id: user.id,
                    org_id: orgId,
                    email: user.email!,
                    name: userName || null,
                    role: 'admin', // First user is admin
                });

            if (userError) {
                console.error('[SetupOrg] User insert error:', userError);
                throw new Error(`User profile: ${userError.message}`);
            }

            console.log('[SetupOrg] User profile created');

            // Refresh the profile to load the new data
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
        <div style={styles.container}>
            <div style={styles.card}>
                {step === 1 && (
                    <>
                        <div style={styles.header}>
                            <span style={styles.emoji}>🏢</span>
                            <h1 style={styles.title}>Set Up Your Organization</h1>
                            <p style={styles.subtitle}>
                                Let's configure your opportunity detection engine
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} style={styles.form}>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Your Name</label>
                                <input
                                    type="text"
                                    value={userName}
                                    onChange={(e) => setUserName(e.target.value)}
                                    placeholder="John Smith"
                                    style={styles.input}
                                />
                            </div>

                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Organization Name *</label>
                                <input
                                    type="text"
                                    value={orgName}
                                    onChange={(e) => setOrgName(e.target.value)}
                                    placeholder="Acme Corporation"
                                    style={styles.input}
                                    required
                                />
                            </div>

                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Industry</label>
                                <select
                                    value={industry}
                                    onChange={(e) => setIndustry(e.target.value)}
                                    style={styles.input}
                                >
                                    <option value="">Select industry...</option>
                                    <option value="construction">Construction</option>
                                    <option value="manufacturing">Manufacturing</option>
                                    <option value="technology">Technology</option>
                                    <option value="healthcare">Healthcare</option>
                                    <option value="finance">Finance</option>
                                    <option value="retail">Retail</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Company Website</label>
                                <input
                                    type="url"
                                    value={website}
                                    onChange={(e) => setWebsite(e.target.value)}
                                    placeholder="https://www.yourcompany.com"
                                    style={styles.input}
                                />
                            </div>

                            {error && (
                                <div style={styles.error}>{error}</div>
                            )}

                            <button
                                type="submit"
                                style={{
                                    ...styles.button,
                                    opacity: loading ? 0.7 : 1,
                                }}
                                disabled={loading}
                            >
                                {loading ? 'Creating...' : 'Create Organization'}
                            </button>
                        </form>
                    </>
                )}

                {step === 2 && (
                    <div style={styles.success}>
                        <div style={styles.successIcon}>✓</div>
                        <h2 style={styles.title}>Organization Created!</h2>
                        <p style={styles.subtitle}>
                            Welcome to SalesPulse, {userName || 'there'}!
                        </p>
                        <p style={styles.redirect}>Redirecting to your dashboard...</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 50%, #16213e 100%)',
        padding: '20px',
    },
    card: {
        backgroundColor: 'rgba(30, 30, 40, 0.9)',
        borderRadius: '16px',
        padding: '48px',
        width: '100%',
        maxWidth: '480px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
    },
    header: {
        textAlign: 'center',
        marginBottom: '32px',
    },
    emoji: {
        fontSize: '48px',
        display: 'block',
        marginBottom: '16px',
    },
    title: {
        fontSize: '24px',
        fontWeight: '700',
        color: '#ffffff',
        margin: '0 0 8px 0',
    },
    subtitle: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: '14px',
        margin: 0,
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
    },
    inputGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
    },
    label: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: '14px',
        fontWeight: '500',
    },
    input: {
        padding: '14px 16px',
        fontSize: '16px',
        borderRadius: '10px',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        color: '#ffffff',
        outline: 'none',
    },
    error: {
        padding: '12px 16px',
        borderRadius: '8px',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        color: '#ef4444',
        fontSize: '14px',
        textAlign: 'center',
    },
    button: {
        padding: '14px 24px',
        fontSize: '16px',
        fontWeight: '600',
        borderRadius: '10px',
        border: 'none',
        background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
        color: '#ffffff',
        cursor: 'pointer',
        marginTop: '8px',
    },
    success: {
        textAlign: 'center',
    },
    successIcon: {
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        backgroundColor: 'rgba(34, 197, 94, 0.2)',
        color: '#22c55e',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '40px',
        fontWeight: 'bold',
        margin: '0 auto 24px',
    },
    redirect: {
        color: 'rgba(255, 255, 255, 0.4)',
        fontSize: '12px',
        marginTop: '16px',
    },
};
