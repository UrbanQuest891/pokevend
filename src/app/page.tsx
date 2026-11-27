'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Smartphone,
  Store,
  Zap,
  Wifi,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  CheckCircle2,
  Layers,
  Tag,
  QrCode,
  ExternalLink,
  Plus,
  Minus,
  RefreshCw,
  Eye,
  X,
  ChevronRight,
  BookOpen,
  DollarSign,
  Heart,
  Flame,
} from 'lucide-react';
import { formatCurrency } from '@/lib/qr';

// Demo sample cards for the interactive smartphone sneak peek
const SNEAK_PEEK_CARDS = [
  {
    slot: 1,
    id: 'peek-1',
    name: 'Umbreon VMAX "Moonbreon"',
    cardNumber: '#215/203',
    setName: 'Evolving Skies',
    rarity: 'Secret Alt Art',
    condition: 'PSA 10 Gem Mint',
    price: 15500000,
    originalPrice: 16500000,
    imageUrl: 'https://images.pokemontcg.io/swsh7/215_hires.png',
    badge: 'Grail Hit',
  },
  {
    slot: 2,
    id: 'peek-2',
    name: 'Rayquaza VMAX Alt Art',
    cardNumber: '#218/203',
    setName: 'Evolving Skies',
    rarity: 'Secret Alt Art',
    condition: 'Raw - NM',
    price: 6800000,
    originalPrice: 7200000,
    imageUrl: 'https://images.pokemontcg.io/swsh7/218_hires.png',
    badge: 'Popular',
  },
  {
    slot: 3,
    id: 'peek-3',
    name: 'Pikachu & Zekrom-GX',
    cardNumber: '#054/150',
    setName: 'Shining Synergy',
    rarity: 'Double Rare (RR)',
    condition: 'Raw - Mint',
    price: 175000,
    originalPrice: 200000,
    imageUrl: '/api/proxy-image?url=https%3A%2F%2Fstatic.tcgcollector.com%2Fcontent%2Fimages%2Fd7%2F4f%2F63%2Fd74f63b7202f1cb1e8dbe3c5016f79007f3a0120bda8240173eb2c3a0df066d2.webp',
    badge: 'Hot Deal',
  },
  {
    slot: 4,
    id: 'peek-4',
    name: 'Pikachu Grey Felt Hat',
    cardNumber: '#085/102',
    setName: 'SVP Black Star',
    rarity: 'Promo Sealed',
    condition: 'Sealed - Mint',
    price: 1850000,
    originalPrice: 2000000,
    imageUrl: 'https://images.pokemontcg.io/svp/85_hires.png',
    badge: 'Van Gogh Promo',
  },
  {
    slot: 5,
    id: 'peek-5',
    name: 'Charizard ex Special Art',
    cardNumber: '#349/190',
    setName: 'Shiny Treasure ex',
    rarity: 'SAR',
    condition: 'Raw - NM/M',
    price: 2400000,
    originalPrice: 2600000,
    imageUrl: 'https://images.pokemontcg.io/sv4a/349_hires.png',
    badge: 'Fan Favorite',
  },
  {
    slot: 6,
    id: 'peek-6',
    name: 'Monkey D. Luffy Manga Rare',
    cardNumber: '#OP05-119',
    setName: 'Awakening of New Era',
    rarity: 'Manga Alt Art',
    condition: 'Graded - BGS 10',
    price: 32000000,
    originalPrice: 35000000,
    imageUrl: 'https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/one-piece/OP05/OP05-119_p1.webp',
    badge: 'Holy Grail',
  },
];

