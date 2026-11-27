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
  const { user, loading, isMasterAdmin, isConfigured, signInWithGoogle, signInAsDemoSeller, signOut } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [customSellerName, setCustomSellerName] = useState('PokeVault Indonesia');
  const [showGoogleChooser, setShowGoogleChooser] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');

  const handleProceedToDashboard = () => {
    router.push('/admin');
  };

  const handleGoogleLogin = async () => {
    if (isConfigured) {
      // Production mode: redirects to live Supabase / Google OAuth server
      setSubmitting(true);
      await signInWithGoogle();
      return;
    }

    // Dev/Local Mode: Buka dialog pemilihan akun Google agar pengguna memilih akun Gmail-nya
    setShowGoogleChooser(true);
  };

  const handleSelectGoogleAccount = async (email: string) => {
    try {
      setSubmitting(true);
      await signInWithGoogle(email);
      setShowGoogleChooser(false);
      router.push('/admin');
    } catch (err) {
      console.error('Login error:', err);
      alert('Gagal melakukan proses login Google.');
    } finally {
      setSubmitting(false);
    }
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
              Masuk ke akun kasir seller untuk atur binder kartu dan catat transaksi meja stand.
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
                    {isMasterAdmin ? '👑 AKUN MASTER OWNER' : 'AKUN SELLER AKTIF'}
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

                {/* Main Google Login Button */}
                <button
                  type="button"
                  disabled={submitting || loading}
                  onClick={handleGoogleLogin}
                  className="w-full py-3.5 px-5 rounded-2xl bg-white hover:bg-[#FAF6F0] text-[#1E293B] font-pixelify font-bold text-xs shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-3 cursor-pointer border border-[#D5CABE]"
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
                  <strong className="text-[#1E293B]">Pencatatan Otomatis:</strong> Setiap kartu yang deal langsung masuk ke rekap kasir tanpa perlu catat manual di kertas.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <Layers className="w-4 h-4 text-[#E05A47] flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-[#1E293B]">Multi-Game TCG:</strong> Bisa dipakai untuk Pokémon TCG, One Piece Card Game, dan Riftbound.
                </span>
              </div>
            </div>
          </div>

          {/* Notice for Event Buyers */}
          <div className="mt-6 p-4 rounded-2xl bg-[#FAF6F0] border-2 border-[#D5CABE] text-center space-y-1 shadow-xs">
            <div className="font-pixelify text-xs font-bold text-[#4A3E31] flex items-center justify-center gap-1.5">
              <QrCode className="w-3.5 h-3.5 text-[#E05A47]" />
              <span>Khusus Pembeli di Meja Bazaar</span>
            </div>
            <p className="text-[11px] text-[#7A6B58] leading-relaxed">
              Anda tidak perlu login akun. Cukup scan QR code di binder meja untuk langsung lihat daftar kartu dan harganya.
            </p>
          </div>
        </div>
      </main>

      {/* Google Account Selector Dialog (Dev & Local Simulation) */}
      {showGoogleChooser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-clean">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-gray-200 space-y-4 animate-in fade-in zoom-in-95">
            {/* Google Header */}
            <div className="text-center space-y-1">
              <svg className="w-8 h-8 mx-auto" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <h2 className="text-base font-bold text-gray-900 pt-1">Pilih Akun Google</h2>
              <p className="text-xs text-gray-500">untuk melanjutkan ke PokéVend</p>
            </div>

            {/* Account List */}
            <div className="space-y-1.5 pt-2 border-t border-gray-100">
              {/* Account 1: Master Owner */}
              <button
                type="button"
                onClick={() => handleSelectGoogleAccount('urbanquest.ecom@gmail.com')}
                className="w-full p-2.5 rounded-2xl hover:bg-gray-50 transition-colors flex items-center justify-between text-left border border-gray-100 hover:border-gray-200 cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-xs">
                    UQ
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-900">UrbanQuest Store</div>
                    <div className="text-[11px] text-gray-500 font-mono">urbanquest.ecom@gmail.com</div>
                  </div>
                </div>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  Master
                </span>
              </button>

              {/* Account 2: Standard Seller */}
              <button
                type="button"
                onClick={() => handleSelectGoogleAccount('seller.bazaar@gmail.com')}
                className="w-full p-2.5 rounded-2xl hover:bg-gray-50 transition-colors flex items-center justify-between text-left border border-gray-100 hover:border-gray-200 cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-xs">
                    SB
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-900">Seller Bazaar Jakarta</div>
                    <div className="text-[11px] text-gray-500 font-mono">seller.bazaar@gmail.com</div>
                  </div>
                </div>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                  Seller
                </span>
              </button>
            </div>

            {/* Use Another Account Input */}
            <div className="pt-2 border-t border-gray-100 space-y-2">
              <label className="text-[11px] text-gray-600 block">Atau ketik alamat Gmail lain:</label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={customGoogleEmail}
                  onChange={(e) => setCustomGoogleEmail(e.target.value)}
                  placeholder="akun.lain@gmail.com"
                  className="flex-1 px-3 py-1.5 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  disabled={!customGoogleEmail.trim()}
                  onClick={() => handleSelectGoogleAccount(customGoogleEmail.trim())}
                  className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 disabled:opacity-40 cursor-pointer"
                >
                  Pilih
                </button>
              </div>
            </div>

            {/* Cancel Button */}
            <button
              type="button"
              onClick={() => setShowGoogleChooser(false)}
              className="w-full py-2 text-xs text-gray-500 hover:text-gray-800 cursor-pointer font-medium"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="relative z-10 py-5 text-center font-pixelify text-[10px] text-[#7A6B58] border-t-2 border-[#E5DACB]">
        PokéVend Card Show Companion • Multi-Game TCG Vending System
      </footer>
    </div>
  );
}
