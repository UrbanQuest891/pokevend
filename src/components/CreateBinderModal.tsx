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
  { name: 'Charizard Red', color: '#E05A47' },
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
  const [coverColor, setCoverColor] = useState('#E05A47');
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
      } else {
        const data = await res.json();
        alert(data.error || 'Gagal membuat binder');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan sistem');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs no-print font-clean">
      <div className="relative w-full max-w-lg bg-[#FAF6F0] border-2 border-[#D5CABE] rounded-3xl p-6 shadow-2xl text-[#1E293B]">
        <div className="flex items-center justify-between pb-3.5 border-b-2 border-[#EAE3D8]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#EAE3D8] text-[#E05A47] border border-[#D5CABE] flex items-center justify-center font-pixelify font-bold shadow-2xs">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-pixelify font-bold text-lg text-[#1E293B]">TAMBAH BINDER BARU</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white border border-[#D5CABE] text-[#7A6B58] hover:text-[#1E293B] flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block font-pixelify text-xs font-bold text-[#4A3E31] mb-1">
              NAMA BINDER <span className="text-[#E05A47]">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="misal: 🔥 Alt Art & Grail Hits atau ⭐ Singles Under 200k"
              className="w-full px-3.5 py-2.5 bg-white border border-[#D5CABE] rounded-xl text-xs font-bold text-[#1E293B] focus:outline-none focus:border-[#E05A47] shadow-inner"
            />
          </div>

          <div>
            <label className="block font-pixelify text-xs font-bold text-[#4A3E31] mb-1">DESKRIPSI SINGKAT</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="misal: Kartu kondisi NM, nego santai, terima tukar tambah"
              className="w-full px-3.5 py-2.5 bg-white border border-[#D5CABE] rounded-xl text-xs font-bold text-[#1E293B] focus:outline-none focus:border-[#E05A47] shadow-inner"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-pixelify text-xs font-bold text-[#4A3E31] mb-1">BADGE / KATEGORI</label>
              <input
                type="text"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                placeholder="misal: High End, Vintage, Slabs"
                className="w-full px-3.5 py-2.5 bg-white border border-[#D5CABE] rounded-xl text-xs font-bold text-[#1E293B] focus:outline-none focus:border-[#E05A47] shadow-inner"
              />
            </div>

            <div>
              <label className="block font-pixelify text-xs font-bold text-[#4A3E31] mb-1">MATA UANG</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as 'IDR' | 'USD')}
                className="w-full px-3.5 py-2.5 bg-white border border-[#D5CABE] rounded-xl text-xs font-bold text-[#1E293B] focus:outline-none focus:border-[#E05A47] shadow-2xs"
              >
                <option value="IDR">Rupiah (IDR)</option>
                <option value="USD">Dollar (USD)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-pixelify text-xs font-bold text-[#4A3E31] mb-1">TIPE POCKET BINDER</label>
              <select
                value={layoutType}
                onChange={(e) => setLayoutType(e.target.value as BinderLayout)}
                className="w-full px-3.5 py-2.5 bg-white border border-[#D5CABE] rounded-xl text-xs font-bold text-[#1E293B] focus:outline-none focus:border-[#E05A47] shadow-2xs"
              >
                <option value="9-pocket">9-Pocket (Standar 3x3)</option>
                <option value="4-pocket">4-Pocket (Kecil 2x2)</option>
                <option value="12-pocket">12-Pocket (Besar 3x4)</option>
              </select>
            </div>

            <div>
              <label className="block font-pixelify text-xs font-bold text-[#4A3E31] mb-1">JUMLAH HALAMAN</label>
              <input
                type="number"
                min={1}
                max={50}
                value={totalPages}
                onChange={(e) => setTotalPages(Math.max(1, Number(e.target.value)))}
                className="w-full px-3.5 py-2.5 bg-white border border-[#D5CABE] rounded-xl text-xs font-bold text-[#1E293B] focus:outline-none focus:border-[#E05A47] shadow-inner font-pixelify"
              />
            </div>
          </div>

          {/* Color Presets */}
          <div>
            <label className="block font-pixelify text-xs font-bold text-[#4A3E31] mb-1.5">WARNA AKSEN BINDER</label>
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map((p) => (
                <button
                  key={p.color}
                  type="button"
                  onClick={() => setCoverColor(p.color)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform cursor-pointer ${
                    coverColor === p.color ? 'scale-110 ring-2 ring-[#1E293B] ring-offset-2 ring-offset-[#FAF6F0]' : ''
                  }`}
                  style={{ backgroundColor: p.color }}
                  title={p.name}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t-2 border-[#EAE3D8]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-pixelify font-bold text-[#7A6B58] hover:text-[#1E293B] hover:bg-white transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-pixelify text-xs font-bold bg-[#E05A47] hover:bg-[#C94735] text-white shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              {submitting ? 'Membuat...' : 'BUAT BINDER'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
