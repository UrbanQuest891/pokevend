'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { isSupabaseConfigured, getSupabaseAuthUrl } from './supabaseClient';

export const MASTER_ADMIN_EMAIL = 'urbanquest.ecom@gmail.com';

export interface SellerUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  provider: 'google' | 'demo' | 'master';
  role: 'seller' | 'admin';
  isMasterAdmin?: boolean;
}

interface AuthContextType {
  user: SellerUser | null;
  loading: boolean;
  isMasterAdmin: boolean;
  signInWithGoogle: (customEmail?: string) => Promise<void>;
  signInAsDemoSeller: (customName?: string, customEmail?: string) => void;
  signInAsMasterAdmin: () => void;
  signOut: () => void;
  isConfigured: boolean;
}

const STORAGE_KEY = 'pokevend_seller_session';

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isMasterAdmin: false,
  signInWithGoogle: async () => {},
  signInAsDemoSeller: () => {},
  signInAsMasterAdmin: () => {},
  signOut: () => {},
  isConfigured: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SellerUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Load existing session on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure isMasterAdmin flag is accurate
        parsed.isMasterAdmin = parsed.email?.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase();
        if (parsed.isMasterAdmin) {
          parsed.role = 'admin';
        }
        setUser(parsed);
      }
    } catch (e) {
      console.warn('Failed to restore auth session:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const signInWithGoogle = async (customEmail?: string) => {
    setLoading(true);
    try {
      if (isSupabaseConfigured) {
        // Redirect to Supabase Google OAuth endpoint
        const targetUrl = getSupabaseAuthUrl('google');
        window.location.href = targetUrl;
        return;
      }

      // If Supabase OAuth keys are not yet configured in local environment,
      // simulate realistic Google Login with chosen or master email
      await new Promise((r) => setTimeout(r, 600));
      const targetEmail = customEmail || MASTER_ADMIN_EMAIL;
      const isMaster = targetEmail.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase();

      const googleUser: SellerUser = {
        id: `google-${Date.now()}`,
        name: isMaster ? 'UrbanQuest Master Owner' : 'PokeVault Official Seller',
        email: targetEmail,
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
        provider: 'google',
        role: isMaster ? 'admin' : 'seller',
        isMasterAdmin: isMaster,
      };
      setUser(googleUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(googleUser));
    } finally {
      setLoading(false);
    }
  };

  const signInAsMasterAdmin = () => {
    const masterUser: SellerUser = {
      id: `master-${Date.now()}`,
      name: 'UrbanQuest Master Owner',
      email: MASTER_ADMIN_EMAIL,
      avatarUrl: '',
      provider: 'master',
      role: 'admin',
      isMasterAdmin: true,
    };
    setUser(masterUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(masterUser));
  };

  const signInAsDemoSeller = (
    customName = 'PokeVault Event Seller',
    customEmail = 'seller@pokevault.id'
  ) => {
    const isMaster = customEmail.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase();
    const demoUser: SellerUser = {
      id: `demo-${Date.now()}`,
      name: customName,
      email: customEmail,
      avatarUrl: '',
      provider: 'demo',
      role: isMaster ? 'admin' : 'seller',
      isMasterAdmin: isMaster,
    };
    setUser(demoUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(demoUser));
  };

  const signOut = () => {
    setUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn(e);
    }
  };

  const isMasterAdmin = Boolean(
    user && user.email?.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase()
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isMasterAdmin,
        signInWithGoogle,
        signInAsDemoSeller,
        signInAsMasterAdmin,
        signOut,
        isConfigured: isSupabaseConfigured,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
