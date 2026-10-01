'use client';

import React, { useState } from 'react';
import Link from 'next/navigation';
import { useRouter } from 'next/navigation';
import { Sparkles, Layers, RefreshCw, Zap, Store, ExternalLink } from 'lucide-react';

interface NavbarProps {
  sellerName?: string;
  boothName?: string;
  activeTab?: 'dashboard' | 'binders' | 'buyer';
}

export default function Navbar({ sellerName = 'PokeVault ID', boothName = 'Table #A-14' }: NavbarProps) {
  const router = useRouter();
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
                  <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-red-400 via-amber-300 to-yellow-400 bg-clip-text text-transparent">
                    PokéVend
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                    Card Show App
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium hidden sm:block">
                  {sellerName} • <span className="text-amber-400">{boothName}</span>
                </p>
              </div>
            </a>
          </div>

          {/* Quick Actions & Status */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Event Mode Active
            </div>

            <a
              href="/"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <Store className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Dashboard Seller</span>
              <span className="sm:hidden">Home</span>
            </a>

            <button
              onClick={handleResetData}
              disabled={resetting}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              title="Reset data ke contoh Pokémon cards"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">Reset Demo</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
