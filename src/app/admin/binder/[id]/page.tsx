'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import EditSlotModal from '@/components/EditSlotModal';
import QrCodeModal from '@/components/QrCodeModal';
import { Binder, PokemonCard } from '@/types';
import { formatCurrency } from '@/lib/qr';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit3,
  ExternalLink,
  Printer,
  QrCode,
  Tag,
  Percent,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Layers,
} from 'lucide-react';

export default function BinderEditorPage() {
  const params = useParams();
  const router = useRouter();
  const binderId = params.id as string;

  const [binder, setBinder] = useState<Binder | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [discountPercent, setDiscountPercent] = useState('');
  const [applyingDiscount, setApplyingDiscount] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  // Edit slot modal state
  const [editModalData, setEditModalData] = useState<{
    isOpen: boolean;
    slotNumber: number;
    existingCard?: PokemonCard | null;
  }>({
    isOpen: false,
    slotNumber: 1,
    existingCard: null,
  });

  const fetchBinder = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/binders/${binderId}`);
      const data = await res.json();
      if (data.success) {
        setBinder(data.binder);
      } else {
        alert('Binder tidak ditemukan');
        router.push('/');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (binderId) fetchBinder();
  }, [binderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-400">Memuat data binder...</p>
        </div>
      </div>
    );
  }

  if (!binder) return null;

  const pocketsPerPage = binder.layoutType === '4-pocket' ? 4 : binder.layoutType === '12-pocket' ? 12 : 9;
  const startSlot = (currentPage - 1) * pocketsPerPage + 1;
  const endSlot = currentPage * pocketsPerPage;
  const slotsList = Object.values(binder.slots || {});
  const totalCards = slotsList.length;
  const totalValue = slotsList.reduce((sum, c) => sum + (c.price || 0), 0);

  const handleApplyDiscount = async () => {
    const val = Number(discountPercent);
    if (isNaN(val) || val <= 0 || val >= 90) {
      alert('Masukkan persentase diskon antara 1% - 89%');
      return;
    }
    if (!confirm(`Terapkan diskon ${val}% ke SEMUA kartu yang masih AVAILABLE di binder ini?`)) return;

    try {
      setApplyingDiscount(true);
      const res = await fetch(`/api/binders/${binder.id}/discount`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discount: val }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(`Berhasil memberikan diskon ${val}% ke ${data.modifiedCount} kartu!`);
        setDiscountPercent('');
        fetchBinder();
      } else {
        alert(data.error || 'Gagal menerapkan diskon');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setApplyingDiscount(false);
    }
  };

  const handleQuickToggleSold = async (slotNumber: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const current = binder.slots[slotNumber];
    if (!current) return;

    const newStatus = current.status === 'AVAILABLE' ? 'SOLD' : 'AVAILABLE';
    try {
      const res = await fetch(`/api/binders/${binder.id}/slots/${slotNumber}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchBinder();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar sellerName={binder.sellerName} boothName={binder.boothName} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Top Header & Breadcrumb */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <a
              href="/"
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </a>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: binder.coverColor || '#DC2626' }}
                />
                <h1 className="text-xl sm:text-2xl font-black text-white">{binder.name}</h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold">
                  {binder.layoutType}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {totalCards} Kartu terisi • Total Nilai: {formatCurrency(totalValue, binder.currency)} •{' '}
                {binder.totalPages} Halaman
              </p>
            </div>
          </div>

          {/* Quick Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={`/b/${binder.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
              <span>Preview Pembeli</span>
            </a>

            <button
              onClick={() => setShowQrModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300 text-xs font-bold transition-colors"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>QR Meja Stand</span>
            </button>

            <a
              href={`/print/slots/${binder.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Stiker QR</span>
            </a>
          </div>
        </div>

        {/* Event Flash Sale / Bulk Discount Ribbon */}
        <div className="bg-gradient-to-r from-red-950/60 to-slate-900 border border-red-900/60 rounded-2xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Percent className="w-4 h-4 text-red-400" />
            <div>
              <span className="font-extrabold text-white">Flash Sale Binder: </span>
              <span className="text-slate-400">
                Potong harga otomatis untuk semua kartu yang masih tersedia di binder ini
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="number"
              min={1}
              max={80}
              placeholder="% Diskon"
              value={discountPercent}
              onChange={(e) => setDiscountPercent(e.target.value)}
              className="w-24 px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-bold text-center text-white focus:outline-none focus:border-red-500"
            />
            <button
              onClick={handleApplyDiscount}
              disabled={applyingDiscount || !discountPercent}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white transition-colors"
            >
              {applyingDiscount ? 'Memproses...' : 'Terapkan Diskon'}
            </button>
          </div>
        </div>

        {/* Page Switcher Navigation */}
        <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800 rounded-2xl p-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-xs font-bold text-slate-200 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Halaman Sebelumnya</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold text-white">
              Halaman {currentPage} dari {binder.totalPages}
            </span>
            <span className="text-[11px] text-slate-400">
              (Slot #{startSlot} - #{endSlot})
            </span>
          </div>

          <button
            onClick={() => setCurrentPage((p) => Math.min(binder.totalPages, p + 1))}
            disabled={currentPage === binder.totalPages}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-xs font-bold text-slate-200 transition-colors"
          >
            <span>Halaman Berikutnya</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Interactive Visual Binder Grid Layout */}
        <div
          className={`grid gap-4 ${
            binder.layoutType === '4-pocket'
              ? 'grid-cols-2 max-w-2xl mx-auto'
              : binder.layoutType === '12-pocket'
              ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4'
              : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
          }`}
        >
          {Array.from({ length: pocketsPerPage }, (_, i) => {
            const slotNum = startSlot + i;
            const card = binder.slots[slotNum];

            return (
              <div
                key={slotNum}
                onClick={() =>
                  setEditModalData({
                    isOpen: true,
                    slotNumber: slotNum,
                    existingCard: card || null,
                  })
                }
                className="binder-pocket rounded-2xl p-3 flex flex-col justify-between cursor-pointer hover:border-amber-500/50 hover:shadow-amber-500/10 transition-all group min-h-[290px]"
              >
                {/* Top Slot Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-black text-amber-400 tracking-wider">
                      SLOT #{slotNum}
                    </span>
                    <a
                      href={`/b/${binder.id}/slot/${slotNum}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-1 text-slate-500 hover:text-white rounded hover:bg-slate-800 transition-colors"
                      title="Lihat Halaman QR Slot Ini"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  {card && (
                    <button
                      onClick={(e) => handleQuickToggleSold(slotNum, e)}
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border transition-all ${
                        card.status === 'AVAILABLE'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                          : card.status === 'SOLD'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                      }`}
                      title="Klik untuk ubah status cepat"
                    >
                      {card.status}
                    </button>
                  )}
                </div>

                {/* Card Content or Empty Pocket */}
                {card ? (
                  <div className="flex-1 flex flex-col justify-between">
                    {/* Image & Overlay */}
                    <div className="relative aspect-[3/4] max-h-48 w-full rounded-xl overflow-hidden bg-slate-950 mx-auto shadow-md mb-2 holo-shine">
                      {card.imageUrl ? (
                        <img
                          src={card.imageUrl}
                          alt={card.name}
                          className="w-full h-full object-contain p-1"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">
                          Tidak ada gambar
                        </div>
                      )}
                      {card.status === 'SOLD' && (
                        <div className="absolute inset-0 bg-black/70 backdrop-blur-[1px] flex items-center justify-center">
                          <span className="px-3 py-1 bg-red-600 text-white font-black text-xs uppercase tracking-widest rounded-lg shadow-lg rotate-[-12deg]">
                            SOLD
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Card Info */}
                    <div>
                      <div className="font-extrabold text-xs text-white line-clamp-1 group-hover:text-amber-400 transition-colors">
                        {card.name}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {card.condition} • {card.setName}
                      </div>

                      {/* Price Tag */}
                      <div className="mt-1.5 flex items-baseline justify-between">
                        <span className="text-sm font-black text-amber-400">
                          {formatCurrency(card.price, binder.currency)}
                        </span>
                        {card.originalPrice && card.originalPrice > card.price && (
                          <span className="text-[10px] line-through text-slate-500">
                            {formatCurrency(card.originalPrice, binder.currency)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-800 rounded-xl group-hover:border-slate-700 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-500 group-hover:text-amber-400 group-hover:bg-slate-800 transition-all mb-2">
                      <Plus className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-400 group-hover:text-white">
                      Slot Kosong
                    </span>
                    <span className="text-[10px] text-slate-500 mt-0.5">Klik untuk pasang kartu</span>
                  </div>
                )}

                {/* Bottom Click to Edit Hint */}
                <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-center text-[10px] font-semibold text-slate-400 group-hover:text-slate-300">
                  <Edit3 className="w-3 h-3 mr-1" />
                  <span>Klik untuk edit kartu</span>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Edit Slot Modal */}
      <EditSlotModal
        isOpen={editModalData.isOpen}
        onClose={() => setEditModalData((prev) => ({ ...prev, isOpen: false }))}
        binderId={binder.id}
        slotNumber={editModalData.slotNumber}
        existingCard={editModalData.existingCard}
        currency={binder.currency}
        onSaved={fetchBinder}
      />

      {/* QR Modal for Table Placard */}
      <QrCodeModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        title={binder.name}
        subtitle="Scan untuk melihat seluruh isi kartu di binder ini langsung di HP pembeli"
        targetUrl={`/b/${binder.id}`}
        printUrl={`/print/binder/${binder.id}`}
      />
    </div>
  );
}
