'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Zap,
  ShoppingBag,
  ShieldCheck,
  Check,
  X,
  Layers,
  ArrowRight,
  TrendingUp,
  Award,
  Crown,
  Search,
  SlidersHorizontal,
  ChevronRight,
  Send,
  Eye,
  Info,
  Heart,
  Gamepad2,
  Package,
  Coins,
  Flame,
  Star,
  Bookmark,
  RotateCcw,
  Sliders,
} from 'lucide-react';

interface PreviewCard {
  id: string;
  slotNumber: number;
  name: string;
  setName: string;
  cardNumber: string;
  rarity: string;
  condition: string;
  price: number;
  imageUrl: string;
  game: 'pokemon' | 'onepiece';
  hp?: number;
  stage?: string;
  isGrail?: boolean;
}

const SAMPLE_CARDS: PreviewCard[] = [
  {
    id: 'c1',
    slotNumber: 1,
    name: 'Umbreon VMAX "Moonbreon"',
    setName: 'Sword & Shield: Evolving Skies',
    cardNumber: '215/203',
    rarity: 'Secret Rare Alt Art',
    condition: 'Graded - PSA 10',
    price: 15500000,
    imageUrl: 'https://images.pokemontcg.io/swsh7/215_hires.png',
    game: 'pokemon',
    isGrail: true,
  },
  {
    id: 'c2',
    slotNumber: 2,
    name: 'Rayquaza VMAX Alt Art',
    setName: 'Sword & Shield: Evolving Skies',
    cardNumber: '218/203',
    rarity: 'Secret Rare Alt Art',
    condition: 'Raw - NM',
    price: 6800000,
    imageUrl: 'https://images.pokemontcg.io/swsh7/218_hires.png',
    game: 'pokemon',
    isGrail: true,
  },
  {
    id: 'c3',
    slotNumber: 3,
    name: 'Charizard ex SIR',
    setName: 'Scarlet & Violet: 151',
    cardNumber: '199/165',
    rarity: 'Special Illustration Rare',
    condition: 'Raw - Mint',
    price: 2450000,
    imageUrl: 'https://images.pokemontcg.io/sv3pt5/199_hires.png',
    game: 'pokemon',
  },
  {
    id: 'c4',
    slotNumber: 4,
    name: 'Pikachu with Grey Felt Hat',
    setName: 'Scarlet & Violet Promos',
    cardNumber: 'SVP #085',
    rarity: 'Van Gogh Museum Promo',
    condition: 'Graded - PSA 10',
    price: 3200000,
    imageUrl: 'https://images.pokemontcg.io/svp/85_hires.png',
    game: 'pokemon',
    isGrail: true,
  },
  {
    id: 'c5',
    slotNumber: 5,
    name: 'Iono Special Illustration Rare',
    setName: 'Scarlet & Violet: Paldea Evolved',
    cardNumber: '269/193',
    rarity: 'Supporter SIR',
    condition: 'Raw - NM',
    price: 1350000,
    imageUrl: 'https://images.pokemontcg.io/sv2/269_hires.png',
    game: 'pokemon',
  },
  {
    id: 'c6',
    slotNumber: 6,
    name: 'Monkey D. Luffy (Manga Flagship)',
    setName: 'Paramount War OP-02',
    cardNumber: 'OP02-013',
    rarity: 'Secret Parallel Rare',
    condition: 'Graded - BGS 10 Black Label',
    price: 45000000,
    imageUrl: 'https://images.pokemontcg.io/swsh7/215_hires.png',
    game: 'onepiece',
    isGrail: true,
  },
];

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function Balanced8BitWarmBinderPreview() {
  // 3 balanced 8-bit font variations that do NOT stretch/flatten (tidak gepeng)
  const [fontChoice, setFontChoice] = useState<'pixelify' | 'dotgothic' | 'vt323'>('pixelify');
  const [cartItems, setCartItems] = useState<PreviewCard[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [buyerName, setBuyerName] = useState('Ash Ketchum');
  const [orderSubmitted, setOrderSubmitted] = useState(false);

  const toggleCartItem = (card: PreviewCard) => {
    if (cartItems.some((c) => c.id === card.id)) {
      setCartItems((prev) => prev.filter((c) => c.id !== card.id));
    } else {
      setCartItems((prev) => [...prev, card]);
    }
  };

  const cartTotal = cartItems.reduce((acc, c) => acc + c.price, 0);

  // Determine font class based on selection
  const fontHeading =
    fontChoice === 'pixelify'
      ? 'font-pixelify'
      : fontChoice === 'dotgothic'
      ? 'font-dotgothic'
      : 'font-vt323';

  return (
    <>
      {/* Import Balanced, Non-Gepeng 8-Bit Google Fonts */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@500;600;700&family=DotGothic16&family=VT323&family=Plus+Jakarta+Sans:wght@500;700;800&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap');
        
        /* 1. Pixelify Sans: Modern proportional 8-bit pixel font, tall and sharp, NOT wide/gepeng */
        .font-pixelify {
          font-family: 'Pixelify Sans', sans-serif;
        }

        /* 2. DotGothic16: Authentic 16x16 pixel Game Boy / JRPG font (balanced Japanese RPG proportions) */
        .font-dotgothic {
          font-family: 'DotGothic16', sans-serif;
          letter-spacing: 0.5px;
        }

        /* 3. VT323: Retro arcade CRT terminal font with tall, condensed vertical proportions */
        .font-vt323 {
          font-family: 'VT323', monospace;
          letter-spacing: 1px;
        }

        .font-mono-clean {
          font-family: 'Space Mono', monospace;
        }

        /* Subtle binder plastic pocket depth */
        .pocket-reflection {
          background: linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.1) 40%, transparent 60%);
        }
      `}</style>

      <div className="min-h-screen bg-[#F5EFE6] text-[#221D17] selection:bg-[#E05A47] selection:text-white pb-24">
        {/* ======================================================== */}
        {/* TOP FONT CONTROLLER & PREVIEW TOOLBAR                   */}
        {/* ======================================================== */}
        <div className="sticky top-0 z-50 bg-[#FAF6F0]/95 backdrop-blur-md border-b-2 border-[#D8CFC4] px-4 py-3 shadow-md">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#E05A47] text-white font-mono-clean">
                OPTI-B + 8-BIT BALANCED
              </span>
              <span className="text-xs font-bold text-[#4A3E31]">
                Pilih Tipe Font 8-Bit Proporsional (Tidak Gepeng):
              </span>
            </div>

            {/* 3 Balanced 8-Bit Font Choices */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#EFE7DC] border border-[#D5CABE]">
              {/* Option 1: Pixelify Sans */}
              <button
                type="button"
                onClick={() => setFontChoice('pixelify')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  fontChoice === 'pixelify'
                    ? 'font-pixelify text-sm bg-[#1E293B] text-[#FACC15] shadow-md scale-105'
                    : 'text-[#7A6B58] hover:text-[#1E293B]'
                }`}
                title="Sangat seimbang, proporsi huruf wajar seperti font modern tapi bergaya pixel 8-bit"
              >
                <span>Pixelify Sans</span>
                <span className="text-[9px] px-1 py-0.2 bg-amber-400 text-black rounded font-sans font-black">
                  Recommended
                </span>
              </button>

              {/* Option 2: DotGothic16 */}
              <button
                type="button"
                onClick={() => setFontChoice('dotgothic')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  fontChoice === 'dotgothic'
                    ? 'font-dotgothic text-sm bg-[#1E293B] text-[#FACC15] shadow-md scale-105'
                    : 'text-[#7A6B58] hover:text-[#1E293B]'
                }`}
                title="Font otentik Game Boy / 16-bit Pokémon RPG, tegak dan ramping"
              >
                <span>DotGothic16</span>
              </button>

              {/* Option 3: VT323 */}
              <button
                type="button"
                onClick={() => setFontChoice('vt323')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  fontChoice === 'vt323'
                    ? 'font-vt323 text-base bg-[#1E293B] text-[#FACC15] shadow-md scale-105'
                    : 'text-[#7A6B58] hover:text-[#1E293B]'
                }`}
                title="Gaya terminal arcade klasik dengan proporsi vertikal yang ramping"
              >
                <span>VT323 (Arcade)</span>
              </button>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* BANNER NOTIFICATION (EXPLAINING THE BALANCE)            */}
        {/* ======================================================== */}
        <div className="bg-[#EDE4D5] border-b border-[#DDD3C4] py-3 px-4 text-xs text-[#524435]">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-[#E05A47] flex-shrink-0" />
              <span>
                <strong>Kombinasi Sempurna:</strong> Kehangatan kertas binder fisik VendBro (`#F5EFE6`) dipadukan dengan tipografi 8-bit yang <strong>tegak, proporsional, dan nyaman dibaca</strong> (bebas dari distorsi melebar/gepeng).
              </span>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-[#FAF6F0] text-[#E05A47] border border-[#DDD3C4] font-mono-clean whitespace-nowrap">
              Font Aktif: {fontChoice === 'pixelify' ? 'Pixelify Sans' : fontChoice === 'dotgothic' ? 'DotGothic16' : 'VT323'}
            </span>
          </div>
        </div>

        {/* ======================================================== */}
        {/* MAIN BINDER VIEW                                        */}
        {/* ======================================================== */}
        <main className="max-w-6xl mx-auto px-4 py-8 space-y-7">
          {/* Header Card (Physical Binder Cover Feel) */}
          <div className="bg-[#FAF6F0] border-2 border-[#D8CFC4] rounded-3xl p-6 sm:p-7 shadow-sm relative overflow-hidden">
            {/* Subtle Leather/Stitch Accent on Top */}
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#E05A47] via-[#FACC15] to-[#2E7D32]"></div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono-clean text-[11px] font-bold text-[#E05A47] bg-[#FCEBE8] border border-[#F5C2BA] px-2.5 py-0.5 rounded-md">
                    📍 TABLE #A-14 • JAKARTA CARD SHOW
                  </span>
                  <span className={`${fontHeading} text-xs font-bold text-[#7A6B58]`}>
                    PAGE 1 / 3
                  </span>
                </div>

                <h1 className={`${fontHeading} text-2xl sm:text-3xl font-bold text-[#1E293B] tracking-tight`}>
                  ★ POKÉVAULT SECRET GRAIL BINDER ★
                </h1>

                <p className="text-xs sm:text-sm text-[#6B5E51] mt-2 max-w-xl leading-relaxed">
                  Koleksi kartu langka resmi di meja event. Pilih kartu yang Anda inginkan dengan menekan tombol keranjang, lalu kirim pesanan langsung ke kasir tanpa chat WhatsApp.
                </p>
              </div>

              {/* Status Pills */}
              <div className="flex items-center gap-2">
                <div className="bg-[#EBF5ED] border border-[#BDE0C4] text-[#2E7D32] px-3.5 py-2 rounded-xl flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#2E7D32] animate-pulse"></span>
                  <span className={`${fontHeading} text-xs font-bold`}>LIVE INVENTORY</span>
                </div>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* 9-POCKET BINDER GRID (PHYSICAL SLEEVE AESTHETIC)        */}
          {/* ======================================================== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SAMPLE_CARDS.map((card) => {
              const inCart = cartItems.some((c) => c.id === card.id);

              return (
                <div
                  key={card.id}
                  className={`relative p-5 rounded-3xl border-2 transition-all duration-200 flex flex-col justify-between ${
                    inCart
                      ? 'bg-[#FFFDF9] border-[#E05A47] shadow-xl ring-2 ring-[#E05A47]/30 scale-[1.01]'
                      : 'bg-[#FAF6F0] hover:bg-white border-[#D8CFC4] hover:border-[#B8AB9B] shadow-sm hover:shadow-md'
                  }`}
                >
                  {/* Top Sleeve Badges */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono-clean text-[11px] font-bold text-[#7A6B58] bg-[#EFE7DC] px-2.5 py-0.5 rounded-md border border-[#D5CABE]">
                      POCKET #{card.slotNumber}
                    </span>

                    <span className={`${fontHeading} text-[11px] font-bold text-[#2E7D32] bg-[#EBF5ED] px-2.5 py-0.5 rounded-md border border-[#BDE0C4]`}>
                      AVAILABLE
                    </span>
                  </div>

                  {/* Translucent Binder Sleeve Frame */}
                  <div className="relative aspect-[63/88] w-full max-w-[210px] mx-auto rounded-2xl overflow-hidden bg-[#24211E] p-2 shadow-inner border border-[#423D38] group">
                    {/* Plastic Glare / Reflection Overlay */}
                    <div className="absolute inset-0 pocket-reflection pointer-events-none z-10 opacity-70 group-hover:opacity-100 transition-opacity"></div>

                    <img
                      src={card.imageUrl}
                      alt={card.name}
                      className="w-full h-full object-contain rounded-xl transform group-hover:scale-105 transition-transform duration-300 relative z-0"
                    />

                    {card.isGrail && (
                      <div className="absolute top-3 left-3 z-20">
                        <span className={`${fontHeading} text-[10px] font-bold bg-[#E05A47] text-white px-2 py-0.5 rounded shadow border border-white/30 flex items-center gap-1`}>
                          <Star className="w-3 h-3 fill-yellow-300 text-yellow-300" />
                          <span>GRAIL</span>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card Metadata & Proportional 8-Bit Typography */}
                  <div className="mt-4 space-y-2.5">
                    <div>
                      {/* Name in Balanced 8-Bit */}
                      <h3 className={`${fontHeading} text-sm sm:text-base font-bold text-[#1E293B] truncate tracking-normal`}>
                        {card.name}
                      </h3>
                      <p className="font-mono-clean text-xs text-[#7A6B58] truncate mt-0.5">
                        {card.setName} • <span className="text-[#B45309] font-bold">{card.cardNumber}</span>
                      </p>
                    </div>

                    {/* Condition / Grading Badge */}
                    <div className="flex items-center justify-between pt-1">
                      <span className={`${fontHeading} text-[11px] font-bold text-[#5C4F40] bg-[#EFE7DC] px-2 py-0.5 rounded border border-[#D5CABE]`}>
                        {card.condition}
                      </span>
                      <span className="font-mono-clean text-[11px] text-[#8C7E6D]">
                        {card.rarity}
                      </span>
                    </div>

                    {/* Price & Cart Button */}
                    <div className="pt-3 border-t border-[#EAE3D8] flex items-center justify-between">
                      <div>
                        <span className="font-mono-clean text-[10px] text-[#8C7E6D] uppercase block">
                          HARGA DEAL
                        </span>
                        <span className={`${fontHeading} text-base sm:text-lg font-bold text-[#1E293B]`}>
                          {formatRupiah(card.price)}
                        </span>
                      </div>

                      {/* Tactile 8-bit Action Button */}
                      <button
                        type="button"
                        onClick={() => toggleCartItem(card)}
                        className={`py-2 px-3.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 ${
                          inCart
                            ? 'bg-[#2E7D32] text-white shadow-emerald-700/20'
                            : 'bg-[#1E293B] hover:bg-[#334155] text-white'
                        }`}
                      >
                        {inCart ? (
                          <>
                            <Check className="w-4 h-4 stroke-[3]" />
                            <span className={`${fontHeading} text-xs`}>Di Keranjang</span>
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="w-4 h-4 text-[#FACC15]" />
                            <span className={`${fontHeading} text-xs text-[#FACC15]`}>+ Keranjang</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </main>

        {/* ======================================================== */}
        {/* FLOATING CART BAR (WHEN ITEMS SELECTED)                  */}
        {/* ======================================================== */}
        {cartItems.length > 0 && (
          <div className="fixed bottom-6 inset-x-4 max-w-lg mx-auto z-40 animate-in slide-in-from-bottom duration-300">
            <div className="p-4 rounded-3xl bg-[#FAF6F0] border-2 border-[#D8CFC4] shadow-2xl flex items-center justify-between gap-3 text-[#221D17]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#1E293B] rounded-2xl flex items-center justify-center text-[#FACC15] shadow-md">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <div>
                  <div className={`${fontHeading} text-xs font-bold text-[#E05A47]`}>
                    {cartItems.length} KARTU DIPILIH
                  </div>
                  <div className={`${fontHeading} text-base font-bold text-[#1E293B]`}>
                    TOTAL: {formatRupiah(cartTotal)}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className={`py-2.5 px-4 rounded-2xl text-xs font-bold bg-[#E05A47] hover:bg-[#C94735] text-white shadow-md flex items-center gap-2 cursor-pointer active:scale-95 transition-all ${fontHeading}`}
              >
                <span>LIHAT PESANAN</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* CHECKOUT MODAL                                           */}
        {/* ======================================================== */}
        {isCartOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4">
            <div className="w-full max-w-md bg-[#FAF6F0] border-2 border-[#D8CFC4] rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 max-h-[85vh] flex flex-col justify-between text-[#221D17]">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b-2 border-[#EAE3D8]">
                <div>
                  <h3 className={`${fontHeading} text-lg font-bold text-[#1E293B]`}>
                    📋 PESANAN MEJA EVENT
                  </h3>
                  <p className="font-mono-clean text-xs text-[#7A6B58] mt-0.5">
                    Kirim langsung ke penjual tanpa WhatsApp
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  className="p-1 text-[#7A6B58] hover:text-black cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {orderSubmitted ? (
                /* Order Sent Confirmation */
                <div className="py-8 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-[#EBF5ED] border-2 border-[#2E7D32] flex items-center justify-center mx-auto text-[#2E7D32]">
                    <Check className="w-8 h-8 stroke-[3]" />
                  </div>
                  <div>
                    <span className="font-mono-clean text-[10px] font-bold px-2.5 py-0.5 bg-[#EBF5ED] text-[#2E7D32] border border-[#BDE0C4] rounded">
                      TIKET PESANAN DITERIMA
                    </span>
                    <h4 className={`${fontHeading} text-3xl font-bold mt-2 text-[#1E293B]`}>
                      #ORD-204
                    </h4>
                    <p className="font-mono-clean text-xs font-bold text-[#B45309] mt-1">
                      Atas Nama: <strong className="text-[#1E293B]">{buyerName}</strong>
                    </p>
                  </div>

                  <p className="p-3.5 bg-[#F2ECE1] border border-[#DDD3C4] rounded-2xl text-xs text-[#524435] leading-relaxed">
                    Silakan dekati kasir di <strong>Table #A-14</strong> dan sebutkan nama <strong>&quot;{buyerName}&quot;</strong> untuk cek kondisi kartu fisik & selesaikan pembayaran!
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      setOrderSubmitted(false);
                      setCartItems([]);
                      setIsCartOpen(false);
                    }}
                    className={`${fontHeading} w-full py-3 bg-[#1E293B] text-white rounded-2xl text-xs font-bold transition-all cursor-pointer`}
                  >
                    SELESAI & TUTUP
                  </button>
                </div>
              ) : (
                /* Item list & Buyer name form */
                <>
                  <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
                    {cartItems.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 bg-white border border-[#EAE3D8] rounded-2xl flex items-center justify-between gap-3 shadow-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={item.imageUrl}
                            alt=""
                            className="w-10 h-14 object-contain rounded-lg bg-[#24211E] p-0.5 border border-[#D8CFC4]"
                          />
                          <div className="min-w-0">
                            <div className={`${fontHeading} text-xs font-bold truncate text-[#1E293B]`}>
                              {item.name}
                            </div>
                            <div className="font-mono-clean text-[10px] text-[#8C7E6D]">
                              Slot #{item.slotNumber} • {item.condition}
                            </div>
                            <div className={`${fontHeading} text-xs font-bold text-[#2E7D32] mt-0.5`}>
                              {formatRupiah(item.price)}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleCartItem(item)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}

                    <div className="pt-2">
                      <label className={`${fontHeading} block text-xs font-bold text-[#4A3E31] mb-1.5`}>
                        NAMA ANDA (UNTUK DIPANGGIL DI MEJA) *
                      </label>
                      <input
                        type="text"
                        value={buyerName}
                        onChange={(e) => setBuyerName(e.target.value)}
                        placeholder="Contoh: Ash / Budi"
                        className="w-full px-3.5 py-2.5 bg-white border border-[#D5CABE] text-[#1E293B] rounded-xl text-xs font-bold focus:outline-none focus:border-[#E05A47] shadow-inner"
                      />
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="pt-4 border-t-2 border-[#EAE3D8] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono-clean text-xs text-[#7A6B58]">TOTAL TRANSAKSI:</span>
                      <span className={`${fontHeading} text-lg font-bold text-[#1E293B]`}>
                        {formatRupiah(cartTotal)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setOrderSubmitted(true)}
                      className={`${fontHeading} w-full py-3.5 bg-[#E05A47] hover:bg-[#C94735] text-white rounded-2xl text-xs font-bold shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all`}
                    >
                      <Send className="w-4 h-4" />
                      <span>KIRIM PESANAN KE PENJUAL</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
