'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import BinderCard from '@/components/BinderCard';
import QuickSellBar from '@/components/QuickSellBar';
import CreateBinderModal from '@/components/CreateBinderModal';
import EditSlotModal from '@/components/EditSlotModal';
import { Binder, PokemonCard, SellerProfile } from '@/types';
import { formatCurrency } from '@/lib/qr';
import { Plus, Search, Sparkles, Layers, TrendingUp, CheckCircle, Tag, Store, ShieldCheck, DollarSign } from 'lucide-react';

export default function SellerDashboard() {
  const [binders, setBinders] = useState<Binder[]>([]);
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [showCreateBinder, setShowCreateBinder] = useState(false);
  const [editModalData, setEditModalData] = useState<{
    isOpen: boolean;
    binderId: string;
    slotNumber: number;
    existingCard?: PokemonCard | null;
  }>({
    isOpen: false,
    binderId: '',
    slotNumber: 1,
    existingCard: null,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/binders');
      const data = await res.json();
      if (data.success) {
        setBinders(data.binders || []);
        setProfile(data.profile || null);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute Overall Stats
  let totalCardsCount = 0;
  let totalInventoryValue = 0;
  let soldCardsCount = 0;
  let soldValue = 0;
  let availableCardsCount = 0;

  binders.forEach((binder) => {
    Object.values(binder.slots || {}).forEach((card) => {
      totalCardsCount++;
      totalInventoryValue += card.price || 0;
      if (card.status === 'SOLD') {
        soldCardsCount++;
        soldValue += card.price || 0;
      } else if (card.status === 'AVAILABLE') {
        availableCardsCount++;
      }
    });
  });

  // Cross-binder card search for quick inquiry
  interface SearchResultItem {
    card: PokemonCard;
    slotNumber: number;
    binder: Binder;
  }

  const searchResults: SearchResultItem[] = [];
  if (searchQuery.trim().length >= 2) {
    const q = searchQuery.toLowerCase();
    binders.forEach((binder) => {
      Object.entries(binder.slots || {}).forEach(([slotStr, card]) => {
        if (
          card.name.toLowerCase().includes(q) ||
          card.setName.toLowerCase().includes(q) ||
          (card.notes && card.notes.toLowerCase().includes(q))
        ) {
          searchResults.push({
            card,
            slotNumber: parseInt(slotStr, 10),
            binder,
          });
        }
      });
    });
  }

  const handleOpenEdit = (binderId: string, slotNumber: number, existingCard?: PokemonCard | null) => {
    setEditModalData({
      isOpen: true,
      binderId,
      slotNumber,
      existingCard: existingCard || null,
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar sellerName={profile?.sellerName} boothName={profile?.boothName} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Event Notice Header */}
        {profile?.bannerNotice && (
          <div className="p-3 bg-gradient-to-r from-red-950/60 via-amber-950/40 to-slate-900 border border-amber-500/30 rounded-2xl flex items-center justify-between text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <span className="text-base">📢</span>
              <span className="font-semibold">{profile.bannerNotice}</span>
            </div>
            <span className="text-[11px] font-bold text-amber-400/80 hidden sm:inline">
              {profile.boothName}
            </span>
          </div>
        )}

        {/* Live Event Stats Ribbon */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Total Cards */}
          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-lg relative overflow-hidden">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Kartu di Binder</div>
            <div className="text-2xl font-black text-white mt-1 flex items-baseline gap-1.5">
              <span>{totalCardsCount}</span>
              <span className="text-xs font-semibold text-emerald-400">({availableCardsCount} Ready)</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <Layers className="w-3 h-3 text-red-400" />
              <span>{binders.length} Binder Terpasang</span>
            </div>
          </div>

          {/* Total Value */}
          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-lg relative overflow-hidden">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Nilai Display</div>
            <div className="text-2xl font-black text-amber-400 mt-1 truncate">
              {formatCurrency(totalInventoryValue, profile?.currency || 'IDR')}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-amber-400" />
              <span>Berdasarkan harga jual live</span>
            </div>
          </div>

          {/* Cards Sold */}
          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-lg relative overflow-hidden">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Terjual di Event</div>
            <div className="text-2xl font-black text-rose-400 mt-1 flex items-baseline gap-1.5">
              <span>{soldCardsCount}</span>
              <span className="text-xs font-semibold text-slate-400">kartu</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <Tag className="w-3 h-3 text-rose-400" />
              <span>Omset: {formatCurrency(soldValue, profile?.currency || 'IDR')}</span>
            </div>
          </div>

          {/* Booth Info */}
          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-lg relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Lokasi Booth</div>
              <div className="text-base font-extrabold text-white mt-1 truncate">
                {profile?.boothName || 'Table #A-14'}
              </div>
            </div>
            <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>QR Database Online</span>
            </div>
          </div>
        </div>

        {/* Fast Action Counter Bar */}
        {binders.length > 0 && (
          <QuickSellBar
            binders={binders}
            onActionComplete={fetchData}
            onOpenEditModal={handleOpenEdit}
          />
        )}

        {/* Global Card Search across all binders */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Search className="w-4 h-4 text-amber-400" />
                <span>Pencari Kartu Cepat (Tanya Pembeli Langsung Ketik)</span>
              </h2>
              <p className="text-xs text-slate-400">
                Ketik nama kartu (misal: "Moonbreon", "Pikachu", "Charizard") untuk cek lokasi binder dan harganya dalam sekejap
              </p>
            </div>

            <div className="relative w-full sm:w-80">
              <input
                type="text"
                placeholder="Cari kartu di semua binder..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2 text-xs text-slate-400 hover:text-white"
                >
                  &times;
                </button>
              )}
            </div>
          </div>

          {/* Search Results Display */}
          {searchQuery.trim().length >= 2 && (
            <div className="pt-2 border-t border-slate-800">
              {searchResults.length === 0 ? (
                <div className="text-xs text-slate-400 py-3 text-center">
                  Tidak ditemukan kartu dengan kata kunci "{searchQuery}".
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-80 overflow-y-auto pr-1">
                  {searchResults.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {item.card.imageUrl && (
                          <img
                            src={item.card.imageUrl}
                            alt=""
                            className="w-10 h-14 object-cover rounded shadow flex-shrink-0"
                          />
                        )}
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate">{item.card.name}</div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {item.binder.name} • <span className="font-extrabold text-amber-400">SLOT #{item.slotNumber}</span>
                          </div>
                          <div className="text-xs font-extrabold text-emerald-400 mt-0.5">
                            {formatCurrency(item.card.price, item.binder.currency)}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span
                          className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                            item.card.status === 'AVAILABLE'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : item.card.status === 'SOLD'
                              ? 'bg-rose-500/20 text-rose-400'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}
                        >
                          {item.card.status}
                        </span>
                        <button
                          onClick={() => handleOpenEdit(item.binder.id, item.slotNumber, item.card)}
                          className="text-[11px] font-semibold text-slate-400 hover:text-white underline"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Binder Section Header & Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-red-500" />
              <span>Daftar Binder Koleksi</span>
            </h2>
            <p className="text-xs text-slate-400">
              Setiap binder memiliki 1 QR Code utama untuk cover dan QR Code unik untuk masing-masing slot kartu
            </p>
          </div>

          <button
            onClick={() => setShowCreateBinder(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-red-600 to-amber-500 hover:brightness-110 active:scale-95 text-white font-bold text-xs shadow-lg shadow-red-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Binder Baru</span>
          </button>
        </div>

        {/* Binder Cards Grid */}
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            Memuat data binder...
          </div>
        ) : binders.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/50 border border-dashed border-slate-800 rounded-3xl">
            <p className="text-sm text-slate-400 mb-3">Belum ada binder yang dibuat.</p>
            <button
              onClick={() => setShowCreateBinder(true)}
              className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold text-xs"
            >
              Buat Binder Pertama
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {binders.map((binder) => (
              <BinderCard key={binder.id} binder={binder} onRefresh={fetchData} />
            ))}
          </div>
        )}
      </main>

      {/* Create Binder Modal */}
      <CreateBinderModal
        isOpen={showCreateBinder}
        onClose={() => setShowCreateBinder(false)}
        onCreated={fetchData}
      />

      {/* Edit Slot Modal */}
      <EditSlotModal
        isOpen={editModalData.isOpen}
        onClose={() => setEditModalData((prev) => ({ ...prev, isOpen: false }))}
        binderId={editModalData.binderId}
        slotNumber={editModalData.slotNumber}
        existingCard={editModalData.existingCard}
        onSaved={fetchData}
      />
    </div>
  );
}
