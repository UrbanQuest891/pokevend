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
    <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-amber-500/30 rounded-2xl p-4 shadow-xl no-print">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Zap className="w-4 h-4 fill-amber-400" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5">
              <span>Aksi Cepat Meja Event</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                Live Counter
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Ubah harga atau tandai terjual dalam 2 detik saat transaksi di tempat
            </p>
          </div>
        </div>

        {/* Form Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Binder Select */}
          <select
            value={selectedBinderId}
            onChange={(e) => setSelectedBinderId(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-semibold text-white focus:outline-none focus:border-amber-500 max-w-[180px]"
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
              className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-bold text-center text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Quick Price Input */}
          <div className="w-32">
            <input
              type="number"
              placeholder="Harga Baru"
              value={quickPrice}
              onChange={(e) => setQuickPrice(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-bold text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Action Buttons */}
          <button
            onClick={handleUpdatePrice}
            disabled={loading || !quickPrice || !slotNumberInput}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 flex items-center gap-1 transition-colors"
          >
            <Tag className="w-3.5 h-3.5" />
            Set Harga
          </button>

          <button
            onClick={() => handleToggleSold('SOLD')}
            disabled={loading || !slotNumberInput}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white flex items-center gap-1 transition-colors"
          >
            <XCircle className="w-3.5 h-3.5" />
            Set Terjual (Sold)
          </button>

          <button
            onClick={() => handleToggleSold('AVAILABLE')}
            disabled={loading || !slotNumberInput}
            className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white flex items-center gap-1 transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Available
          </button>

          <button
            onClick={handleInspectOrEdit}
            disabled={!slotNumberInput}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 transition-colors"
          >
            Detail Slot
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`mt-2 text-xs font-semibold p-2 rounded-lg flex items-center justify-between ${
            message.type === 'success'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-white">
            &times;
          </button>
        </div>
      )}
    </div>
  );
}
