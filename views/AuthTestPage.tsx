import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Simple auth test page to verify signup/login/org creation works
 * independently from the rest of the app.
 */
export default function AuthTestPage() {
    const { user, userProfile, organization, loading, signUp, signIn, signOut, createOrg } = useAuth();

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
            <div style={styles.container}>
                <h1>🔄 Loading...</h1>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <h1 style={styles.title}>🔐 Auth Test Page</h1>

            {/* Status Display */}
            <div style={styles.status}>
                <h2>Current State:</h2>
                <p><strong>User:</strong> {user ? user.email : 'Not logged in'}</p>
                <p><strong>Profile:</strong> {userProfile ? 'Loaded' : 'None'}</p>
                <p><strong>Org:</strong> {organization ? organization.name : 'None'}</p>
            </div>

            {message && (
                <div style={styles.message}>
                    {message}
                </div>
            )}

            {!user ? (
                /* Login/Signup Form */
                <div style={styles.form}>
                    <h2>Login or Sign Up</h2>
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={styles.input}
                    />
                    <input
                        type="password"
                        placeholder="Password (min 6 chars)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={styles.input}
                    />
                    <div style={styles.buttons}>
                        <button onClick={handleSignUp} disabled={isLoading} style={styles.button}>
                            {isLoading ? '...' : 'Sign Up'}
                        </button>
                        <button onClick={handleSignIn} disabled={isLoading} style={styles.button}>
                            {isLoading ? '...' : 'Log In'}
                        </button>
                    </div>
                </div>
            ) : !organization ? (
                /* Create Org Form */
                <div style={styles.form}>
                    <h2>Create Organization</h2>
                    <p>You're logged in but need an organization.</p>
                    <input
                        type="text"
                        placeholder="Organization Name"
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        style={styles.input}
                    />
                    <div style={styles.buttons}>
                        <button onClick={handleCreateOrg} disabled={isLoading} style={styles.button}>
                            {isLoading ? '...' : 'Create Org'}
                        </button>
                        <button onClick={handleSignOut} style={styles.buttonSecondary}>
                            Sign Out
                        </button>
                    </div>
                </div>
            ) : (
                /* Success State */
                <div style={styles.form}>
                    <h2>✅ All Set!</h2>
                    <p>User: {user.email}</p>
                    <p>Organization: {organization.name}</p>
                    <button onClick={handleSignOut} style={styles.button}>
                        Sign Out
                    </button>
                </div>
            )}

            {/* Debug Info */}
            <details style={styles.debug}>
                <summary>Debug Info</summary>
                <pre>{JSON.stringify({ user: user?.id, userProfile, organization }, null, 2)}</pre>
            </details>
        </div>
    );
}

const styles: Record<string, React.CSSProperties> = {
    container: {
        minHeight: '100vh',
        backgroundColor: '#1a1a2e',
        color: '#eee',
        padding: '40px',
        fontFamily: 'system-ui, sans-serif',
    },
    title: {
        fontSize: '2rem',
        marginBottom: '20px',
    },
    status: {
        backgroundColor: '#16213e',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px',
    },
    message: {
        padding: '15px',
        backgroundColor: '#0f3460',
        borderRadius: '8px',
        marginBottom: '20px',
        fontSize: '1.1rem',
    },
    form: {
        backgroundColor: '#16213e',
        padding: '30px',
        borderRadius: '8px',
        maxWidth: '400px',
    },
    input: {
        width: '100%',
        padding: '12px',
        marginBottom: '15px',
        borderRadius: '6px',
        border: 'none',
        fontSize: '16px',
    },
    buttons: {
        display: 'flex',
        gap: '10px',
    },
    button: {
        flex: 1,
        padding: '12px 24px',
        backgroundColor: '#e94560',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        fontSize: '16px',
        cursor: 'pointer',
    },
    buttonSecondary: {
        flex: 1,
        padding: '12px 24px',
        backgroundColor: '#555',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        fontSize: '16px',
        cursor: 'pointer',
    },
    debug: {
        marginTop: '40px',
        backgroundColor: '#0f0f0f',
        padding: '15px',
        borderRadius: '8px',
    },
};
