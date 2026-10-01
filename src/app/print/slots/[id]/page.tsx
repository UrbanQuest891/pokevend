'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Binder, PokemonCard } from '@/types';
import { generateQrDataUrl, formatCurrency } from '@/lib/qr';
import { Printer, ArrowLeft, Settings2, Sliders, CheckSquare, Square } from 'lucide-react';

interface SlotQrItem {
  slotNumber: number;
  qrDataUrl: string;
  card?: PokemonCard | null;
}

export default function PrintSlotStickersPage() {
  const params = useParams();
  const binderId = params.id as string;

  const [binder, setBinder] = useState<Binder | null>(null);
  const [items, setItems] = useState<SlotQrItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Print settings
  const [filterMode, setFilterMode] = useState<'all' | 'filled-only' | 'page'>('all');
  const [selectedPage, setSelectedPage] = useState<number>(1);
  const [includeCardDetails, setIncludeCardDetails] = useState<boolean>(true);
  const [stickerColumns, setStickerColumns] = useState<number>(4);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await fetch(`/api/binders/${binderId}`);
        const data = await res.json();
        if (data.success) {
          const b: Binder = data.binder;
          setBinder(b);

          const pocketsPerPage = b.layoutType === '4-pocket' ? 4 : b.layoutType === '12-pocket' ? 12 : 9;
          const totalSlots = b.totalPages * pocketsPerPage;

          const origin = typeof window !== 'undefined' ? window.location.origin : '';
          const generatedItems: SlotQrItem[] = [];

          for (let s = 1; s <= totalSlots; s++) {
            const card = b.slots[s] || null;
            // Short URL for higher QR density and faster mobile camera recognition
            const slotUrl = `${origin}/b/${b.id}/slot/${s}`;
            const qrDataUrl = await generateQrDataUrl(slotUrl, { width: 220, margin: 1 });
            generatedItems.push({
              slotNumber: s,
              qrDataUrl,
              card,
            });
          }

          setItems(generatedItems);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (binderId) loadData();
  }, [binderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
        <p className="text-sm font-bold">Membuat lembar stiker QR Code untuk semua slot...</p>
      </div>
    );
  }

  if (!binder) return null;

  const pocketsPerPage = binder.layoutType === '4-pocket' ? 4 : binder.layoutType === '12-pocket' ? 12 : 9;

  // Filter slots to display
  const displayedItems = items.filter((item) => {
    if (filterMode === 'filled-only') {
      return !!item.card;
    }
    if (filterMode === 'page') {
      const pageStart = (selectedPage - 1) * pocketsPerPage + 1;
      const pageEnd = selectedPage * pocketsPerPage;
      return item.slotNumber >= pageStart && item.slotNumber <= pageEnd;
    }
    return true; // all
  });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 sm:p-6 print:bg-white print:text-black print:p-0">
      {/* Configuration Header (Hidden on Print) */}
      <div className="max-w-5xl mx-auto mb-6 bg-slate-950 border border-slate-800 rounded-3xl p-5 shadow-2xl no-print space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <a
              href={`/admin/binder/${binder.id}`}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300"
            >
              <ArrowLeft className="w-4 h-4" />
            </a>
            <div>
              <h1 className="text-lg font-black text-white">Cetak Lembar Stiker QR Slot</h1>
              <p className="text-xs text-slate-400">
                {binder.name} • Total {displayedItems.length} Stiker Siap Cetak
              </p>
            </div>
          </div>

          <button
            onClick={() => window.print()}
            className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-500 hover:brightness-110 active:scale-95 text-white font-extrabold text-xs shadow-lg shadow-red-500/20 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Lembar Stiker (Print / PDF)</span>
          </button>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Filter Slot yang Dicetak:
            </label>
            <select
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-semibold focus:outline-none focus:border-amber-500"
            >
              <option value="all">Cetak Semua Slot (1 - {items.length})</option>
              <option value="filled-only">Cetak Hanya Slot yang Berisi Kartu</option>
              <option value="page">Cetak Per Halaman Tertentu</option>
            </select>
          </div>

          {filterMode === 'page' && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Pilih Halaman:
              </label>
              <select
                value={selectedPage}
                onChange={(e) => setSelectedPage(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-semibold focus:outline-none focus:border-amber-500"
              >
                {Array.from({ length: binder.totalPages }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Halaman {i + 1} (Slot #{i * pocketsPerPage + 1} - #{(i + 1) * pocketsPerPage})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Tipe Stiker:
            </label>
            <button
              onClick={() => setIncludeCardDetails(!includeCardDetails)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-semibold flex items-center justify-between text-left"
            >
              <span>{includeCardDetails ? 'Stiker + Nama Kartu & Harga' : 'Stiker Permanen (Hanya Slot #)'}</span>
              <span className="text-amber-400 font-bold text-[10px] uppercase">
                {includeCardDetails ? 'Spesifik' : 'Reusable'}
              </span>
            </button>
          </div>
        </div>

        {/* Tip */}
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-200">
          💡 <strong>Tips Seller:</strong> Gunakan opsi <em>"Stiker Permanen (Hanya Slot #)"</em> jika Anda ingin menempelkan stiker QR satu kali saja di sleeve / saku binder. Setiap kali Anda mengganti kartu atau mengubah harga di website, QR code tidak perlu dicetak ulang karena link-nya selalu terhubung ke slot tersebut!
        </div>
      </div>

      {/* Printable Sheet (Standard A4 / Letter format) */}
      <div className="max-w-5xl mx-auto bg-white text-slate-900 p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-300 print:shadow-none print:border-none print:p-0 print:m-0">
        <div className="hidden print:block mb-4 pb-2 border-b border-slate-300">
          <div className="text-sm font-black text-slate-900">
            {binder.name} • Lembar Stiker QR Barcode Slot Binder
          </div>
          <div className="text-xs text-slate-500">
            {binder.sellerName} • {binder.boothName} • Tempelkan di pojok sleeve atau saku binder
          </div>
        </div>

        {/* Sticker Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 print:grid-cols-4 gap-2.5 sm:gap-3 print:gap-2">
          {displayedItems.map(({ slotNumber, qrDataUrl, card }) => {
            return (
              <div
                key={slotNumber}
                className="border-2 border-dashed border-slate-300 print:border print:border-slate-400 rounded-xl p-2.5 flex items-center gap-2.5 bg-white shadow-sm print:shadow-none break-inside-avoid"
              >
                {/* QR Code */}
                <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 bg-white p-0.5 border border-slate-200 rounded-lg flex items-center justify-center">
                  <img src={qrDataUrl} alt={`QR Slot ${slotNumber}`} className="w-full h-full object-contain" />
                </div>

                {/* Info Text */}
                <div className="flex-1 min-w-0 text-left">
                  <div className="inline-block px-1.5 py-0.5 rounded bg-slate-900 text-white font-black text-[10px] tracking-wider mb-0.5">
                    SLOT #{slotNumber}
                  </div>

                  <div className="text-[9px] font-bold text-slate-500 uppercase truncate">
                    {binder.name}
                  </div>

                  {includeCardDetails && card ? (
                    <div className="mt-0.5">
                      <div className="text-[10px] font-extrabold text-slate-900 leading-tight truncate">
                        {card.name}
                      </div>
                      <div className="text-[11px] font-black text-red-600">
                        {formatCurrency(card.price, binder.currency)}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-1 text-[8px] font-bold text-slate-400 leading-tight uppercase">
                      Scan untuk Cek Harga Live
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
