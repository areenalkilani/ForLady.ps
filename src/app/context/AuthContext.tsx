import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '../../lib/supabaseClient';
import { ADMIN_EMAIL } from '../lib/constants';
import type { Profile } from '../lib/types';

interface AuthContextType {
  user: Profile | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  register: (userData: Partial<Profile> & { password?: string }) => Promise<{ needsEmailConfirmation: boolean }>;
  resendVerification: (email: string) => Promise<boolean>;
  forgotPassword: (email: string) => Promise<boolean>;
  resetPassword: (password: string) => Promise<boolean>;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function profileFromAuthUser(authUser: User, profile?: any): Profile {
  const metadata = authUser.user_metadata || {};
  const email = authUser.email || profile?.email || '';

  return {
    id: authUser.id,
    email,
    fullName: profile?.full_name || metadata.full_name || metadata.name || email,
    phone: profile?.phone || metadata.phone || '',
    region: profile?.region || metadata.region || '',
    city: profile?.city || metadata.city || '',
    town: profile?.town || metadata.town || '',
    role: profile?.role || (email.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? 'admin' : 'customer'),
    createdAt: profile?.created_at || authUser.created_at || new Date().toISOString(),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (authUser?: User | null) => {
    if (!isSupabaseConfigured) {
      setUser(null);
      setLoading(false);
      return;
    }

    const currentUser = authUser ?? (await supabase.auth.getUser()).data.user;
    console.info('[Auth] loadProfile user:', currentUser?.id || null);
    if (!currentUser) {
      setUser(null);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', currentUser.id)
      .maybeSingle();
    if (error) console.warn('[Auth] Profile query failed; using auth metadata fallback:', error.message);

    setUser(profileFromAuthUser(currentUser, data));
    setLoading(false);
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      console.info('[Auth] Initial session:', Boolean(data.session));
      loadProfile(data.session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.info('[Auth] State changed:', _event, Boolean(session));
      window.setTimeout(() => {
        loadProfile(session?.user ?? null);
      }, 0);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    ensureConfigured();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      console.info('[Auth] Login successful:', data.user?.id);
      await loadProfile(data.user);
      return true;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    if (!isSupabaseConfigured) {
      setUser(null);
      return;
    }
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    console.info('[Auth] Logout successful');
    setUser(null);
  };

  const register = async (userData: Partial<Profile> & { password?: string }) => {
    ensureConfigured();
    const email = userData.email?.trim() || '';
    const { data, error } = await supabase.auth.signUp({
      email,
      password: userData.password || '',
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
        data: {
          full_name: userData.fullName || '',
          phone: userData.phone || '',
          region: userData.region || '',
          city: userData.city || '',
          town: userData.town || '',
        },
      },
    });
    if (error) throw error;
    const needsEmailConfirmation = Boolean(data.user && !data.session);
    console.info('[Auth] Sign up submitted:', {
      userId: data.user?.id || null,
      hasSession: Boolean(data.session),
      needsEmailConfirmation,
    });
    if (data.user && data.session) await loadProfile(data.user);
    if (data.user && !data.session && userData.password) {
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password: userData.password,
      });
      if (!loginError && loginData.user) {
        await loadProfile(loginData.user);
        return { needsEmailConfirmation: false };
      }
    }
    return { needsEmailConfirmation };
  };

  const resendVerification = async (email: string) => {
    ensureConfigured();
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });
    if (error) throw error;
    console.info('[Auth] Verification email resent for:', email.trim());
    return true;
  };

  const forgotPassword = async (email: string) => {
    ensureConfigured();
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
    console.info('[Auth] Password reset email requested for:', email.trim());
    return true;
  };

  const resetPassword = async (password: string) => {
    ensureConfigured();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
    console.info('[Auth] Password updated for current reset session');
    return true;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        register,
        resendVerification,
        forgotPassword,
        resetPassword,
        loading,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

function ensureConfigured() {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase environment variables are missing or invalid.');
  }
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
