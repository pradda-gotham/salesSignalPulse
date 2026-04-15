import React, { useEffect, useState } from 'react';
import { supabase } from '../src/lib/supabase';
import { useTheme } from '../contexts/ThemeContext';
import { getVL } from '../utils/vesper';

interface AuthCallbackProps {
    onComplete: () => void;
}

export const AuthCallback: React.FC<AuthCallbackProps> = ({ onComplete }) => {
    const { isDarkMode } = useTheme();
    const vl = getVL(isDarkMode);
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
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: vl.bg }}>
            <div className="vl-card" style={{ backgroundColor: vl.surface, borderRadius: '6px', padding: '48px', textAlign: 'center', minWidth: '320px', border: `1px solid ${vl.border}` }}>
                {status === 'loading' && (
                    <>
                        <div style={{ width: '48px', height: '48px', border: `3px solid ${vl.borderStrong}`, borderTopColor: vl.primary, borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 24px' }}></div>
                        <h2 style={{ color: vl.textMain, fontSize: '24px', fontWeight: '600', marginBottom: '8px', fontFamily: "'Newsreader', Georgia, serif" }}>Signing you in...</h2>
                        <p style={{ color: vl.textBody, fontSize: '14px' }}>Please wait while we verify your session</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#10B98120', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 'bold', margin: '0 auto 24px' }}>✓</div>
                        <h2 style={{ color: vl.textMain, fontSize: '24px', fontWeight: '600', marginBottom: '8px', fontFamily: "'Newsreader', Georgia, serif" }}>Welcome back!</h2>
                        <p style={{ color: vl.textBody, fontSize: '14px' }}>Redirecting to your dashboard...</p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#EF444420', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 'bold', margin: '0 auto 24px' }}>✕</div>
                        <h2 style={{ color: vl.textMain, fontSize: '24px', fontWeight: '600', marginBottom: '8px', fontFamily: "'Newsreader', Georgia, serif" }}>Authentication Failed</h2>
                        <p style={{ color: vl.textBody, fontSize: '14px', marginBottom: '24px' }}>{error}</p>
                        <button
                            onClick={() => window.location.href = '/'}
                            className="btn-primary"
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
