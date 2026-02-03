import React, { useEffect, useState } from 'react';
import { supabase } from '../src/lib/supabase';

interface AuthCallbackProps {
    onComplete: () => void;
}

export const AuthCallback: React.FC<AuthCallbackProps> = ({ onComplete }) => {
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const handleCallback = async () => {
            try {
                // Check URL for tokens (magic link or OAuth callback)
                const hashParams = new URLSearchParams(window.location.hash.substring(1));
                const accessToken = hashParams.get('access_token');
                const refreshToken = hashParams.get('refresh_token');

                if (accessToken && refreshToken) {
                    // Set the session from URL tokens
                    const { error } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken,
                    });

                    if (error) throw error;
                } else {
                    // Try to get existing session
                    const { data: { session }, error } = await supabase.auth.getSession();
                    if (error) throw error;
                    if (!session) throw new Error('No session found');
                }

                setStatus('success');

                // Small delay before redirect for UX
                setTimeout(() => {
                    // Clear the hash from URL
                    window.history.replaceState(null, '', window.location.pathname);
                    onComplete();
                }, 1500);

            } catch (err) {
                console.error('[AuthCallback] Error:', err);
                setStatus('error');
                setError(err instanceof Error ? err.message : 'Authentication failed');
            }
        };

        handleCallback();
    }, [onComplete]);

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                {status === 'loading' && (
                    <>
                        <div style={styles.spinner}></div>
                        <h2 style={styles.title}>Signing you in...</h2>
                        <p style={styles.subtitle}>Please wait while we verify your session</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div style={styles.successIcon}>✓</div>
                        <h2 style={styles.title}>Welcome back!</h2>
                        <p style={styles.subtitle}>Redirecting to your dashboard...</p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div style={styles.errorIcon}>✕</div>
                        <h2 style={styles.title}>Authentication Failed</h2>
                        <p style={styles.subtitle}>{error}</p>
                        <button
                            onClick={() => window.location.href = '/'}
                            style={styles.button}
                        >
                            Return to Login
                        </button>
                    </>
                )}
            </div>

            <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
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
    },
    card: {
        backgroundColor: 'rgba(30, 30, 40, 0.9)',
        borderRadius: '16px',
        padding: '48px',
        textAlign: 'center',
        minWidth: '320px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
    },
    spinner: {
        width: '48px',
        height: '48px',
        border: '3px solid rgba(255, 255, 255, 0.1)',
        borderTopColor: '#f97316',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        margin: '0 auto 24px',
    },
    successIcon: {
        width: '64px',
        height: '64px',
        borderRadius: '50%',
        backgroundColor: 'rgba(34, 197, 94, 0.2)',
        color: '#22c55e',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '32px',
        fontWeight: 'bold',
        margin: '0 auto 24px',
    },
    errorIcon: {
        width: '64px',
        height: '64px',
        borderRadius: '50%',
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        color: '#ef4444',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '32px',
        fontWeight: 'bold',
        margin: '0 auto 24px',
    },
    title: {
        color: '#ffffff',
        fontSize: '24px',
        fontWeight: '600',
        marginBottom: '8px',
    },
    subtitle: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: '14px',
    },
    button: {
        marginTop: '24px',
        padding: '12px 24px',
        fontSize: '14px',
        fontWeight: '600',
        borderRadius: '8px',
        border: 'none',
        backgroundColor: '#f97316',
        color: '#ffffff',
        cursor: 'pointer',
    },
};
