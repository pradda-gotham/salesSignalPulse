import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface LoginViewProps {
    onSuccess?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onSuccess }) => {
    const { signIn, signUp, signInWithGoogle } = useAuth();
    const [isSignUp, setIsSignUp] = useState(false);
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

    return (
        <div style={styles.container}>
            {/* Left Panel - Branding */}
            <div style={styles.leftPanel}>
                <div style={styles.leftContent}>
                    {/* Logo */}
                    <div style={styles.logoIcon}>⚡</div>

                    {/* Headline */}
                    <h1 style={styles.heroTitle}>
                        Hello<br />
                        SalesPulse!<span style={styles.waveEmoji}>👋</span>
                    </h1>

                    {/* Tagline */}
                    <p style={styles.heroSubtitle}>
                        Detect buyer signals in real-time.<br />
                        Get AI-powered deal dossiers and<br />
                        close more deals with less effort!
                    </p>
                </div>

                {/* Decorative grid lines */}
                <div style={styles.gridOverlay}></div>
            </div>

            {/* Right Panel - Form */}
            <div style={styles.rightPanel}>
                <div style={styles.formContainer}>
                    {/* Brand name */}
                    <h2 style={styles.brandName}>SalesPulse</h2>

                    {/* Welcome text */}
                    <div style={styles.welcomeSection}>
                        <h3 style={styles.welcomeTitle}>
                            {isSignUp ? 'Get Started!' : 'Welcome Back!'}
                        </h3>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} style={styles.form}>
                        <div style={styles.inputGroup}>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@company.com"
                                style={styles.input}
                                disabled={loading}
                            />
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.inputLabel}>Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                style={styles.input}
                                disabled={loading}
                            />
                        </div>

                        {isSignUp && (
                            <div style={styles.inputGroup}>
                                <label style={styles.inputLabel}>Confirm Password</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    style={styles.input}
                                    disabled={loading}
                                />
                            </div>
                        )}

                        {message && (
                            <div style={{
                                ...styles.message,
                                backgroundColor: message.type === 'success' ? 'rgba(76, 227, 100, 0.1)' : 'rgba(255, 95, 95, 0.1)',
                                color: message.type === 'success' ? '#4CE364' : '#FF5F5F',
                            }}>
                                {message.text}
                            </div>
                        )}

                        <button
                            type="submit"
                            style={{
                                ...styles.primaryButton,
                                opacity: loading ? 0.7 : 1,
                            }}
                            disabled={loading}
                        >
                            {loading ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Login Now')}
                        </button>



                        {!isSignUp && (
                            <div style={styles.forgotPassword}>
                                Forget password? <button type="button" style={styles.linkButton}>Click here</button>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'row',
    },
    leftPanel: {
        flex: '1',
        background: 'linear-gradient(135deg, #6C5DD3 0%, #5A4DBF 50%, #4838AB 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        padding: '60px',
    },
    leftContent: {
        position: 'relative',
        zIndex: 2,
        maxWidth: '480px',
    },
    logoIcon: {
        fontSize: '48px',
        marginBottom: '40px',
        filter: 'brightness(0) invert(1)',
    },
    heroTitle: {
        fontSize: '56px',
        fontWeight: '700',
        color: '#ffffff',
        lineHeight: '1.1',
        marginBottom: '24px',
    },
    waveEmoji: {
        display: 'inline-block',
        marginLeft: '8px',
        animation: 'wave 1.5s ease-in-out infinite',
    },
    heroSubtitle: {
        fontSize: '18px',
        color: 'rgba(255, 255, 255, 0.85)',
        lineHeight: '1.6',
        fontWeight: '400',
    },
    gridOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `
            linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
        zIndex: 1,
    },
    rightPanel: {
        flex: '1',
        backgroundColor: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px',
    },
    formContainer: {
        width: '100%',
        maxWidth: '400px',
    },
    brandName: {
        fontSize: '20px',
        fontWeight: '700',
        color: '#1B1D21',
        marginBottom: '48px',
    },
    welcomeSection: {
        marginBottom: '32px',
    },
    welcomeTitle: {
        fontSize: '32px',
        fontWeight: '700',
        color: '#1B1D21',
        marginBottom: '12px',
    },
    welcomeSubtitle: {
        fontSize: '14px',
        color: '#808191',
        lineHeight: '1.6',
    },
    linkButton: {
        background: 'none',
        border: 'none',
        color: '#1B1D21',
        textDecoration: 'underline',
        cursor: 'pointer',
        padding: 0,
        fontSize: '14px',
        fontWeight: '500',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
    },
    inputGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
    },
    inputLabel: {
        fontSize: '14px',
        color: '#808191',
        fontWeight: '400',
    },
    input: {
        padding: '16px 0',
        fontSize: '15px',
        borderRadius: '0',
        border: 'none',
        borderBottom: '1px solid #E8E8F0',
        backgroundColor: 'transparent',
        color: '#1B1D21',
        outline: 'none',
        transition: 'border-color 0.2s',
    },
    message: {
        padding: '14px 18px',
        borderRadius: '12px',
        fontSize: '14px',
        textAlign: 'center',
    },
    primaryButton: {
        padding: '18px 24px',
        fontSize: '15px',
        fontWeight: '600',
        borderRadius: '30px',
        border: 'none',
        backgroundColor: '#1B1D21',
        color: '#ffffff',
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        marginTop: '8px',
    },
    googleButton: {
        padding: '16px 24px',
        fontSize: '15px',
        fontWeight: '500',
        borderRadius: '30px',
        border: '1px solid #E8E8F0',
        backgroundColor: '#ffffff',
        color: '#1B1D21',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background-color 0.2s',
    },
    forgotPassword: {
        textAlign: 'center',
        fontSize: '14px',
        color: '#808191',
        marginTop: '8px',
    },
};

// Add CSS animation for wave emoji
const styleSheet = document.createElement('style');
styleSheet.textContent = `
    @keyframes wave {
        0%, 100% { transform: rotate(0deg); }
        25% { transform: rotate(20deg); }
        75% { transform: rotate(-10deg); }
    }
`;
document.head.appendChild(styleSheet);
