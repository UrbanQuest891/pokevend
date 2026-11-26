'use client';

import React, { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/Navbar';
import BinderCard from '@/components/BinderCard';
import QuickSellBar from '@/components/QuickSellBar';
import CreateBinderModal from '@/components/CreateBinderModal';
import EditSlotModal from '@/components/EditSlotModal';
import SellerOrderModal from '@/components/SellerOrderModal';
import QuickRestockModal from '@/components/QuickRestockModal';
import { Binder, PokemonCard, SellerProfile, Order } from '@/types';
import { formatCurrency } from '@/lib/qr';
import { playNewOrderSound, isSoundEnabled, setSoundEnabled } from '@/lib/audio';
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
  Volume2,
  VolumeX,
  Crown,
  ExternalLink,
} from 'lucide-react';

export default function SellerDashboard() {
  const [binders, setBinders] = useState<Binder[]>([]);
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [soundActive, setSoundActive] = useState(true);

  // Sound & Order tracking refs
  const prevOrderCountRef = useRef(0);
  const isMountedRef = useRef(false);

  useEffect(() => {
    setSoundActive(isSoundEnabled());
  }, []);

  const toggleSound = () => {
    const next = !soundActive;
    setSoundActive(next);
    setSoundEnabled(next);
  };

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
        const incomingOrders = data.orders || [];
        // Trigger 8-bit sound alert when new orders arrive
        if (isMountedRef.current && incomingOrders.length > prevOrderCountRef.current) {
          playNewOrderSound();
        }
        prevOrderCountRef.current = incomingOrders.length;
        isMountedRef.current = true;
        setPendingOrders(incomingOrders);
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
    <div
      className="min-h-screen bg-[#F5EFE6] text-[#1E293B] flex flex-col font-clean selection:bg-[#E05A47] selection:text-white"
      style={{
        backgroundImage: 'radial-gradient(#E2D9CC 0.85px, transparent 0.85px)',
        backgroundSize: '20px 20px',
      }}
    >
      <Navbar sellerName={profile?.sellerName} boothName={profile?.boothName} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Incoming Live Orders Alert Ribbon */}
        {pendingOrders.length > 0 && (
          <div className="p-4 bg-[#FAF6F0] border-2 border-[#E05A47] rounded-3xl shadow-[0_4px_25px_rgba(224,90,71,0.22)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fadeInUp">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-[#E05A47] text-white flex items-center justify-center font-pixelify font-bold text-lg shadow-sm animate-pulse">
                <Bell className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-pixelify text-sm sm:text-base font-bold text-[#E05A47]">
                    {pendingOrders.length} PESANAN MASUK DARI PEMBELI!
                  </span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                </div>
                <p className="text-xs text-[#5D4E3E] mt-0.5">
                  Terbaru: <span className="font-bold text-[#1E293B] underline">#{pendingOrders[0].orderNumber}</span> oleh{' '}
                  <span className="font-bold text-[#E05A47]">{pendingOrders[0].buyerName}</span> •{' '}
                  <span className="font-mono-clean">{pendingOrders[0].items.length} kartu</span> (
                  {formatCurrency(pendingOrders[0].totalAmount, profile?.currency || 'IDR')})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleSound}
                className="px-3 py-2.5 bg-white hover:bg-[#FAF6F0] border border-[#D5CABE] text-[#1E293B] rounded-2xl font-pixelify text-xs font-bold shadow-2xs flex items-center gap-1.5 cursor-pointer"
                title={soundActive ? 'Suara order aktif (8-bit chime)' : 'Suara order dinonaktifkan (hening)'}
              >
                {soundActive ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 text-[#7A6B58]" />}
                <span className="hidden sm:inline">{soundActive ? 'Sound ON' : 'Mute'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveNegotiationOrder(pendingOrders[0])}
                className="w-full sm:w-auto px-4 py-2.5 bg-[#E05A47] hover:bg-[#C94735] text-white rounded-2xl font-pixelify text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
              >
                <span>BUKA TIKET & NEGO HARGA</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Event Notice Header */}
        {profile?.bannerNotice && (
          <div className="p-3.5 bg-[#FAF6F0] border-2 border-[#E5DACB] rounded-2xl flex items-center justify-between text-xs text-[#5D4E3E] shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="text-base">📢</span>
              <span className="font-semibold">{profile.bannerNotice}</span>
            </div>
            <span className="font-pixelify text-[11px] font-bold text-[#E05A47] hidden sm:inline">
              {profile.boothName}
            </span>
          </div>
        )}

        {/* Live Event Stats Ribbon with Warm Vintage 8-Bit Accents */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          {/* Total Cards */}
          <div className="p-4 bg-[#FAF6F0] border-2 border-[#D5CABE] rounded-2xl shadow-xs relative overflow-hidden">
            <div className="font-pixelify text-[11px] font-bold uppercase tracking-wider text-[#7A6B58]">
              KARTU DI BINDER
            </div>
            <div className="text-2xl font-pixelify font-bold text-[#1E293B] mt-1 flex items-baseline gap-1.5">
              <span>{totalCardsCount}</span>
              <span className="text-xs font-pixelify text-[#2E7D32]">({availableCardsCount} Ready)</span>
            </div>
            <div className="text-[11px] text-[#7A6B58] mt-1 flex items-center gap-1 font-mono-clean">
              <Layers className="w-3.5 h-3.5 text-[#E05A47]" />
              <span>{binders.length} Binder Terpasang</span>
            </div>
          </div>

          {/* Total Value */}
          <div className="p-4 bg-[#FAF6F0] border-2 border-[#D5CABE] rounded-2xl shadow-xs relative overflow-hidden">
            <div className="font-pixelify text-[11px] font-bold uppercase tracking-wider text-[#7A6B58]">
              TOTAL NILAI DISPLAY
            </div>
            <div className="text-xl sm:text-2xl font-pixelify font-bold text-[#1E293B] mt-1 truncate">
              {formatCurrency(totalInventoryValue, profile?.currency || 'IDR')}
            </div>
            <div className="text-[11px] text-[#7A6B58] mt-1 flex items-center gap-1 font-mono-clean">
              <TrendingUp className="w-3.5 h-3.5 text-[#2E7D32]" />
              <span>Harga live di event</span>
            </div>
          </div>

          {/* Cards Sold */}
          <div className="p-4 bg-[#FAF6F0] border-2 border-[#D5CABE] rounded-2xl shadow-xs relative overflow-hidden">
            <div className="font-pixelify text-[11px] font-bold uppercase tracking-wider text-[#7A6B58]">
              TERJUAL DI EVENT
            </div>
            <div className="text-2xl font-pixelify font-bold text-[#2E7D32] mt-1 flex items-baseline gap-1.5">
              <span>{soldCardsCount}</span>
              <span className="text-xs font-clean text-[#7A6B58]">kartu</span>
            </div>
            <div className="text-[11px] text-[#7A6B58] mt-1 flex items-center gap-1 font-mono-clean">
              <Tag className="w-3.5 h-3.5 text-[#E05A47]" />
              <span className="truncate">Omset: {formatCurrency(soldValue, profile?.currency || 'IDR')}</span>
            </div>
          </div>

          {/* Booth Info */}
          <div className="p-4 bg-[#FAF6F0] border-2 border-[#D5CABE] rounded-2xl shadow-xs relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="font-pixelify text-[11px] font-bold uppercase tracking-wider text-[#7A6B58]">
                LOKASI BOOTH
              </div>
              <div className="font-pixelify text-base font-bold text-[#1E293B] mt-1 truncate">
                {profile?.boothName || 'Table #A-14'}
              </div>
            </div>
            <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1.5 mt-1">
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
        <div className="bg-[#FAF6F0] border-2 border-[#D5CABE] rounded-2xl p-4 space-y-3 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-pixelify text-sm font-bold text-[#1E293B] flex items-center gap-2">
                <Search className="w-4 h-4 text-[#E05A47]" />
                <span>Pencari Kartu Cepat (Tanya Pembeli Langsung Ketik)</span>
              </h2>
              <p className="text-xs text-[#7A6B58]">
                Ketik nama kartu (misal: "Moonbreon", "Pikachu", "Charizard") untuk cek lokasi binder dan harganya dalam sekejap
              </p>
            </div>

            <div className="relative w-full sm:w-80">
              <input
                type="text"
                placeholder="Cari kartu di semua binder..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-[#D5CABE] rounded-xl text-xs text-[#1E293B] placeholder-[#9C8E7D] focus:outline-none focus:border-[#E05A47] shadow-inner"
              />
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#9C8E7D]" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2 text-xs text-[#9C8E7D] hover:text-[#1E293B]"
                >
                  &times;
                </button>
              )}
            </div>
          </div>

          {/* Search Results Display */}
          {searchQuery.trim().length >= 2 && (
            <div className="pt-2 border-t border-[#EAE3D8]">
              {searchResults.length === 0 ? (
                <div className="text-xs text-[#7A6B58] py-3 text-center font-pixelify">
                  Tidak ditemukan kartu dengan kata kunci "{searchQuery}".
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-80 overflow-y-auto pr-1">
                  {searchResults.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white border border-[#D5CABE] rounded-xl flex items-center justify-between gap-3 hover:border-[#B5A593] transition-colors shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {item.card.imageUrl && (
                          <img
                            src={item.card.imageUrl}
                            alt=""
                            className="w-10 h-14 object-contain rounded bg-[#EAE3D8] border border-[#D5CABE] flex-shrink-0 p-0.5"
                          />
                        )}
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-[#1E293B] truncate">{item.card.name}</div>
                          <div className="font-mono-clean text-[10px] text-[#7A6B58] truncate">
                            {item.binder.name} • <span className="font-pixelify font-bold text-[#E05A47]">SLOT #{item.slotNumber}</span>
                          </div>
                          <div className="text-xs font-pixelify font-bold text-[#2E7D32] mt-0.5">
                            {formatCurrency(item.card.price, item.binder.currency)}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span
                          className={`font-pixelify text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            item.card.status === 'AVAILABLE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {item.card.status}
                        </span>
                        <button
                          onClick={() => handleOpenEdit(item.binder.id, item.slotNumber, item.card)}
                          className="font-pixelify text-[10px] text-[#7A6B58] hover:text-[#E05A47] underline cursor-pointer"
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
            <h2 className="font-pixelify text-xl font-bold text-[#1E293B] flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#E05A47]" />
              <span>DAFTAR BINDER KOLEKSI</span>
            </h2>
            <p className="text-xs text-[#7A6B58]">
              Kelola multi-binder di stand meja Anda ({binders.length} Binder Aktif). Setiap binder memiliki QR Code cover dan stiker per slot.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/b"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-[#FAF6F0] border border-[#D5CABE] text-[#1E293B] font-pixelify text-xs font-bold transition-all shadow-2xs"
              title="Lihat tampilan rak multi-binder seperti yang dilihat pembeli di HP"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#E05A47]" />
              <span className="hidden sm:inline">Pratinjau Rak Pembeli</span>
            </a>

            <button
              onClick={() => setShowCreateBinder(true)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-[#E05A47] hover:bg-[#C94735] text-white font-pixelify font-bold text-xs shadow-md transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>TAMBAH BINDER</span>
            </button>
          </div>
        </div>

        {/* Binder Cards Grid */}
        {loading ? (
          <div className="p-12 text-center text-[#7A6B58] text-sm font-pixelify">
            MEMUAT DATA BINDER...
          </div>
        ) : binders.length === 0 ? (
          <div className="p-12 text-center bg-[#FAF6F0] border-2 border-dashed border-[#D5CABE] rounded-3xl">
            <p className="text-sm text-[#7A6B58] mb-3 font-pixelify">Belum ada binder yang dibuat.</p>
            <button
              onClick={() => setShowCreateBinder(true)}
              className="px-4 py-2 rounded-xl bg-[#E05A47] text-white font-pixelify font-bold text-xs cursor-pointer shadow-md"
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
