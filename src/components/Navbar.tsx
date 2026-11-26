'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
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
  Crown,
  BookOpen,
  Home,
} from 'lucide-react';

interface NavbarProps {
  sellerName?: string;
  boothName?: string;
  activeTab?: 'dashboard' | 'binders' | 'buyer';
}

export default function Navbar({ sellerName = 'PokeVault ID', boothName = 'Table #A-14' }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isMasterAdmin, signOut } = useAuth();
  const [resetting, setResetting] = useState(false);

  const isDashboard = pathname === '/admin';
  const isSales = pathname === '/admin/sales';

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
    <header className="sticky top-0 z-40 bg-[#FAF6F0]/95 backdrop-blur-md border-b-2 border-[#E5DACB] no-print shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Branding */}
          <div className="flex items-center gap-3">
            <a href="/admin" className="flex items-center gap-2.5 group" title="Kembali ke Dashboard Kasir">
              <div className="w-10 h-10 rounded-2xl bg-[#E05A47] p-0.5 shadow-sm group-hover:scale-105 transition-transform flex items-center justify-center border border-black/10">
                <div className="w-full h-full bg-[#FAF6F0] rounded-[14px] flex items-center justify-center relative overflow-hidden">
                  {/* Stylized Pokeball icon */}
                  <div className="absolute top-0 inset-x-0 h-1/2 bg-[#E05A47]"></div>
                  <div className="absolute bottom-0 inset-x-0 h-1/2 bg-white"></div>
                  <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 bg-[#1E293B]"></div>
                  <div className="w-3.5 h-3.5 rounded-full bg-white border-2 border-[#1E293B] z-10 shadow-xs flex items-center justify-center">
                    <div className="w-1 h-1 rounded-full bg-[#E05A47]"></div>
                  </div>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-pixelify font-bold text-lg tracking-tight text-[#1E293B]">
                    PokéVend
                  </span>
                  <span className="font-pixelify text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#EAE3D8] text-[#7A6B58] border border-[#D5CABE]">
                    Kasir Meja
                  </span>
                </div>
                <p className="text-xs text-[#7A6B58] font-medium hidden sm:block">
                  {user?.name || sellerName} • <span className="text-[#E05A47] font-bold">{boothName}</span>
                </p>
              </div>
            </a>
          </div>

          {/* Quick Actions & Navigation */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Dashboard Link */}
            <a
              href="/admin"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-pixelify font-bold transition-all shadow-2xs ${
                isDashboard
                  ? 'bg-white border-2 border-[#E05A47] text-[#1E293B] shadow-xs'
                  : 'bg-[#FAF6F0] border border-[#D5CABE] text-[#5D4E3E] hover:bg-white hover:text-[#1E293B]'
              }`}
            >
              <Store className={`w-4 h-4 ${isDashboard ? 'text-[#E05A47]' : 'text-[#7A6B58]'}`} />
              <span className="hidden md:inline">Dashboard</span>
            </a>

            {/* Riwayat Penjualan (Sales History) Link */}
            <a
              href="/admin/sales"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-pixelify font-bold transition-all shadow-2xs ${
                isSales
                  ? 'bg-white border-2 border-[#2E7D32] text-[#1E293B] shadow-xs'
                  : 'bg-[#FAF6F0] border border-[#D5CABE] text-[#5D4E3E] hover:bg-white hover:text-[#1E293B]'
              }`}
              title="Lihat riwayat transaksi kartu terjual & omset"
            >
              <TrendingUp className={`w-4 h-4 ${isSales ? 'text-[#2E7D32]' : 'text-[#7A6B58]'}`} />
              <span className="hidden sm:inline">Laporan Omset</span>
              <span className="sm:hidden">Omset</span>
            </a>

            {/* Pratinjau Rak Pembeli (Live Customer View) */}
            <a
              href="/b"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-pixelify font-bold bg-[#FAF0E6] border border-[#E0C9B6] text-[#8C4A32] hover:bg-[#FCECE0] hover:border-[#E05A47] transition-all shadow-2xs"
              title="Buka tampilan rak binder seperti yang dilihat pembeli di HP"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#E05A47]" />
              <span className="hidden lg:inline">Rak Pembeli</span>
              <ExternalLink className="w-3 h-3 text-[#E05A47]" />
            </a>

            {/* Reset Demo Data Button */}
            <button
              onClick={handleResetData}
              disabled={resetting}
              className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-pixelify font-bold text-[#7A6B58] hover:text-[#1E293B] hover:bg-[#EAE3D8] transition-colors cursor-pointer"
              title="Reset data ke contoh Pokémon cards"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
              <span>Reset</span>
            </button>

            {/* Public Landing Page subtle link */}
            <a
              href="/"
              className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-clean text-[#7A6B58] hover:text-[#1E293B] hover:bg-white/80 transition-colors"
              title="Kunjungi Website Utama / Info Publik"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Web Publik</span>
            </a>

            {/* User Auth Section */}
            {user ? (
              <div className="flex items-center gap-1.5 pl-1.5 border-l-2 border-[#EAE3D8]">
                <div className="hidden xl:flex flex-col text-right leading-tight pr-1">
                  <div className="flex items-center gap-1 justify-end">
                    {isMasterAdmin && <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />}
                    <span className="text-xs font-bold text-[#1E293B] truncate max-w-[130px]">{user.name}</span>
                  </div>
                  <span className={`font-pixelify text-[10px] font-bold ${isMasterAdmin ? 'text-amber-600' : 'text-[#2E7D32]'}`}>
                    {isMasterAdmin ? '👑 Master Owner' : 'Seller Aktif'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={signOut}
                  className="flex items-center gap-1 p-2 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-pixelify font-bold text-[#7A6B58] hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all cursor-pointer"
                  title="Keluar dari akun seller"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Keluar</span>
                </button>
              </div>
            ) : (
              <a
                href="/login"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-pixelify font-bold bg-[#E05A47] hover:bg-[#C94735] text-white shadow-xs active:scale-95 transition-all"
              >
                <LogIn className="w-4 h-4 text-white" />
                <span>Login</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
