'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Binder, PokemonCard } from '@/types';
import { formatCurrency } from '@/lib/qr';
import { formatCardImageUrl } from '@/lib/imageHelper';
import { smoothScrollToElement } from '@/lib/scrollHelper';
import { formatCardDisplayName, translateCardSet } from '@/lib/cardTranslator';
import BuyerCartDrawer, { CartItem } from '@/components/BuyerCartDrawer';
import CardImageLightbox from '@/components/CardImageLightbox';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Check,
  Sparkles,
  Layers,
  Store,
  Tag,
  ArrowRight,
  ZoomIn,
  BookOpen,
  Filter,
} from 'lucide-react';

export default function BuyerBinderPage() {
  const params = useParams();
  const binderId = params.id as string;

  const [binder, setBinder] = useState<Binder | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'flip' | 'grid'>('flip');
  const [currentPage, setCurrentPage] = useState(1);
  const contentTopRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [priceFilter, setPriceFilter] = useState<'all' | 'under500k' | '500k-2m' | 'above2m'>('all');
  const [hideSold, setHideSold] = useState(false);

  // Cart & detail modals
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedCardDetail, setSelectedCardDetail] = useState<{ slotNumber: number; card: PokemonCard } | null>(null);
  const [lightboxCard, setLightboxCard] = useState<{ slotNumber: number; card: PokemonCard } | null>(null);

  // Smooth scroll to top of page content on page change
  const handlePageChange = (newPage: number) => {
    if (!binder || newPage < 1 || newPage > binder.totalPages || newPage === currentPage) return;
    setCurrentPage(newPage);
    smoothScrollToElement(contentTopRef.current, 75);
  };

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    smoothScrollToElement(contentTopRef.current, 75);
  }, [currentPage]);

  useEffect(() => {
    async function loadBinder() {
      try {
        setLoading(true);
        const res = await fetch(`/api/binders/${binderId}`, { cache: 'no-store' });
        const data = await res.json();
        if (data.success) {
          setBinder(data.binder);
        }
      } catch (err) {
        console.error('Failed to load binder:', err);
      } finally {
        setLoading(false);
      }
    }
    if (binderId) loadBinder();
  }, [binderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5EFE6] text-[#1E293B] flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full border-4 border-[#E05A47] border-t-transparent animate-spin mx-auto"></div>
          <p className="font-pixelify text-sm font-bold text-[#7A6B58]">MEMBUKA BINDER DIGITAL...</p>
        </div>
      </div>
    );
  }

  if (!binder) {
    return (
      <div className="min-h-screen bg-[#F5EFE6] text-[#1E293B] flex items-center justify-center p-4">
        <div className="text-center p-6 bg-[#FAF6F0] border-2 border-[#D5CABE] rounded-3xl max-w-sm shadow-xl">
          <p className="font-pixelify text-sm font-bold text-[#1E293B]">Binder tidak ditemukan atau QR Code kadaluarsa.</p>
          <a
            href="/"
            className="mt-4 inline-block px-4 py-2 bg-[#E05A47] rounded-xl font-pixelify text-xs font-bold text-white shadow-md"
          >
            Kembali ke Beranda
          </a>
        </div>
      </div>
    );
  }

  const pocketsPerPage = binder.layoutType === '4-pocket' ? 4 : binder.layoutType === '12-pocket' ? 12 : 9;
  const startSlot = (currentPage - 1) * pocketsPerPage + 1;
  const endSlot = currentPage * pocketsPerPage;

  // Filter cards for Grid Mode
  const allCardsWithSlots = Object.entries(binder.slots || {}).map(([slotStr, card]) => ({
    slotNumber: parseInt(slotStr, 10),
    card,
  }));

  const filteredCards = allCardsWithSlots.filter(({ card }) => {
    if (hideSold && card.status === 'SOLD') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const displayName = formatCardDisplayName(card.name, card.cardNumber, card.setName, card.game).toLowerCase();
      const displaySet = translateCardSet(card.setName, card.cardNumber, card.game).toLowerCase();
      const match =
        card.name.toLowerCase().includes(q) ||
        displayName.includes(q) ||
        card.setName.toLowerCase().includes(q) ||
        displaySet.includes(q) ||
        (card.rarity && card.rarity.toLowerCase().includes(q));
      if (!match) return false;
    }
    if (priceFilter === 'under500k' && card.price >= 500000) return false;
    if (priceFilter === '500k-2m' && (card.price < 500000 || card.price > 2000000)) return false;
    if (priceFilter === 'above2m' && card.price < 2000000) return false;

    return true;
  });

  const toggleCart = (slotNumber: number, card: PokemonCard) => {
    if (card.status !== 'AVAILABLE') return;
    const exists = cartItems.some((item) => item.slotNumber === slotNumber);
    if (exists) {
      setCartItems((prev) => prev.filter((item) => item.slotNumber !== slotNumber));
    } else {
      setCartItems((prev) => [
        ...prev,
        {
          slotNumber,
          binderId: binder.id,
          binderName: binder.name,
          card,
        },
      ]);
    }
  };

  const isCardInCart = (slotNumber: number) => {
    return cartItems.some((item) => item.slotNumber === slotNumber);
  };

  return (
    <div
      className="min-h-screen bg-[#F5EFE6] text-[#1E293B] flex flex-col pb-28 font-clean selection:bg-[#E05A47] selection:text-white"
      style={{
        backgroundImage: 'radial-gradient(#E2D9CC 0.85px, transparent 0.85px)',
        backgroundSize: '20px 20px',
      }}
    >
      {/* Mobile-First Warm Vintage Header */}
      <header className="sticky top-0 z-30 bg-[#FAF6F0]/95 backdrop-blur-md border-b-2 border-[#E5DACB] p-3 sm:p-4 shadow-xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm text-white font-pixelify font-bold text-xs border border-black/10"
              style={{ backgroundColor: binder.coverColor || '#E05A47' }}
            >
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-pixelify text-sm sm:text-base font-bold text-[#1E293B] truncate tracking-tight">
                  {binder.name}
                </h1>
                <span className="font-pixelify text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EAE3D8] text-[#7A6B58] border border-[#D5CABE] flex-shrink-0">
                  {binder.badge || 'Koleksi'}
                </span>
              </div>
              <p className="text-[11px] text-[#7A6B58] truncate">
                {binder.sellerName} • <span className="font-bold text-[#E05A47]">{binder.boothName}</span>
              </p>
            </div>
          </div>

          {/* Actions & View Mode Toggle */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <a
              href="/b"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white border border-[#D5CABE] text-[#7A6B58] hover:text-[#1E293B] font-pixelify text-xs font-bold shadow-2xs transition-colors"
              title="Kembali ke pilihan rak binder meja stand"
            >
              <Layers className="w-3.5 h-3.5 text-[#E05A47]" />
              <span className="hidden sm:inline">Pilih Rak</span>
            </a>

            <div className="flex items-center bg-[#EAE3D8] p-1 rounded-xl border border-[#D5CABE]">
              <button
                onClick={() => setViewMode('flip')}
                className={`px-2 py-1 rounded-lg font-pixelify text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'flip'
                    ? 'bg-white text-[#1E293B] shadow-xs'
                    : 'text-[#7A6B58] hover:text-[#1E293B]'
                }`}
              >
                Binder
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-2 py-1 rounded-lg font-pixelify text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white text-[#1E293B] shadow-xs'
                    : 'text-[#7A6B58] hover:text-[#1E293B]'
                }`}
              >
                Semua
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Low-Bandwidth Event Notification Banner */}
      <div className="max-w-4xl mx-auto w-full px-4 pt-3">
        <div className="p-3 bg-[#FAF6F0] border-2 border-[#E5DACB] rounded-2xl flex items-center justify-between text-xs text-[#5D4E3E] shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-base">✨</span>
            <span>
              Tap <strong>+ Keranjang</strong> pada kartu yang Anda incar, masukkan nama, dan kirim pesanan langsung ke meja seller!
            </span>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto w-full px-4 py-4 space-y-4">
        {/* Search & Filter Bar */}
        <div className="space-y-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Cari kartu (contoh: Moonbreon, Pikachu, Charizard...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-[#FAF6F0] border-2 border-[#D5CABE] rounded-2xl text-xs sm:text-sm text-[#1E293B] placeholder-[#9C8E7D] focus:outline-none focus:border-[#E05A47] shadow-inner"
            />
            <Search className="w-4 h-4 absolute left-3 top-3 text-[#9C8E7D]" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-xs text-[#9C8E7D] hover:text-[#1E293B]"
              >
                &times;
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setPriceFilter('all')}
              className={`px-3 py-1.5 rounded-full font-pixelify text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                priceFilter === 'all'
                  ? 'bg-[#1E293B] text-white shadow-xs'
                  : 'bg-[#FAF6F0] text-[#7A6B58] border border-[#D5CABE] hover:bg-white'
              }`}
            >
              Semua Harga
            </button>
            <button
              onClick={() => setPriceFilter('under500k')}
              className={`px-3 py-1.5 rounded-full font-pixelify text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                priceFilter === 'under500k'
                  ? 'bg-[#E05A47] text-white shadow-xs'
                  : 'bg-[#FAF6F0] text-[#7A6B58] border border-[#D5CABE] hover:bg-white'
              }`}
            >
              &lt; 500rb
            </button>
            <button
              onClick={() => setPriceFilter('500k-2m')}
              className={`px-3 py-1.5 rounded-full font-pixelify text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                priceFilter === '500k-2m'
                  ? 'bg-[#E05A47] text-white shadow-xs'
                  : 'bg-[#FAF6F0] text-[#7A6B58] border border-[#D5CABE] hover:bg-white'
              }`}
            >
              500rb - 2jt
            </button>
            <button
              onClick={() => setPriceFilter('above2m')}
              className={`px-3 py-1.5 rounded-full font-pixelify text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                priceFilter === 'above2m'
                  ? 'bg-[#E05A47] text-white shadow-xs'
                  : 'bg-[#FAF6F0] text-[#7A6B58] border border-[#D5CABE] hover:bg-white'
              }`}
            >
              2jt+ Hits
            </button>
            <button
              onClick={() => setHideSold(!hideSold)}
              className={`px-3 py-1.5 rounded-full font-pixelify text-xs font-bold whitespace-nowrap border transition-colors cursor-pointer ${
                hideSold
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-[#FAF6F0] text-[#7A6B58] border-[#D5CABE] hover:bg-white'
              }`}
            >
              {hideSold ? '✓ Sembunyikan Terjual' : 'Sembunyikan Terjual'}
            </button>
          </div>
        </div>

        {/* View Mode 1: Binder Page-Flip Mode */}
        {viewMode === 'flip' && (
          <div className="space-y-3">
            {/* Page Navigator */}
            <div
              ref={contentTopRef}
              className="flex items-center justify-between bg-[#FAF6F0] border-2 border-[#E5DACB] rounded-2xl p-2.5 shadow-xs scroll-mt-20"
            >
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-[#D5CABE] hover:bg-[#F5EFE6] disabled:opacity-40 font-pixelify text-xs font-bold text-[#1E293B] transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Hal. Sebelumnya</span>
              </button>

              <div className="text-center">
                <span className="font-pixelify text-xs font-bold text-[#1E293B]">
                  HALAMAN {currentPage} / {binder.totalPages}
                </span>
                <span className="font-mono-clean text-[10px] text-[#7A6B58] block">
                  (Slot #{startSlot} - #{endSlot})
                </span>
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === binder.totalPages}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-[#D5CABE] hover:bg-[#F5EFE6] disabled:opacity-40 font-pixelify text-xs font-bold text-[#1E293B] transition-colors cursor-pointer"
              >
                <span className="hidden sm:inline">Hal. Berikutnya</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Tactile Pocket Grid */}
            <div
              className={`grid gap-3.5 ${
                binder.layoutType === '4-pocket'
                  ? 'grid-cols-2'
                  : binder.layoutType === '12-pocket'
                  ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4'
                  : 'grid-cols-2 sm:grid-cols-3'
              }`}
            >
              {Array.from({ length: pocketsPerPage }, (_, i) => {
                const slotNum = startSlot + i;
                const card = binder.slots[slotNum];

                if (!card) {
                  return (
                    <div
                      key={slotNum}
                      className="bg-[#EAE3D8]/60 border-2 border-dashed border-[#D5CABE] rounded-2xl p-3 flex flex-col items-center justify-center text-center min-h-[260px] opacity-60"
                    >
                      <span className="font-pixelify px-2 py-0.5 rounded bg-[#FAF6F0] border border-[#D5CABE] text-[10px] font-bold text-[#8C7E6D] mb-1.5">
                        SLOT #{slotNum}
                      </span>
                      <span className="font-mono-clean text-[11px] text-[#8C7E6D]">Saku Kosong</span>
                    </div>
                  );
                }

                const inCart = isCardInCart(slotNum);

                return (
                  <div
                    key={slotNum}
                    onClick={() => setSelectedCardDetail({ slotNumber: slotNum, card })}
                    className={`bg-[#FAF6F0] border-2 rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between cursor-pointer transition-all relative overflow-hidden group shadow-sm hover:shadow-md ${
                      inCart
                        ? 'border-[#E05A47] ring-2 ring-[#E05A47]/30'
                        : 'border-[#D5CABE] hover:border-[#B5A593]'
                    }`}
                  >
                    {/* Slot Header */}
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-pixelify px-2 py-0.5 rounded-md bg-[#EAE3D8] text-[10px] font-bold text-[#4A3E31]">
                        #{slotNum}
                      </span>

                      <span
                        className={`font-pixelify text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          card.status === 'AVAILABLE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : card.status === 'SOLD'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {card.status === 'AVAILABLE' ? 'READY' : card.status}
                      </span>
                    </div>

                    {/* Card Pocket Sleeve with Authentic Reflection Glare */}
                    <div className="pocket-reflection relative aspect-[3/4] max-h-44 sm:max-h-52 w-full rounded-xl overflow-hidden bg-[#E2D9CC] mx-auto shadow-inner mb-2 border border-[#D5CABE]">
                      {card.imageUrl ? (
                        <>
                          <img
                            src={formatCardImageUrl(card.imageUrl)}
                            alt={card.name}
                            loading="lazy"
                            className="w-full h-full object-contain p-1 transition-transform group-hover:scale-105 duration-200"
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setLightboxCard({ slotNumber: slotNum, card });
                            }}
                            className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-lg p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Zoom Kartu"
                          >
                            <ZoomIn className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-pixelify text-xs text-[#8C7E6D]">
                          POKÉMON
                        </div>
                      )}

                      {card.status === 'SOLD' && (
                        <div className="absolute inset-0 bg-black/65 flex items-center justify-center pointer-events-none">
                          <span className="font-pixelify px-2.5 py-1 bg-red-600 text-white font-bold text-[11px] uppercase tracking-wider rounded rotate-[-12deg] shadow-lg">
                            TERJUAL
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Card Info */}
                    <div>
                      <h4 className="font-bold text-xs text-[#1E293B] line-clamp-1 group-hover:text-[#E05A47] transition-colors">
                        {formatCardDisplayName(card.name, card.cardNumber, card.setName, card.game)}
                      </h4>
                      <p className="font-mono-clean text-[10px] text-[#7A6B58] truncate flex items-center gap-1 mt-0.5">
                        <span className="truncate">{card.condition} • {translateCardSet(card.setName, card.cardNumber, card.game)}</span>
                      </p>

                      {/* Price Badge */}
                      <div className="mt-1.5 flex items-baseline justify-between">
                        <span className="font-pixelify text-xs sm:text-sm font-bold text-[#2E7D32]">
                          {formatCurrency(card.price, binder.currency)}
                        </span>
                      </div>
                    </div>

                    {/* Cart Action Button */}
                    {card.status === 'AVAILABLE' ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCart(slotNum, card);
                        }}
                        className={`font-pixelify mt-2.5 w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          inCart
                            ? 'bg-[#E05A47] text-white shadow-sm'
                            : 'bg-white hover:bg-[#FAF6F0] text-[#1E293B] border border-[#D5CABE] shadow-2xs'
                        }`}
                      >
                        {inCart ? (
                          <>
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Di Keranjang</span>
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="w-3.5 h-3.5 text-[#E05A47]" />
                            <span>+ Keranjang</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="mt-2.5 w-full py-1.5 rounded-xl text-[10px] font-bold text-center text-[#8C7E6D] bg-[#EAE3D8]">
                        Sudah Terjual
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom Navigator */}
            <div className="flex items-center justify-between bg-[#FAF6F0] border-2 border-[#E5DACB] rounded-2xl p-2.5 mt-3 shadow-xs">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-[#D5CABE] hover:bg-[#F5EFE6] disabled:opacity-40 font-pixelify text-xs font-bold text-[#1E293B] transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Hal. Sebelumnya</span>
              </button>

              <div className="text-center">
                <span className="font-pixelify text-xs font-bold text-[#1E293B]">
                  HALAMAN {currentPage} / {binder.totalPages}
                </span>
                <span className="font-mono-clean text-[10px] text-[#7A6B58] block">
                  (Slot #{startSlot} - #{endSlot})
                </span>
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === binder.totalPages}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-[#D5CABE] hover:bg-[#F5EFE6] disabled:opacity-40 font-pixelify text-xs font-bold text-[#1E293B] transition-colors cursor-pointer"
              >
                <span className="hidden sm:inline">Hal. Berikutnya</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* View Mode 2: Gallery List Mode */}
        {viewMode === 'grid' && (
          <div>
            {filteredCards.length === 0 ? (
              <div className="p-12 text-center bg-[#FAF6F0] border-2 border-[#E5DACB] rounded-3xl">
                <p className="font-pixelify text-xs text-[#7A6B58]">Tidak ada kartu yang cocok dengan pencarian.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
                {filteredCards.map(({ slotNumber, card }) => {
                  const inCart = isCardInCart(slotNumber);

                  return (
                    <div
                      key={slotNumber}
                      onClick={() => setSelectedCardDetail({ slotNumber, card })}
                      className={`bg-[#FAF6F0] border-2 rounded-2xl p-2.5 flex flex-col justify-between cursor-pointer transition-all relative overflow-hidden group shadow-sm hover:shadow-md ${
                        inCart
                          ? 'border-[#E05A47] ring-2 ring-[#E05A47]/30'
                          : 'border-[#D5CABE] hover:border-[#B5A593]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-pixelify px-1.5 py-0.5 rounded bg-[#EAE3D8] text-[10px] font-bold text-[#4A3E31]">
                          #{slotNumber}
                        </span>
                        <span
                          className={`font-pixelify text-[9px] font-bold px-1.5 py-0.2 rounded ${
                            card.status === 'AVAILABLE' ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {card.status}
                        </span>
                      </div>

                      <div className="pocket-reflection relative aspect-[3/4] max-h-48 w-full rounded-xl overflow-hidden bg-[#E2D9CC] mx-auto shadow-inner mb-2 border border-[#D5CABE]">
                        {card.imageUrl ? (
                          <img
                            src={card.imageUrl}
                            alt={card.name}
                            loading="lazy"
                            className="w-full h-full object-contain p-1"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-pixelify text-xs text-[#8C7E6D]">
                            POKÉMON
                          </div>
                        )}
                        {card.status === 'SOLD' && (
                          <div className="absolute inset-0 bg-black/65 flex items-center justify-center pointer-events-none">
                            <span className="font-pixelify px-2 py-0.5 bg-red-600 text-white font-bold text-[10px] uppercase rounded rotate-[-12deg]">
                              TERJUAL
                            </span>
                          </div>
                        )}
                      </div>

                      <div>
                        <h4 className="font-bold text-xs text-[#1E293B] line-clamp-1">
                          {formatCardDisplayName(card.name, card.cardNumber, card.setName, card.game)}
                        </h4>
                        <p className="font-mono-clean text-[10px] text-[#7A6B58] truncate">
                          {card.condition}
                        </p>
                        <div className="mt-1 font-pixelify text-xs font-bold text-[#2E7D32]">
                          {formatCurrency(card.price, binder.currency)}
                        </div>
                      </div>

                      {card.status === 'AVAILABLE' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCart(slotNumber, card);
                          }}
                          className={`font-pixelify mt-2 w-full py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            inCart
                              ? 'bg-[#E05A47] text-white shadow-xs'
                              : 'bg-white text-[#1E293B] border border-[#D5CABE] hover:bg-[#FAF6F0]'
                          }`}
                        >
                          {inCart ? '✓ Di Keranjang' : '+ Keranjang'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Card Detail Modal */}
      {selectedCardDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-[#FAF6F0] border-2 border-[#D5CABE] rounded-3xl p-5 shadow-2xl relative text-[#1E293B] animate-fadeInUp">
            <button
              onClick={() => setSelectedCardDetail(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-white border border-[#D5CABE] text-[#7A6B58] hover:text-[#1E293B] flex items-center justify-center cursor-pointer"
            >
              &times;
            </button>

            {/* Header info */}
            <div className="text-center mb-3">
              <span className="font-pixelify px-3 py-1 rounded-full bg-[#EAE3D8] text-[#4A3E31] border border-[#D5CABE] text-xs font-bold tracking-wider">
                SLOT #{selectedCardDetail.slotNumber}
              </span>
              <h3 className="font-pixelify font-bold text-base text-[#1E293B] mt-2 leading-snug">
                {formatCardDisplayName(selectedCardDetail.card.name, selectedCardDetail.card.cardNumber, selectedCardDetail.card.setName, selectedCardDetail.card.game)}
              </h3>
              <p className="font-mono-clean text-xs text-[#7A6B58] mt-0.5">
                {translateCardSet(selectedCardDetail.card.setName, selectedCardDetail.card.cardNumber, selectedCardDetail.card.game)} {selectedCardDetail.card.cardNumber ? `• ${selectedCardDetail.card.cardNumber}` : ''}
              </p>
            </div>

            {/* High-res Image */}
            <div className="pocket-reflection relative aspect-[3/4] max-h-60 rounded-2xl overflow-hidden bg-[#E2D9CC] mx-auto shadow-inner border border-[#D5CABE] mb-4">
              <img
                src={selectedCardDetail.card.imageUrl}
                alt={selectedCardDetail.card.name}
                className="w-full h-full object-contain p-2"
              />
              {selectedCardDetail.card.status === 'SOLD' && (
                <div className="absolute inset-0 bg-black/65 flex items-center justify-center">
                  <span className="font-pixelify px-4 py-2 bg-red-600 text-white font-bold text-sm uppercase tracking-widest rounded-xl rotate-[-12deg] shadow-2xl">
                    SUDAH TERJUAL
                  </span>
                </div>
              )}
            </div>

            {/* Details & Condition */}
            <div className="space-y-2 bg-white p-3 rounded-2xl border border-[#D5CABE] text-xs mb-4">
              <div className="flex justify-between">
                <span className="text-[#7A6B58]">Kondisi:</span>
                <span className="font-bold text-[#1E293B]">{selectedCardDetail.card.condition}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7A6B58]">Rarity:</span>
                <span className="font-semibold text-[#1E293B]">{selectedCardDetail.card.rarity || '-'}</span>
              </div>
              {selectedCardDetail.card.notes && (
                <div className="pt-2 border-t border-[#EAE3D8] text-[11px] text-[#7A6B58] italic">
                  "{selectedCardDetail.card.notes}"
                </div>
              )}
              <div className="flex justify-between items-baseline pt-2 border-t border-[#EAE3D8]">
                <span className="text-[#7A6B58] font-bold">Harga Display:</span>
                <span className="font-pixelify text-base font-bold text-[#2E7D32]">
                  {formatCurrency(selectedCardDetail.card.price, binder.currency)}
                </span>
              </div>
            </div>

            {/* Action */}
            <div className="grid grid-cols-2 gap-2">
              <a
                href={`/b/${binder.id}/slot/${selectedCardDetail.slotNumber}`}
                className="font-pixelify py-2.5 px-3 rounded-xl bg-white border border-[#D5CABE] hover:bg-[#FAF6F0] text-[#1E293B] text-xs font-bold text-center transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>Halaman Slot</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>

              {selectedCardDetail.card.status === 'AVAILABLE' ? (
                <button
                  onClick={() => {
                    toggleCart(selectedCardDetail.slotNumber, selectedCardDetail.card);
                    setSelectedCardDetail(null);
                  }}
                  className={`font-pixelify py-2.5 px-3 rounded-xl text-xs font-bold text-center shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    isCardInCart(selectedCardDetail.slotNumber)
                      ? 'bg-[#1E293B] text-white'
                      : 'bg-[#E05A47] hover:bg-[#C94735] text-white'
                  }`}
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>
                    {isCardInCart(selectedCardDetail.slotNumber) ? 'Hapus Keranjang' : '+ Keranjang'}
                  </span>
                </button>
              ) : (
                <div className="py-2.5 px-3 rounded-xl bg-[#EAE3D8] text-[#8C7E6D] text-xs font-bold text-center flex items-center justify-center">
                  Terjual
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Full-screen Card Image Lightbox */}
      <CardImageLightbox
        isOpen={lightboxCard !== null}
        onClose={() => setLightboxCard(null)}
        card={lightboxCard?.card ?? null}
        slotNumber={lightboxCard?.slotNumber ?? 0}
        binderName={binder.name}
        currency={binder.currency}
        isInWishlist={lightboxCard ? isCardInCart(lightboxCard.slotNumber) : false}
        onToggleWishlist={
          lightboxCard
            ? () => {
                toggleCart(lightboxCard.slotNumber, lightboxCard.card);
              }
            : undefined
        }
      />

      {/* In-App Direct Buyer Cart & Order Placement Drawer */}
      <BuyerCartDrawer
        items={cartItems}
        onRemove={(slotNum) => setCartItems((prev) => prev.filter((item) => item.slotNumber !== slotNum))}
        onClear={() => setCartItems([])}
        binderId={binder.id}
        boothName={binder.boothName || 'Booth Seller'}
        sellerName={binder.sellerName || 'Seller'}
        currency={binder.currency}
      />
    </div>
  );
}
