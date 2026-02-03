import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../src/lib/supabase';
import { Database } from '../src/lib/database.types';

type UserProfile = Database['public']['Tables']['users']['Row'];
type Organization = Database['public']['Tables']['organizations']['Row'];

interface AuthContextType {
    session: Session | null;
    user: User | null;
    userProfile: UserProfile | null;
    organization: Organization | null;
    loading: boolean;
    signInWithMagicLink: (email: string) => Promise<{ error: Error | null }>;
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
            // Get user profile
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

            // Get organization
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
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
            }
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

    const signInWithMagicLink = async (email: string) => {
        try {
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                },
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
        signInWithMagicLink,
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
