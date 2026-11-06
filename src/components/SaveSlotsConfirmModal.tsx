'use client';

import React from 'react';
import { AlertTriangle, X, Check, ArrowRight, Layers, ShieldAlert, CheckCircle2, RefreshCw } from 'lucide-react';
import { PokemonCard } from '@/types';
import { formatCurrency } from '@/lib/qr';
import { formatCardImageUrl } from '@/lib/imageHelper';

export interface SlotChangeItem {
  slotNumber: number;
  originalCard?: PokemonCard | null;
  newCard?: PokemonCard | null;
}

interface SaveSlotsConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isSaving: boolean;
  changes: SlotChangeItem[];
  currency?: 'IDR' | 'USD';
}

export default function SaveSlotsConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  isSaving,
  changes,
  currency = 'IDR',
}: SaveSlotsConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 no-print">
      <div className="relative w-full max-w-lg bg-slate-900 border border-amber-500/40 rounded-3xl p-6 text-slate-100 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isSaving}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-40"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with Warning Icon */}
        <div className="flex items-center gap-3.5 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/50 text-amber-400 flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-500/10">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white">Konfirmasi Perubahan Posisi Slot</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Tinjau kembali susunan slot kartu baru sebelum disimpan permanen ke sistem.
            </p>
          </div>
        </div>

        {/* Warning Callout Box */}
        <div className="bg-gradient-to-r from-amber-950/60 to-red-950/40 border border-amber-500/50 rounded-2xl p-4 mb-4 text-xs space-y-2">
          <div className="flex items-center gap-2 text-amber-300 font-extrabold uppercase tracking-wide text-[11px]">
            <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>Peringatan Penting Untuk Seller</span>
          </div>
          <p className="text-amber-100/90 leading-relaxed">
            Menyimpan perubahan ini akan <strong>langsung mengubah urutan display</strong> di katalog pembeli dan <strong>nomor slot barcode/QR</strong> yang discan pelanggan.
          </p>
          <p className="text-amber-200/80 text-[11px]">
            ⚠️ Pastikan posisi kartu fisik di binder display asli Anda telah disesuaikan dengan urutan slot baru ini agar pembeli menerima kartu yang tepat.
          </p>
        </div>

        {/* Changes Summary Header */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>Rincian Perubahan ({changes.length} Slot Berubah)</span>
          </span>
          <span className="text-[10px] text-slate-400">Sebelum ➔ Sesudah</span>
        </div>

        {/* Scrollable Changes List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 mb-5 max-h-60 border border-slate-800 rounded-2xl p-2.5 bg-slate-950/60">
          {changes.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500">
              Tidak ada perubahan posisi slot yang terdeteksi.
            </div>
          ) : (
            changes.map((item) => (
              <div
                key={item.slotNumber}
                className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3 text-xs"
              >
                {/* Slot Badge */}
                <div className="flex-shrink-0">
                  <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-amber-400 font-black text-[10px]">
                    SLOT #{item.slotNumber}
                  </span>
                </div>

                {/* Old Card vs New Card */}
                <div className="flex-1 grid grid-cols-[1fr,auto,1fr] items-center gap-2 min-w-0">
                  {/* Previous State */}
                  <div className="min-w-0 flex items-center gap-1.5 opacity-60">
                    {item.originalCard ? (
                      <>
                        <img
                          src={formatCardImageUrl(item.originalCard.imageUrl)}
                          alt={item.originalCard.name}
                          className="w-6 h-8 object-contain rounded bg-slate-950 border border-slate-800 flex-shrink-0"
                        />
                        <span className="truncate text-[11px] text-slate-300 line-through">
                          {item.originalCard.name}
                        </span>
                      </>
                    ) : (
                      <span className="text-[11px] text-slate-500 italic">Slot Kosong</span>
                    )}
                  </div>

                  {/* Arrow Indicator */}
                  <ArrowRight className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />

                  {/* New State */}
                  <div className="min-w-0 flex items-center gap-1.5 font-bold text-white">
                    {item.newCard ? (
                      <>
                        <img
                          src={formatCardImageUrl(item.newCard.imageUrl)}
                          alt={item.newCard.name}
                          className="w-6 h-8 object-contain rounded bg-slate-950 border border-amber-500/40 flex-shrink-0"
                        />
                        <div className="min-w-0 truncate">
                          <p className="truncate text-[11px] text-emerald-300">{item.newCard.name}</p>
                          <p className="text-[9px] text-amber-400">{formatCurrency(item.newCard.price, currency)}</p>
                        </div>
                      </>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">Dikosongkan</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors disabled:opacity-40"
          >
            Periksa Kembali
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isSaving || changes.length === 0}
            className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:brightness-110 text-white text-xs font-black transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-40 flex items-center justify-center gap-1.5"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Ya, Simpan Perubahan</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
