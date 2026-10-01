'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  ShoppingBag,
  Check,
  Tag,
  Maximize2,
  Info,
} from 'lucide-react';
import { PokemonCard } from '@/types';
import { formatCurrency } from '@/lib/qr';

interface CardImageLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  card: PokemonCard | null;
  slotNumber: number;
  binderName?: string;
  currency?: 'IDR' | 'USD';
  isInWishlist?: boolean;
  onToggleWishlist?: () => void;
}

export default function CardImageLightbox({
  isOpen,
  onClose,
  card,
  slotNumber,
  binderName,
  currency = 'IDR',
  isInWishlist = false,
  onToggleWishlist,
}: CardImageLightboxProps) {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [showHolo, setShowHolo] = useState<boolean>(true);

  // Reset zoom on open/close
  useEffect(() => {
    if (isOpen) {
      setZoomLevel(1);
      // Disable body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle keyboard shortcuts (Esc to close, +/- for zoom)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === '+' || e.key === '=') setZoomLevel((z) => Math.min(2.5, z + 0.3));
      if (e.key === '-') setZoomLevel((z) => Math.max(1, z - 0.3));
      if (e.key === '0') setZoomLevel(1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !card) return null;

  // Derive high-res image URL: TCGdex assets support appending /high.webp for max quality
  const highResUrl = card.imageUrl?.includes('assets.tcgdex.net')
    ? card.imageUrl.replace(/\/(high\.webp|high\.png|low\.webp|low\.png)?$/, '') + '/high.webp'
    : card.imageUrl;

  const handleToggleZoom = () => {
    if (zoomLevel === 1) setZoomLevel(1.6);
    else if (zoomLevel < 2) setZoomLevel(2.2);
    else setZoomLevel(1);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-between bg-black/95 backdrop-blur-md p-2 sm:p-4 text-white overflow-hidden animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Top Floating Control Bar */}
      <div
        className="w-full max-w-2xl mx-auto flex items-center justify-between gap-3 p-3 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-md z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 text-xs font-black tracking-wider flex-shrink-0">
            SLOT #{slotNumber}
          </span>
          <div className="min-w-0">
            <h3 className="font-extrabold text-xs sm:text-sm text-white truncate">{card.name}</h3>
            <p className="text-[11px] text-slate-400 truncate">
              {card.condition} • {card.setName}
            </p>
          </div>
        </div>

        {/* Zoom Controls & Close */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => setZoomLevel((z) => Math.max(1, +(z - 0.3).toFixed(1)))}
            disabled={zoomLevel <= 1}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-200 transition-colors"
            title="Perkecil (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <button
            onClick={handleToggleZoom}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-mono font-bold text-amber-300 transition-colors"
            title="Klik untuk Zoom"
          >
            {Math.round(zoomLevel * 100)}%
          </button>

          <button
            onClick={() => setZoomLevel((z) => Math.min(2.5, +(z + 0.3).toFixed(1)))}
            disabled={zoomLevel >= 2.5}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-200 transition-colors"
            title="Perbesar (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            onClick={() => setZoomLevel(1)}
            disabled={zoomLevel === 1}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-200 transition-colors hidden sm:block"
            title="Reset Zoom (0)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold ml-1 transition-colors"
            title="Tutup (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Image Stage (Click to toggle Zoom) */}
      <div
        className="flex-1 w-full flex items-center justify-center p-2 overflow-auto cursor-zoom-in relative select-none"
        onClick={(e) => {
          e.stopPropagation();
          handleToggleZoom();
        }}
      >
        <div
          className="relative transition-transform duration-300 ease-out max-h-[72vh] max-w-full flex items-center justify-center"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          {highResUrl ? (
            <div className={`relative rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-slate-700/80 bg-slate-950 ${showHolo ? 'holo-shine' : ''}`}>
              <img
                src={highResUrl}
                alt={card.name}
                className="max-h-[68vh] sm:max-h-[72vh] w-auto object-contain rounded-3xl pointer-events-none"
              />

              {card.status === 'SOLD' && (
                <div className="absolute inset-0 bg-black/75 flex items-center justify-center pointer-events-none">
                  <span className="px-6 py-2.5 bg-red-600 text-white font-black text-base sm:text-lg uppercase tracking-widest rounded-2xl rotate-[-12deg] shadow-2xl border-2 border-white/20">
                    SUDAH TERJUAL
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="w-64 h-96 bg-slate-900 border border-slate-800 rounded-3xl flex items-center justify-center text-slate-500 text-sm">
              Tidak ada gambar
            </div>
          )}
        </div>

        {/* Tap to zoom hint overlay */}
        <div className="absolute bottom-2 inset-x-0 flex justify-center pointer-events-none">
          <div className="px-3 py-1 rounded-full bg-black/70 border border-slate-800 text-[11px] text-slate-300 font-semibold shadow-lg backdrop-blur-sm flex items-center gap-1.5">
            <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Tap gambar untuk perbesar ({zoomLevel > 1 ? '100%' : 'Zoom In'})</span>
          </div>
        </div>
      </div>

      {/* Bottom Floating Info & Action Tray */}
      <div
        className="w-full max-w-2xl mx-auto p-3 sm:p-4 bg-slate-900/95 border border-slate-800 rounded-3xl shadow-2xl backdrop-blur-md z-10 space-y-2.5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg sm:text-xl font-black text-amber-400">
                {formatCurrency(card.price, currency)}
              </span>
              {card.originalPrice && card.originalPrice > card.price && (
                <span className="text-xs line-through text-slate-500">
                  {formatCurrency(card.originalPrice, currency)}
                </span>
              )}
              <span
                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                  card.status === 'AVAILABLE'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : card.status === 'SOLD'
                    ? 'bg-rose-500/20 text-rose-400'
                    : 'bg-amber-500/20 text-amber-400'
                }`}
              >
                {card.status === 'AVAILABLE' ? 'Ready di Meja' : card.status}
              </span>
            </div>

            {card.notes && (
              <p className="text-xs text-amber-300/90 italic mt-0.5 line-clamp-1">
                "{card.notes}"
              </p>
            )}
          </div>

          {/* Action button */}
          <div className="flex items-center gap-2">
            {onToggleWishlist && (
              <button
                type="button"
                onClick={onToggleWishlist}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 ${
                  isInWishlist
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : 'bg-gradient-to-r from-red-600 to-amber-500 text-white hover:brightness-110'
                }`}
              >
                {isInWishlist ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Sudah di Wishlist</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>Mau Beli Kartu Ini</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Kembali
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
