import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface LoginViewProps {
    onSuccess?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onSuccess }) => {
    const { signIn, signUp } = useAuth();
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

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <div style={styles.logo}>
                    <span style={styles.logoIcon}>⚡</span>
                    <h1 style={styles.title}>SalesPulse</h1>
                </div>

                <p style={styles.subtitle}>
                    {isSignUp ? 'Create your account' : 'Sign in to your opportunity detection platform'}
                </p>

                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Email Address</label>
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
                        <label style={styles.label}>Password</label>
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
                            <label style={styles.label}>Confirm Password</label>
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
                            backgroundColor: message.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: message.type === 'success' ? '#22c55e' : '#ef4444',
                        }}>
                            {message.text}
                        </div>
                    )}

                    <button
                        type="submit"
                        style={{
                            ...styles.button,
                            opacity: loading ? 0.7 : 1,
                        }}
                        disabled={loading}
                    >
                        {loading ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Sign In')}
                    </button>
                </form>

                <div style={styles.footer}>
                    <span style={styles.footerText}>
                        {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                    </span>
                    <button
                        type="button"
                        onClick={() => {
                            setIsSignUp(!isSignUp);
                            setMessage(null);
                            setPassword('');
                            setConfirmPassword('');
                        }}
                        style={styles.switchButton}
                    >
                        {isSignUp ? 'Sign In' : 'Sign Up'}
                    </button>
                </div>
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
        maxWidth: '420px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
    },
    logo: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        marginBottom: '8px',
    },
    logoIcon: {
        fontSize: '32px',
    },
    title: {
        fontSize: '28px',
        fontWeight: '700',
        color: '#ffffff',
        margin: 0,
    },
    subtitle: {
        textAlign: 'center',
        color: 'rgba(255, 255, 255, 0.6)',
        marginBottom: '32px',
        fontSize: '14px',
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
        transition: 'border-color 0.2s, box-shadow 0.2s',
    },
    message: {
        padding: '12px 16px',
        borderRadius: '8px',
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
        transition: 'transform 0.2s, box-shadow 0.2s',
    },
    footer: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        marginTop: '24px',
    },
    footerText: {
        color: 'rgba(255, 255, 255, 0.4)',
        fontSize: '14px',
    },
    switchButton: {
        background: 'none',
        border: 'none',
        color: '#f97316',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
        padding: 0,
    },
};
