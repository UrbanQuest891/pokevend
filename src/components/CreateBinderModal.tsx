'use client';

import React, { useState } from 'react';
import { X, Layers, Plus, Sparkles } from 'lucide-react';
import { BinderLayout } from '@/types';

interface CreateBinderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const COLOR_PRESETS = [
  { name: 'Charizard Red', color: '#DC2626' },
  { name: 'Blastoise Blue', color: '#2563EB' },
  { name: 'Venusaur Green', color: '#16A34A' },
  { name: 'Gengar Purple', color: '#9333EA' },
  { name: 'Pikachu Yellow', color: '#EAB308' },
  { name: 'Umbreon Dark', color: '#334155' },
  { name: 'Arceus Gold', color: '#D97706' },
];

export default function CreateBinderModal({ isOpen, onClose, onCreated }: CreateBinderModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [badge, setBadge] = useState('Hits');
  const [coverColor, setCoverColor] = useState('#DC2626');
  const [layoutType, setLayoutType] = useState<BinderLayout>('9-pocket');
  const [totalPages, setTotalPages] = useState(5);
  const [currency, setCurrency] = useState<'IDR' | 'USD'>('IDR');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Nama binder wajib diisi');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/binders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          badge,
          coverColor,
          layoutType,
          totalPages: Number(totalPages),
          currency,
        }),
      });

      if (res.ok) {
        onCreated();
        onClose();
        setName('');
        setDescription('');
      } else {
        alert('Gagal membuat binder');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm no-print">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl text-slate-100">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-lg text-white">Tambah Binder Baru</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nama Binder <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="misal: 🔥 Alt Art & Grail Hits atau ⭐ Singles Under 200k"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Deskripsi Singkat</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="misal: Kartu kondisi NM, nego santai, terima tukar tambah"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Badge / Kategori</label>
              <input
                type="text"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                placeholder="misal: High End, Vintage, Slabs"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Mata Uang</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as 'IDR' | 'USD')}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-red-500"
              >
                <option value="IDR">Rupiah (IDR)</option>
                <option value="USD">Dollar (USD)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Tipe Pocket Binder</label>
              <select
                value={layoutType}
                onChange={(e) => setLayoutType(e.target.value as BinderLayout)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-red-500"
              >
                <option value="9-pocket">9-Pocket (Standar 3x3)</option>
                <option value="4-pocket">4-Pocket (Kecil 2x2)</option>
                <option value="12-pocket">12-Pocket (Besar 3x4)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Jumlah Halaman</label>
              <input
                type="number"
                min={1}
                max={50}
                value={totalPages}
                onChange={(e) => setTotalPages(Math.max(1, Number(e.target.value)))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          {/* Color Presets */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Warna Aksen Binder</label>
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map((p) => (
                <button
                  key={p.color}
                  type="button"
                  onClick={() => setCoverColor(p.color)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform ${
                    coverColor === p.color ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-slate-900' : ''
                  }`}
                  style={{ backgroundColor: p.color }}
                  title={p.name}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-red-600 to-amber-500 text-white shadow-lg shadow-red-500/20 hover:brightness-110 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              {submitting ? 'Membuat...' : 'Buat Binder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
