import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, UserProfile, Organization } from '../src/lib/supabase';

interface AuthContextType {
    session: Session | null;
    user: User | null;
    userProfile: UserProfile | null;
    organization: Organization | null;
    loading: boolean;
    signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
    signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
    signInWithGoogle: () => Promise<{ error: Error | null }>;
    resetPassword: (email: string) => Promise<{ error: Error | null }>;
    signOut: () => Promise<void>;
    createOrg: (name: string) => Promise<{ error: Error | null }>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [organization, setOrganization] = useState<Organization | null>(null);
    const [loading, setLoading] = useState(true);

    // Fetch user profile from database
    const fetchProfile = async (userId: string) => {
        console.log('[Auth] Fetching profile for:', userId);

        const { data: profile, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) {
            console.log('[Auth] No profile found:', error.message);
            return;
        }

        console.log('[Auth] Profile loaded:', profile);
        setUserProfile(profile);

        // Fetch org if user has one
        if (profile?.org_id) {
            const { data: org } = await supabase
                .from('organizations')
                .select('*')
                .eq('id', profile.org_id)
                .single();

            if (org) {
                console.log('[Auth] Organization loaded:', org);
                setOrganization(org);
            }
        }
    };

    const refreshProfile = async () => {
        if (user?.id) await fetchProfile(user.id);
    };

    // Initialize auth state
    useEffect(() => {
        console.log('[Auth] Initializing...');

        // Get current session
        supabase.auth.getSession().then(({ data: { session } }) => {
            console.log('[Auth] Session:', session ? 'found' : 'none');
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
            }
            setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log('[Auth] State changed:', event);
            setSession(session);
            setUser(session?.user ?? null);

            if (session?.user) {
                // Fetch profile on any auth event with active session
                fetchProfile(session.user.id);
            }

            if (event === 'SIGNED_OUT' || !session) {
                setUserProfile(null);
                setOrganization(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    // Sign up with email/password
    const signUp = async (email: string, password: string) => {
        console.log('[Auth] Signing up:', email);
        const { error } = await supabase.auth.signUp({ email, password });

        if (error) {
            console.error('[Auth] Signup error:', error);
            return { error };
        }

        // Create user profile
        const { data: { user: newUser } } = await supabase.auth.getUser();
        if (newUser) {
            console.log('[Auth] Creating user profile...');
            await supabase.from('users').insert({
                id: newUser.id,
                email: newUser.email!,
            });
        }

        return { error: null };
    };

    // Sign in with email/password
    const signIn = async (email: string, password: string) => {
        console.log('[Auth] Signing in:', email);
        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            console.error('[Auth] Login error:', error);
            return { error };
        }

        return { error: null };
    };

    // Sign out
    const signOut = async () => {
        console.log('[Auth] Signing out...');
        await supabase.auth.signOut();
        setUserProfile(null);
        setOrganization(null);
    };

    // Sign in with Google OAuth
    const signInWithGoogle = async () => {
        console.log('[Auth] Signing in with Google...');
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin
            }
        });

        if (error) {
            console.error('[Auth] Google sign-in error:', error);
            return { error };
        }

        return { error: null };
    };

    // Reset password
    const resetPassword = async (email: string) => {
        console.log('[Auth] Sending password reset email to:', email);
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`
        });

        if (error) {
            console.error('[Auth] Password reset error:', error);
            return { error };
        }

        return { error: null };
    };

    // Create organization and link to user
    const createOrg = async (name: string) => {
        if (!user) return { error: new Error('Not logged in') };

        console.log('[Auth] Creating org:', name);

        // Create organization
        const { data: org, error: orgError } = await supabase
            .from('organizations')
            .insert({ name })
            .select()
            .single();

        if (orgError) {
            console.error('[Auth] Org creation error:', orgError);
            return { error: orgError };
        }

        console.log('[Auth] Org created:', org);

        // Link user to org
        const { error: updateError } = await supabase
            .from('users')
            .update({ org_id: org.id })
            .eq('id', user.id);

        if (updateError) {
            console.error('[Auth] User update error:', updateError);
            return { error: updateError };
        }

        // Refresh profile
        await fetchProfile(user.id);

        return { error: null };
    };

    return (
        <AuthContext.Provider value={{
            session,
            user,
            userProfile,
            organization,
            loading,
            signUp,
            signIn,
            signInWithGoogle,
            resetPassword,
            signOut,
            createOrg,
            refreshProfile,
        }}>
            {children}
        </AuthContext.Provider>
    );
}
