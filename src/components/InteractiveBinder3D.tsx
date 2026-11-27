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
  BookOpen,
  Store,
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

  // Desktop Spread Calculation:
  // Spread 0: Left = Inside Front Cover, Right = Page 1
  // Spread 1: Left = Page 2, Right = Page 3 (or Inside Back Cover)
  // Spread 2: Left = Page 4, Right = Page 5 (or Inside Back Cover)
  const [spreadIndex, setSpreadIndex] = useState(() => Math.floor(currentPage / 2));

  // Swipe gesture tracking
  const touchStartXRef = useRef<number>(0);
  const touchStartYRef = useRef<number>(0);
  const isHorizontalSwipeRef = useRef<boolean | null>(null);

  const pocketsPerPage =
    binder.layoutType === '4-pocket' ? 4 : binder.layoutType === '12-pocket' ? 12 : 9;

  const totalSpreads = Math.floor(binder.totalPages / 2) + 1;

  // Sync internal display page and spreadIndex with external prop
  useEffect(() => {
    setDisplayPage(currentPage);
    setSpreadIndex(Math.floor(currentPage / 2));
  }, [currentPage]);

  const triggerFlip = (direction: 'next' | 'prev', newSpread: number, newPage: number) => {
    if (isFlipping) return;
    setFlipDirection(direction);
    setIsFlipping(true);

    // Midway: switch the content
    setTimeout(() => {
      setSpreadIndex(newSpread);
      setDisplayPage(newPage);
      onPageChange(newPage);
    }, 220);

    // End flip
    setTimeout(() => {
      setIsFlipping(false);
    }, 450);
  };

  const handleDesktopNav = (direction: 'next' | 'prev') => {
    if (isFlipping) return;
    if (direction === 'next' && spreadIndex < totalSpreads - 1) {
      const nextSpread = spreadIndex + 1;
      const nextPage = nextSpread === 0 ? 1 : nextSpread * 2;
      triggerFlip('next', nextSpread, nextPage);
    } else if (direction === 'prev' && spreadIndex > 0) {
      const prevSpread = spreadIndex - 1;
      const prevPage = prevSpread === 0 ? 1 : prevSpread * 2;
      triggerFlip('prev', prevSpread, prevPage);
    }
  };

  const handleMobileNav = (direction: 'next' | 'prev') => {
    if (isFlipping) return;
    if (direction === 'next' && displayPage < binder.totalPages) {
      const nextPage = displayPage + 1;
      triggerFlip('next', Math.floor(nextPage / 2), nextPage);
    } else if (direction === 'prev' && displayPage > 1) {
      const prevPage = displayPage - 1;
      triggerFlip('prev', Math.floor(prevPage / 2), prevPage);
    }
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

    if (isHorizontalSwipeRef.current === null && (deltaX > 8 || deltaY > 8)) {
      isHorizontalSwipeRef.current = deltaX > deltaY * 1.15;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isFlipping || !isHorizontalSwipeRef.current) return;
    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = touchEndX - touchStartXRef.current;

    if (deltaX < -45) {
      // Swiped Left -> Next
      handleMobileNav('next');
    } else if (deltaX > 45) {
      // Swiped Right -> Prev
      handleMobileNav('prev');
    }
    isHorizontalSwipeRef.current = null;
  };

  // In-place Dimming filter match helper
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

  // Render Slots with 100% Consistent Dimensions Across All Rows & Pages
  const renderSlotsForPage = (pageNumber: number) => {
    const startSlot = (pageNumber - 1) * pocketsPerPage + 1;

    return (
      <div
        className={`grid gap-2 sm:gap-2.5 ${
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

          // EMPTY SLOT: Structured with the EXACT SAME heights and ratios as filled slots
          if (!card) {
            return (
              <div
                key={slotNum}
                className="bg-[#EAE3D8]/30 border-2 border-dashed border-[#D5CABE] rounded-2xl p-1.5 sm:p-2 flex flex-col justify-between select-none opacity-45"
              >
                {/* Slot Header */}
                <div className="flex items-center justify-between mb-1 flex-shrink-0">
                  <span className="font-pixelify px-1.5 py-0.5 rounded bg-[#FAF6F0] border border-[#D5CABE] text-[9px] font-bold text-[#8C7E6D]">
                    #{slotNum}
                  </span>
                  <span className="font-pixelify text-[8px] font-bold text-[#A89A88]">
                    KOSONG
                  </span>
                </div>

                {/* Empty Pocket Sleeve with exact aspect-[3/4] ratio */}
                <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-[#E2D9CC]/30 border border-dashed border-[#D5CABE] mb-1 flex flex-col items-center justify-center text-center">
                  <span className="font-pixelify text-xs font-bold text-[#B0A290]">#</span>
                </div>

                {/* Empty Meta matching filled card's bottom bar height */}
                <div className="pt-1 border-t border-dashed border-[#D5CABE] flex-shrink-0 flex items-center justify-center text-[9px] font-pixelify text-[#8C7E6D] h-7">
                  Saku Kosong
                </div>
              </div>
            );
          }

          const inCart = isCardInCart(slotNum);
          const matchesFilter = isCardMatch(card);
          const isDimmed = isFilteringActive && !matchesFilter;

          // FILLED SLOT CARD
          return (
            <div
              key={slotNum}
              onClick={() => {
                if (!isDimmed) onSelectCard(slotNum, card);
              }}
              className={`bg-white border-2 rounded-2xl p-1.5 sm:p-2 flex flex-col justify-between transition-all duration-200 relative overflow-hidden group shadow-2xs hover:shadow-md select-none ${
                isDimmed
                  ? 'opacity-30 grayscale pointer-events-none scale-[0.98]'
                  : isFilteringActive
                  ? 'ring-2 ring-[#E05A47] border-[#E05A47] shadow-xs'
                  : inCart
                  ? 'border-[#E05A47] ring-2 ring-[#E05A47]/30'
                  : 'border-[#D5CABE] hover:border-[#B5A593] cursor-pointer'
              }`}
            >
              {/* Slot Header */}
              <div className="flex items-center justify-between mb-1 flex-shrink-0">
                <span className="font-pixelify px-1.5 py-0.5 rounded bg-[#EAE3D8] text-[9px] font-bold text-[#4A3E31]">
                  #{slotNum}
                </span>

                <div className="flex items-center gap-1">
                  {isFilteringActive && matchesFilter && (
                    <span className="font-pixelify text-[8px] font-bold px-1 py-0.5 rounded bg-[#E05A47] text-white">
                      MATCH
                    </span>
                  )}
                  <span
                    className={`font-pixelify text-[8px] font-bold px-1.5 py-0.5 rounded ${
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

              {/* Card Pocket Sleeve with maximum artwork clarity and exact aspect-[3/4] */}
              <div className="pocket-reflection relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-[#F2EDE4] mx-auto shadow-inner mb-1 border border-[#D5CABE] flex items-center justify-center">
                {card.imageUrl ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={formatCardImageUrl(card.imageUrl)}
                      alt={card.name}
                      loading="lazy"
                      className="w-full h-full object-contain p-0.5 transition-transform group-hover:scale-105 duration-200"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onZoomCard(slotNum, card);
                      }}
                      className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-lg p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      title="Zoom Kartu"
                    >
                      <ZoomIn className="w-3 h-3" />
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

              {/* Meta & Price with Consistent Height */}
              <div className="space-y-0.5 pt-1 border-t border-[#EAE3D8] flex-shrink-0 h-7 flex flex-col justify-center">
                <div
                  className="font-pixelify text-[10px] sm:text-[11px] font-bold text-[#1E293B] truncate leading-tight"
                  title={card.name}
                >
                  {formatCardDisplayName(card.name, card.cardNumber, card.setName, card.game)}
                </div>
                <div className="flex items-center justify-between text-[9px] text-[#7A6B58] leading-none">
                  <span className="truncate max-w-[80px] sm:max-w-[95px]">{card.condition}</span>
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

  // Inside Front Cover (Sebelah kiri halaman 1 di dunia nyata)
  const renderInsideFrontCover = () => (
    <div className="h-full flex flex-col justify-between p-4 sm:p-5 bg-[#FAF6F0]/95 rounded-l-2xl rounded-r-sm border border-[#D5CABE] shadow-inner relative overflow-hidden select-none">
      {/* Decorative Inner Stitched Border */}
      <div className="absolute inset-2 rounded-xl border border-dashed border-[#C5B8A5] pointer-events-none"></div>

      {/* Top Header of Inside Cover */}
      <div className="relative z-10 text-center pt-2">
        <div
          className="w-13 h-13 rounded-2xl mx-auto flex items-center justify-center text-white shadow-md border-2 border-white/80 mb-2"
          style={{ backgroundColor: binder.coverColor || '#E05A47' }}
        >
          <BookOpen className="w-6 h-6" />
        </div>
        <div className="inline-block px-2.5 py-0.5 rounded-full bg-[#EAE3D8] border border-[#D5CABE] font-pixelify text-[10px] font-bold text-[#7A6B58] uppercase tracking-wider mb-1">
          {binder.badge || 'Koleksi Meja Stand'}
        </div>
        <h3 className="font-pixelify text-base sm:text-lg font-bold text-[#1E293B] leading-tight">
          {binder.name}
        </h3>
        <p className="text-xs text-[#7A6B58] mt-0.5 font-medium">
          {binder.sellerName} • <span className="font-bold text-[#E05A47]">{binder.boothName || 'Stand Seller'}</span>
        </p>
      </div>

      {/* Middle: Clear Sleeve Pocket with Seller Slip / Info */}
      <div className="relative z-10 my-3 p-3.5 rounded-2xl bg-white border-2 border-[#D5CABE] shadow-2xs space-y-2">
        <div className="flex items-center justify-between pb-1.5 border-b border-[#EAE3D8] font-pixelify text-[11px] font-bold text-[#4A3E31]">
          <span>INFORMASI BINDER</span>
          <span className="text-[#E05A47]">{binder.totalPages} Halaman Fisik</span>
        </div>
        <p className="text-xs text-[#5D4E3E] leading-relaxed">
          {binder.description ||
            'Koleksi kartu siap deal di meja stand. Periksa saku kartu di sebelah kanan (Halaman 1) untuk mulai melihat kartu.'}
        </p>
        <div className="pt-1 flex items-center gap-1.5 text-[10px] font-pixelify text-[#7A6B58]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Tap kartu di sebelah kanan untuk tambah ke keranjang</span>
        </div>
      </div>

      {/* Bottom: Guide pointing to Page 1 */}
      <div className="relative z-10 text-center pb-2">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#EAE3D8] border border-[#D5CABE] font-pixelify text-xs font-bold text-[#1E293B]">
          <span>Mulai dari Halaman 1</span>
          <span className="text-base text-[#E05A47]">👉</span>
        </div>
      </div>
    </div>
  );

  // Inside Back Cover (Jika binder berakhir di halaman genap)
  const renderInsideBackCover = () => (
    <div className="h-full flex flex-col items-center justify-center p-6 bg-[#FAF6F0]/95 rounded-r-2xl rounded-l-sm border border-[#D5CABE] text-center shadow-inner relative overflow-hidden select-none">
      <div className="absolute inset-2 rounded-xl border border-dashed border-[#C5B8A5] pointer-events-none"></div>
      <div className="relative z-10 space-y-3 max-w-xs">
        <div className="w-13 h-13 rounded-2xl bg-[#E05A47]/10 text-[#E05A47] flex items-center justify-center mx-auto shadow-2xs border border-[#E05A47]/20">
          <Sparkles className="w-6 h-6" />
        </div>
        <h4 className="font-pixelify text-base font-bold text-[#1E293B]">
          AKHIR DARI BINDER
        </h4>
        <p className="text-xs text-[#7A6B58] leading-relaxed">
          Anda telah melihat seluruh saku kartu di binder ini. Tunjukkan pesanan Anda ke penjual di meja untuk periksa fisik kartu!
        </p>
      </div>
    </div>
  );

  // Desktop Page Calculations for Spread
  const leftPageNum = spreadIndex === 0 ? null : spreadIndex * 2;
  const rightPageNum =
    spreadIndex === 0
      ? 1
      : spreadIndex * 2 + 1 <= binder.totalPages
      ? spreadIndex * 2 + 1
      : null;

  return (
    <div className="space-y-3">
      {/* Top Navigator Status Bar */}
      <div className="flex items-center justify-between bg-[#FAF6F0] border-2 border-[#E5DACB] rounded-2xl p-2.5 shadow-xs">
        {/* Previous Button */}
        <button
          type="button"
          onClick={() => {
            handleDesktopNav('prev');
            handleMobileNav('prev');
          }}
          disabled={spreadIndex === 0 && displayPage <= 1 || isFlipping}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-[#D5CABE] hover:bg-[#F5EFE6] disabled:opacity-35 font-pixelify text-xs font-bold text-[#1E293B] transition-all cursor-pointer shadow-2xs active:scale-95"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Hal. Sebelumnya</span>
        </button>

        {/* Status Text (Desktop vs Mobile) */}
        <div className="text-center">
          {/* Desktop Spread Indicator */}
          <div className="hidden md:block">
            <span className="font-pixelify text-xs sm:text-sm font-bold text-[#1E293B]">
              {spreadIndex === 0
                ? 'COVER DEPAN • HALAMAN 1'
                : rightPageNum
                ? `HALAMAN ${leftPageNum} • HALAMAN ${rightPageNum}`
                : `HALAMAN ${leftPageNum} • COVER BELAKANG`}
            </span>
            <span className="font-mono-clean text-[10px] text-[#7A6B58] block">
              {spreadIndex === 0
                ? `Slot #1 - #${Math.min(pocketsPerPage, binder.totalPages * pocketsPerPage)}`
                : `Slot #${((leftPageNum || 1) - 1) * pocketsPerPage + 1} - #${Math.min(
                    (rightPageNum || leftPageNum || 1) * pocketsPerPage,
                    binder.totalPages * pocketsPerPage
                  )}`}
            </span>
          </div>

          {/* Mobile Single Page Indicator */}
          <div className="md:hidden">
            <span className="font-pixelify text-xs sm:text-sm font-bold text-[#1E293B]">
              HALAMAN {displayPage} / {binder.totalPages}
            </span>
            <span className="font-mono-clean text-[10px] text-[#7A6B58] block">
              (Slot #{(displayPage - 1) * pocketsPerPage + 1} - #{Math.min(displayPage * pocketsPerPage, binder.totalPages * pocketsPerPage)})
            </span>
          </div>
        </div>

        {/* Next Button */}
        <button
          type="button"
          onClick={() => {
            handleDesktopNav('next');
            handleMobileNav('next');
          }}
          disabled={spreadIndex >= totalSpreads - 1 && displayPage >= binder.totalPages || isFlipping}
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
        className="relative rounded-3xl p-2 sm:p-4 shadow-xl border-4 border-black/15 transition-all select-none overflow-hidden"
        style={{
          backgroundColor: binder.coverColor || '#963C30',
          backgroundImage: 'radial-gradient(rgba(0,0,0,0.12) 1px, transparent 1px)',
          backgroundSize: '12px 12px',
        }}
      >
        {/* Leather Stitched Border Effect Around Album */}
        <div className="absolute inset-1 rounded-[22px] border-2 border-dashed border-black/40 pointer-events-none"></div>

        {/* 3D Perspective Stage */}
        <div
          className="relative min-h-[460px] sm:min-h-[520px] rounded-2xl bg-[#E2D8C9] border border-[#C5B8A5] p-2 sm:p-3 shadow-inner"
          style={{ perspective: '1400px' }}
        >
          {/* MOBILE VIEW: Single Sleeve Page (< 768px) with Stitched Left Seam */}
          <div className="md:hidden flex">
            {/* Left Edge Stitched Seam (No metal rings!) */}
            <div className="w-3.5 flex-shrink-0 bg-black/15 border-r-2 border-dashed border-black/40 flex flex-col justify-around items-center py-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="w-1.5 h-1 bg-black/50 rounded-full"></div>
              ))}
            </div>

            {/* Mobile 3D Sheet Flip Container */}
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
              <div className="bg-[#FAF6F0] rounded-xl p-2 sm:p-2.5 border border-[#D5CABE] shadow-sm">
                {renderSlotsForPage(displayPage)}
              </div>
            </div>
          </div>

          {/* DESKTOP VIEW: Open 2-Page Spread (≥ 768px) */}
          <div className="hidden md:flex items-stretch gap-0">
            {/* Left Side: Inside Front Cover on Spread 0, OR Page leftPageNum on Spread > 0 */}
            <div className="flex-1 bg-[#FAF6F0] rounded-l-2xl rounded-r-xs p-3 border border-[#D5CABE] shadow-xs relative flex flex-col">
              {spreadIndex === 0 ? (
                renderInsideFrontCover()
              ) : leftPageNum ? (
                <>
                  <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-[#EAE3D8]">
                    <span className="font-pixelify text-xs font-bold text-[#7A6B58]">
                      HALAMAN {leftPageNum}
                    </span>
                    <span className="font-mono-clean text-[10px] text-[#A89A88]">
                      SLOT #{(leftPageNum - 1) * pocketsPerPage + 1} - #{leftPageNum * pocketsPerPage}
                    </span>
                  </div>
                  {renderSlotsForPage(leftPageNum)}
                </>
              ) : null}
            </div>

            {/* Center Spine with Black Stitched Seam Divider (NO RINGS!) */}
            <div className="w-5 sm:w-6 bg-[#2B1E14] flex flex-col items-center justify-center py-4 relative shadow-inner">
              <div className="h-full w-0.5 border-r-2 border-dashed border-black/60"></div>
              <div className="absolute inset-y-0 w-full flex flex-col justify-around items-center py-4 pointer-events-none">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="w-2.5 h-1 bg-black/60 rounded-full"></div>
                ))}
              </div>
            </div>

            {/* Right Side: Page 1 on Spread 0, OR Page rightPageNum / Inside Back Cover on Spread > 0 */}
            <div
              className={`flex-1 bg-[#FAF6F0] rounded-r-2xl rounded-l-xs p-3 border border-[#D5CABE] shadow-xs relative origin-left transition-all duration-400 flex flex-col ${
                isFlipping
                  ? flipDirection === 'next'
                    ? 'rotate-y-[-70deg] opacity-60 shadow-2xl'
                    : 'rotate-y-[70deg] opacity-60 shadow-2xl'
                  : 'rotate-y-0 opacity-100'
              }`}
              style={{ transformStyle: 'preserve-3d' }}
            >
              {rightPageNum ? (
                <>
                  <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-[#EAE3D8]">
                    <span className="font-pixelify text-xs font-bold text-[#7A6B58]">
                      HALAMAN {rightPageNum}
                    </span>
                    <span className="font-mono-clean text-[10px] text-[#A89A88]">
                      SLOT #{(rightPageNum - 1) * pocketsPerPage + 1} - #{Math.min(rightPageNum * pocketsPerPage, binder.totalPages * pocketsPerPage)}
                    </span>
                  </div>
                  {renderSlotsForPage(rightPageNum)}
                </>
              ) : (
                renderInsideBackCover()
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
