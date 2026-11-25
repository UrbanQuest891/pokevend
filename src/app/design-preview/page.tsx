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
    rarity: 'Van Gogh Promo',
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
    rarity: 'Special Illustration Rare',
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

export default function DesignComparisonPreviewPage() {
  const [selectedTheme, setSelectedTheme] = useState<'cyber' | 'luxury'>('cyber');
  const [cartItems, setCartItems] = useState<PreviewCard[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [buyerName, setBuyerName] = useState('Budi Santoso');
  const [orderSubmitted, setOrderSubmitted] = useState(false);

  const toggleCartItem = (card: PreviewCard) => {
    if (cartItems.some((c) => c.id === card.id)) {
      setCartItems((prev) => prev.filter((c) => c.id !== card.id));
    } else {
      setCartItems((prev) => [...prev, card]);
    }
  };

  const cartTotal = cartItems.reduce((acc, c) => acc + c.price, 0);

  return (
    <div className={`min-h-screen transition-colors duration-500 ${
      selectedTheme === 'cyber' ? 'bg-slate-950 text-slate-100' : 'bg-[#0a0907] text-[#f7eedc]'
    }`}>
      {/* ======================================================== */}
      {/* FLOATING THEME SELECTOR BAR (STAYS ON TOP FOR EASY TEST) */}
      {/* ======================================================== */}
      <div className="sticky top-0 z-50 bg-black/90 backdrop-blur-xl border-b border-white/10 px-4 py-3 shadow-2xl">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-full">
              Mode Uji Coba UI/UX
            </span>
            <span className="text-xs text-slate-300 font-bold hidden sm:inline">
              Bandingkan 2 Konsep Desain:
            </span>
          </div>

          {/* Toggle Pills */}
          <div className="flex items-center gap-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800">
            {/* Opsi 1: Cyber-Collector HUD */}
            <button
              type="button"
              onClick={() => {
                setSelectedTheme('cyber');
                setOrderSubmitted(false);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                selectedTheme === 'cyber'
                  ? 'bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 text-white shadow-lg shadow-red-600/30 ring-2 ring-amber-400/50 scale-[1.02]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Zap className="w-4 h-4 fill-amber-300 text-amber-300" />
              <span>Opsi 1: Cyber-Collector HUD</span>
            </button>

            {/* Opsi 2: Luxury Vault Gallery */}
            <button
              type="button"
              onClick={() => {
                setSelectedTheme('luxury');
                setOrderSubmitted(false);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                selectedTheme === 'luxury'
                  ? 'bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-400 text-slate-950 shadow-lg shadow-yellow-500/30 ring-2 ring-yellow-300 scale-[1.02]'
                  : 'text-slate-400 hover:text-amber-200 hover:bg-slate-800/60'
              }`}
            >
              <Crown className="w-4 h-4 text-slate-950 fill-slate-950" />
              <span>Opsi 2: Luxury Vault Gallery</span>
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* THEME EXPLANATION BANNER                                */}
      {/* ======================================================== */}
      <div className={`py-4 px-4 border-b text-center text-xs transition-all ${
        selectedTheme === 'cyber'
          ? 'bg-slate-900/40 border-slate-800/80 text-slate-300'
          : 'bg-[#15120d]/80 border-[#382e1c] text-[#dfcfb0]'
      }`}>
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          {selectedTheme === 'cyber' ? (
            <>
              <div className="flex items-center gap-2 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
                <span><strong>Karakter Opsi 1:</strong> Gelap pekat, aksen neon merah-amber, kartu tajam, tombol cepat ala gaming / pro trading terminal.</span>
              </div>
              <span className="text-[11px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                Fokus Kecepatan & Kontras Tinggi
              </span>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
                <span><strong>Karakter Opsi 2:</strong> Emas champagne mewah, hitam marmer, efek kilau foil emas, tipografi elegan ala galeri lelang eksklusif.</span>
              </div>
              <span className="text-[11px] font-bold text-yellow-300 bg-yellow-400/15 px-2 py-0.5 rounded border border-yellow-400/30">
                Fokus Prestise & High-End Investment
              </span>
            </>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* MAIN BINDER VIEW DEMO                                   */}
      {/* ======================================================== */}
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Binder Header Simulation */}
        <div className={`p-6 rounded-3xl border transition-all ${
          selectedTheme === 'cyber'
            ? 'bg-slate-900/80 border-slate-800 shadow-2xl relative overflow-hidden'
            : 'bg-gradient-to-r from-[#17130c] via-[#1f1910] to-[#17130c] border-[#43351d] shadow-2xl shadow-amber-950/20'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${
                  selectedTheme === 'cyber'
                    ? 'bg-red-500/20 text-red-400 border-red-500/40'
                    : 'bg-amber-400/20 text-amber-300 border-amber-400/40'
                }`}>
                  Table #A-14 • Jakarta Card Show
                </span>
                <span className="text-xs text-slate-400 font-bold">Halaman 1 dari 3</span>
              </div>
              <h1 className={`text-2xl sm:text-3xl font-black tracking-tight ${
                selectedTheme === 'cyber'
                  ? 'text-white'
                  : 'text-transparent bg-clip-text bg-gradient-to-r from-[#fff4dc] via-[#edd097] to-[#d6a956]'
              }`}>
                🔥 Grail & Secret Rare Binder
              </h1>
              <p className={`text-xs sm:text-sm mt-1 max-w-xl ${
                selectedTheme === 'cyber' ? 'text-slate-400' : 'text-[#b8a688]'
              }`}>
                Koleksi kartu top tier, Alternate Art, SIR, dan PSA 10 slabs. Klik kartu untuk zoom detail, atau tekan tombol keranjang untuk pesan ke kasir.
              </p>
            </div>

            {/* Quick Actions / Fast Filter */}
            <div className="flex items-center gap-2">
              <div className={`px-3 py-2 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
                selectedTheme === 'cyber'
                  ? 'bg-slate-950 border-slate-800 text-slate-300'
                  : 'bg-[#0f0c08] border-[#382c18] text-[#e0cfb0]'
              }`}>
                <Search className="w-3.5 h-3.5 text-amber-400" />
                <span>Cari Kartu...</span>
              </div>
              <div className={`px-3 py-2 rounded-2xl border text-xs font-bold flex items-center gap-1.5 ${
                selectedTheme === 'cyber'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
              }`}>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Stok Live Meja</span>
              </div>
            </div>
          </div>
        </div>

        {/* 9-Pocket Binder Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {SAMPLE_CARDS.map((card) => {
            const inCart = cartItems.some((c) => c.id === card.id);

            if (selectedTheme === 'cyber') {
              /* ==================================================== */
              /* OPSI 1: CYBER-COLLECTOR HUD CARD ITEM                 */
              /* ==================================================== */
              return (
                <div
                  key={card.id}
                  className={`group relative rounded-3xl p-4 transition-all duration-300 border flex flex-col justify-between ${
                    inCart
                      ? 'bg-slate-900 border-amber-400 shadow-xl shadow-amber-500/10 ring-2 ring-amber-400/40 scale-[1.01]'
                      : 'bg-slate-900/80 hover:bg-slate-900 border-slate-800/80 hover:border-slate-700 shadow-lg'
                  }`}
                >
                  {/* Top Badges */}
                  <div className="flex items-center justify-between mb-3 z-10">
                    <span className="px-2.5 py-1 rounded-xl bg-slate-950/90 text-white text-[11px] font-black border border-slate-800 shadow">
                      #{card.slotNumber}
                    </span>
                    <span className="px-2.5 py-1 rounded-xl bg-emerald-500/15 text-emerald-400 text-[10px] font-black uppercase tracking-wider border border-emerald-500/30 shadow-sm flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      AVAILABLE
                    </span>
                  </div>

                  {/* Card Image Display with Zoom Hint */}
                  <div className="relative aspect-[63/88] w-full max-w-[220px] mx-auto rounded-2xl overflow-hidden bg-slate-950 border border-slate-800/90 group-hover:scale-105 transition-transform duration-300 shadow-md">
                    <img
                      src={card.imageUrl}
                      alt={card.name}
                      className="w-full h-full object-contain p-1"
                    />
                    {card.isGrail && (
                      <div className="absolute top-2 left-2 bg-gradient-to-r from-red-600 to-amber-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-lg shadow-md border border-white/20">
                        GRAIL
                      </div>
                    )}
                  </div>

                  {/* Metadata & Pricing */}
                  <div className="mt-4 space-y-2">
                    <div>
                      <h3 className="font-extrabold text-sm text-white truncate group-hover:text-amber-300 transition-colors">
                        {card.name}
                      </h3>
                      <p className="text-[11px] text-slate-400 truncate">
                        {card.cardNumber} • <span className="text-amber-400/90 font-semibold">{card.rarity}</span>
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">
                          {card.condition}
                        </span>
                        <span className="text-base font-black text-amber-300 tracking-tight">
                          {formatRupiah(card.price)}
                        </span>
                      </div>

                      {/* Add to Cart Button */}
                      <button
                        type="button"
                        onClick={() => toggleCartItem(card)}
                        className={`px-3.5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                          inCart
                            ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                            : 'bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 text-white hover:brightness-110 active:scale-95 shadow-md shadow-red-500/20'
                        }`}
                      >
                        {inCart ? (
                          <>
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Di Keranjang</span>
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>+ Keranjang</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            } else {
              /* ==================================================== */
              /* OPSI 2: LUXURY VAULT GALLERY CARD ITEM                */
              /* ==================================================== */
              return (
                <div
                  key={card.id}
                  className={`group relative rounded-3xl p-5 transition-all duration-500 border flex flex-col justify-between ${
                    inCart
                      ? 'bg-gradient-to-b from-[#2a2113] via-[#1a140a] to-[#120e07] border-amber-400 shadow-2xl shadow-yellow-600/20 ring-1 ring-yellow-400/60 scale-[1.01]'
                      : 'bg-gradient-to-b from-[#1c160e]/90 via-[#141009]/95 to-[#0d0a06] hover:from-[#241c12] border-[#3d2f19] hover:border-[#6b5329] shadow-xl'
                  }`}
                >
                  {/* Subtle Gold Foil Line */}
                  <div className="absolute inset-x-8 top-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/40 to-transparent"></div>

                  {/* Top Badges */}
                  <div className="flex items-center justify-between mb-3 z-10">
                    <span className="px-2.5 py-0.5 rounded-lg bg-[#0a0805] text-[#d6c29b] text-[10px] font-bold border border-[#4a391e] tracking-widest uppercase">
                      Vault Slot #{card.slotNumber}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-lg bg-[#241a0b] text-[#f0d8a8] text-[9px] font-black uppercase tracking-widest border border-[#5c4623] shadow-sm flex items-center gap-1">
                      <Crown className="w-2.5 h-2.5 text-amber-400" />
                      CERTIFIED
                    </span>
                  </div>

                  {/* Card Image Display with Gold Accent Frame */}
                  <div className="relative aspect-[63/88] w-full max-w-[220px] mx-auto rounded-2xl overflow-hidden bg-[#070503] border-2 border-[#382b17] group-hover:border-[#c99f52] group-hover:scale-105 transition-all duration-500 shadow-2xl">
                    <img
                      src={card.imageUrl}
                      alt={card.name}
                      className="w-full h-full object-contain p-1"
                    />
                    {/* Metallic Shine Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-amber-200/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                  </div>

                  {/* Metadata & Pricing */}
                  <div className="mt-5 space-y-3">
                    <div>
                      <h3 className="font-bold text-sm text-[#f7eedc] truncate group-hover:text-amber-200 transition-colors">
                        {card.name}
                      </h3>
                      <p className="text-[11px] text-[#9c896d] truncate">
                        {card.setName} • <span className="text-[#e3be78]">{card.cardNumber}</span>
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-[#312513]">
                      <div>
                        <span className="text-[10px] font-semibold text-[#8c7a5e] block uppercase tracking-wider">
                          {card.condition}
                        </span>
                        <span className="text-base font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#ffe8ba] via-[#f7cf84] to-[#c79948]">
                          {formatRupiah(card.price)}
                        </span>
                      </div>

                      {/* Add to Vault Cart Button */}
                      <button
                        type="button"
                        onClick={() => toggleCartItem(card)}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          inCart
                            ? 'bg-[#ffe8b3] text-[#291c06] shadow-lg shadow-amber-400/20'
                            : 'bg-gradient-to-r from-[#b38230] via-[#c99a42] to-[#dfb459] hover:from-[#c99a42] hover:to-[#ebd078] text-[#1a1204] shadow-md shadow-amber-950/30'
                        }`}
                      >
                        {inCart ? (
                          <>
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Tersimpan</span>
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>+ Beli Kartu</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            }
          })}
        </div>
      </main>

      {/* ======================================================== */}
      {/* FLOATING CART BAR (IF AT LEAST 1 CARD SELECTED)         */}
      {/* ======================================================== */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-6 inset-x-4 max-w-lg mx-auto z-40 animate-in slide-in-from-bottom duration-300">
          <div className={`p-4 rounded-3xl border-2 shadow-2xl backdrop-blur-xl flex items-center justify-between gap-3 ${
            selectedTheme === 'cyber'
              ? 'bg-slate-900/95 border-amber-400 text-white shadow-amber-500/20'
              : 'bg-[#1a1309]/95 border-[#d4a853] text-[#f7eedc] shadow-yellow-600/30'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold shadow-md ${
                selectedTheme === 'cyber'
                  ? 'bg-gradient-to-tr from-red-600 to-amber-500 text-white'
                  : 'bg-gradient-to-tr from-[#c49233] to-[#ffd880] text-slate-950'
              }`}>
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <div className={`text-xs font-extrabold ${
                  selectedTheme === 'cyber' ? 'text-amber-400' : 'text-[#f5d693]'
                }`}>
                  {cartItems.length} Kartu Incaran
                </div>
                <div className="text-sm font-black">
                  Total: {formatRupiah(cartTotal)}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black shadow-lg flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer ${
                selectedTheme === 'cyber'
                  ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-amber-400/25'
                  : 'bg-gradient-to-r from-[#d9a543] to-[#ffdb8a] text-slate-950 hover:brightness-110 shadow-amber-400/20'
              }`}
            >
              <span>Lihat Pesanan</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* CART / ORDER DRAWER MODAL                               */}
      {/* ======================================================== */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-200">
          <div className={`w-full max-w-md rounded-t-3xl sm:rounded-3xl border shadow-2xl p-6 max-h-[85vh] flex flex-col justify-between ${
            selectedTheme === 'cyber'
              ? 'bg-slate-900 border-slate-700 text-slate-100'
              : 'bg-[#171109] border-[#47351b] text-[#f7eedc]'
          }`}>
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <h3 className="font-black text-lg text-white flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-amber-400" />
                  <span>Daftar Pesanan Meja Event</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Kirim ke kasir tanpa perlu chat WhatsApp
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {orderSubmitted ? (
              /* Order Sent Success Ticket View */
              <div className="py-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto text-emerald-400 shadow-xl">
                  <Check className="w-8 h-8 stroke-[3]" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Pesanan Berhasil Dikirim!
                  </span>
                  <h4 className="text-2xl font-black mt-2 text-white">#ORD-204</h4>
                  <p className="text-xs text-slate-300 font-bold mt-1">
                    Atas Nama: <span className="text-amber-400">{buyerName}</span>
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-black/40 border border-white/10 text-xs text-slate-300 text-left space-y-2">
                  <div className="flex items-center gap-2 text-amber-300 font-bold">
                    <Info className="w-4 h-4 flex-shrink-0" />
                    <span>Langkah Selanjutnya di Meja:</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Silakan datangi meja <strong className="text-white">Table #A-14</strong> dan sebutkan nama <strong className="text-amber-300">&quot;{buyerName}&quot;</strong> kepada penjual. Penjual akan langsung mengambilkan kartu dari slot fisik untuk Anda cek & bayar!
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setOrderSubmitted(false);
                    setCartItems([]);
                    setIsCartOpen(false);
                  }}
                  className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-xs font-black text-white transition-colors cursor-pointer"
                >
                  Tutup & Kembali Belanja
                </button>
              </div>
            ) : (
              /* Order Summary & Buyer Name Input */
              <>
                <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
                  {cartItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={item.imageUrl}
                          alt=""
                          className="w-10 h-14 object-contain rounded-lg bg-black border border-white/10"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-bold truncate text-white">{item.name}</div>
                          <div className="text-[10px] text-amber-400 font-medium">Slot #{item.slotNumber} • {item.condition}</div>
                          <div className="text-xs font-black text-emerald-400 mt-0.5">{formatRupiah(item.price)}</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleCartItem(item)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Hapus dari pesanan"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  {/* Buyer Name Input */}
                  <div className="pt-2">
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Nama Anda (Untuk Dipanggil Penjual di Meja) <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      placeholder="Contoh: Budi / Kevin"
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-black/60 border border-white/20 text-xs font-bold text-white focus:outline-none focus:border-amber-400 shadow-inner"
                    />
                  </div>
                </div>

                {/* Footer Submit Button */}
                <div className="pt-4 border-t border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-medium">Total Pembayaran</span>
                    <span className="text-lg font-black text-amber-300">{formatRupiah(cartTotal)}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setOrderSubmitted(true)}
                    className={`w-full py-3.5 rounded-2xl font-black text-xs sm:text-sm shadow-xl flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all ${
                      selectedTheme === 'cyber'
                        ? 'bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 text-white shadow-red-500/20'
                        : 'bg-gradient-to-r from-[#c49233] via-[#dfb155] to-[#f5d078] text-slate-950 shadow-amber-400/20'
                    }`}
                  >
                    <Send className="w-4 h-4" />
                    <span>Kirim Pesanan ke Penjual Langsung</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
