'use client';

import React from 'react';
import { formatCurrency } from '@/lib/qr';
import { CheckCircle2, Plus, ArrowRight, Sparkles, Layers } from 'lucide-react';

interface QuickRestockModalProps {
  isOpen: boolean;
  soldSlots: Array<{
    binderId: string;
    slotNumber: number;
    cardName: string;
    soldPrice: number;
  }>;
  orderNumber: string;
  onClose: () => void;
  onRestockSlot: (binderId: string, slotNumber: number) => void;
  currency?: 'IDR' | 'USD';
}

export default function QuickRestockModal({
  isOpen,
  soldSlots,
  orderNumber,
  onClose,
  onRestockSlot,
  currency = 'IDR',
}: QuickRestockModalProps) {
  if (!isOpen || soldSlots.length === 0) return null;

  const totalSold = soldSlots.reduce((acc, s) => acc + s.soldPrice, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="w-full max-w-md bg-slate-900 border-2 border-emerald-500/50 rounded-3xl p-6 shadow-2xl animate-fadeInUp text-slate-100 space-y-4">
        {/* Celebration Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center mx-auto shadow-lg">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <h3 className="font-pixelify text-lg font-bold text-white tracking-tight">
            TRANSAKSI #{orderNumber} BERHASIL!
          </h3>

          <p className="text-xs text-slate-300">
            Total penerimaan <span className="font-pixelify font-bold text-emerald-400">{formatCurrency(totalSold, currency)}</span> telah resmi dicatat ke{' '}
            <span className="font-bold text-white underline">Riwayat Penjualan</span>.
          </p>
        </div>

        {/* List of emptied binder slots */}
        <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-2.5">
          <div className="font-pixelify text-xs font-bold text-amber-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>SLOT BINDER KINI KOSONG (READY RESTOCK):</span>
          </div>

          <div className="divide-y divide-slate-800/80 text-xs">
            {soldSlots.map((slot) => (
              <div key={`${slot.binderId}-${slot.slotNumber}`} className="py-2.5 flex items-center justify-between">
                <div className="min-w-0 pr-2">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span className="font-pixelify px-1.5 py-0.5 rounded bg-slate-800 text-amber-400 text-[10px]">
                      Slot #{slot.slotNumber}
                    </span>
                    <span className="truncate">{slot.cardName}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Terjual seharga {formatCurrency(slot.soldPrice, currency)}
                  </div>
                </div>

                {/* Optional Quick Restock Button per Slot */}
                <button
                  type="button"
                  onClick={() => onRestockSlot(slot.binderId, slot.slotNumber)}
                  className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/40 font-pixelify text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer flex-shrink-0"
                  title="Langsung masukkan kartu baru ke slot kosong ini"
                >
                  <Plus className="w-3 h-3" />
                  <span>Isi Slot</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons: Primary Skip / Done vs Optional Quick Restock */}
        <div className="space-y-2 pt-2">
          {/* PRIMARY BUTTON: NON-INTRUSIVE / CAN SKIP IMMEDIATELY */}
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-pixelify text-xs font-bold shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
          >
            <span>SELESAI • LAYANI PEMBELI BERIKUTNYA ▶</span>
          </button>

          <p className="text-[11px] text-center text-slate-400">
            Anda bisa mengisi slot kosong kapan saja nanti lewat dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}
