'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Binder, PokemonCard } from '@/types';
import { formatCurrency } from '@/lib/qr';
import { formatCardImageUrl } from '@/lib/imageHelper';
import { smoothScrollToElement } from '@/lib/scrollHelper';
import WishlistDrawer, { WishlistItem } from '@/components/WishlistDrawer';
import CardImageLightbox from '@/components/CardImageLightbox';
import {
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Check,
  Eye,
  Info,
  Sparkles,
  Layers,
  Store,
  Tag,
  ArrowRight,
  ZoomIn,
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

  // Smooth glide to top of content when target page content displays
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
  const [searchQuery, setSearchQuery] = useState('');
  const [priceFilter, setPriceFilter] = useState<'all' | 'under500k' | '500k-2m' | 'above2m'>('all');
  const [hideSold, setHideSold] = useState(false);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [selectedCardDetail, setSelectedCardDetail] = useState<{ slotNumber: number; card: PokemonCard } | null>(null);
  const [lightboxCard, setLightboxCard] = useState<{ slotNumber: number; card: PokemonCard } | null>(null);

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
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (binderId) loadBinder();
  }, [binderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full border-4 border-red-500 border-t-transparent animate-spin mx-auto"></div>
          <p className="text-sm font-semibold text-slate-300">Membuka Binder Digital...</p>
        </div>
      </div>
    );
  }

  if (!binder) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="text-center p-6 bg-slate-900 border border-slate-800 rounded-3xl max-w-sm">
          <p className="text-base font-bold text-slate-200">Binder tidak ditemukan atau QR Code sudah kadaluarsa.</p>
          <a href="/" className="mt-4 inline-block px-4 py-2 bg-red-600 rounded-xl text-xs font-bold text-white">
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
      const match =
        card.name.toLowerCase().includes(q) ||
        card.setName.toLowerCase().includes(q) ||
        (card.rarity && card.rarity.toLowerCase().includes(q));
      if (!match) return false;
    }
    if (priceFilter === 'under500k' && card.price >= 500000) return false;
    if (priceFilter === '500k-2m' && (card.price < 500000 || card.price > 2000000)) return false;
    if (priceFilter === 'above2m' && card.price < 2000000) return false;

    return true;
  });

  const toggleWishlist = (slotNumber: number, card: PokemonCard) => {
    const exists = wishlist.some((item) => item.slotNumber === slotNumber && item.binderId === binder.id);
    if (exists) {
      setWishlist((prev) => prev.filter((item) => !(item.slotNumber === slotNumber && item.binderId === binder.id)));
    } else {
      setWishlist((prev) => [
        ...prev,
        {
          slotNumber,
          binderName: binder.name,
          binderId: binder.id,
          card,
        },
      ]);
    }
  };

  const isCardInWishlist = (slotNumber: number) => {
    return wishlist.some((item) => item.slotNumber === slotNumber && item.binderId === binder.id);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-28">
      {/* Mobile-First Header Bar */}
      <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 p-3 sm:p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md text-white font-extrabold text-xs"
              style={{ backgroundColor: binder.coverColor || '#DC2626' }}
            >
              <Layers className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-black text-sm sm:text-base text-white truncate">{binder.name}</h1>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                  {binder.badge || 'Koleksi'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                {binder.sellerName} • <span className="text-amber-400 font-semibold">{binder.boothName}</span>
              </p>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 flex-shrink-0">
            <button
              onClick={() => setViewMode('flip')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'flip'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Mode Binder
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'grid'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Semua Kartu
            </button>
          </div>
        </div>
      </header>

      {/* Description & Card Show Tip Banner */}
      <div className="max-w-4xl mx-auto w-full px-4 pt-3">
        <div className="p-3 bg-gradient-to-r from-slate-900 to-slate-900/60 border border-slate-800 rounded-2xl flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <span className="text-base">💡</span>
            <span>
              Tap kartu yang Anda minati lalu tekan <strong>"Tunjukkan ke Seller"</strong> di bawah untuk langsung ambil kartu di meja!
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
              placeholder="Cari nama kartu (Pokémon, Riftbound, One Piece...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-white"
              >
                &times;
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setPriceFilter('all')}
              className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition-colors ${
                priceFilter === 'all'
                  ? 'bg-slate-200 text-slate-900'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Semua Harga
            </button>
            <button
              onClick={() => setPriceFilter('under500k')}
              className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition-colors ${
                priceFilter === 'under500k'
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              &lt; 500rb
            </button>
            <button
              onClick={() => setPriceFilter('500k-2m')}
              className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition-colors ${
                priceFilter === '500k-2m'
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              500rb - 2jt
            </button>
            <button
              onClick={() => setPriceFilter('above2m')}
              className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition-colors ${
                priceFilter === 'above2m'
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              2jt+ (Grail Hits)
            </button>
            <button
              onClick={() => setHideSold(!hideSold)}
              className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap border transition-colors ${
                hideSold
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
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
              className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl p-2 scroll-mt-20"
            >
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-xs font-bold text-slate-200 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Hal. Sebelumnya</span>
              </button>

              <div className="text-center">
                <span className="text-xs font-black text-white">
                  Halaman {currentPage} / {binder.totalPages}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  (Slot #{startSlot} - #{endSlot})
                </span>
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === binder.totalPages}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-xs font-bold text-slate-200 transition-colors"
              >
                <span className="hidden sm:inline">Hal. Berikutnya</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Pocket Grid */}
            <div
              className={`grid gap-3 ${
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
                      className="binder-pocket rounded-2xl p-3 flex flex-col items-center justify-center text-center min-h-[260px] opacity-40"
                    >
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-black text-slate-400 mb-2">
                        SLOT #{slotNum}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">Slot Kosong</span>
                    </div>
                  );
                }

                const inWishlist = isCardInWishlist(slotNum);

                return (
                  <div
                    key={slotNum}
                    onClick={() => setSelectedCardDetail({ slotNumber: slotNum, card })}
                    className={`binder-pocket rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between cursor-pointer transition-all relative overflow-hidden group hover:border-amber-400/60 ${
                      inWishlist ? 'ring-2 ring-amber-400 border-amber-400' : ''
                    }`}
                  >
                    {/* Slot Header */}
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="px-2 py-0.5 rounded bg-slate-900 text-[10px] font-black text-amber-400">
                        SLOT #{slotNum}
                      </span>

                      <span
                        className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                          card.status === 'AVAILABLE'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : card.status === 'SOLD'
                            ? 'bg-rose-500/20 text-rose-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {card.status}
                      </span>
                    </div>

                    {/* Card Image */}
                    <div className="relative aspect-[3/4] max-h-44 sm:max-h-52 w-full rounded-xl overflow-hidden bg-slate-950 mx-auto shadow-md mb-2 holo-shine">
                      {card.imageUrl ? (
                        <>
                          <img
                            src={formatCardImageUrl(card.imageUrl)}
                            alt={card.name}
                            className="w-full h-full object-contain p-0.5"
                          />
                          {/* Zoom overlay – click opens lightbox */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setLightboxCard({ slotNumber: slotNum, card });
                            }}
                            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 cursor-zoom-in"
                            title="Lihat gambar penuh"
                          >
                            <span className="bg-black/70 rounded-full p-2.5 border border-white/20 shadow-lg">
                              <ZoomIn className="w-5 h-5 text-white" />
                            </span>
                          </button>
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-slate-600">
                          Pokémon
                        </div>
                      )}

                      {card.status === 'SOLD' && (
                        <div className="absolute inset-0 bg-black/75 flex items-center justify-center pointer-events-none">
                          <span className="px-2.5 py-1 bg-red-600 text-white font-black text-[11px] uppercase tracking-wider rounded rotate-[-12deg] shadow-lg">
                            TERJUAL
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Card Title & Condition */}
                    <div>
                      <h4 className="font-bold text-xs text-white line-clamp-1 group-hover:text-amber-300 transition-colors">
                        {card.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                        {card.game && card.game !== 'pokemon' && (
                          <span className="text-[9px] font-black uppercase px-1 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 flex-shrink-0">
                            {card.game}
                          </span>
                        )}
                        <span className="truncate">{card.condition} • {card.setName}</span>
                      </p>

                      {/* Price Badge */}
                      <div className="mt-1 flex items-baseline justify-between">
                        <span className="text-xs sm:text-sm font-black text-amber-400">
                          {formatCurrency(card.price, binder.currency)}
                        </span>
                        {card.originalPrice && card.originalPrice > card.price && (
                          <span className="text-[9px] line-through text-slate-500">
                            {formatCurrency(card.originalPrice, binder.currency)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Wishlist Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWishlist(slotNum, card);
                      }}
                      className={`mt-2 w-full py-1.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-all ${
                        inWishlist
                          ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                          : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      {inWishlist ? (
                        <>
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Ditandai</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
                          <span>Mau Beli</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Bottom Page Navigator */}
            <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl p-2 mt-3 shadow-lg">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-xs font-bold text-slate-200 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Hal. Sebelumnya</span>
              </button>

              <div className="text-center">
                <span className="text-xs font-black text-white">
                  Halaman {currentPage} / {binder.totalPages}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  (Slot #{startSlot} - #{endSlot})
                </span>
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === binder.totalPages}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-xs font-bold text-slate-200 transition-colors"
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
              <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl">
                <p className="text-xs text-slate-400">Tidak ada kartu yang cocok dengan pencarian.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {filteredCards.map(({ slotNumber, card }) => {
                  const inWishlist = isCardInWishlist(slotNumber);

                  return (
                    <div
                      key={slotNumber}
                      onClick={() => setSelectedCardDetail({ slotNumber, card })}
                      className={`binder-pocket rounded-2xl p-2.5 flex flex-col justify-between cursor-pointer transition-all relative overflow-hidden group hover:border-amber-400/60 ${
                        inWishlist ? 'ring-2 ring-amber-400 border-amber-400' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="px-1.5 py-0.5 rounded bg-slate-900 text-[10px] font-black text-amber-400">
                          SLOT #{slotNumber}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                            card.status === 'AVAILABLE' ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {card.status}
                        </span>
                      </div>

                      <div className="relative aspect-[3/4] max-h-48 w-full rounded-xl overflow-hidden bg-slate-950 mx-auto shadow-md mb-2 holo-shine">
                        {card.imageUrl && (
                          <>
                            <img
                              src={card.imageUrl}
                              alt={card.name}
                              className="w-full h-full object-contain p-0.5"
                            />
                            {/* Zoom overlay – click opens lightbox */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setLightboxCard({ slotNumber, card });
                              }}
                              className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 cursor-zoom-in"
                              title="Lihat gambar penuh"
                            >
                              <span className="bg-black/70 rounded-full p-2.5 border border-white/20 shadow-lg">
                                <ZoomIn className="w-5 h-5 text-white" />
                              </span>
                            </button>
                          </>
                        )}
                        {card.status === 'SOLD' && (
                          <div className="absolute inset-0 bg-black/75 flex items-center justify-center pointer-events-none">
                            <span className="px-2.5 py-1 bg-red-600 text-white font-black text-[11px] uppercase tracking-wider rounded rotate-[-12deg]">
                              SOLD
                            </span>
                          </div>
                        )}
                      </div>

                      <div>
                        <h4 className="font-bold text-xs text-white line-clamp-1">{card.name}</h4>
                        <p className="text-[10px] text-slate-400 truncate">{card.condition}</p>
                        <div className="mt-1 font-black text-amber-400 text-xs sm:text-sm">
                          {formatCurrency(card.price, binder.currency)}
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWishlist(slotNumber, card);
                        }}
                        className={`mt-2 w-full py-1.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-all ${
                          inWishlist
                            ? 'bg-amber-500 text-slate-950 font-black'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }`}
                      >
                        {inWishlist ? <Check className="w-3 h-3 stroke-[3]" /> : <ShoppingBag className="w-3 h-3 text-amber-400" />}
                        <span>{inWishlist ? 'Ditandai' : 'Mau Beli'}</span>
                      </button>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-5 shadow-2xl relative text-slate-100">
            <button
              onClick={() => setSelectedCardDetail(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
            >
              &times;
            </button>

            {/* Header info */}
            <div className="text-center mb-3">
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 text-xs font-black tracking-wider">
                SLOT #{selectedCardDetail.slotNumber}
              </span>
              <h3 className="font-black text-base text-white mt-2 leading-snug">
                {selectedCardDetail.card.name}
              </h3>
              <p className="text-xs text-slate-400">
                {selectedCardDetail.card.setName} {selectedCardDetail.card.cardNumber ? `• ${selectedCardDetail.card.cardNumber}` : ''}
              </p>
            </div>

            {/* High-res Image */}
            <div className="relative aspect-[3/4] max-h-64 rounded-2xl overflow-hidden bg-slate-950 mx-auto shadow-2xl border border-slate-800 holo-shine mb-4">
              <img
                src={selectedCardDetail.card.imageUrl}
                alt={selectedCardDetail.card.name}
                className="w-full h-full object-contain p-2"
              />
              {selectedCardDetail.card.status === 'SOLD' && (
                <div className="absolute inset-0 bg-black/75 flex items-center justify-center">
                  <span className="px-4 py-2 bg-red-600 text-white font-black text-sm uppercase tracking-widest rounded-xl rotate-[-12deg] shadow-2xl">
                    SUDAH TERJUAL
                  </span>
                </div>
              )}
            </div>

            {/* Details & Condition */}
            <div className="space-y-2 bg-slate-950 p-3 rounded-2xl border border-slate-800 text-xs mb-4">
              <div className="flex justify-between">
                <span className="text-slate-400">Kondisi:</span>
                <span className="font-bold text-white">{selectedCardDetail.card.condition}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Rarity:</span>
                <span className="font-semibold text-slate-200">{selectedCardDetail.card.rarity || '-'}</span>
              </div>
              {selectedCardDetail.card.notes && (
                <div className="pt-2 border-t border-slate-800 text-[11px] text-amber-300/90 italic">
                  "{selectedCardDetail.card.notes}"
                </div>
              )}
              <div className="flex justify-between items-baseline pt-2 border-t border-slate-800">
                <span className="text-slate-400 font-bold">Harga Jual:</span>
                <span className="text-lg font-black text-amber-400">
                  {formatCurrency(selectedCardDetail.card.price, binder.currency)}
                </span>
              </div>
            </div>

            {/* Action */}
            <div className="grid grid-cols-2 gap-2">
              <a
                href={`/b/${binder.id}/slot/${selectedCardDetail.slotNumber}`}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold text-center transition-colors flex items-center justify-center gap-1"
              >
                <span>Halaman Slot QR</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={() => {
                  toggleWishlist(selectedCardDetail.slotNumber, selectedCardDetail.card);
                  setSelectedCardDetail(null);
                }}
                className={`py-2.5 px-3 rounded-xl text-xs font-black text-center shadow-lg transition-all flex items-center justify-center gap-1.5 ${
                  isCardInWishlist(selectedCardDetail.slotNumber)
                    ? 'bg-rose-600 hover:bg-rose-500 text-white'
                    : 'bg-gradient-to-r from-red-600 to-amber-500 text-white'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>
                  {isCardInWishlist(selectedCardDetail.slotNumber) ? 'Hapus dari List' : 'Mau Beli Ini'}
                </span>
              </button>
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
        isInWishlist={lightboxCard ? isCardInWishlist(lightboxCard.slotNumber) : false}
        onToggleWishlist={
          lightboxCard
            ? () => {
                toggleWishlist(lightboxCard.slotNumber, lightboxCard.card);
              }
            : undefined
        }
      />

      {/* Floating Bottom Wishlist Drawer */}
      <WishlistDrawer
        items={wishlist}
        onRemove={(slotNum, bId) =>
          setWishlist((prev) => prev.filter((item) => !(item.slotNumber === slotNum && item.binderId === bId)))
        }
        onClear={() => setWishlist([])}
        sellerPhone={binder.contactNumber || '081234567890'}
        currency={binder.currency}
      />
    </div>
  );
}
