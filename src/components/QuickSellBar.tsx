'use client';

import React, { useState } from 'react';
import { Zap, CheckCircle2, XCircle, Tag, ArrowRight } from 'lucide-react';
import { Binder, PokemonCard } from '@/types';
import { formatCurrency } from '@/lib/qr';

interface QuickSellBarProps {
  binders: Binder[];
  onActionComplete: () => void;
  onOpenEditModal: (binderId: string, slotNumber: number, existingCard?: PokemonCard | null) => void;
}

export default function QuickSellBar({ binders, onActionComplete, onOpenEditModal }: QuickSellBarProps) {
  const [selectedBinderId, setSelectedBinderId] = useState<string>(binders[0]?.id || '');
  const [slotNumberInput, setSlotNumberInput] = useState<string>('');
  const [quickPrice, setQuickPrice] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const activeBinder = binders.find((b) => b.id === selectedBinderId) || binders[0];

  const handleToggleSold = async (status: 'SOLD' | 'AVAILABLE') => {
    const slotNum = parseInt(slotNumberInput, 10);
    if (isNaN(slotNum) || !activeBinder) {
      setMessage({ text: 'Masukkan nomor slot yang valid', type: 'error' });
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/binders/${activeBinder.id}/slots/${slotNum}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({
          text: `Slot #${slotNum} (${data.card.name}) berhasil diubah ke ${status}!`,
          type: 'success',
        });
        onActionComplete();
        setTimeout(() => setMessage(null), 4000);
      } else {
        setMessage({ text: data.error || 'Gagal mengubah status', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Terjadi kesalahan sistem', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePrice = async () => {
    const slotNum = parseInt(slotNumberInput, 10);
    const newPrice = Number(quickPrice);
    if (isNaN(slotNum) || isNaN(newPrice) || !activeBinder) {
      setMessage({ text: 'Masukkan nomor slot dan nominal harga valid', type: 'error' });
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/binders/${activeBinder.id}/slots/${slotNum}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: newPrice }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({
          text: `Harga Slot #${slotNum} (${data.card.name}) diubah ke ${formatCurrency(newPrice, activeBinder.currency)}!`,
          type: 'success',
        });
        setQuickPrice('');
        onActionComplete();
        setTimeout(() => setMessage(null), 4000);
      } else {
        setMessage({ text: data.error || 'Gagal mengubah harga', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Terjadi kesalahan sistem', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleInspectOrEdit = () => {
    const slotNum = parseInt(slotNumberInput, 10);
    if (isNaN(slotNum) || !activeBinder) {
      setMessage({ text: 'Masukkan nomor slot untuk diedit', type: 'error' });
      return;
    }
    const card = activeBinder.slots[slotNum] || null;
    onOpenEditModal(activeBinder.id, slotNum, card);
  };

  return (
    <div className="bg-[#FAF6F0] border-2 border-[#D5CABE] rounded-2xl p-4 shadow-xs no-print text-[#1E293B]">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#EAE3D8] border border-[#D5CABE] flex items-center justify-center text-[#E05A47]">
            <Zap className="w-4 h-4 fill-[#E05A47]" />
          </div>
          <div>
            <h3 className="font-pixelify font-bold text-sm text-[#1E293B] flex items-center gap-1.5">
              <span>AKSI CEPAT MEJA EVENT</span>
              <span className="font-pixelify text-[10px] px-2 py-0.5 rounded-full bg-[#EAE3D8] text-[#7A6B58] font-bold border border-[#D5CABE]">
                Live Counter
              </span>
            </h3>
            <p className="text-[11px] text-[#7A6B58]">
              Ubah harga atau tandai status kartu dalam sekejap saat transaksi di booth
            </p>
          </div>
        </div>

        {/* Form Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Binder Select */}
          <select
            value={selectedBinderId}
            onChange={(e) => setSelectedBinderId(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-[#D5CABE] rounded-xl text-xs font-bold text-[#1E293B] focus:outline-none focus:border-[#E05A47] max-w-[180px] shadow-2xs"
          >
            {binders.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>

          {/* Slot Number Input */}
          <div className="w-24">
            <input
              type="number"
              min={1}
              placeholder="No. Slot"
              value={slotNumberInput}
              onChange={(e) => setSlotNumberInput(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white border border-[#D5CABE] rounded-xl text-xs font-bold text-center text-[#1E293B] focus:outline-none focus:border-[#E05A47] shadow-inner font-pixelify"
            />
          </div>

          {/* Quick Price Input */}
          <div className="w-32">
            <input
              type="number"
              placeholder="Harga Baru"
              value={quickPrice}
              onChange={(e) => setQuickPrice(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white border border-[#D5CABE] rounded-xl text-xs font-bold text-[#1E293B] focus:outline-none focus:border-[#E05A47] shadow-inner font-pixelify"
            />
          </div>

          {/* Action Buttons */}
          <button
            onClick={handleUpdatePrice}
            disabled={loading || !quickPrice || !slotNumberInput}
            className="px-3 py-1.5 rounded-xl font-pixelify text-xs font-bold bg-white hover:bg-[#FAF6F0] border border-[#D5CABE] text-[#1E293B] disabled:opacity-40 flex items-center gap-1 transition-all shadow-2xs cursor-pointer"
          >
            <Tag className="w-3.5 h-3.5 text-[#E05A47]" />
            Set Harga
          </button>

          <button
            onClick={() => handleToggleSold('SOLD')}
            disabled={loading || !slotNumberInput}
            className="px-3 py-1.5 rounded-xl font-pixelify text-xs font-bold bg-[#E05A47] hover:bg-[#C94735] disabled:opacity-40 text-white flex items-center gap-1 transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <XCircle className="w-3.5 h-3.5" />
            Set Terjual
          </button>

          <button
            onClick={() => handleToggleSold('AVAILABLE')}
            disabled={loading || !slotNumberInput}
            className="px-2.5 py-1.5 rounded-xl font-pixelify text-xs font-bold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white flex items-center gap-1 transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Available
          </button>

          <button
            onClick={handleInspectOrEdit}
            disabled={!slotNumberInput}
            className="px-2.5 py-1.5 rounded-xl font-pixelify text-xs font-bold bg-white hover:bg-[#FAF6F0] border border-[#D5CABE] disabled:opacity-40 text-[#7A6B58] hover:text-[#1E293B] transition-colors shadow-2xs cursor-pointer"
          >
            Detail Slot
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`mt-2.5 text-xs font-bold p-2.5 rounded-xl flex items-center justify-between ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
              : 'bg-rose-50 text-rose-800 border border-rose-300'
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-[#7A6B58] hover:text-[#1E293B]">
            &times;
          </button>
        </div>
      )}
    </div>
  );
}
