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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-clean">
      <div className="w-full max-w-md bg-[#FAF6F0] border-2 border-[#D5CABE] rounded-3xl p-6 shadow-2xl animate-fadeInUp text-[#1E293B] space-y-4">
        {/* Celebration Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-full bg-emerald-100 border-2 border-emerald-400 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <h3 className="font-pixelify text-lg font-bold text-[#1E293B] tracking-tight">
            TRANSAKSI #{orderNumber} BERHASIL!
          </h3>

          <p className="text-xs text-[#5D4E3E]">
            Total penerimaan <span className="font-pixelify font-bold text-[#2E7D32]">{formatCurrency(totalSold, currency)}</span> telah resmi dicatat ke{' '}
            <span className="font-bold text-[#1E293B] underline">Riwayat Penjualan</span>.
          </p>
        </div>

        {/* List of emptied binder slots */}
        <div className="p-3.5 bg-white border border-[#D5CABE] rounded-2xl space-y-2.5 shadow-2xs">
          <div className="font-pixelify text-xs font-bold text-[#4A3E31] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#E05A47]" />
            <span>SLOT BINDER KINI KOSONG (READY RESTOCK):</span>
          </div>

          <div className="divide-y divide-[#EAE3D8] text-xs">
            {soldSlots.map((slot) => (
              <div key={`${slot.binderId}-${slot.slotNumber}`} className="py-2.5 flex items-center justify-between">
                <div className="min-w-0 pr-2">
                  <div className="font-bold text-[#1E293B] flex items-center gap-1.5">
                    <span className="font-pixelify px-1.5 py-0.5 rounded bg-[#EAE3D8] text-[#4A3E31] text-[10px]">
                      Slot #{slot.slotNumber}
                    </span>
                    <span className="truncate">{slot.cardName}</span>
                  </div>
                  <div className="text-[10px] text-[#7A6B58] mt-0.5 font-mono-clean">
                    Terjual seharga {formatCurrency(slot.soldPrice, currency)}
                  </div>
                </div>

                {/* Optional Quick Restock Button per Slot */}
                <button
                  type="button"
                  onClick={() => onRestockSlot(slot.binderId, slot.slotNumber)}
                  className="px-2.5 py-1.5 rounded-xl bg-[#EAE3D8] hover:bg-[#E05A47] text-[#4A3E31] hover:text-white border border-[#D5CABE] font-pixelify text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer flex-shrink-0 shadow-2xs"
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
            className="w-full py-3.5 bg-[#2E7D32] hover:bg-[#25632A] text-white rounded-2xl font-pixelify text-xs font-bold shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            <span>SELESAI • LAYANI PEMBELI BERIKUTNYA ▶</span>
          </button>

          <p className="text-[11px] text-center text-[#7A6B58]">
            Anda bisa mengisi slot kosong kapan saja nanti lewat dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}
