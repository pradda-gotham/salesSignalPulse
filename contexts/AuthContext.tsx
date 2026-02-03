import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../src/lib/supabase';
import { Database } from '../src/lib/database.types';

type UserProfile = Database['public']['Tables']['users']['Row'];
type Organization = Database['public']['Tables']['organizations']['Row'];

interface AuthContextType {
    session: Session | null;
    user: User | null;
    userProfile: UserProfile | null;
    organization: Organization | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
    signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [organization, setOrganization] = useState<Organization | null>(null);
    const [loading, setLoading] = useState(true);

    // Fetch user profile and organization
    const fetchProfile = async (userId: string) => {
        try {
            const { data: profile, error: profileError } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (profileError) {
                console.log('[Auth] No user profile found, may need onboarding');
                return;
            }

            setUserProfile(profile);

            if (profile?.org_id) {
                const { data: org, error: orgError } = await supabase
                    .from('organizations')
                    .select('*')
                    .eq('id', profile.org_id)
                    .single();

                if (!orgError && org) {
                    setOrganization(org);
                }
            }
        } catch (error) {
            console.error('[Auth] Error fetching profile:', error);
        }
    };

    const refreshProfile = async () => {
        if (user?.id) {
            await fetchProfile(user.id);
        }
    };

    useEffect(() => {
        // Skip auth if Supabase is not configured
        if (!isSupabaseConfigured) {
            console.warn('[Auth] Supabase not configured, skipping auth');
            setLoading(false);
            return;
        }

        // Set a timeout to prevent infinite loading
        const timeout = setTimeout(() => {
            console.warn('[Auth] Auth check timed out after 5s, proceeding without session');
            setLoading(false);
        }, 5000);

        // Get initial session with error handling
        supabase.auth.getSession().then(({ data: { session } }) => {
            clearTimeout(timeout);
            console.log('[Auth] Session check complete:', session ? 'logged in' : 'no session');
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
            }
            setLoading(false);
        }).catch((error) => {
            clearTimeout(timeout);
            console.error('[Auth] Failed to get session:', error);
            setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log('[Auth] State changed:', event);
                setSession(session);
                setUser(session?.user ?? null);

                if (event === 'SIGNED_IN' && session?.user) {
                    await fetchProfile(session.user.id);
                } else if (event === 'SIGNED_OUT') {
                    setUserProfile(null);
                    setOrganization(null);
                }

                setLoading(false);
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    // Email/Password Sign In
    const signIn = async (email: string, password: string) => {
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            return { error: error as Error | null };
        } catch (error) {
            return { error: error as Error };
        }
    };

    // Email/Password Sign Up
    const signUp = async (email: string, password: string) => {
        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
            });
            return { error: error as Error | null };
        } catch (error) {
            return { error: error as Error };
        }
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
        setUserProfile(null);
        setOrganization(null);
    };

    const value = {
        session,
        user,
        userProfile,
        organization,
        loading,
        signIn,
        signUp,
        signOut,
        refreshProfile,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
