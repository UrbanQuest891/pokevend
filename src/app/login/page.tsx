'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import {
  Sparkles,
  ShieldCheck,
  TrendingUp,
  QrCode,
  Layers,
  ArrowLeft,
  CheckCircle2,
  Lock,
  Zap,
  Store,
  HelpCircle,
  Crown,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, isMasterAdmin, signInWithGoogle, signInAsDemoSeller, signInAsMasterAdmin, signOut } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [customSellerName, setCustomSellerName] = useState('PokeVault Indonesia');

  const handleProceedToDashboard = () => {
    router.push('/admin');
  };

  const handleGoogleLogin = async () => {
    try {
      setSubmitting(true);
      await signInWithGoogle('urbanquest.ecom@gmail.com');
      router.push('/admin');
    } catch (err) {
      console.error('Login error:', err);
      alert('Gagal melakukan proses login Google.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMasterLogin = () => {
    signInAsMasterAdmin();
    router.push('/admin');
  };

  const handleDemoLogin = () => {
    signInAsDemoSeller(customSellerName || 'PokeVault Indonesia');
    router.push('/admin');
  };

  return (
    <div
      className="min-h-screen bg-[#F5EFE6] text-[#1E293B] flex flex-col justify-between relative overflow-hidden select-none font-clean"
      style={{
        backgroundImage: 'radial-gradient(#E2D9CC 0.85px, transparent 0.85px)',
        backgroundSize: '20px 20px',
      }}
    >
      {/* Top Bar Navigation */}
      <header className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
        <a
          href="/"
          className="flex items-center gap-2 font-pixelify text-xs sm:text-sm font-bold text-[#7A6B58] hover:text-[#1E293B] transition-colors px-3 py-1.5 rounded-xl bg-white border border-[#D5CABE] shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4 text-[#E05A47]" />
          <span>Kembali ke Beranda</span>
        </a>

        <div className="flex items-center gap-2 text-xs font-pixelify font-bold text-[#7A6B58]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Sistem Online</span>
        </div>
      </header>

      {/* Main Content Card Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* PokéVend Logo & Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#E05A47] p-0.5 shadow-md mb-4 transform hover:scale-105 transition-transform border border-black/10">
              <div className="w-full h-full bg-[#FAF6F0] rounded-[14px] flex items-center justify-center relative overflow-hidden">
                {/* Stylized PokéBall Icon */}
                <div className="absolute top-0 inset-x-0 h-1/2 bg-[#E05A47]"></div>
                <div className="absolute bottom-0 inset-x-0 h-1/2 bg-white"></div>
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 bg-[#1E293B]"></div>
                <div className="w-4 h-4 rounded-full bg-white border-2 border-[#1E293B] z-10 shadow-xs flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#E05A47]"></div>
                </div>
              </div>
            </div>

            <h1 className="font-pixelify text-2xl sm:text-3xl font-bold tracking-tight text-[#1E293B] mb-1">
              POKÉVEND
            </h1>
            <p className="text-xs sm:text-sm text-[#7A6B58] max-w-sm mx-auto leading-relaxed">
              Login Seller untuk mengelola binder kartu, referensi harga pasar, dan mencatat riwayat penjualan otomatis.
            </p>
          </div>

          {/* Card Box */}
          <div className="bg-[#FAF6F0] border-2 border-[#D5CABE] rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 text-[#1E293B]">
            {user ? (
              /* Already Logged In Card */
              <div className="text-center space-y-5">
                <div className={`p-4 rounded-2xl border-2 space-y-2 ${isMasterAdmin ? 'bg-amber-50/80 border-amber-300' : 'bg-emerald-50 border-emerald-300'}`}>
                  {isMasterAdmin ? (
                    <Crown className="w-8 h-8 text-amber-600 mx-auto fill-amber-400" />
                  ) : (
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  )}
                  <div className={`font-pixelify font-bold text-sm ${isMasterAdmin ? 'text-amber-950' : 'text-emerald-900'}`}>
                    {isMasterAdmin ? '👑 MASTER OWNER TERDAFTAR' : 'ANDA SEDANG LOGIN!'}
                  </div>
                  <div className="text-xs text-[#1E293B] font-bold">{user.name}</div>
                  <div className="text-[11px] text-[#7A6B58] font-mono-clean">{user.email}</div>
                  <span className={`inline-block mt-1 font-pixelify text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                    isMasterAdmin
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : 'bg-white text-emerald-800 border-emerald-300'
                  }`}>
                    {isMasterAdmin ? 'Master Super Admin (Akses Penuh)' : user.provider === 'google' ? 'Akun Google Terverifikasi' : 'Mode Demo Seller'}
                  </span>
                </div>

                <div className="space-y-2.5">
                  <button
                    type="button"
                    onClick={handleProceedToDashboard}
                    className="w-full py-3.5 px-4 rounded-2xl bg-[#E05A47] hover:bg-[#C94735] text-white font-pixelify font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Store className="w-4 h-4" />
                    <span>BUKA DASHBOARD SELLER</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => signOut()}
                    className="w-full py-2.5 px-4 rounded-2xl bg-white hover:bg-[#FAF6F0] text-[#7A6B58] hover:text-[#1E293B] font-pixelify font-bold text-xs border border-[#D5CABE] transition-colors cursor-pointer"
                  >
                    Keluar / Ganti Akun
                  </button>
                </div>
              </div>
            ) : (
              /* Not Logged In - Login Actions */
              <div className="space-y-4">
                <div className="text-center">
                  <span className="font-pixelify text-[10px] uppercase tracking-wider font-bold text-[#4A3E31] bg-[#EAE3D8] border border-[#D5CABE] px-3 py-1 rounded-full inline-flex items-center gap-1.5">
                    <Lock className="w-3 h-3 text-[#E05A47]" />
                    <span>AKSES PORTAL SELLER</span>
                  </span>
                </div>

                {/* Master Account 1-Click Login Card */}
                <div className="p-3.5 rounded-2xl bg-amber-50/80 border-2 border-amber-300 space-y-2.5 shadow-2xs">
                  <div className="flex items-center justify-between font-pixelify text-[11px] font-bold text-amber-950">
                    <span className="flex items-center gap-1.5 text-amber-800">
                      <Crown className="w-4 h-4 fill-amber-500 text-amber-600" />
                      Master Account Owner
                    </span>
                    <span className="text-[9px] text-amber-900 bg-amber-200/80 border border-amber-300 px-2 py-0.5 rounded-full font-pixelify">
                      MASTER
                    </span>
                  </div>
                  <div className="text-[11px] text-[#5A4B3C] leading-tight">
                    Terdaftar: <strong className="text-[#1E293B] font-mono-clean text-xs">urbanquest.ecom@gmail.com</strong>
                  </div>
                  <button
                    type="button"
                    onClick={handleMasterLogin}
                    className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-pixelify font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <Crown className="w-4 h-4" />
                    <span>Masuk sebagai Master Owner</span>
                  </button>
                </div>

                {/* Divider */}
                <div className="relative flex items-center justify-center pt-1">
                  <div className="border-t border-[#D5CABE] w-full"></div>
                  <span className="bg-[#FAF6F0] px-3 font-pixelify text-[10px] text-[#7A6B58] uppercase tracking-widest font-bold">
                    atau login opsi lain
                  </span>
                </div>

                {/* Main Google Login Button */}
                <button
                  type="button"
                  disabled={submitting || loading}
                  onClick={handleGoogleLogin}
                  className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-[#FAF6F0] text-[#1E293B] font-pixelify font-bold text-xs shadow-2xs active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 cursor-pointer border border-[#D5CABE]"
                >
                  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>{submitting ? 'Menghubungkan...' : 'Login Google'}</span>
                </button>

                {/* Demo Seller Fast Login */}
                <div className="p-3 rounded-2xl bg-white border border-[#D5CABE] space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between font-pixelify text-[11px] font-bold text-[#4A3E31]">
                    <span className="flex items-center gap-1.5 text-[#E05A47]">
                      <Zap className="w-3.5 h-3.5 fill-[#E05A47]" />
                      Mode Demo Seller
                    </span>
                    <span className="text-[10px] text-[#7A6B58]">Tanpa Setup OAuth</span>
                  </div>

                  <input
                    type="text"
                    value={customSellerName}
                    onChange={(e) => setCustomSellerName(e.target.value)}
                    placeholder="Nama Seller / Booth"
                    className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#D5CABE] rounded-xl text-xs font-bold text-[#1E293B] focus:outline-none focus:border-[#E05A47] shadow-inner font-pixelify"
                  />

                  <button
                    type="button"
                    onClick={handleDemoLogin}
                    className="w-full py-2.5 px-3 rounded-xl bg-[#FAF6F0] hover:bg-[#EAE3D8] text-[#1E293B] font-pixelify font-bold text-xs transition-colors border border-[#D5CABE] flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <span>Masuk Instan sebagai {customSellerName || 'Seller'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Feature Highlights List */}
            <div className="pt-4 border-t-2 border-[#EAE3D8] space-y-2.5 text-xs text-[#7A6B58]">
              <div className="flex items-start gap-2.5">
                <TrendingUp className="w-4 h-4 text-[#2E7D32] flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-[#1E293B]">Riwayat Penjualan Permanen:</strong> Setiap kartu yang laku terjual otomatis tercatat di data penjualan.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <Layers className="w-4 h-4 text-[#E05A47] flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-[#1E293B]">Multi-Game TCG:</strong> Dukungan penuh katalog Pokémon, One Piece Card Game, & Riftbound.
                </span>
              </div>
            </div>
          </div>

          {/* Notice for Event Buyers */}
          <div className="mt-6 p-4 rounded-2xl bg-[#FAF6F0] border-2 border-[#D5CABE] text-center space-y-1 shadow-xs">
            <div className="font-pixelify text-xs font-bold text-[#4A3E31] flex items-center justify-center gap-1.5">
              <QrCode className="w-3.5 h-3.5 text-[#E05A47]" />
              <span>Pengunjung / Pembeli di Meja Event?</span>
            </div>
            <p className="text-[11px] text-[#7A6B58] leading-relaxed">
              Anda tidak perlu login. Cukup scan QR code di binder fisik untuk melihat stok kartu & harga secara langsung.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-5 text-center font-pixelify text-[10px] text-[#7A6B58] border-t-2 border-[#E5DACB]">
        PokéVend Card Show Companion • Multi-Game TCG Vending System
      </footer>
    </div>
  );
}