export default function LandingPage() {
  // Interactive Sneak Peek simulator state
  const [selectedCards, setSelectedCards] = useState<string[]>(['peek-1']);
  const [showDemoCart, setShowDemoCart] = useState(false);
  const [demoBuyerName, setDemoBuyerName] = useState('Rian (Meja Depan)');
  const [activeTab, setActiveTab] = useState<'all' | 'grail' | 'promo'>('all');
  const [demoOrderSent, setDemoOrderSent] = useState(false);

  const toggleCardInDemoCart = (id: string) => {
    setSelectedCards((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const demoCartItems = SNEAK_PEEK_CARDS.filter((c) => selectedCards.includes(c.id));
  const demoCartTotal = demoCartItems.reduce((acc, c) => acc + c.price, 0);

  const handleSendDemoOrder = () => {
    setDemoOrderSent(true);
    setTimeout(() => {
      setDemoOrderSent(false);
      setShowDemoCart(false);
    }, 2800);
  };

  return (
    <div
      className="min-h-screen bg-[#F5EFE6] text-[#1E293B] relative overflow-hidden select-none font-clean"
      style={{
        backgroundImage: 'radial-gradient(#E2D9CC 0.85px, transparent 0.85px)',
        backgroundSize: '20px 20px',
      }}
    >
      {/* 1. Header / Navbar */}
      <header className="sticky top-0 z-50 bg-[#FAF6F0]/95 backdrop-blur-md border-b-2 border-[#E5DACB] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Brand Logo */}
            <a href="/" className="flex items-center gap-2.5 sm:gap-3 group">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#E05A47] p-0.5 shadow-sm group-hover:scale-105 transition-transform flex items-center justify-center border border-black/10">
                <div className="w-full h-full bg-[#FAF6F0] rounded-[14px] flex items-center justify-center relative overflow-hidden">
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
                  <span className="font-pixelify font-bold text-xl sm:text-2xl tracking-tight text-[#1E293B]">
                    PokéVend
                  </span>
                  <span className="hidden sm:inline-block font-pixelify text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#EAE3D8] text-[#7A6B58] border border-[#D5CABE]">
                    TCG Smart Vending
                  </span>
                </div>
                <p className="text-[11px] text-[#7A6B58] font-medium hidden sm:block">
                  Katalog Binder Digital & Kasir Meja Event
                </p>
              </div>
            </a>

            {/* Quick Navigation Links */}
            <nav className="hidden md:flex items-center gap-6 text-xs sm:text-sm font-pixelify font-bold text-[#7A6B58]">
              <a href="#kemampuan" className="hover:text-[#E05A47] transition-colors">
                Kemampuan
              </a>
              <a href="#sneak-peek" className="hover:text-[#E05A47] transition-colors">
                Sneak Peek Pembeli
              </a>
              <a href="#alur-kerja" className="hover:text-[#E05A47] transition-colors">
                Alur Meja
              </a>
              <a href="#fitur-kasir" className="hover:text-[#E05A47] transition-colors">
                Sisi Kasir
              </a>
            </nav>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 sm:gap-3">
              <a
                href="/b"
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-pixelify font-bold bg-[#FAF6F0] border-2 border-[#D5CABE] text-[#1E293B] hover:bg-white hover:border-[#E05A47] transition-all shadow-2xs"
                title="Buka Demo Rak Multi-Binder Pembeli"
              >
                <Smartphone className="w-4 h-4 text-[#E05A47]" />
                <span>Demo Pembeli</span>
              </a>

              <a
                href="/login"
                className="flex items-center gap-2 px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-pixelify font-bold bg-[#E05A47] text-white hover:bg-[#D04936] transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98] border border-black/10"
              >
                <Store className="w-4 h-4" />
                <span>Buka Seller Hub</span>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative pt-12 pb-16 sm:pt-20 sm:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          {/* Eyebrow Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FAF6F0] border-2 border-[#D5CABE] text-xs font-pixelify font-bold text-[#E05A47] shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#E05A47] animate-pulse"></span>
            <span>KATALOG BINDER & KASIR MEJA EVENT TCG</span>
          </div>

          {/* Main Headline */}
          <h1 className="font-pixelify text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#1E293B] leading-tight sm:leading-none">
            Buka Binder di Meja Event Tanpa Takut Kartu Rusak & <span className="text-[#E05A47]">Ribet Bikin Nota</span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-[#5A4B3C] font-normal leading-relaxed max-w-2xl mx-auto">
            Katalog binder digital yang dibuka pembeli dari HP lewat scan QR. Pembeli bisa pesan kartu mandiri di tempat tanpa perlu chat WA, dan Anda tinggal terima pesanan serta atur harga nego langsung di kasir.
          </p>

          {/* Key Value Proposition Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 pt-2 text-xs font-pixelify font-bold">
            <span className="px-3 py-1.5 rounded-xl bg-white border border-[#D5CABE] text-[#1E293B] flex items-center gap-1.5 shadow-2xs">
              <Wifi className="w-3.5 h-3.5 text-emerald-600" /> Tetap Lancar saat Sinyal Lemah
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-white border border-[#D5CABE] text-[#1E293B] flex items-center gap-1.5 shadow-2xs">
              <ShoppingBag className="w-3.5 h-3.5 text-[#E05A47]" /> Pesan Mandiri Tanpa Chat WA
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-white border border-[#D5CABE] text-[#1E293B] flex items-center gap-1.5 shadow-2xs">
              <TrendingUp className="w-3.5 h-3.5 text-blue-600" /> Atur Harga Nego di Kasir
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-white border border-[#D5CABE] text-[#1E293B] flex items-center gap-1.5 shadow-2xs">
              <Zap className="w-3.5 h-3.5 text-amber-600" /> Otomatis Masuk Buku Kas
            </span>
          </div>

          {/* Hero CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
            <a
              href="#sneak-peek"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[#E05A47] text-white font-pixelify font-bold text-sm sm:text-base hover:bg-[#D04936] transition-all shadow-md hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 border border-black/10"
            >
              <Smartphone className="w-5 h-5" />
              <span>Coba Tampilan Pembeli</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </a>

            <a
              href="/login"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[#FAF6F0] text-[#1E293B] font-pixelify font-bold text-sm sm:text-base border-2 border-[#D5CABE] hover:bg-white hover:border-[#1E293B] transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <Store className="w-5 h-5 text-[#E05A47]" />
              <span>Masuk ke Kasir Seller</span>
            </a>
          </div>
        </div>
      </section>

      {/* 3. Interactive Sneak Peek Showcase (Highlight Halaman Pembeli) */}
      <section id="sneak-peek" className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-20">
        <div className="bg-[#FAF6F0] border-2 border-[#D5CABE] rounded-3xl p-6 sm:p-10 shadow-sm relative overflow-hidden">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAE3D8] border border-[#D5CABE] text-xs font-pixelify font-bold text-[#7A6B58]">
              <Eye className="w-3.5 h-3.5 text-[#E05A47]" />
              <span>SIMULASI PEMBELI</span>
            </div>
            <h2 className="font-pixelify text-2xl sm:text-4xl font-bold text-[#1E293B]">
              Katalog Digital di HP Pembeli
            </h2>
            <p className="text-sm sm:text-base text-[#7A6B58] font-medium">
              Coba klik kartu di bawah seolah-olah Anda pembeli yang lagi berdiri di depan meja stand:
            </p>
          </div>

          {/* Interactive Mobile Device Simulator & Feature Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-center">
            {/* Left Column: Interactive Phone Mockup */}
            <div className="lg:col-span-7 flex justify-center">
              <div className="w-full max-w-[390px] bg-[#1E293B] p-3 sm:p-4 rounded-[42px] shadow-2xl border-4 border-[#334155] relative">
                {/* Phone Speaker Notch */}
                <div className="w-32 h-5 bg-[#0F172A] rounded-full mx-auto mb-3 flex items-center justify-center relative">
                  <div className="w-3 h-3 rounded-full bg-[#1E293B] mr-2"></div>
                  <div className="w-10 h-1 bg-[#334155] rounded-full"></div>
                </div>

                {/* Inner Screen Area */}
                <div
                  className="bg-[#F5EFE6] rounded-[32px] overflow-hidden border border-[#D5CABE] p-3 sm:p-4 relative select-none font-clean"
                  style={{
                    backgroundImage: 'radial-gradient(#E2D9CC 0.85px, transparent 0.85px)',
                    backgroundSize: '16px 16px',
                    minHeight: '520px',
                    maxHeight: '560px',
                    overflowY: 'auto',
                  }}
                >
                  {/* Mini Mobile Top Header */}
                  <div className="bg-[#FAF6F0] border-b-2 border-[#E5DACB] -mx-3 -mt-3 sm:-mx-4 sm:-mt-4 p-3 mb-3 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-[#E05A47] flex items-center justify-center text-white font-pixelify font-bold text-xs">
                        PV
                      </div>
                      <div className="leading-tight">
                        <div className="font-pixelify text-xs font-bold text-[#1E293B]">
                          🔥 Grail Hits Binder
                        </div>
                        <div className="text-[10px] text-[#7A6B58]">Table #A-14 • Jakarta</div>
                      </div>
                    </div>

                    {/* Mini Cart Button */}
                    <button
                      onClick={() => setShowDemoCart(!showDemoCart)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#E05A47] text-white font-pixelify text-[11px] font-bold shadow-xs hover:bg-[#D04936] transition-colors cursor-pointer"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>{selectedCards.length}</span>
                    </button>
                  </div>

                  {/* Banner Info */}
                  <div className="mb-3 px-2.5 py-1.5 rounded-xl bg-[#FAF6F0] border border-[#D5CABE] text-[10px] font-pixelify text-[#7A6B58] flex items-center justify-between">
                    <span>⚡ Mode: Flip Binder 9-Pocket</span>
                    <span className="text-[#2E7D32] font-bold">● Sinyal Stabil</span>
                  </div>

                  {/* 2x3 Pocket Grid (Simulating 9-Pocket on Mobile) */}
                  <div className="grid grid-cols-2 gap-2.5">
                    {SNEAK_PEEK_CARDS.map((card) => {
                      const isSelected = selectedCards.includes(card.id);
                      return (
                        <div
                          key={card.id}
                          onClick={() => toggleCardInDemoCart(card.id)}
                          className={`bg-[#FAF6F0] rounded-2xl p-2 border-2 transition-all cursor-pointer relative group flex flex-col justify-between ${
                            isSelected
                              ? 'border-[#E05A47] ring-2 ring-[#E05A47]/30 shadow-md'
                              : 'border-[#D5CABE] hover:border-[#1E293B]'
                          }`}
                        >
                          {/* Slot Tag & Badge */}
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-pixelify text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-[#EAE3D8] text-[#7A6B58]">
                              SLOT #{card.slot.toString().padStart(2, '0')}
                            </span>
                            <span className="font-pixelify text-[8px] font-bold text-[#E05A47]">
                              {card.badge}
                            </span>
                          </div>

                          {/* Card Image with Pocket Reflection */}
                          <div className="relative aspect-[2.5/3.5] bg-[#EAE3D8] rounded-xl overflow-hidden mb-2 border border-black/5 flex items-center justify-center">
                            {/* Reflection Glaze */}
                            <div className="absolute inset-0 pocket-reflection z-10 pointer-events-none opacity-40"></div>

                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={card.imageUrl}
                              alt={card.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              loading="lazy"
                            />

                            {/* Selected Checkmark Overlay */}
                            {isSelected && (
                              <div className="absolute inset-0 bg-[#E05A47]/20 backdrop-blur-[1px] flex items-center justify-center z-15">
                                <div className="w-7 h-7 rounded-full bg-[#E05A47] text-white flex items-center justify-center shadow-md">
                                  <CheckCircle2 className="w-4 h-4" />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Card Title & Condition */}
                          <div className="space-y-0.5 mb-1.5">
                            <div className="font-pixelify text-[10px] font-bold text-[#1E293B] truncate">
                              {card.name}
                            </div>
                            <div className="text-[9px] text-[#7A6B58] font-medium flex items-center justify-between">
                              <span className="truncate">{card.cardNumber}</span>
                              <span className="px-1 py-0.2 bg-[#EAE3D8] rounded text-[8px] font-bold text-[#1E293B]">
                                {card.condition.split(' ')[0]}
                              </span>
                            </div>
                          </div>

                          {/* Price & Add Button */}
                          <div className="pt-1 border-t border-[#EAE3D8] flex items-center justify-between">
                            <div className="font-pixelify text-[10px] font-bold text-[#1E293B]">
                              {formatCurrency(card.price, 'IDR')}
                            </div>
                            <button
                              type="button"
                              className={`w-5 h-5 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${
                                isSelected
                                  ? 'bg-[#E05A47] text-white'
                                  : 'bg-[#EAE3D8] text-[#1E293B] hover:bg-[#E05A47] hover:text-white'
                              }`}
                            >
                              {isSelected ? '✓' : '+'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Interactive Mini Cart Drawer Overlay (Inside Phone) */}
                  {showDemoCart && (
                    <div className="absolute inset-x-0 bottom-0 top-12 bg-[#FAF6F0] z-30 border-t-2 border-[#D5CABE] p-3 flex flex-col justify-between shadow-xl animate-in slide-in-from-bottom duration-200">
                      <div>
                        {/* Drawer Header */}
                        <div className="flex items-center justify-between pb-2 border-b border-[#EAE3D8] mb-2">
                          <div className="font-pixelify text-xs font-bold text-[#1E293B] flex items-center gap-1.5">
                            <ShoppingBag className="w-3.5 h-3.5 text-[#E05A47]" />
                            <span>Keranjang Saya ({demoCartItems.length})</span>
                          </div>
                          <button
                            onClick={() => setShowDemoCart(false)}
                            className="p-1 rounded-lg hover:bg-[#EAE3D8] text-[#7A6B58] text-xs cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Selected Items List */}
                        {demoCartItems.length === 0 ? (
                          <div className="text-center py-8 text-xs font-pixelify text-[#7A6B58]">
                            Keranjang kosong.<br />Pilih kartu dari binder di atas!
                          </div>
                        ) : (
                          <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                            {demoCartItems.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#D5CABE] text-[10px]"
                              >
                                <div className="truncate pr-2">
                                  <div className="font-pixelify font-bold text-[#1E293B] truncate">
                                    Slot #{item.slot}: {item.name}
                                  </div>
                                  <div className="text-[#7A6B58] text-[9px]">{item.condition}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-pixelify font-bold text-[#1E293B] whitespace-nowrap">
                                    {formatCurrency(item.price, 'IDR')}
                                  </span>
                                  <button
                                    onClick={() => toggleCardInDemoCart(item.id)}
                                    className="text-red-500 hover:text-red-700 cursor-pointer p-0.5"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Buyer Name Input (No WhatsApp Needed) */}
                        <div className="mt-3 p-2 bg-white rounded-xl border border-[#D5CABE] space-y-1">
                          <label className="font-pixelify text-[10px] font-bold text-[#7A6B58] block">
                            Nama Pembeli (Di Meja Stand):
                          </label>
                          <input
                            type="text"
                            value={demoBuyerName}
                            onChange={(e) => setDemoBuyerName(e.target.value)}
                            className="w-full text-xs font-bold text-[#1E293B] bg-transparent focus:outline-none"
                            placeholder="Contoh: Rian (Kemeja Putih)"
                          />
                        </div>
                      </div>

                      {/* Checkout Total & Send Order Action */}
                      <div className="pt-2 border-t border-[#EAE3D8]">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-pixelify text-xs text-[#7A6B58]">Total Harga:</span>
                          <span className="font-pixelify text-xs sm:text-sm font-bold text-[#1E293B]">
                            {formatCurrency(demoCartTotal, 'IDR')}
                          </span>
                        </div>

                        {demoOrderSent ? (
                          <div className="py-2 px-3 rounded-xl bg-emerald-600 text-white font-pixelify text-xs font-bold text-center flex items-center justify-center gap-1.5 animate-in fade-in">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Pesanan #ORD-892 Terkirim ke Kasir!</span>
                          </div>
                        ) : (
                          <button
                            onClick={handleSendDemoOrder}
                            disabled={demoCartItems.length === 0}
                            className="w-full py-2.5 rounded-xl bg-[#2E7D32] hover:bg-[#256628] disabled:opacity-50 text-white font-pixelify text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            <span>Kirim Pesanan Langsung ke Penjual</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Phone Bottom Floating Cart Bar */}
                  {!showDemoCart && (
                    <div className="sticky bottom-0 -mx-3 -mb-3 sm:-mx-4 sm:-mt-4 p-2.5 bg-[#FAF6F0]/95 backdrop-blur-xs border-t-2 border-[#E5DACB] flex items-center justify-between z-10">
                      <div>
                        <div className="text-[9px] text-[#7A6B58]">Terpilih: {demoCartItems.length} Kartu</div>
                        <div className="font-pixelify text-xs font-bold text-[#1E293B]">
                          {formatCurrency(demoCartTotal, 'IDR')}
                        </div>
                      </div>
                      <button
                        onClick={() => setShowDemoCart(true)}
                        className="px-3 py-1.5 rounded-xl bg-[#E05A47] text-white font-pixelify text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer hover:bg-[#D04936]"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Lihat Keranjang</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Key User View Explanations */}
            <div className="lg:col-span-5 space-y-6">
              <div className="space-y-2">
                <span className="font-pixelify text-xs font-bold text-[#E05A47] uppercase tracking-wider">
                  KENAPA PEMBELI NYAMAN?
                </span>
                <h3 className="font-pixelify text-2xl sm:text-3xl font-bold text-[#1E293B]">
                  Bebas Antre, Kartu di Binder Fisik Tetap Aman
                </h3>
                <p className="text-sm text-[#7A6B58] leading-relaxed">
                  Pembeli nggak perlu antre berdesakan membolak-balik binder fisik yang rawan lecek. Cukup scan QR di meja, pembeli langsung bisa:
                </p>
              </div>

              {/* 3 Sneak Peek Features */}
              <div className="space-y-4">
                <div className="flex gap-3.5 items-start p-3.5 rounded-2xl bg-white border border-[#D5CABE] shadow-2xs">
                  <div className="w-9 h-9 rounded-xl bg-[#FAF6F0] border border-[#D5CABE] flex items-center justify-center shrink-0 text-[#E05A47]">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-pixelify text-sm font-bold text-[#1E293B]">
                      Nomor Slot Sesuai Posisi Binder Meja
                    </h4>
                    <p className="text-xs text-[#7A6B58] mt-0.5">
                      Nomor slot di web sama persis dengan posisi kartu di binder fisik (misal: Slot #01, #02). Penjual tinggal tarik kartu yang diminta tanpa repot mencari lagi.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3.5 items-start p-3.5 rounded-2xl bg-white border border-[#D5CABE] shadow-2xs">
                  <div className="w-9 h-9 rounded-xl bg-[#FAF6F0] border border-[#D5CABE] flex items-center justify-center shrink-0 text-[#2E7D32]">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-pixelify text-sm font-bold text-[#1E293B]">
                      Pesan Langsung Tanpa Buka WhatsApp
                    </h4>
                    <p className="text-xs text-[#7A6B58] mt-0.5">
                      Nggak perlu simpan nomor baru atau kirim screenshot foto kartu. Pembeli cukup masukkan nama panggilan, dan pesanan langsung bunyi di layar kasir.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3.5 items-start p-3.5 rounded-2xl bg-white border border-[#D5CABE] shadow-2xs">
                  <div className="w-9 h-9 rounded-xl bg-[#FAF6F0] border border-[#D5CABE] flex items-center justify-center shrink-0 text-blue-600">
                    <Wifi className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-pixelify text-sm font-bold text-[#1E293B]">
                      Tetap Cepat saat Sinyal Lemah
                    </h4>
                    <p className="text-xs text-[#7A6B58] mt-0.5">
                      Semua aset dan gambar kartu dikompres seringan mungkin, jadi halaman tetap terbuka lancar walau sinyal di dalam venue mall lagi jelek.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Link to Full Buyer View */}
              <div className="pt-2">
                <a
                  href="/b"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#E05A47] text-white font-pixelify font-bold text-xs sm:text-sm hover:bg-[#D04936] transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98] border border-black/10"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Buka Rak Meja Pembeli (Full Screen)</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Core Capabilities Section (Kemampuan Website Kita) */}
      <section id="kemampuan" className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-20">
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF6F0] border border-[#D5CABE] text-xs font-pixelify font-bold text-[#E05A47]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>FITUR MEJA STAND</span>
          </div>
          <h2 className="font-pixelify text-2xl sm:text-4xl lg:text-5xl font-bold text-[#1E293B]">
            Dibuat untuk Masalah Nyata di Meja Event
          </h2>
          <p className="text-sm sm:text-base text-[#7A6B58] font-medium max-w-2xl mx-auto">
            Bukan sekadar etalase online biasa, tapi alat bantu jualan saat antrean meja bazaar lagi ramai-ramainya.
          </p>
        </div>

        {/* 5 Core Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: Low-Signal Optimization */}
          <div className="bg-[#FAF6F0] border-2 border-[#D5CABE] rounded-3xl p-6 shadow-2xs hover:shadow-md transition-shadow space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-white border border-[#D5CABE] flex items-center justify-center text-emerald-600 shadow-2xs">
              <Wifi className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <span className="font-pixelify text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                SINYAL VENUE
              </span>
              <h3 className="font-pixelify text-lg sm:text-xl font-bold text-[#1E293B]">
                1. Tetap Ringan saat Sinyal Ngedrop
              </h3>
              <p className="text-xs sm:text-sm text-[#7A6B58] leading-relaxed">
                Basement mall atau hall pameran sering susah sinyal. Halaman web dibuat seringan mungkin dengan kompresi gambar otomatis, jadi pembeli tetap bisa buka katalog tanpa lemot.
              </p>
            </div>
          </div>

          {/* Card 2: In-App Cart No WhatsApp */}
          <div className="bg-[#FAF6F0] border-2 border-[#D5CABE] rounded-3xl p-6 shadow-2xs hover:shadow-md transition-shadow space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-white border border-[#D5CABE] flex items-center justify-center text-[#E05A47] shadow-2xs">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <span className="font-pixelify text-[10px] font-bold text-[#E05A47] bg-red-100 px-2 py-0.5 rounded-full">
                TANPA REPOT WA
              </span>
              <h3 className="font-pixelify text-lg sm:text-xl font-bold text-[#1E293B]">
                2. Keranjang Langsung ke Kasir
              </h3>
              <p className="text-xs sm:text-sm text-[#7A6B58] leading-relaxed">
                Nggak perlu repot simpan nomor atau kirim foto kartu ke chat. Pembeli pilih kartu langsung di layar mereka, lalu nomor slot dan nama pembeli langsung muncul di kasir Anda.
              </p>
            </div>
          </div>

          {/* Card 3: Real-Time Negotiation */}
          <div className="bg-[#FAF6F0] border-2 border-[#D5CABE] rounded-3xl p-6 shadow-2xs hover:shadow-md transition-shadow space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-white border border-[#D5CABE] flex items-center justify-center text-blue-600 shadow-2xs">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <span className="font-pixelify text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                NEGO DI TEMPAT
              </span>
              <h3 className="font-pixelify text-lg sm:text-xl font-bold text-[#1E293B]">
                3. Atur Harga Deal & Diskon di Meja
              </h3>
              <p className="text-xs sm:text-sm text-[#7A6B58] leading-relaxed">
                Namanya jual beli kartu pasti ada tawar-menawar. Di kasir Anda bisa langsung ubah harga kesepakatan, hapus kartu yang batal, atau masukkan kartu bonus langsung dari binder.
              </p>
            </div>
          </div>

          {/* Card 4: Auto-Archive & Quick Restock */}
          <div className="bg-[#FAF6F0] border-2 border-[#D5CABE] rounded-3xl p-6 shadow-2xs hover:shadow-md transition-shadow space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-white border border-[#D5CABE] flex items-center justify-center text-amber-600 shadow-2xs">
              <Zap className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <span className="font-pixelify text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                OTOMATIS RAPI
              </span>
              <h3 className="font-pixelify text-lg sm:text-xl font-bold text-[#1E293B]">
                4. Slot Otomatis Terarsip ke Buku Kas
              </h3>
              <p className="text-xs sm:text-sm text-[#7A6B58] leading-relaxed">
                Begitu transaksi selesai dibayar, kartu otomatis ditandai terjual dan masuk riwayat omset. Anda bisa langsung restock slot kosong atau lewati dulu biar antrean tetap jalan.
              </p>
            </div>
          </div>

          {/* Card 5: QR Print & Stand Placard */}
          <div className="bg-[#FAF6F0] border-2 border-[#D5CABE] rounded-3xl p-6 shadow-2xs hover:shadow-md transition-shadow space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-white border border-[#D5CABE] flex items-center justify-center text-purple-600 shadow-2xs">
              <QrCode className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <span className="font-pixelify text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                SIAP CETAK
              </span>
              <h3 className="font-pixelify text-lg sm:text-xl font-bold text-[#1E293B]">
                5. Cetak QR Meja & Stiker Slot Kartu
              </h3>
              <p className="text-xs sm:text-sm text-[#7A6B58] leading-relaxed">
                Tinggal cetak satu lembar akrilik QR untuk dipajang di meja stand, plus lembar stiker QR kecil per nomor slot untuk ditempel di saku binder fisik Anda.
              </p>
            </div>
          </div>

          {/* Card 6: Multi-TCG Support */}
          <div className="bg-[#FAF6F0] border-2 border-[#D5CABE] rounded-3xl p-6 shadow-2xs hover:shadow-md transition-shadow space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-white border border-[#D5CABE] flex items-center justify-center text-rose-600 shadow-2xs">
              <Layers className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <span className="font-pixelify text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                BANYAK PILIHAN TCG
              </span>
              <h3 className="font-pixelify text-lg sm:text-xl font-bold text-[#1E293B]">
                Mendukung Berbagai Game Kartu
              </h3>
              <p className="text-xs sm:text-sm text-[#7A6B58] leading-relaxed">
                Database terintegrasi untuk kartu Pokémon TCG (versi English, Japanese, Indonesian, Chinese), One Piece Card Game, sampai Riftbound.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Alur Meja Event (3 Langkah Mudah) */}
      <section id="alur-kerja" className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-20">
        <div className="bg-white border-2 border-[#D5CABE] rounded-3xl p-6 sm:p-12 shadow-sm">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF6F0] border border-[#D5CABE] text-xs font-pixelify font-bold text-[#E05A47]">
              <span>CARA KERJA</span>
            </div>
            <h2 className="font-pixelify text-2xl sm:text-4xl font-bold text-[#1E293B]">
              3 Langkah Jualan di Meja Event
            </h2>
            <p className="text-sm sm:text-base text-[#7A6B58] font-medium">
              Alur sederhana agar meja stand tetap teratur walau pengunjung sedang padat.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="space-y-4 text-center sm:text-left relative">
              <div className="w-12 h-12 rounded-2xl bg-[#FAF6F0] border-2 border-[#D5CABE] flex items-center justify-center font-pixelify text-xl font-bold text-[#E05A47] mx-auto sm:mx-0 shadow-2xs">
                1
              </div>
              <h3 className="font-pixelify text-lg sm:text-xl font-bold text-[#1E293B]">
                Pajang QR di Meja
              </h3>
              <p className="text-xs sm:text-sm text-[#7A6B58] leading-relaxed">
                Taruh akrilik QR code di atas meja booth. Binder koleksi fisik tetap aman di meja tanpa risiko lecek atau tergores kuku pengunjung.
              </p>
            </div>

            {/* Step 2 */}
            <div className="space-y-4 text-center sm:text-left relative">
              <div className="w-12 h-12 rounded-2xl bg-[#FAF6F0] border-2 border-[#D5CABE] flex items-center justify-center font-pixelify text-xl font-bold text-[#2E7D32] mx-auto sm:mx-0 shadow-2xs">
                2
              </div>
              <h3 className="font-pixelify text-lg sm:text-xl font-bold text-[#1E293B]">
                Pembeli Scan & Kirim Pilihan
              </h3>
              <p className="text-xs sm:text-sm text-[#7A6B58] leading-relaxed">
                Pembeli scan QR dari HP masing-masing, membolak-balik halaman binder digital, lalu mengirim pesanan kartu dengan nama panggilan mereka.
              </p>
            </div>

            {/* Step 3 */}
            <div className="space-y-4 text-center sm:text-left relative">
              <div className="w-12 h-12 rounded-2xl bg-[#FAF6F0] border-2 border-[#D5CABE] flex items-center justify-center font-pixelify text-xl font-bold text-blue-600 mx-auto sm:mx-0 shadow-2xs">
                3
              </div>
              <h3 className="font-pixelify text-lg sm:text-xl font-bold text-[#1E293B]">
                Kasir Terima, Nego, & Selesai
              </h3>
              <p className="text-xs sm:text-sm text-[#7A6B58] leading-relaxed">
                Pesanan muncul di layar kasir dengan suara 8-bit. Anda sepakati harga deal, terima pembayaran via QRIS atau tunai, dan kartu otomatis terarsip.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Sneak Peek Sisi Kasir / Penjual */}
      <section id="fitur-kasir" className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-20">
        <div className="bg-[#FAF6F0] border-2 border-[#D5CABE] rounded-3xl p-6 sm:p-10 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-6 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAE3D8] border border-[#D5CABE] text-xs font-pixelify font-bold text-[#E05A47]">
                <Store className="w-3.5 h-3.5" />
                <span>KONTROL PENJUAL</span>
              </div>
              <h2 className="font-pixelify text-2xl sm:text-4xl font-bold text-[#1E293B]">
                Sisi Kasir yang Praktis & Nggak Kaku
              </h2>
              <p className="text-sm text-[#7A6B58] leading-relaxed">
                Saat antrean meja lagi ramai, kasir butuh alat yang serba cepat:
              </p>

              <ul className="space-y-2.5 text-xs sm:text-sm text-[#1E293B] font-medium">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>Alert Pesanan Baru:</strong> Notifikasi langsung di layar kasir saat ada pembeli yang memesan.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>Nego Fleksibel:</strong> Bebas ubah harga deal, hapus kartu yang batal, atau tambah kartu on-the-spot.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>Restock Cepat:</strong> Mau langsung ganti kartu di slot kosong bisa, mau dilewati dulu juga bisa.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>Rekap Omset Bersih:</strong> Laporan omset event, kartu terlaris, dan jam ramai tanpa perlu rekap nota manual.</span>
                </li>
              </ul>

              <div className="pt-2 flex flex-wrap gap-3">
                <a
                  href="/login"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E05A47] text-white font-pixelify font-bold text-xs sm:text-sm shadow-sm hover:bg-[#D04936] transition-colors"
                >
                  <Store className="w-4 h-4" />
                  <span>Buka Kasir Seller</span>
                </a>
                <a
                  href="/login"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-[#D5CABE] text-[#1E293B] font-pixelify font-bold text-xs sm:text-sm shadow-2xs hover:bg-[#FAF6F0] transition-colors"
                >
                  <TrendingUp className="w-4 h-4 text-[#2E7D32]" />
                  <span>Lihat Riwayat Penjualan</span>
                </a>
              </div>
            </div>

            {/* Right Mini Graphic Mockup of Seller Modal */}
            <div className="lg:col-span-6 bg-white border-2 border-[#D5CABE] rounded-2xl p-5 shadow-md space-y-3.5 font-clean">
              {/* Fake Order Alert */}
              <div className="p-3 rounded-xl bg-[#FAF6F0] border-2 border-[#E05A47] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#E05A47] animate-pulse"></span>
                  <div>
                    <div className="font-pixelify text-xs font-bold text-[#1E293B]">
                      Pesanan Masuk #ORD-892
                    </div>
                    <div className="text-[10px] text-[#7A6B58]">
                      Pembeli: Rian (Meja Depan) • 1 Menit Lalu
                    </div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-[#E05A47] text-white font-pixelify text-[10px] font-bold">
                  Buka Nego
                </span>
              </div>

              {/* Fake Negotiation Box */}
              <div className="p-3 rounded-xl bg-[#FAF6F0] border border-[#D5CABE] space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-[#1E293B]">Moonbreon #215/203 (Slot #01)</span>
                  <span className="font-pixelify font-bold text-[#1E293B]">Rp 15.500.000</span>
                </div>
                <div className="p-2 rounded-lg bg-white border border-[#D5CABE] flex items-center justify-between">
                  <span className="text-[11px] font-pixelify text-[#7A6B58]">Harga Deal Kesepakatan:</span>
                  <span className="font-pixelify font-bold text-[#2E7D32] text-xs">Rp 15.000.000 (Diskon 500rb)</span>
                </div>
                <div className="flex gap-2 pt-1">
                  <button type="button" className="flex-1 py-1.5 rounded-lg bg-[#2E7D32] text-white font-pixelify text-[11px] font-bold text-center">
                    ✓ Finalisasi Transaksi
                  </button>
                  <button type="button" className="px-2.5 py-1.5 rounded-lg bg-[#EAE3D8] text-[#7A6B58] font-pixelify text-[11px] font-bold">
                    + Tambah Kartu
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. CTA Bottom Banner */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="bg-[#E05A47] text-white rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-xl border border-black/10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 backdrop-blur-xs text-xs font-pixelify font-bold text-white border border-white/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>SIAP UNTUK EVENT TCG BERIKUTNYA</span>
          </div>

          <h2 className="font-pixelify text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            Bikin Meja Event Anda Lebih Rapi & Profesional
          </h2>

          <p className="text-sm sm:text-base text-white/90 max-w-2xl mx-auto leading-relaxed">
            Biar binder fisik Anda nggak gampang rusak dibolak-balik pengunjung, dan Anda nggak repot bikin nota manual saat booth lagi ramai.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <a
              href="/login"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white text-[#E05A47] font-pixelify font-bold text-sm sm:text-base hover:bg-[#FAF6F0] transition-all shadow-md flex items-center justify-center gap-2"
            >
              <Store className="w-5 h-5" />
              <span>Masuk ke Kasir Seller</span>
            </a>

            <a
              href="/b"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-black/20 text-white font-pixelify font-bold text-sm sm:text-base border border-white/30 hover:bg-black/30 transition-all flex items-center justify-center gap-2"
            >
              <Smartphone className="w-5 h-5" />
              <span>Lihat Contoh Rak Pembeli</span>
            </a>
          </div>
        </div>
      </section>

      {/* 8. Footer */}
      <footer className="bg-[#FAF6F0] border-t-2 border-[#E5DACB] py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#E05A47] p-0.5 flex items-center justify-center">
              <div className="w-full h-full bg-[#FAF6F0] rounded-[10px] flex items-center justify-center relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-1/2 bg-[#E05A47]"></div>
                <div className="absolute bottom-0 inset-x-0 h-1/2 bg-white"></div>
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 bg-[#1E293B]"></div>
              </div>
            </div>
            <div>
              <div className="font-pixelify font-bold text-base text-[#1E293B]">PokéVend</div>
              <div className="text-[11px] text-[#7A6B58]">
                Katalog Binder & Kasir Meja untuk Komunitas TCG
              </div>
            </div>
          </div>

          <div className="flex items-center gap-5 text-xs font-pixelify font-bold text-[#7A6B58]">
            <a href="/" className="hover:text-[#1E293B] transition-colors">
              Beranda
            </a>
            <a href="/b" className="hover:text-[#1E293B] transition-colors">
              Rak Pembeli
            </a>
            <a href="/login" className="hover:text-[#1E293B] transition-colors">
              Seller Hub
            </a>
            <a href="/login" className="hover:text-[#1E293B] transition-colors">
              Riwayat Penjualan
            </a>
          </div>

          <div className="text-xs text-[#7A6B58]">
            © {new Date().getFullYear()} PokéVend. Made for Pokémon, One Piece & TCG Enthusiasts.
          </div>
        </div>
      </footer>
    </div>
  );
}
