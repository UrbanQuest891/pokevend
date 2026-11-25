'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { isSupabaseConfigured, getSupabaseAuthUrl } from './supabaseClient';

export interface SellerUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  provider: 'google' | 'demo';
  role: 'seller' | 'admin';
}

interface AuthContextType {
  user: SellerUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInAsDemoSeller: (customName?: string, customEmail?: string) => void;
  signOut: () => void;
  isConfigured: boolean;
}

const STORAGE_KEY = 'pokevend_seller_session';

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  signInAsDemoSeller: () => {},
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
        setUser(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Failed to restore auth session:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      if (isSupabaseConfigured) {
        // Redirect to Supabase Google OAuth endpoint
        const targetUrl = getSupabaseAuthUrl('google');
        window.location.href = targetUrl;
        return;
      }

      // If Supabase OAuth keys are not yet configured in local environment,
      // simulate realistic Google Login so developer & user can test immediately!
      await new Promise((r) => setTimeout(r, 600));
      const googleUser: SellerUser = {
        id: `google-${Date.now()}`,
        name: 'PokeVault Official Seller',
        email: 'seller.pokevault@gmail.com',
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
        provider: 'google',
        role: 'seller',
      };
      setUser(googleUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(googleUser));
    } finally {
      setLoading(false);
    }
  };

  const signInAsDemoSeller = (
    customName = 'PokeVault Event Seller',
    customEmail = 'seller@pokevault.id'
  ) => {
    const demoUser: SellerUser = {
      id: `demo-${Date.now()}`,
      name: customName,
      email: customEmail,
      avatarUrl: '',
      provider: 'demo',
      role: 'seller',
    };
    setUser(demoUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(demoUser));
  };

  const signOut = () => {
    setUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('Failed removing auth session:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle,
        signInAsDemoSeller,
        signOut,
        isConfigured: isSupabaseConfigured,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
