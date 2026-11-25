'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import BinderCard from '@/components/BinderCard';
import QuickSellBar from '@/components/QuickSellBar';
import CreateBinderModal from '@/components/CreateBinderModal';
import EditSlotModal from '@/components/EditSlotModal';
import SellerOrderModal from '@/components/SellerOrderModal';
import QuickRestockModal from '@/components/QuickRestockModal';
import { Binder, PokemonCard, SellerProfile, Order } from '@/types';
import { formatCurrency } from '@/lib/qr';
import {
  Plus,
  Search,
  Sparkles,
  Layers,
  TrendingUp,
  CheckCircle,
  Tag,
  Store,
  ShieldCheck,
  DollarSign,
  Bell,
  ArrowRight,
  Clock,
  User,
} from 'lucide-react';

export default function SellerDashboard() {
  const [binders, setBinders] = useState<Binder[]>([]);
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Live Orders State
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [activeNegotiationOrder, setActiveNegotiationOrder] = useState<Order | null>(null);

  // Quick Restock State
  const [restockModalData, setRestockModalData] = useState<{
    isOpen: boolean;
    soldSlots: Array<{ binderId: string; slotNumber: number; cardName: string; soldPrice: number }>;
    orderNumber: string;
  }>({
    isOpen: false,
    soldSlots: [],
    orderNumber: '',
  });

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
      const res = await fetch('/api/binders', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setBinders(data.binders || []);
        setProfile(data.profile || null);
      }
    } catch (err) {
      console.error('Failed to load binders data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders?status=PENDING', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setPendingOrders(data.orders || []);
      }
    } catch (err) {
      console.error('Failed to load pending orders:', err);
    }
  };

  useEffect(() => {
    fetchData();
    fetchOrders();

    // Poll for incoming live orders every 6 seconds
    const interval = setInterval(() => {
      fetchOrders();
    }, 6000);
    return () => clearInterval(interval);
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

  // Called when an order is finalized by seller
  const handleOrderFinalized = (
    soldSlots: Array<{ binderId: string; slotNumber: number; cardName: string; soldPrice: number }>,
    finalOrder: Order
  ) => {
    setActiveNegotiationOrder(null);
    setRestockModalData({
      isOpen: true,
      soldSlots,
      orderNumber: finalOrder.orderNumber,
    });
    fetchData();
    fetchOrders();
  };

  // Handle Quick Restock click for a specific emptied slot
  const handleRestockSlot = (binderId: string, slotNumber: number) => {
    setRestockModalData((prev) => ({ ...prev, isOpen: false }));
    handleOpenEdit(binderId, slotNumber, null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-clean selection:bg-amber-500 selection:text-slate-950">
      <Navbar sellerName={profile?.sellerName} boothName={profile?.boothName} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Incoming Live Orders Alert Ribbon */}
        {pendingOrders.length > 0 && (
          <div className="p-4 bg-gradient-to-r from-amber-950/80 via-red-950/60 to-slate-900 border-2 border-amber-500/60 rounded-3xl shadow-[0_4px_25px_rgba(245,158,11,0.25)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fadeInUp">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-pixelify font-bold text-lg shadow-md animate-pulse">
                <Bell className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-pixelify text-sm sm:text-base font-bold text-amber-300">
                    {pendingOrders.length} PESANAN MASUK DARI PEMBELI!
                  </span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Terbaru: <span className="font-bold text-white underline">#{pendingOrders[0].orderNumber}</span> oleh{' '}
                  <span className="font-bold text-amber-200">{pendingOrders[0].buyerName}</span> •{' '}
                  <span className="font-mono-clean">{pendingOrders[0].items.length} kartu</span> (
                  {formatCurrency(pendingOrders[0].totalAmount, profile?.currency || 'IDR')})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveNegotiationOrder(pendingOrders[0])}
                className="w-full sm:w-auto px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-2xl font-pixelify text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
              >
                <span>BUKA TIKET & NEGO HARGA</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Event Notice Header */}
        {profile?.bannerNotice && (
          <div className="p-3 bg-gradient-to-r from-red-950/60 via-amber-950/40 to-slate-900 border border-amber-500/30 rounded-2xl flex items-center justify-between text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <span className="text-base">📢</span>
              <span className="font-semibold">{profile.bannerNotice}</span>
            </div>
            <span className="font-pixelify text-[11px] font-bold text-amber-400/80 hidden sm:inline">
              {profile.boothName}
            </span>
          </div>
        )}

        {/* Live Event Stats Ribbon with 8-Bit Accents */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Total Cards */}
          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-lg relative overflow-hidden">
            <div className="font-pixelify text-[11px] font-bold uppercase tracking-wider text-slate-400">
              KARTU DI BINDER
            </div>
            <div className="text-2xl font-pixelify font-bold text-white mt-1 flex items-baseline gap-1.5">
              <span>{totalCardsCount}</span>
              <span className="text-xs font-pixelify text-emerald-400">({availableCardsCount} Ready)</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <Layers className="w-3 h-3 text-red-400" />
              <span>{binders.length} Binder Terpasang</span>
            </div>
          </div>

          {/* Total Value */}
          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-lg relative overflow-hidden">
            <div className="font-pixelify text-[11px] font-bold uppercase tracking-wider text-slate-400">
              TOTAL NILAI DISPLAY
            </div>
            <div className="text-xl sm:text-2xl font-pixelify font-bold text-amber-400 mt-1 truncate">
              {formatCurrency(totalInventoryValue, profile?.currency || 'IDR')}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-amber-400" />
              <span>Harga live di event</span>
            </div>
          </div>

          {/* Cards Sold */}
          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-lg relative overflow-hidden">
            <div className="font-pixelify text-[11px] font-bold uppercase tracking-wider text-slate-400">
              TERJUAL DI EVENT
            </div>
            <div className="text-2xl font-pixelify font-bold text-rose-400 mt-1 flex items-baseline gap-1.5">
              <span>{soldCardsCount}</span>
              <span className="text-xs font-clean text-slate-400">kartu</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <Tag className="w-3 h-3 text-rose-400" />
              <span className="truncate">Omset: {formatCurrency(soldValue, profile?.currency || 'IDR')}</span>
            </div>
          </div>

          {/* Booth Info */}
          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-lg relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="font-pixelify text-[11px] font-bold uppercase tracking-wider text-slate-400">
                LOKASI BOOTH
              </div>
              <div className="font-pixelify text-base font-bold text-white mt-1 truncate">
                {profile?.boothName || 'Table #A-14'}
              </div>
            </div>
            <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1.5 mt-1">
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
              <h2 className="font-pixelify text-sm font-bold text-white flex items-center gap-2">
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
                            className="w-10 h-14 object-cover rounded shadow-sm flex-shrink-0"
                          />
                        )}
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate">{item.card.name}</div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {item.binder.name} • <span className="font-pixelify font-bold text-amber-400">SLOT #{item.slotNumber}</span>
                          </div>
                          <div className="text-xs font-pixelify font-bold text-emerald-400 mt-0.5">
                            {formatCurrency(item.card.price, item.binder.currency)}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span
                          className={`font-pixelify text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            item.card.status === 'AVAILABLE'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-rose-500/20 text-rose-400'
                          }`}
                        >
                          {item.card.status}
                        </span>
                        <button
                          onClick={() => handleOpenEdit(item.binder.id, item.slotNumber, item.card)}
                          className="text-[10px] text-slate-400 hover:text-white underline cursor-pointer"
                        >
                          Edit Slot
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
            <h2 className="font-pixelify text-xl font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-red-500" />
              <span>DAFTAR BINDER KOLEKSI</span>
            </h2>
            <p className="text-xs text-slate-400">
              Setiap binder memiliki QR Code cover digital dan QR Code unik untuk masing-masing slot kartu
            </p>
          </div>

          <button
            onClick={() => setShowCreateBinder(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-red-600 to-amber-500 hover:brightness-110 active:scale-95 text-white font-pixelify font-bold text-xs shadow-lg shadow-red-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>TAMBAH BINDER BARU</span>
          </button>
        </div>

        {/* Binder Cards Grid */}
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm font-pixelify">
            MEMUAT DATA BINDER...
          </div>
        ) : binders.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/50 border border-dashed border-slate-800 rounded-3xl">
            <p className="text-sm text-slate-400 mb-3 font-pixelify">Belum ada binder yang dibuat.</p>
            <button
              onClick={() => setShowCreateBinder(true)}
              className="px-4 py-2 rounded-xl bg-red-600 text-white font-pixelify font-bold text-xs cursor-pointer"
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

      {/* Seller Order Negotiation Modal */}
      <SellerOrderModal
        isOpen={activeNegotiationOrder !== null}
        order={activeNegotiationOrder}
        onClose={() => setActiveNegotiationOrder(null)}
        onOrderFinalized={handleOrderFinalized}
        binders={binders}
        currency={profile?.currency || 'IDR'}
      />

      {/* Quick Restock Confirmation Modal (Non-Intrusive / Can Skip) */}
      <QuickRestockModal
        isOpen={restockModalData.isOpen}
        soldSlots={restockModalData.soldSlots}
        orderNumber={restockModalData.orderNumber}
        onClose={() => setRestockModalData((prev) => ({ ...prev, isOpen: false }))}
        onRestockSlot={handleRestockSlot}
        currency={profile?.currency || 'IDR'}
      />

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
