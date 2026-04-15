import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { getVL } from '../utils/vesper';

/**
 * Simple auth test page to verify signup/login/org creation works
 * independently from the rest of the app.
 */
export default function AuthTestPage() {
    const { user, userProfile, organization, loading, signUp, signIn, signOut, createOrg } = useAuth();
    const { isDarkMode } = useTheme();
    const vl = getVL(isDarkMode);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [orgName, setOrgName] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSignUp = async () => {
        setIsLoading(true);
        setMessage('');
        const { error } = await signUp(email, password);
        if (error) {
            setMessage(`❌ Signup Error: ${error.message}`);
        } else {
            setMessage('✅ Signed up successfully!');
        }
        setIsLoading(false);
    };

    const handleSignIn = async () => {
        setIsLoading(true);
        setMessage('');
        const { error } = await signIn(email, password);
        if (error) {
            setMessage(`❌ Login Error: ${error.message}`);
        } else {
            setMessage('✅ Logged in successfully!');
        }
        setIsLoading(false);
    };

    const handleCreateOrg = async () => {
        setIsLoading(true);
        setMessage('');
        const { error } = await createOrg(orgName);
        if (error) {
            setMessage(`❌ Org Error: ${error.message}`);
        } else {
            setMessage('✅ Organization created!');
        }
        setIsLoading(false);
    };

    const handleSignOut = async () => {
        await signOut();
        setMessage('👋 Signed out');
    };

    if (loading) {
        return (
            <div style={{ ...styles.container, background: vl.bg, color: vl.textMain }}>
                <h1 style={{ fontFamily: "'Newsreader', Georgia, serif" }}>🔄 Loading...</h1>
            </div>
        );
    }

    return (
        <div style={{ ...styles.container, background: vl.bg, color: vl.textMain }}>
            <h1 style={{ ...styles.title, fontFamily: "'Newsreader', Georgia, serif" }}>🔐 Auth Test Page</h1>

            {/* Status Display */}
            <div style={{ ...styles.status, background: vl.surface, border: `1px solid ${vl.border}` }}>
                <h2 style={{ fontFamily: "'Newsreader', Georgia, serif" }}>Current State:</h2>
                <p><strong>User:</strong> {user ? user.email : 'Not logged in'}</p>
                <p><strong>Profile:</strong> {userProfile ? 'Loaded' : 'None'}</p>
                <p><strong>Org:</strong> {organization ? organization.name : 'None'}</p>
            </div>

            {message && (
                <div style={{ ...styles.message, background: vl.surfaceMuted, border: `1px solid ${vl.borderStrong}` }}>
                    {message}
                </div>
            )}

            {!user ? (
                /* Login/Signup Form */
                <div style={{ ...styles.form, background: vl.surface, border: `1px solid ${vl.border}` }}>
                    <h2 style={{ fontFamily: "'Newsreader', Georgia, serif", marginBottom: '16px' }}>Login or Sign Up</h2>
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="vl-input"
                        style={{ ...styles.input, background: vl.surfaceMuted, color: vl.textMain, border: `1px solid ${vl.borderStrong}` }}
                    />
                    <input
                        type="password"
                        placeholder="Password (min 6 chars)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="vl-input"
                        style={{ ...styles.input, background: vl.surfaceMuted, color: vl.textMain, border: `1px solid ${vl.borderStrong}` }}
                    />
                    <div style={styles.buttons}>
                        <button onClick={handleSignUp} disabled={isLoading} className="btn-primary" style={{ flex: 1 }}>
                            {isLoading ? '...' : 'Sign Up'}
                        </button>
                        <button onClick={handleSignIn} disabled={isLoading} className="btn-primary" style={{ flex: 1 }}>
                            {isLoading ? '...' : 'Log In'}
                        </button>
                    </div>
                </div>
            ) : !organization ? (
                /* Create Org Form */
                <div style={{ ...styles.form, background: vl.surface, border: `1px solid ${vl.border}` }}>
                    <h2 style={{ fontFamily: "'Newsreader', Georgia, serif", marginBottom: '16px' }}>Create Organization</h2>
                    <p style={{ color: vl.textBody, fontSize: '13px', marginBottom: '16px' }}>You're logged in but need an organization.</p>
                    <input
                        type="text"
                        placeholder="Organization Name"
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        className="vl-input"
                        style={{ ...styles.input, background: vl.surfaceMuted, color: vl.textMain, border: `1px solid ${vl.borderStrong}` }}
                    />
                    <div style={styles.buttons}>
                        <button onClick={handleCreateOrg} disabled={isLoading} className="btn-primary" style={{ flex: 1 }}>
                            {isLoading ? '...' : 'Create Org'}
                        </button>
                        <button onClick={handleSignOut} style={{ ...styles.buttonSecondary, background: vl.chipBg, color: vl.textMuted }}>
                            Sign Out
                        </button>
                    </div>
                </div>
            ) : (
                /* Success State */
                <div style={{ ...styles.form, background: vl.surface, border: `1px solid ${vl.border}` }}>
                    <h2 style={{ fontFamily: "'Newsreader', Georgia, serif", marginBottom: '16px' }}>✅ All Set!</h2>
                    <p style={{ color: vl.textBody }}>User: {user.email}</p>
                    <p style={{ color: vl.textBody }}>Organization: {organization.name}</p>
                    <div style={{ marginTop: '16px' }}>
                        <button onClick={handleSignOut} className="btn-primary" style={{ width: '100%' }}>
                            Sign Out
                        </button>
                    </div>
                </div>
            )}

            {/* Debug Info */}
            <details style={{ ...styles.debug, background: vl.surface, border: `1px solid ${vl.border}` }}>
                <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>Debug Info</summary>
                <pre style={{ color: vl.textMuted, fontSize: '12px', marginTop: '12px', overflowX: 'auto' }}>{JSON.stringify({ user: user?.id, userProfile, organization }, null, 2)}</pre>
            </details>
        </div>
    );
}

const styles: Record<string, React.CSSProperties> = {
    container: {
        minHeight: '100vh',
        padding: '40px',
    },
    title: {
        fontSize: '2rem',
        marginBottom: '20px',
    },
    status: {
        padding: '20px',
        borderRadius: '6px',
        marginBottom: '20px',
    },
    message: {
        padding: '15px',
        borderRadius: '4px',
        marginBottom: '20px',
        fontSize: '13px',
        fontWeight: 'bold',
    },
    form: {
        padding: '30px',
        borderRadius: '6px',
        maxWidth: '400px',
    },
    input: {
        width: '100%',
        padding: '12px',
        marginBottom: '15px',
        borderRadius: '4px',
        fontSize: '13px',
        outline: 'none',
    },
    buttons: {
        display: 'flex',
        gap: '10px',
    },
    buttonSecondary: {
        flex: 1,
        padding: '12px 24px',
        border: 'none',
        borderRadius: '4px',
        fontSize: '13px',
        fontWeight: 'bold',
        cursor: 'pointer',
    },
    debug: {
        marginTop: '40px',
        padding: '15px',
        borderRadius: '6px',
    },
};
