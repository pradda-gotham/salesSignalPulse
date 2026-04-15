import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { getVL } from '../utils/vesper';

interface LoginViewProps {
    onSuccess?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onSuccess }) => {
    const { signIn, signUp, signInWithGoogle, resetPassword } = useAuth();
    const { isDarkMode } = useTheme();
    const vl = getVL(isDarkMode);
    
    const [isSignUp, setIsSignUp] = useState(false);
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email.trim() || !password.trim()) {
            setMessage({ type: 'error', text: 'Please fill in all fields' });
            return;
        }

        if (isSignUp && password !== confirmPassword) {
            setMessage({ type: 'error', text: 'Passwords do not match' });
            return;
        }

        if (password.length < 6) {
            setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
            return;
        }

        setLoading(true);
        setMessage(null);

        if (isSignUp) {
            const { error } = await signUp(email, password);
            if (error) {
                setMessage({ type: 'error', text: error.message });
            } else {
                setMessage({
                    type: 'success',
                    text: '✨ Account created! Please check your email to verify.'
                });
            }
        } else {
            const { error } = await signIn(email, password);
            if (error) {
                setMessage({ type: 'error', text: error.message });
            } else {
                if (onSuccess) onSuccess();
            }
        }

        setLoading(false);
    };

    const handleGoogleSignIn = async () => {
        setLoading(true);
        setMessage(null);
        const { error } = await signInWithGoogle();
        if (error) {
            setMessage({ type: 'error', text: error.message });
        }
        setLoading(false);
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email.trim()) {
            setMessage({ type: 'error', text: 'Please enter your email address' });
            return;
        }

        setLoading(true);
        setMessage(null);

        const { error } = await resetPassword(email);
        if (error) {
            setMessage({ type: 'error', text: error.message });
        } else {
            setMessage({
                type: 'success',
                text: '✉️ Password reset email sent! Check your inbox.'
            });
        }

        setLoading(false);
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'row', background: vl.bg }}>
            {/* Left Panel - Branding */}
            <div style={{
                flex: '1',
                background: vl.primary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                padding: '60px',
            }}>
                <div style={{ position: 'relative', zIndex: 2, maxWidth: '480px' }}>
                    {/* Logo */}
                    <div style={{ fontSize: '48px', marginBottom: '40px', filter: 'brightness(0) invert(1)' }}>⚡</div>

                    {/* Headline */}
                    <h1 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '56px', fontWeight: '700', color: '#ffffff', lineHeight: '1.1', marginBottom: '24px' }}>
                        Hello<br />
                        Leadpulse!<span style={{ display: 'inline-block', marginLeft: '8px', animation: 'wave 1.5s ease-in-out infinite' }}>👋</span>
                    </h1>

                    {/* Tagline */}
                    <p style={{ fontSize: '15px', color: 'rgba(255, 255, 255, 0.85)', lineHeight: '1.6', fontWeight: '400' }}>
                        Detect buyer signals in real-time.<br />
                        Get Leadpulse-powered deal dossiers and<br />
                        close more deals with less effort!
                    </p>
                </div>

                {/* Decorative grid lines */}
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundImage: `
                        linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
                    `,
                    backgroundSize: '60px 60px',
                    zIndex: 1,
                }}></div>
            </div>

            {/* Right Panel - Form */}
            <div style={{ flex: '1', backgroundColor: vl.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px' }}>
                <div style={{ width: '100%', maxWidth: '400px' }}>
                    {/* Brand name */}
                    <h2 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '20px', fontWeight: '700', color: vl.textMain, marginBottom: '48px' }}>Leadpulse</h2>

                    {/* Welcome text */}
                    <div style={{ marginBottom: '32px' }}>
                        <h3 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '32px', fontWeight: '700', color: vl.textMain, marginBottom: '12px' }}>
                            {isForgotPassword ? 'Reset Password' : (isSignUp ? 'Get Started!' : 'Welcome Back!')}
                        </h3>
                        {isForgotPassword && (
                            <p style={{ fontSize: '13px', color: vl.textBody, lineHeight: '1.6' }}>
                                Enter your email and we'll send you a reset link.
                            </p>
                        )}
                    </div>

                    {/* Form */}
                    <form onSubmit={isForgotPassword ? handleForgotPassword : handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@company.com"
                                style={{ padding: '16px 0', fontSize: '13px', borderRadius: '0', border: 'none', borderBottom: `1px solid ${vl.borderStrong}`, backgroundColor: 'transparent', color: vl.textMain, outline: 'none', transition: 'border-color 0.2s' }}
                                disabled={loading}
                            />
                        </div>

                        {!isForgotPassword && (
                            <>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '11px', color: vl.textMuted, fontWeight: '700' }} className="label-caps">Password</label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        style={{ padding: '16px 0', fontSize: '13px', borderRadius: '0', border: 'none', borderBottom: `1px solid ${vl.borderStrong}`, backgroundColor: 'transparent', color: vl.textMain, outline: 'none', transition: 'border-color 0.2s' }}
                                        disabled={loading}
                                    />
                                </div>

                                {isSignUp && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <label style={{ fontSize: '11px', color: vl.textMuted, fontWeight: '700' }} className="label-caps">Confirm Password</label>
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="••••••••"
                                            style={{ padding: '16px 0', fontSize: '13px', borderRadius: '0', border: 'none', borderBottom: `1px solid ${vl.borderStrong}`, backgroundColor: 'transparent', color: vl.textMain, outline: 'none', transition: 'border-color 0.2s' }}
                                            disabled={loading}
                                        />
                                    </div>
                                )}
                            </>
                        )}

                        {message && (
                            <div style={{
                                padding: '14px 18px',
                                borderRadius: '4px',
                                fontSize: '13px',
                                textAlign: 'center',
                                backgroundColor: message.type === 'success' ? '#10B98110' : '#EF444410',
                                color: message.type === 'success' ? '#10B981' : '#EF4444',
                                border: `1px solid ${message.type === 'success' ? '#10B98130' : '#EF444430'}`,
                                fontWeight: '700'
                            }}>
                                {message.text}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="btn-primary"
                            style={{
                                width: '100%',
                                opacity: loading ? 0.7 : 1,
                                marginTop: '8px',
                            }}
                            disabled={loading}
                        >
                            {loading ? 'Please wait...' : (
                                isForgotPassword ? 'Send Reset Link' : (isSignUp ? 'Create Account' : 'Login Now')
                            )}
                        </button>

                        {/* Forgot Password / Back to Login */}
                        {!isSignUp && !isForgotPassword && (
                            <div style={{ textAlign: 'center', fontSize: '13px', color: vl.textMuted, marginTop: '8px' }}>
                                Forget password?{' '}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsForgotPassword(true);
                                        setMessage(null);
                                    }}
                                    style={{ background: 'none', border: 'none', color: vl.primary, textDecoration: 'none', cursor: 'pointer', padding: 0, fontSize: '13px', fontWeight: '700' }}
                                >
                                    Click here
                                </button>
                            </div>
                        )}

                        {isForgotPassword && (
                            <div style={{ textAlign: 'center', fontSize: '13px', color: vl.textMuted, marginTop: '8px' }}>
                                Remember your password?{' '}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsForgotPassword(false);
                                        setMessage(null);
                                    }}
                                    style={{ background: 'none', border: 'none', color: vl.primary, textDecoration: 'none', cursor: 'pointer', padding: 0, fontSize: '13px', fontWeight: '700' }}
                                >
                                    Back to Login
                                </button>
                            </div>
                        )}

                        {/* Toggle Sign Up / Sign In */}
                        {!isForgotPassword && (
                            <div style={{ textAlign: 'center', fontSize: '13px', color: vl.textMuted, marginTop: '16px', paddingTop: '16px', borderTop: `1px solid ${vl.borderStrong}` }}>
                                {isSignUp ? "Already have an account? " : "Don't have an account? "}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsSignUp(!isSignUp);
                                        setMessage(null);
                                        setConfirmPassword('');
                                    }}
                                    style={{ background: 'none', border: 'none', color: vl.primary, textDecoration: 'none', cursor: 'pointer', padding: 0, fontSize: '13px', fontWeight: '700' }}
                                >
                                    {isSignUp ? 'Sign In' : 'Sign Up'}
                                </button>
                            </div>
                        )}
                    </form>
                </div>
            </div>
            
            {/* Inject wave styles */}
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes wave {
                    0%, 100% { transform: rotate(0deg); }
                    25% { transform: rotate(20deg); }
                    75% { transform: rotate(-10deg); }
                }
            `}} />
        </div>
    );
};

export default LoginView;
