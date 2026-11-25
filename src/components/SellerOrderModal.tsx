'use client';

import React, { useState } from 'react';
import { Order, OrderItem, Binder, PokemonCard } from '@/types';
import { formatCurrency } from '@/lib/qr';
import {
  X,
  Trash2,
  Plus,
  CheckCircle,
  AlertCircle,
  DollarSign,
  User,
  Clock,
  Layers,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface SellerOrderModalProps {
  isOpen: boolean;
  order: Order | null;
  onClose: () => void;
  onOrderFinalized: (
    soldSlots: Array<{ binderId: string; slotNumber: number; cardName: string; soldPrice: number }>,
    order: Order
  ) => void;
  binders: Binder[];
  currency?: 'IDR' | 'USD';
}

export default function SellerOrderModal({
  isOpen,
  order: initialOrder,
  onClose,
  onOrderFinalized,
  binders,
  currency = 'IDR',
}: SellerOrderModalProps) {
  const [order, setOrder] = useState<Order | null>(initialOrder);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [showAddCardPicker, setShowAddCardPicker] = useState(false);
  const [addSearch, setAddSearch] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Keep local order state synchronized with initialOrder
  React.useEffect(() => {
    setOrder(initialOrder);
    setErrorMsg('');
    setShowAddCardPicker(false);
  }, [initialOrder]);

  if (!isOpen || !order) return null;

  const currentBinder = binders.find((b) => b.id === order.binderId) || binders[0];

  // Available cards in this binder that can be added
  const availableCards: Array<{ slotNumber: number; card: PokemonCard }> = [];
  if (currentBinder?.slots) {
    Object.entries(currentBinder.slots).forEach(([slotStr, card]) => {
      const slotNum = parseInt(slotStr, 10);
      // check if not already in order
      const alreadyInOrder = order.items.some(
        (it) => it.slotNumber === slotNum && it.status === 'IN_ORDER'
      );
      if (card.status === 'AVAILABLE' && !alreadyInOrder) {
        if (!addSearch.trim() || card.name.toLowerCase().includes(addSearch.toLowerCase())) {
          availableCards.push({ slotNumber: slotNum, card });
        }
      }
    });
  }

  // Update deal price for an item
  const handleDealPriceChange = async (itemId: string, newPrice: number) => {
    if (!order) return;
    try {
      // optimistic update
      setOrder((prev) => {
        if (!prev) return prev;
        const newItems = prev.items.map((it) => (it.id === itemId ? { ...it, dealPrice: newPrice } : it));
        const newTotal = newItems.reduce((acc, it) => acc + (it.status === 'IN_ORDER' ? it.dealPrice : 0), 0);
        return { ...prev, items: newItems, totalAmount: newTotal };
      });

      await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_deal_price',
          itemId,
          newDealPrice: newPrice,
        }),
      });
    } catch (err) {
      console.error('Failed to update deal price:', err);
    }
  };

  // Partial cancel / remove item from active order
  const handleRemoveItem = async (itemId: string) => {
    if (!order) return;
    try {
      // optimistic update
      setOrder((prev) => {
        if (!prev) return prev;
        const newItems = prev.items.filter((it) => it.id !== itemId);
        const newTotal = newItems.reduce((acc, it) => acc + (it.status === 'IN_ORDER' ? it.dealPrice : 0), 0);
        return { ...prev, items: newItems, totalAmount: newTotal };
      });

      await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'remove_item',
          itemId,
        }),
      });
    } catch (err) {
      console.error('Failed to remove item:', err);
    }
  };

  // Add another card from binder to the active order
  const handleAddCard = async (slotNumber: number, card: PokemonCard) => {
    if (!order) return;
    try {
      const cardData = {
        binderId: order.binderId,
        slotNumber,
        cardName: card.name,
        setName: card.setName,
        cardNumber: card.cardNumber,
        rarity: card.rarity,
        condition: card.condition,
        game: card.game || 'pokemon',
        imageUrl: card.imageUrl,
        listedPrice: card.price,
        dealPrice: card.price,
      };

      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_item',
          cardData,
        }),
      });

      const data = await res.json();
      if (data.success && data.order) {
        setOrder(data.order);
        setShowAddCardPicker(false);
      }
    } catch (err) {
      console.error('Failed to add card to order:', err);
    }
  };

  // Finalize transaction, archive to sales ledger, and clear binder slots!
  const handleFinalize = async () => {
    if (!order) return;
    const activeItems = order.items.filter((it) => it.status === 'IN_ORDER');
    if (activeItems.length === 0) {
      setErrorMsg('Pesanan tidak memiliki kartu aktif. Tambahkan kartu atau batalkan pesanan.');
      return;
    }

    setIsFinalizing(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'finalize' }),
      });

      const data = await res.json();
      if (data.success) {
        onOrderFinalized(data.soldSlots, data.order);
      } else {
        setErrorMsg(data.error || 'Gagal memproses finalisasi order');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Gagal memproses transaksi. Periksa koneksi internet.');
    } finally {
      setIsFinalizing(false);
    }
  };

  // Cancel order entirely
  const handleCancelOrder = async () => {
    if (!order || !confirm('Yakin ingin membatalkan pesanan ini?')) return;
    try {
      await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      });
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  const activeItems = order.items.filter((it) => it.status === 'IN_ORDER');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs font-clean">
      <div className="w-full max-w-xl bg-[#FAF6F0] border-2 border-[#D5CABE] rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col max-h-[92vh] animate-fadeInUp text-[#1E293B]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b-2 border-[#EAE3D8]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#EAE3D8] text-[#E05A47] border border-[#D5CABE] flex items-center justify-center font-pixelify font-bold text-sm shadow-2xs">
              #
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-pixelify text-base font-bold text-[#1E293B] tracking-tight">
                  PESANAN MASUK {order.orderNumber}
                </h3>
                <span className="font-pixelify text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EAE3D8] text-[#7A6B58] border border-[#D5CABE]">
                  LIVE NEGO
                </span>
              </div>
              <p className="text-xs text-[#7A6B58] flex items-center gap-1.5 mt-0.5">
                <User className="w-3.5 h-3.5 text-[#7A6B58]" />
                <span>Pembeli:</span>
                <span className="font-bold text-[#1E293B] underline">{order.buyerName}</span>
                {order.notes && (
                  <span className="text-[#E05A47] italic text-[11px]">"{order.notes}"</span>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white border border-[#D5CABE] text-[#7A6B58] hover:text-[#1E293B] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Item List & Price Negotiation Form */}
        <div className="py-4 space-y-3 overflow-y-auto flex-1">
          <div className="flex items-center justify-between text-xs text-[#7A6B58] pb-1">
            <span className="font-pixelify font-bold text-[#4A3E31]">DAFTAR KARTU & NEGO HARGA DEAL:</span>
            <span className="font-mono-clean text-[11px]">{activeItems.length} Kartu Terpilih</span>
          </div>

          {activeItems.length === 0 ? (
            <div className="p-8 text-center bg-white border-2 border-dashed border-[#D5CABE] rounded-2xl">
              <p className="font-pixelify text-xs text-[#7A6B58]">Semua kartu dalam pesanan ini telah dibatalkan.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {activeItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-white border border-[#D5CABE] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-16 rounded-xl overflow-hidden bg-[#EAE3D8] border border-[#D5CABE] flex-shrink-0">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.cardName}
                          className="w-full h-full object-contain p-0.5"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-pixelify text-[#8C7E6D]">
                          #
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#1E293B] truncate">{item.cardName}</div>
                      <div className="font-mono-clean text-[10px] text-[#7A6B58] mt-0.5">
                        Slot #{item.slotNumber} • {item.condition}
                      </div>
                      <div className="text-[10px] text-[#7A6B58] mt-0.5">
                        Display: <span className="line-through">{formatCurrency(item.listedPrice, currency)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Nego Deal Price & Partial Delete */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <div className="flex items-center gap-1 bg-[#FAF6F0] px-2.5 py-1.5 rounded-xl border border-[#D5CABE] shadow-inner">
                      <span className="font-pixelify text-[10px] font-bold text-[#2E7D32]">Deal: Rp</span>
                      <input
                        type="number"
                        defaultValue={item.dealPrice}
                        onBlur={(e) => {
                          const val = Number(e.target.value);
                          if (!isNaN(val) && val >= 0) {
                            handleDealPriceChange(item.id, val);
                          }
                        }}
                        className="w-24 sm:w-28 bg-transparent text-xs font-pixelify font-bold text-[#1E293B] focus:outline-none"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      className="p-2 rounded-xl bg-white border border-[#D5CABE] hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Batalkan / Hapus kartu ini dari pesanan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Another Card from Binder (Direct On-The-Spot Addition) */}
          <div className="pt-2">
            {!showAddCardPicker ? (
              <button
                type="button"
                onClick={() => setShowAddCardPicker(true)}
                className="w-full py-2.5 bg-white hover:bg-[#FAF6F0] border-2 border-dashed border-[#D5CABE] rounded-2xl font-pixelify text-xs font-bold text-[#E05A47] flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <Plus className="w-4 h-4" />
                <span>+ Tambah Kartu Lain dari Binder (On-the-spot)</span>
              </button>
            ) : (
              <div className="p-3 bg-white border-2 border-[#D5CABE] rounded-2xl space-y-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-pixelify text-xs font-bold text-[#4A3E31]">
                    PILIH KARTU TERSEDIA DI {currentBinder?.name || 'BINDER'}:
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAddCardPicker(false)}
                    className="text-xs font-pixelify font-bold text-[#7A6B58] hover:text-[#1E293B] cursor-pointer"
                  >
                    Batal
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="Ketik untuk filter kartu..."
                  value={addSearch}
                  onChange={(e) => setAddSearch(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#FAF6F0] border border-[#D5CABE] rounded-xl text-xs text-[#1E293B] placeholder-[#9C8E7D] focus:outline-none focus:border-[#E05A47]"
                />

                <div className="max-h-40 overflow-y-auto space-y-1.5 pt-1 pr-1">
                  {availableCards.length === 0 ? (
                    <div className="text-center py-3 text-xs text-[#7A6B58] font-pixelify">
                      Tidak ada kartu tersedia yang cocok
                    </div>
                  ) : (
                    availableCards.slice(0, 8).map(({ slotNumber, card }) => (
                      <div
                        key={slotNumber}
                        onClick={() => handleAddCard(slotNumber, card)}
                        className="p-2 bg-[#FAF6F0] hover:bg-[#F5EFE6] border border-[#D5CABE] rounded-xl flex items-center justify-between text-xs cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-pixelify text-[10px] text-[#4A3E31] font-bold px-1.5 py-0.5 rounded bg-[#EAE3D8]">
                            #{slotNumber}
                          </span>
                          <span className="font-bold text-[#1E293B] truncate">{card.name}</span>
                          <span className="text-[10px] text-[#7A6B58]">({card.condition})</span>
                        </div>
                        <span className="font-pixelify text-xs font-bold text-[#2E7D32] flex-shrink-0">
                          +{formatCurrency(card.price, currency)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Footer & Finalize Action */}
        <div className="pt-3 border-t-2 border-[#EAE3D8] space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono-clean text-xs text-[#7A6B58]">TOTAL DEAL AKHIR:</span>
            <span className="font-pixelify text-xl font-bold text-[#2E7D32]">
              {formatCurrency(order.totalAmount, currency)}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={handleCancelOrder}
              className="py-3 px-2 bg-white hover:bg-[#FAF6F0] border border-[#D5CABE] text-[#7A6B58] hover:text-[#1E293B] rounded-2xl font-pixelify text-xs font-bold text-center transition-colors cursor-pointer shadow-2xs"
            >
              Batalkan
            </button>

            <button
              type="button"
              disabled={isFinalizing || activeItems.length === 0}
              onClick={handleFinalize}
              className="col-span-2 py-3 px-4 bg-[#2E7D32] hover:bg-[#25632A] disabled:opacity-40 text-white rounded-2xl font-pixelify text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{isFinalizing ? 'MEMPROSES TRANSAKSI...' : 'SELESAIKAN & TERIMA PEMBAYARAN'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
