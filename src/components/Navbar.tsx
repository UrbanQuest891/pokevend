'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import {
  Sparkles,
  Layers,
  RefreshCw,
  Zap,
  Store,
  ExternalLink,
  TrendingUp,
  LogIn,
  LogOut,
  User,
} from 'lucide-react';

interface NavbarProps {
  sellerName?: string;
  boothName?: string;
  activeTab?: 'dashboard' | 'binders' | 'buyer';
}

export default function Navbar({ sellerName = 'PokeVault ID', boothName = 'Table #A-14' }: NavbarProps) {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [resetting, setResetting] = useState(false);

  const handleResetData = async () => {
    if (!confirm('Kembalikan data binder & kartu ke preset awal demo?')) return;
    try {
      setResetting(true);
      const res = await fetch('/api/reset', { method: 'POST' });
      if (res.ok) {
        alert('Data berhasil di-reset ke preset awal!');
        router.refresh();
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
      alert('Gagal mereset data');
    } finally {
      setResetting(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Branding */}
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 via-rose-500 to-amber-500 p-0.5 shadow-lg shadow-red-500/20 group-hover:scale-105 transition-transform flex items-center justify-center">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center relative overflow-hidden">
                  {/* Stylized Pokeball icon */}
                  <div className="absolute top-0 inset-x-0 h-1/2 bg-red-600"></div>
                  <div className="absolute bottom-0 inset-x-0 h-1/2 bg-white"></div>
                  <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 bg-slate-900"></div>
                  <div className="w-3.5 h-3.5 rounded-full bg-white border-2 border-slate-900 z-10 shadow-sm flex items-center justify-center">
                    <div className="w-1 h-1 rounded-full bg-red-600"></div>
                  </div>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-pixelify font-bold text-lg tracking-tight bg-gradient-to-r from-red-400 via-amber-300 to-yellow-400 bg-clip-text text-transparent">
                    PokéVend
                  </span>
                  <span className="font-pixelify text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                    Card Show App
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium hidden sm:block">
                  {user?.name || sellerName} • <span className="text-amber-400">{boothName}</span>
                </p>
              </div>
            </a>
          </div>

          {/* Quick Actions & Navigation */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Dashboard Link */}
            <a
              href="/"
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <Store className="w-4 h-4 text-amber-400" />
              <span className="hidden md:inline">Dashboard</span>
            </a>

            {/* Riwayat Penjualan (Sales History) Link */}
            <a
              href="/admin/sales"
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              title="Lihat riwayat transaksi kartu terjual & omset"
            >
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Riwayat Penjualan</span>
              <span className="sm:hidden">Sales</span>
            </a>

            {/* Reset Demo Data Button */}
            <button
              onClick={handleResetData}
              disabled={resetting}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              title="Reset data ke contoh Pokémon cards"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
              <span>Reset</span>
            </button>

            {/* User Auth Section */}
            {user ? (
              <div className="flex items-center gap-1.5 pl-1.5 border-l border-slate-800">
                <div className="hidden xl:flex flex-col text-right leading-tight pr-1">
                  <span className="text-xs font-bold text-white truncate max-w-[130px]">{user.name}</span>
                  <span className="text-[10px] text-emerald-400 font-semibold">Seller Aktif</span>
                </div>
                <button
                  type="button"
                  onClick={signOut}
                  className="flex items-center gap-1 p-2 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-bold text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer"
                  title="Keluar dari akun seller"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Keluar</span>
                </button>
              </div>
            ) : (
              <a
                href="/login"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-extrabold bg-gradient-to-r from-red-600 to-amber-500 hover:brightness-110 text-slate-950 shadow-md shadow-red-500/20 active:scale-95 transition-all"
              >
                <LogIn className="w-4 h-4 text-slate-950" />
                <span>Login</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
