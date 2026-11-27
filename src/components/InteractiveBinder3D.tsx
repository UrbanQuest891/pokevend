'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Binder, PokemonCard } from '@/types';
import { formatCurrency } from '@/lib/qr';
import { formatCardImageUrl } from '@/lib/imageHelper';
import { formatCardDisplayName, translateCardSet } from '@/lib/cardTranslator';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  Sparkles,
  ShoppingBag,
  Hand,
  Check,
} from 'lucide-react';

interface InteractiveBinder3DProps {
  binder: Binder;
  currentPage: number;
  onPageChange: (newPage: number) => void;
  isCardInCart: (slotNumber: number) => boolean;
  onSelectCard: (slotNumber: number, card: PokemonCard) => void;
  onZoomCard: (slotNumber: number, card: PokemonCard) => void;
  searchQuery?: string;
  priceFilter?: 'all' | 'under500k' | '500k-2m' | 'above2m';
  hideSold?: boolean;
  currency?: 'IDR' | 'USD';
}

export default function InteractiveBinder3D({
  binder,
  currentPage,
  onPageChange,
  isCardInCart,
  onSelectCard,
  onZoomCard,
  searchQuery = '',
  priceFilter = 'all',
  hideSold = false,
  currency = 'IDR',
}: InteractiveBinder3DProps) {
  // Flip animation state
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState<'next' | 'prev'>('next');
  const [displayPage, setDisplayPage] = useState(currentPage);

  // Swipe gesture tracking
  const touchStartXRef = useRef<number>(0);
  const touchStartYRef = useRef<number>(0);
  const isHorizontalSwipeRef = useRef<boolean | null>(null);

  const pocketsPerPage =
    binder.layoutType === '4-pocket' ? 4 : binder.layoutType === '12-pocket' ? 12 : 9;

  // Sync internal display page with external prop
  useEffect(() => {
    if (currentPage !== displayPage && !isFlipping) {
      triggerFlip(currentPage > displayPage ? 'next' : 'prev', currentPage);
    }
  }, [currentPage]);

  const triggerFlip = (direction: 'next' | 'prev', targetPage: number) => {
    if (isFlipping) return;
    setFlipDirection(direction);
    setIsFlipping(true);

    // After half-way (225ms), switch the content page
    setTimeout(() => {
      setDisplayPage(targetPage);
    }, 220);

    // Finish animation after 450ms
    setTimeout(() => {
      setIsFlipping(false);
    }, 450);
  };

  const handleNavClick = (newPage: number) => {
    if (isFlipping || newPage < 1 || newPage > binder.totalPages || newPage === currentPage) return;
    onPageChange(newPage);
  };

  // Touch gesture listeners for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isFlipping) return;
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
    isHorizontalSwipeRef.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isFlipping) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = Math.abs(currentX - touchStartXRef.current);
    const deltaY = Math.abs(currentY - touchStartYRef.current);

    // Disambiguate horizontal swipe from vertical scrolling
    if (isHorizontalSwipeRef.current === null && (deltaX > 8 || deltaY > 8)) {
      isHorizontalSwipeRef.current = deltaX > deltaY * 1.15;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isFlipping || !isHorizontalSwipeRef.current) return;
    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = touchEndX - touchStartXRef.current;

    // Minimum swipe threshold of 45px
    if (deltaX < -45 && currentPage < binder.totalPages) {
      handleNavClick(currentPage + 1);
    } else if (deltaX > 45 && currentPage > 1) {
      handleNavClick(currentPage - 1);
    }
    isHorizontalSwipeRef.current = null;
  };

  // Helper to check if a card matches search/price filter (In-place Dimming)
  const isCardMatch = (card: PokemonCard | undefined) => {
    if (!card) return true;
    if (hideSold && card.status === 'SOLD') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const displayName = formatCardDisplayName(
        card.name,
        card.cardNumber,
        card.setName,
        card.game
      ).toLowerCase();
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
  };

  const isFilteringActive =
    searchQuery.trim().length > 0 || priceFilter !== 'all' || hideSold;

  // Render slots for a specific page number
  const renderSlotsForPage = (pageNumber: number) => {
    const startSlot = (pageNumber - 1) * pocketsPerPage + 1;

    return (
      <div
        className={`grid gap-2.5 sm:gap-3.5 ${
          binder.layoutType === '4-pocket'
            ? 'grid-cols-2'
            : binder.layoutType === '12-pocket'
            ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4'
            : 'grid-cols-2 sm:grid-cols-3'
        }`}
      >
        {Array.from({ length: pocketsPerPage }, (_, i) => {
          const slotNum = startSlot + i;
          const card = binder.slots ? binder.slots[slotNum] : undefined;

          if (!card) {
            return (
              <div
                key={slotNum}
                className="bg-[#EAE3D8]/40 border-2 border-dashed border-[#D5CABE] rounded-2xl p-2 sm:p-3 flex flex-col items-center justify-center text-center min-h-[220px] sm:min-h-[250px] opacity-50"
              >
                <span className="font-pixelify px-2 py-0.5 rounded bg-[#FAF6F0] border border-[#D5CABE] text-[9px] font-bold text-[#8C7E6D] mb-1">
                  SLOT #{slotNum}
                </span>
                <span className="font-mono-clean text-[10px] text-[#8C7E6D]">Saku Kosong</span>
              </div>
            );
          }

          const inCart = isCardInCart(slotNum);
          const matchesFilter = isCardMatch(card);
          const isDimmed = isFilteringActive && !matchesFilter;

          return (
            <div
              key={slotNum}
              onClick={() => {
                if (!isDimmed) onSelectCard(slotNum, card);
              }}
              className={`bg-white border-2 rounded-2xl p-2 sm:p-2.5 flex flex-col justify-between transition-all duration-200 relative overflow-hidden group shadow-xs hover:shadow-md select-none ${
                isDimmed
                  ? 'opacity-30 grayscale pointer-events-none scale-[0.98]'
                  : isFilteringActive
                  ? 'ring-2 ring-[#E05A47] border-[#E05A47] shadow-sm'
                  : inCart
                  ? 'border-[#E05A47] ring-2 ring-[#E05A47]/30'
                  : 'border-[#D5CABE] hover:border-[#B5A593] cursor-pointer'
              }`}
            >
              {/* Slot Header */}
              <div className="flex items-center justify-between mb-1">
                <span className="font-pixelify px-1.5 py-0.5 rounded bg-[#EAE3D8] text-[9px] sm:text-[10px] font-bold text-[#4A3E31]">
                  #{slotNum}
                </span>

                <div className="flex items-center gap-1">
                  {isFilteringActive && matchesFilter && (
                    <span className="font-pixelify text-[8px] font-bold px-1 py-0.5 rounded bg-[#E05A47] text-white">
                      MATCH
                    </span>
                  )}
                  <span
                    className={`font-pixelify text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded ${
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
              </div>

              {/* Card Pocket Sleeve with Authentic Reflection Glare */}
              <div className="pocket-reflection relative aspect-[3/4] max-h-40 sm:max-h-48 w-full rounded-xl overflow-hidden bg-[#E2D9CC] mx-auto shadow-inner mb-1.5 border border-[#D5CABE]">
                {card.imageUrl ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={formatCardImageUrl(card.imageUrl)}
                      alt={card.name}
                      loading="lazy"
                      className="w-full h-full object-contain p-1 transition-transform group-hover:scale-105 duration-200"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onZoomCard(slotNum, card);
                      }}
                      className="absolute top-1.5 right-1.5 bg-black/60 hover:bg-black/80 text-white rounded-lg p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
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
                  <div className="absolute inset-0 bg-black/65 flex items-center justify-center pointer-events-none z-15">
                    <span className="font-pixelify px-2 py-0.5 bg-red-600 text-white font-bold text-[10px] uppercase tracking-wider rounded rotate-[-12deg] shadow-lg">
                      TERJUAL
                    </span>
                  </div>
                )}
              </div>

              {/* Card Meta & Price */}
              <div className="space-y-0.5 pt-1 border-t border-[#EAE3D8]">
                <div className="font-pixelify text-[10px] sm:text-xs font-bold text-[#1E293B] truncate leading-tight">
                  {formatCardDisplayName(card.name, card.cardNumber, card.setName, card.game)}
                </div>
                <div className="flex items-center justify-between text-[9px] text-[#7A6B58]">
                  <span className="truncate max-w-[90px]">{card.condition}</span>
                  <span className="font-pixelify font-bold text-[#2E7D32] text-[10px] sm:text-[11px]">
                    {formatCurrency(card.price, currency)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Visual Binder Ring Element
  const renderBinderRings = () => (
    <div className="flex flex-col justify-around items-center py-6 px-1 h-full select-none pointer-events-none">
      {[1, 2, 3].map((ring) => (
        <div key={ring} className="relative flex items-center justify-center my-4">
          {/* Outer ring curve */}
          <div className="w-4 sm:w-5 h-12 sm:h-14 rounded-full border-4 border-slate-300 bg-gradient-to-r from-slate-400 via-white to-slate-400 shadow-md transform -rotate-2"></div>
          {/* Inner ring core */}
          <div className="absolute w-2 h-8 rounded-full bg-slate-700/30"></div>
          {/* Paper punch hole left */}
          <div className="absolute -left-2 w-2.5 h-2.5 rounded-full bg-neutral-800 shadow-inner"></div>
          {/* Paper punch hole right */}
          <div className="absolute -right-2 w-2.5 h-2.5 rounded-full bg-neutral-800 shadow-inner hidden md:block"></div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-3">
      {/* Page Navigation & Flip Status Bar */}
      <div className="flex items-center justify-between bg-[#FAF6F0] border-2 border-[#E5DACB] rounded-2xl p-2.5 shadow-xs">
        <button
          type="button"
          onClick={() => handleNavClick(currentPage - 1)}
          disabled={currentPage === 1 || isFlipping}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-[#D5CABE] hover:bg-[#F5EFE6] disabled:opacity-35 font-pixelify text-xs font-bold text-[#1E293B] transition-all cursor-pointer shadow-2xs active:scale-95"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Hal. Sebelumnya</span>
        </button>

        <div className="text-center">
          <span className="font-pixelify text-xs sm:text-sm font-bold text-[#1E293B]">
            HALAMAN {currentPage} / {binder.totalPages}
          </span>
          <span className="font-mono-clean text-[10px] text-[#7A6B58] block">
            (Slot #{(currentPage - 1) * pocketsPerPage + 1} - #{Math.min(currentPage * pocketsPerPage, binder.totalPages * pocketsPerPage)})
          </span>
        </div>

        <button
          type="button"
          onClick={() => handleNavClick(currentPage + 1)}
          disabled={currentPage === binder.totalPages || isFlipping}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-[#D5CABE] hover:bg-[#F5EFE6] disabled:opacity-35 font-pixelify text-xs font-bold text-[#1E293B] transition-all cursor-pointer shadow-2xs active:scale-95"
        >
          <span className="hidden sm:inline">Hal. Berikutnya</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 3D Binder Outer Casing / Leather Album Container */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative rounded-3xl p-2 sm:p-4 shadow-xl border-4 border-black/10 transition-all select-none overflow-hidden"
        style={{
          backgroundColor: binder.coverColor || '#963C30',
          backgroundImage: 'radial-gradient(rgba(0,0,0,0.12) 1px, transparent 1px)',
          backgroundSize: '12px 12px',
        }}
      >
        {/* Leather Stitched Border Effect */}
        <div className="absolute inset-1 rounded-[22px] border-2 border-dashed border-white/20 pointer-events-none"></div>

        {/* 3D Perspective Stage */}
        <div
          className="relative min-h-[460px] sm:min-h-[520px] rounded-2xl bg-[#EAE3D8] border border-[#D5CABE] p-2 sm:p-3.5 shadow-inner"
          style={{ perspective: '1400px' }}
        >
          {/* MOBILE VIEW: Single Sleeve Page (< 768px) */}
          <div className="md:hidden flex">
            {/* Left Ring Holes Bar */}
            <div className="w-6 flex-shrink-0 flex flex-col justify-around items-center py-8">
              {[1, 2, 3].map((ring) => (
                <div key={ring} className="relative flex items-center justify-center">
                  <div className="w-3.5 h-10 rounded-full border-2 border-slate-400 bg-gradient-to-r from-slate-400 via-white to-slate-400 shadow-sm"></div>
                  <div className="absolute -right-1 w-2 h-2 rounded-full bg-neutral-800"></div>
                </div>
              ))}
            </div>

            {/* Flipping 3D Sheet Container */}
            <div
              className={`flex-1 transition-all duration-400 ease-out origin-left ${
                isFlipping
                  ? flipDirection === 'next'
                    ? 'rotate-y-[-80deg] opacity-70 scale-[0.98] shadow-2xl'
                    : 'rotate-y-[80deg] opacity-70 scale-[0.98] shadow-2xl'
                  : 'rotate-y-0 opacity-100 scale-100'
              }`}
              style={{ transformStyle: 'preserve-3d' }}
            >
              <div className="bg-[#FAF6F0] rounded-xl p-2 sm:p-3 border border-[#D5CABE] shadow-sm">
                {renderSlotsForPage(displayPage)}
              </div>
            </div>
          </div>

          {/* DESKTOP VIEW: Open 2-Page Spread (≥ 768px) */}
          <div className="hidden md:flex items-stretch gap-2">
            {/* Left Page (Current Page) */}
            <div className="flex-1 bg-[#FAF6F0] rounded-l-2xl rounded-r-sm p-3.5 border border-[#D5CABE] shadow-xs relative">
              <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-[#EAE3D8]">
                <span className="font-pixelify text-xs font-bold text-[#7A6B58]">
                  HALAMAN {displayPage}
                </span>
                <span className="font-mono-clean text-[10px] text-[#A89A88]">
                  SLOT #{(displayPage - 1) * pocketsPerPage + 1} - #{displayPage * pocketsPerPage}
                </span>
              </div>
              {renderSlotsForPage(displayPage)}
            </div>

            {/* Center Spine with Metal Rings */}
            <div className="w-10 bg-[#3D2C1E] rounded-md shadow-inner flex items-center justify-center relative">
              {renderBinderRings()}
            </div>

            {/* Right Page (Next Page or End Cover) */}
            <div
              className={`flex-1 bg-[#FAF6F0] rounded-r-2xl rounded-l-sm p-3.5 border border-[#D5CABE] shadow-xs relative origin-left transition-all duration-400 ${
                isFlipping
                  ? flipDirection === 'next'
                    ? 'rotate-y-[-70deg] opacity-60 shadow-2xl'
                    : 'rotate-y-[70deg] opacity-60 shadow-2xl'
                  : 'rotate-y-0 opacity-100'
              }`}
              style={{ transformStyle: 'preserve-3d' }}
            >
              {displayPage < binder.totalPages ? (
                <>
                  <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-[#EAE3D8]">
                    <span className="font-pixelify text-xs font-bold text-[#7A6B58]">
                      HALAMAN {displayPage + 1}
                    </span>
                    <span className="font-mono-clean text-[10px] text-[#A89A88]">
                      SLOT #{displayPage * pocketsPerPage + 1} - #{Math.min((displayPage + 1) * pocketsPerPage, binder.totalPages * pocketsPerPage)}
                    </span>
                  </div>
                  {renderSlotsForPage(displayPage + 1)}
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-[#FAF6F0]/80 rounded-xl border border-dashed border-[#D5CABE]">
                  <div className="w-14 h-14 rounded-2xl bg-[#E05A47]/10 text-[#E05A47] flex items-center justify-center mb-3">
                    <Sparkles className="w-7 h-7" />
                  </div>
                  <h4 className="font-pixelify text-sm font-bold text-[#1E293B] mb-1">
                    AKHIR DARI BINDER
                  </h4>
                  <p className="text-xs text-[#7A6B58] max-w-xs leading-relaxed">
                    Anda telah menjelajahi seluruh koleksi kartu di binder ini.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Swipe Guidance Microcopy */}
        <div className="md:hidden flex items-center justify-center gap-1.5 text-center pt-2 text-[10px] font-pixelify font-bold text-white/90">
          <Hand className="w-3 h-3 animate-pulse" />
          <span>Swipe kiri / kanan di layar untuk membalik halaman binder</span>
        </div>
      </div>
    </div>
  );
}
