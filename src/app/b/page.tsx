'use client';

import React, { useState, useEffect } from 'react';
import { Binder, SellerProfile } from '@/types';
import { formatCurrency } from '@/lib/qr';
import {
  Layers,
  BookOpen,
  ArrowRight,
  Sparkles,
  Store,
  Tag,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  Flame,
} from 'lucide-react';

export default function BuyerMultiBinderShelfPage() {
  const [binders, setBinders] = useState<Binder[]>([]);
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await fetch('/api/binders', { cache: 'no-store' });
        const data = await res.json();
        if (data.success) {
          setBinders(data.binders || []);
          setProfile(data.profile || null);
        }
      } catch (err) {
        console.error('Failed to load binders shelf:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5EFE6] text-[#1E293B] flex items-center justify-center p-4 font-clean">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full border-4 border-[#E05A47] border-t-transparent animate-spin mx-auto"></div>
          <p className="font-pixelify text-sm font-bold text-[#7A6B58]">MEMBUKA RAK BINDER MEJA...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#F5EFE6] text-[#1E293B] flex flex-col font-clean selection:bg-[#E05A47] selection:text-white"
      style={{
        backgroundImage: 'radial-gradient(#E2D9CC 0.85px, transparent 0.85px)',
        backgroundSize: '20px 20px',
      }}
    >
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#FAF6F0]/95 backdrop-blur-md border-b-2 border-[#E5DACB] shadow-xs">
        <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#E05A47] p-0.5 shadow-sm flex items-center justify-center">
              <div className="w-full h-full bg-[#FAF6F0] rounded-[13px] flex items-center justify-center relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-1/2 bg-[#E05A47]"></div>
                <div className="absolute bottom-0 inset-x-0 h-1/2 bg-white"></div>
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 bg-[#1E293B]"></div>
                <div className="w-3 h-3 rounded-full bg-white border border-[#1E293B] z-10 flex items-center justify-center">
                  <div className="w-1 h-1 rounded-full bg-[#E05A47]"></div>
                </div>
              </div>
            </div>
            <div>
              <div className="font-pixelify font-bold text-base text-[#1E293B]">
                {profile?.sellerName || 'PokéVault Indonesia'}
              </div>
              <div className="text-[11px] text-[#7A6B58] font-medium">
                {profile?.boothName || 'Table #A-14 • Jakarta Card Show'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-pixelify text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
              ● Booth Buka
            </span>
          </div>
        </div>
      </header>

      {/* Main Content: Multi-Binder Shelf */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 sm:py-10 space-y-6">
        {/* Banner Title */}
        <div className="text-center max-w-lg mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF6F0] border border-[#D5CABE] text-xs font-pixelify font-bold text-[#E05A47] shadow-2xs">
            <BookOpen className="w-3.5 h-3.5" />
            <span>KATALOG STAND MEJA DIGITAL</span>
          </div>
          <h1 className="font-pixelify text-2xl sm:text-3xl font-bold text-[#1E293B]">
            Pilih Binder Koleksi
          </h1>
          <p className="text-xs sm:text-sm text-[#7A6B58] leading-relaxed">
            Scan dari stand meja terdeteksi. Silakan pilih kategori binder yang ingin Anda jelajahi langsung dari ponsel Anda:
          </p>
        </div>

        {/* Binder Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
          {binders.map((binder, index) => {
            const cardCount = Object.keys(binder.slots || {}).length;
            const availableCount = Object.values(binder.slots || {}).filter(
              (c) => c.status === 'AVAILABLE'
            ).length;

            return (
              <a
                key={binder.id}
                href={`/b/${binder.id}`}
                className="group bg-[#FAF6F0] border-2 border-[#D5CABE] hover:border-[#E05A47] rounded-3xl pl-7 pr-5 py-5 shadow-xs hover:shadow-xl transition-all duration-200 flex flex-col justify-between relative overflow-hidden"
              >
                {/* Top Binder Accent Stripe */}
                <div
                  className="absolute top-0 inset-x-0 h-2.5 shadow-xs"
                  style={{ backgroundColor: binder.coverColor || '#E05A47' }}
                ></div>

                {/* Vintage Binder Spine & Rings Motif on Left Edge */}
                <div className="absolute left-0 inset-y-0 w-4 bg-[#EDE5D8] border-r border-[#D5CABE] flex flex-col justify-around py-6 items-center shadow-inner">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FAF6F0] border border-[#B5A593] shadow-xs flex items-center justify-center">
                    <div className="w-1 h-1 rounded-full bg-[#7A6B58]"></div>
                  </div>
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FAF6F0] border border-[#B5A593] shadow-xs flex items-center justify-center">
                    <div className="w-1 h-1 rounded-full bg-[#7A6B58]"></div>
                  </div>
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FAF6F0] border border-[#B5A593] shadow-xs flex items-center justify-center">
                    <div className="w-1 h-1 rounded-full bg-[#7A6B58]"></div>
                  </div>
                </div>

                <div className="space-y-3 pt-1">
                  {/* Badge & Slot Info */}
                  <div className="flex items-center justify-between">
                    <span className="font-pixelify text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white border border-[#D5CABE] text-[#1E293B] shadow-2xs">
                      {binder.badge || `Rak #${index + 1}`}
                    </span>
                    <span className="font-clean text-[11px] font-bold text-[#2E7D32] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      ● {availableCount} Ready
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="font-pixelify text-base sm:text-lg font-bold text-[#1E293B] group-hover:text-[#E05A47] transition-colors leading-snug">
                      {binder.name}
                    </h3>
                    <p className="text-xs text-[#7A6B58] line-clamp-2 mt-1 leading-relaxed font-clean">
                      {binder.description || 'Koleksi kartu pilihan siap adopt di meja stand.'}
                    </p>
                  </div>

                  {/* Visual Preview Samples */}
                  <div className="p-2.5 bg-white rounded-2xl border border-[#D5CABE] flex items-center justify-between text-xs font-mono-clean shadow-2xs">
                    <span className="text-[#7A6B58] text-[11px]">Format:</span>
                    <span className="font-bold text-[#1E293B]">{binder.layoutType}</span>
                    <span className="text-[#7A6B58] text-[11px]">•</span>
                    <span className="text-[#7A6B58] text-[11px]">Koleksi:</span>
                    <span className="font-bold text-[#1E293B]">{cardCount} Kartu</span>
                  </div>
                </div>

                {/* Open Binder CTA Button */}
                <div className="pt-4 mt-3 border-t border-[#EAE3D8] flex items-center justify-between text-xs font-pixelify font-bold text-[#E05A47] group-hover:text-[#D04936]">
                  <span className="tracking-wide">Buka Halaman Binder ▶</span>
                  <div className="w-8 h-8 rounded-xl bg-white border border-[#D5CABE] group-hover:border-[#E05A47] group-hover:bg-[#E05A47] group-hover:text-white flex items-center justify-center transition-all shadow-2xs">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </a>
            );
          })}
        </div>

        {/* Notice for Buyers */}
        <div className="p-4 rounded-2xl bg-white border border-[#D5CABE] text-center space-y-1 shadow-2xs max-w-lg mx-auto">
          <div className="font-pixelify text-xs font-bold text-[#1E293B] flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#E05A47]" />
            <span>Pesan Mandiri Tanpa Antre</span>
          </div>
          <p className="text-[11px] text-[#7A6B58] leading-relaxed">
            Pilih kartu favorit Anda, masukkan ke keranjang digital, dan kirim pesanan langsung ke kasir tanpa perlu chat WhatsApp.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center font-pixelify text-[10px] text-[#7A6B58] py-5 border-t border-[#E5DACB]">
        PokéVend Multi-Binder Shelf • {profile?.boothName || 'Event Table Stand'}
      </footer>
    </div>
  );
}
