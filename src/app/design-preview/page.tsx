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
    hp: 310,
    stage: 'VMAX',
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
    hp: 320,
    stage: 'VMAX',
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
    hp: 330,
    stage: 'Stage 2',
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
    hp: 60,
    stage: 'Basic',
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
    stage: 'Supporter',
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
    hp: 5,
    stage: 'Leader',
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

export default function RetroDesignPreviewPage() {
  // '8bit' = Retro Game Boy Pixel RPG; 'vendbro' = Warm Tactile Vintage Binder (VendBro Inspired with Twist)
  const [theme, setTheme] = useState<'8bit' | 'vendbro'>('8bit');
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

  return (
    <>
      {/* Import Retro Fonts for true 8-bit & playful typography */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Silkscreen:wght@400;700&family=Plus+Jakarta+Sans:wght@500;700;800;900&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap');
        
        .font-pixel {
          font-family: 'Press Start 2P', monospace;
        }
        .font-silkscreen {
          font-family: 'Silkscreen', sans-serif;
        }
        .font-retro-mono {
          font-family: 'Space Mono', monospace;
        }
        
        /* CRT scanline overlay effect for 8-bit arcade */
        .scanlines {
          background: linear-gradient(
            rgba(18, 16, 16, 0) 50%, 
            rgba(0, 0, 0, 0.25) 50%
          ), linear-gradient(
            90deg,
            rgba(255, 0, 0, 0.03),
            rgba(0, 255, 0, 0.01),
            rgba(0, 0, 255, 0.03)
          );
          background-size: 100% 3px, 6px 100%;
        }

        /* Subtle binder plastic pocket reflections for Vendbro theme */
        .binder-pocket {
          box-shadow: inset 0 2px 4px rgba(255, 255, 255, 0.6), inset 0 -2px 4px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.06);
        }
      `}</style>

      <div
        className={`min-h-screen transition-colors duration-300 ${
          theme === '8bit'
            ? 'bg-[#181a27] text-white scanlines'
            : 'bg-[#F5EFE6] text-[#212121]'
        }`}
      >
        {/* ======================================================== */}
        {/* TOP THEME SWITCHER BAR                                  */}
        {/* ======================================================== */}
        <div
          className={`sticky top-0 z-50 px-4 py-3 border-b transition-all ${
            theme === '8bit'
              ? 'bg-[#0f111d]/95 border-b-4 border-black backdrop-blur-md text-white'
              : 'bg-[#FAF6F0]/95 border-b-2 border-[#D8CFC4] backdrop-blur-md text-[#2C241B]'
          }`}
        >
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                  theme === '8bit'
                    ? 'font-pixel bg-[#FFCC00] text-black border-2 border-black shadow-[2px_2px_0px_#000]'
                    : 'font-retro-mono bg-[#E05A47] text-white rounded-md'
                }`}
              >
                {theme === '8bit' ? '★ RETRO PLAYFUL ★' : '🌿 VENDBRO STYLE'}
              </span>
              <span className="text-xs font-bold hidden md:inline opacity-80">
                Pilih konsep desain playful yang Anda inginkan:
              </span>
            </div>

            {/* Toggle Buttons */}
            <div
              className={`flex items-center gap-2 p-1 rounded-xl border ${
                theme === '8bit'
                  ? 'bg-[#0a0c14] border-2 border-black'
                  : 'bg-[#EFE7DC] border border-[#D5CABE]'
              }`}
            >
              {/* Theme 1: 8-Bit Pixel RPG */}
              <button
                type="button"
                onClick={() => {
                  setTheme('8bit');
                  setOrderSubmitted(false);
                }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                  theme === '8bit'
                    ? 'font-silkscreen font-bold bg-[#E63946] text-white border-2 border-black shadow-[3px_3px_0px_#000] scale-105'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Gamepad2 className="w-4 h-4" />
                <span>Opsi A: 8-Bit PokéDex RPG</span>
              </button>

              {/* Theme 2: Vendbro Warm Binder */}
              <button
                type="button"
                onClick={() => {
                  setTheme('vendbro');
                  setOrderSubmitted(false);
                }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  theme === 'vendbro'
                    ? 'font-retro-mono bg-[#1E293B] text-white shadow-md scale-105'
                    : 'text-[#827566] hover:text-[#2C241B]'
                }`}
              >
                <Package className="w-4 h-4 text-[#FACC15]" />
                <span>Opsi B: VendBro Vintage Warm</span>
              </button>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* BANNER DESCRIPTION                                      */}
        {/* ======================================================== */}
        <div
          className={`py-3 px-4 border-b text-xs transition-all ${
            theme === '8bit'
              ? 'bg-[#23273c] border-black text-amber-300'
              : 'bg-[#EDE4D5] border-[#DDD3C4] text-[#4A3E31]'
          }`}
        >
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
            {theme === '8bit' ? (
              <div className="flex items-center gap-2 font-silkscreen text-[11px]">
                <Flame className="w-4 h-4 text-red-500 fill-red-500 animate-bounce" />
                <span>
                  <strong>Konsep 8-Bit RPG:</strong> Terinspirasi dari Game Boy Pokémon Red/Emerald! Border pixel tebal, bayangan kartun neo-brutalist, lencana HP/Level, dan tombol game yang membal.
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 font-retro-mono text-xs">
                <Bookmark className="w-4 h-4 text-[#E05A47]" />
                <span>
                  <strong>Konsep VendBro Twist:</strong> Palet kertas vintage hangat (krem/parchment), kartu terlihat seperti diselipkan ke kantong binder fisik transparan, tipografi tebal retro ala 90-an.
                </span>
              </div>
            )}
            <span
              className={`text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider rounded ${
                theme === '8bit'
                  ? 'bg-black text-[#FFCC00] font-pixel'
                  : 'bg-[#D8CEBF] text-[#2C241B] font-retro-mono'
              }`}
            >
              100% Playful & Nostalgik
            </span>
          </div>
        </div>

        {/* ======================================================== */}
        {/* MAIN BINDER VIEW                                        */}
        {/* ======================================================== */}
        <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
          {/* Header Card */}
          <div
            className={`p-6 transition-all ${
              theme === '8bit'
                ? 'bg-[#2a2e45] border-4 border-black rounded-2xl shadow-[6px_6px_0px_#000] relative overflow-hidden'
                : 'bg-[#FAF6F0] border-2 border-[#D8CFC4] rounded-3xl shadow-md'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 ${
                      theme === '8bit'
                        ? 'font-pixel bg-[#E63946] text-white border-2 border-black shadow-[2px_2px_0px_#000]'
                        : 'font-retro-mono bg-[#EFE7DC] text-[#7A6B58] border border-[#D5CABE] rounded-full'
                    }`}
                  >
                    📍 TABLE #A-14 • JAKARTA CARD SHOW
                  </span>
                  <span
                    className={`text-xs font-bold ${
                      theme === '8bit' ? 'font-silkscreen text-[#FFCC00]' : 'font-retro-mono text-[#8C7E6D]'
                    }`}
                  >
                    PAGE 1 / 3
                  </span>
                </div>

                <h1
                  className={`text-2xl sm:text-4xl tracking-tight ${
                    theme === '8bit'
                      ? 'font-silkscreen font-bold text-[#FFCC00] drop-shadow-[3px_3px_0px_#000]'
                      : 'font-extrabold text-[#1F2937]'
                  }`}
                >
                  ⚡ POKÉVAULT SECRET GRAIL BINDER
                </h1>
                <p
                  className={`text-xs sm:text-sm mt-2 max-w-xl ${
                    theme === '8bit'
                      ? 'font-retro-mono text-slate-300'
                      : 'font-sans text-[#6B5E51] leading-relaxed'
                  }`}
                >
                  {theme === '8bit'
                    ? '▶ PILIH KARTU UNTUK DITAMBAHKAN KE INVENTORY BAG! BAWA KE KASIR UNTUK CLAIM!'
                    : 'Koleksi kartu langka siap bawa pulang. Klik "+ Keranjang" untuk pesan langsung ke penjual di meja tanpa perlu buka WhatsApp.'}
                </p>
              </div>

              {/* Status Pills */}
              <div className="flex items-center gap-2">
                <div
                  className={`px-3 py-2 text-xs flex items-center gap-2 ${
                    theme === '8bit'
                      ? 'font-silkscreen bg-[#1f2233] border-2 border-black shadow-[3px_3px_0px_#000] text-emerald-400 rounded-lg'
                      : 'font-retro-mono bg-[#EBF5ED] border border-[#BDE0C4] text-[#2E7D32] rounded-xl'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                  <span>STOCK READY</span>
                </div>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* CARDS GRID (9-POCKET FEEL)                              */}
          {/* ======================================================== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SAMPLE_CARDS.map((card) => {
              const inCart = cartItems.some((c) => c.id === card.id);

              if (theme === '8bit') {
                /* ================================================== */
                /* THEME A: 8-BIT POKEDEX ARCADE                      */
                /* ================================================== */
                return (
                  <div
                    key={card.id}
                    className={`relative p-4 rounded-xl border-4 border-black transition-all duration-200 flex flex-col justify-between ${
                      inCart
                        ? 'bg-[#373d5c] shadow-[6px_6px_0px_#FFCC00] translate-x-[-2px] translate-y-[-2px]'
                        : 'bg-[#24273b] hover:bg-[#2c3049] shadow-[5px_5px_0px_#000] hover:shadow-[7px_7px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px]'
                    }`}
                  >
                    {/* Top Retro Badges */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-pixel text-[9px] bg-black text-[#FFCC00] px-2 py-1 border-2 border-black rounded shadow-[1px_1px_0px_#fff]">
                        SLOT #{card.slotNumber}
                      </span>
                      <span className="font-silkscreen text-[10px] font-bold bg-[#10B981] text-black px-2 py-0.5 border-2 border-black rounded shadow-[2px_2px_0px_#000] uppercase">
                        READY
                      </span>
                    </div>

                    {/* Card Container with Pixel Frame */}
                    <div className="relative aspect-[63/88] w-full max-w-[210px] mx-auto rounded-lg overflow-hidden bg-black border-3 border-black shadow-inner p-1 group">
                      <img
                        src={card.imageUrl}
                        alt={card.name}
                        className="w-full h-full object-contain transform group-hover:scale-105 transition-transform"
                      />
                      {card.isGrail && (
                        <div className="absolute top-2 left-2 font-pixel text-[8px] bg-[#E63946] text-white px-1.5 py-0.5 border border-black shadow-[2px_2px_0px_#000] flex items-center gap-1">
                          <Star className="w-2.5 h-2.5 fill-yellow-300 text-yellow-300" />
                          <span>GRAIL</span>
                        </div>
                      )}
                    </div>

                    {/* Info & Stats */}
                    <div className="mt-3 space-y-2">
                      <div>
                        <div className="font-silkscreen font-bold text-sm text-[#FFCC00] truncate">
                          {card.name}
                        </div>
                        <div className="font-retro-mono text-[11px] text-slate-300 truncate mt-0.5">
                          {card.cardNumber} • <span className="text-cyan-300 font-bold">{card.rarity}</span>
                        </div>
                      </div>

                      {/* Pixel Health / Level Bar */}
                      <div className="flex items-center justify-between bg-black/60 p-2 rounded border-2 border-black text-[10px] font-pixel text-slate-300">
                        <span className="text-emerald-400">GRADE:</span>
                        <span className="text-yellow-300">{card.condition}</span>
                      </div>

                      {/* Price & CTA Button */}
                      <div className="flex items-center justify-between pt-2 border-t-2 border-black/40">
                        <div>
                          <span className="font-pixel text-[8px] text-slate-400 block">PRICE:</span>
                          <span className="font-silkscreen font-bold text-base text-emerald-400">
                            {formatRupiah(card.price)}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleCartItem(card)}
                          className={`font-silkscreen font-bold text-xs py-2 px-3 rounded border-3 border-black shadow-[3px_3px_0px_#000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all cursor-pointer flex items-center gap-1.5 ${
                            inCart
                              ? 'bg-[#10B981] text-black shadow-[3px_3px_0px_#000]'
                              : 'bg-[#FFCC00] hover:bg-[#ffd633] text-black'
                          }`}
                        >
                          {inCart ? (
                            <>
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                              <span>IN BAG</span>
                            </>
                          ) : (
                            <>
                              <Coins className="w-3.5 h-3.5" />
                              <span>+ BAG</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              } else {
                /* ================================================== */
                /* THEME B: VENDBRO VINTAGE WARM BINDER                */
                /* ================================================== */
                return (
                  <div
                    key={card.id}
                    className={`relative p-5 rounded-2xl border-2 transition-all duration-300 flex flex-col justify-between ${
                      inCart
                        ? 'bg-[#FFFDF9] border-[#E05A47] shadow-xl ring-2 ring-[#E05A47]/30 scale-[1.01]'
                        : 'bg-[#FAF6F0] hover:bg-[#FFFFFF] border-[#D8CFC4] hover:border-[#B5A898] shadow-sm hover:shadow-md'
                    }`}
                  >
                    {/* Top Binder Slot Tabs */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-retro-mono text-[11px] font-bold text-[#7A6B58] bg-[#EFE7DC] px-2.5 py-0.5 rounded-md border border-[#D5CABE]">
                          Pocket #{card.slotNumber}
                        </span>
                        {card.isGrail && (
                          <span className="font-retro-mono text-[10px] font-bold text-[#E05A47] bg-[#FCEBE8] px-2 py-0.5 rounded-md border border-[#F5C2BA]">
                            TOP HIT
                          </span>
                        )}
                      </div>
                      <span className="font-retro-mono text-[11px] font-bold text-[#2E7D32] bg-[#EBF5ED] px-2 py-0.5 rounded-md border border-[#BDE0C4]">
                        AVAILABLE
                      </span>
                    </div>

                    {/* Card inside Translucent Binder Sleeve */}
                    <div className="relative aspect-[63/88] w-full max-w-[210px] mx-auto rounded-xl overflow-hidden bg-[#262422] p-1.5 shadow-md binder-pocket group">
                      <img
                        src={card.imageUrl}
                        alt={card.name}
                        className="w-full h-full object-contain rounded-lg group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    {/* Metadata & Pricing */}
                    <div className="mt-4 space-y-2">
                      <div>
                        <h3 className="font-extrabold text-sm text-[#1F2937] truncate">
                          {card.name}
                        </h3>
                        <p className="font-retro-mono text-xs text-[#7A6B58] truncate">
                          {card.setName} • <span className="text-[#B45309] font-bold">{card.cardNumber}</span>
                        </p>
                      </div>

                      <div className="pt-2 border-t border-[#EAE3D8] flex items-center justify-between">
                        <div>
                          <span className="font-retro-mono text-[10px] text-[#8C7E6D] uppercase block">
                            {card.condition}
                          </span>
                          <span className="font-extrabold text-base text-[#111827]">
                            {formatRupiah(card.price)}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleCartItem(card)}
                          className={`font-retro-mono text-xs font-bold py-2 px-3.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                            inCart
                              ? 'bg-[#2E7D32] text-white'
                              : 'bg-[#1E293B] hover:bg-[#334155] text-white'
                          }`}
                        >
                          {inCart ? (
                            <>
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                              <span>Dipilih</span>
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
              }
            })}
          </div>
        </main>

        {/* ======================================================== */}
        {/* FLOATING CART / ITEM BAG                                 */}
        {/* ======================================================== */}
        {cartItems.length > 0 && (
          <div className="fixed bottom-6 inset-x-4 max-w-lg mx-auto z-40 animate-in slide-in-from-bottom duration-300">
            <div
              className={`p-4 transition-all flex items-center justify-between gap-3 ${
                theme === '8bit'
                  ? 'bg-[#2a2e45] border-4 border-black rounded-2xl shadow-[6px_6px_0px_#000] text-white'
                  : 'bg-[#FAF6F0] border-2 border-[#D8CFC4] rounded-2xl shadow-2xl text-[#212121]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 flex items-center justify-center font-bold ${
                    theme === '8bit'
                      ? 'bg-[#FFCC00] text-black border-3 border-black shadow-[2px_2px_0px_#000] rounded-xl'
                      : 'bg-[#1E293B] text-white rounded-xl shadow-md'
                  }`}
                >
                  {theme === '8bit' ? <Gamepad2 className="w-6 h-6" /> : <ShoppingBag className="w-5 h-5 text-[#FACC15]" />}
                </div>
                <div>
                  <div
                    className={`text-xs ${
                      theme === '8bit' ? 'font-pixel text-[#FFCC00]' : 'font-retro-mono font-bold text-[#E05A47]'
                    }`}
                  >
                    {cartItems.length} {theme === '8bit' ? 'ITEMS SELECTED' : 'Kartu Dipilih'}
                  </div>
                  <div className={`text-base font-black ${theme === '8bit' ? 'font-silkscreen' : 'font-sans'}`}>
                    TOTAL: {formatRupiah(cartTotal)}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className={`py-2.5 px-4 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  theme === '8bit'
                    ? 'font-silkscreen bg-[#E63946] text-white border-3 border-black shadow-[3px_3px_0px_#000] active:translate-x-1 active:translate-y-1 active:shadow-none'
                    : 'font-retro-mono bg-[#E05A47] hover:bg-[#C94735] text-white rounded-xl shadow-md'
                }`}
              >
                <span>{theme === '8bit' ? 'CHECKOUT ▶' : 'Lihat Pesanan'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* CHECKOUT MODAL                                           */}
        {/* ======================================================== */}
        {isCartOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4">
            <div
              className={`w-full max-w-md p-6 max-h-[85vh] flex flex-col justify-between ${
                theme === '8bit'
                  ? 'bg-[#2a2e45] border-4 border-black rounded-2xl shadow-[8px_8px_0px_#000] text-white'
                  : 'bg-[#FAF6F0] border-2 border-[#D8CFC4] rounded-3xl shadow-2xl text-[#212121]'
              }`}
            >
              {/* Header */}
              <div
                className={`flex items-center justify-between pb-3 border-b-2 ${
                  theme === '8bit' ? 'border-black' : 'border-[#EAE3D8]'
                }`}
              >
                <div>
                  <h3
                    className={`text-lg font-bold ${
                      theme === '8bit' ? 'font-silkscreen text-[#FFCC00]' : 'font-extrabold text-[#111827]'
                    }`}
                  >
                    {theme === '8bit' ? '🎒 INVENTORY CHECKOUT' : '📋 Pesanan Langsung ke Meja'}
                  </h3>
                  <p
                    className={`text-xs ${
                      theme === '8bit' ? 'font-retro-mono text-slate-300' : 'font-sans text-[#7A6B58]'
                    }`}
                  >
                    Kirim ke penjual tanpa perlu WhatsApp
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  className="p-1 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {orderSubmitted ? (
                /* Success View */
                <div className="py-8 text-center space-y-4">
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${
                      theme === '8bit'
                        ? 'bg-[#10B981] border-4 border-black text-black shadow-[4px_4px_0px_#000]'
                        : 'bg-[#EBF5ED] border-2 border-[#2E7D32] text-[#2E7D32]'
                    }`}
                  >
                    <Check className="w-8 h-8 stroke-[3]" />
                  </div>
                  <div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 uppercase ${
                        theme === '8bit'
                          ? 'font-pixel bg-[#FFCC00] text-black border border-black'
                          : 'font-retro-mono bg-[#EBF5ED] text-[#2E7D32] rounded'
                      }`}
                    >
                      ORDER SENT TO SELLER!
                    </span>
                    <h4
                      className={`text-3xl font-black mt-2 ${
                        theme === '8bit' ? 'font-silkscreen text-[#FFCC00]' : 'font-extrabold text-[#111827]'
                      }`}
                    >
                      #ORD-204
                    </h4>
                    <p
                      className={`text-xs font-bold mt-1 ${
                        theme === '8bit' ? 'font-retro-mono text-cyan-300' : 'font-sans text-[#7A6B58]'
                      }`}
                    >
                      Atas Nama: <strong className="text-white">{buyerName}</strong>
                    </p>
                  </div>

                  <p
                    className={`p-3 text-xs leading-relaxed ${
                      theme === '8bit'
                        ? 'font-retro-mono bg-black/60 border-2 border-black rounded text-amber-200'
                        : 'bg-[#F2ECE1] border border-[#DDD3C4] rounded-xl text-[#524435]'
                    }`}
                  >
                    Silakan dekati kasir di <strong>Table #A-14</strong> dan sebutkan nama <strong>&quot;{buyerName}&quot;</strong> untuk ambil kartu & bayar!
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      setOrderSubmitted(false);
                      setCartItems([]);
                      setIsCartOpen(false);
                    }}
                    className={`w-full py-3 text-xs font-bold transition-all cursor-pointer ${
                      theme === '8bit'
                        ? 'font-silkscreen bg-[#E63946] text-white border-3 border-black shadow-[3px_3px_0px_#000]'
                        : 'font-retro-mono bg-[#1E293B] text-white rounded-xl'
                    }`}
                  >
                    Selesai & Belanja Lagi
                  </button>
                </div>
              ) : (
                /* Item list & Name input */
                <>
                  <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
                    {cartItems.map((item) => (
                      <div
                        key={item.id}
                        className={`p-3 flex items-center justify-between gap-3 ${
                          theme === '8bit'
                            ? 'bg-black/50 border-2 border-black rounded'
                            : 'bg-[#FFFDF9] border border-[#EAE3D8] rounded-xl'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={item.imageUrl}
                            alt=""
                            className="w-10 h-14 object-contain rounded bg-black"
                          />
                          <div className="min-w-0">
                            <div
                              className={`text-xs font-bold truncate ${
                                theme === '8bit' ? 'font-silkscreen text-white' : 'font-sans text-[#1F2937]'
                              }`}
                            >
                              {item.name}
                            </div>
                            <div
                              className={`text-[10px] ${
                                theme === '8bit' ? 'font-retro-mono text-cyan-300' : 'font-retro-mono text-[#8C7E6D]'
                              }`}
                            >
                              Slot #{item.slotNumber} • {item.condition}
                            </div>
                            <div className="text-xs font-black text-emerald-500 mt-0.5">
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
                      <label
                        className={`block text-xs font-bold mb-1.5 ${
                          theme === '8bit' ? 'font-pixel text-[9px] text-[#FFCC00]' : 'font-retro-mono text-[#4A3E31]'
                        }`}
                      >
                        NAMA PEMBELI (UNTUK DIPANGGIL DI MEJA) *
                      </label>
                      <input
                        type="text"
                        value={buyerName}
                        onChange={(e) => setBuyerName(e.target.value)}
                        placeholder="Contoh: Ash / Budi"
                        className={`w-full px-3.5 py-2.5 text-xs font-bold ${
                          theme === '8bit'
                            ? 'font-retro-mono bg-black border-2 border-black text-white focus:outline-none focus:border-[#FFCC00]'
                            : 'bg-white border border-[#D5CABE] text-[#111827] rounded-xl focus:outline-none focus:border-[#E05A47]'
                        }`}
                      />
                    </div>
                  </div>

                  <div
                    className={`pt-4 border-t-2 space-y-3 ${
                      theme === '8bit' ? 'border-black' : 'border-[#EAE3D8]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs ${theme === '8bit' ? 'font-pixel text-[9px]' : 'font-retro-mono text-[#7A6B58]'}`}>
                        TOTAL AMOUNT:
                      </span>
                      <span
                        className={`text-lg font-black ${
                          theme === '8bit' ? 'font-silkscreen text-emerald-400' : 'text-[#111827]'
                        }`}
                      >
                        {formatRupiah(cartTotal)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setOrderSubmitted(true)}
                      className={`w-full py-3 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        theme === '8bit'
                          ? 'font-silkscreen bg-[#E63946] text-white border-3 border-black shadow-[4px_4px_0px_#000] active:translate-x-1 active:translate-y-1 active:shadow-none'
                          : 'font-retro-mono bg-[#E05A47] hover:bg-[#C94735] text-white rounded-xl shadow-md'
                      }`}
                    >
                      <Send className="w-4 h-4" />
                      <span>{theme === '8bit' ? 'TRANSMIT ORDER ▶' : 'Kirim Pesanan ke Penjual'}</span>
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
