'use client';

import React, { useState, useEffect } from 'react';
import { PokemonCard, Order } from '@/types';
import { formatCurrency } from '@/lib/qr';
import {
  ShoppingBag,
  X,
  Send,
  Trash2,
  CheckCircle2,
  Store,
  Clock,
  Sparkles,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';

export interface CartItem {
  slotNumber: number;
  binderId: string;
  binderName: string;
  card: PokemonCard;
}

interface BuyerCartDrawerProps {
  items: CartItem[];
  onRemove: (slotNumber: number) => void;
  onClear: () => void;
  binderId: string;
  boothName: string;
  sellerName: string;
  currency?: 'IDR' | 'USD';
}

export default function BuyerCartDrawer({
  items,
  onRemove,
  onClear,
  binderId,
  boothName,
  sellerName,
  currency = 'IDR',
}: BuyerCartDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [buyerName, setBuyerName] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Restore buyer name & active order from localStorage on mount
  useEffect(() => {
    try {
      const savedName = localStorage.getItem('pokevend_buyer_name');
      if (savedName) setBuyerName(savedName);

      const savedOrder = localStorage.getItem(`pokevend_active_order_${binderId}`);
      if (savedOrder) {
        setActiveOrder(JSON.parse(savedOrder));
      }
    } catch (e) {
      // Ignore localStorage errors
    }
  }, [binderId]);

  const totalAmount = items.reduce((sum, item) => sum + (item.card.price || 0), 0);

  const handleSubmitOrder = async () => {
    if (!buyerName.trim()) {
      setErrorMsg('Tulis nama panggilan Anda dulu agar penjual bisa panggil di meja.');
      return;
    }
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      // Save buyer name for future use
      localStorage.setItem('pokevend_buyer_name', buyerName.trim());

      const orderItems = items.map((it) => ({
        slotNumber: it.slotNumber,
        cardName: it.card.name,
        setName: it.card.setName,
        cardNumber: it.card.cardNumber,
        rarity: it.card.rarity,
        condition: it.card.condition,
        game: it.card.game || 'pokemon',
        imageUrl: it.card.imageUrl,
        listedPrice: it.card.price,
      }));

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          binderId,
          buyerName: buyerName.trim(),
          notes: notes.trim(),
          items: orderItems,
        }),
      });

      const data = await res.json();
      if (data.success && data.order) {
        setActiveOrder(data.order);
        try {
          localStorage.setItem(`pokevend_active_order_${binderId}`, JSON.stringify(data.order));
        } catch (e) {}
        onClear(); // Clear the active cart
      } else {
        setErrorMsg(data.error || 'Gagal mengirim pesanan. Silakan coba lagi.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Gagal terhubung ke penjual. Pastikan koneksi internet aktif.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDismissActiveOrder = () => {
    setActiveOrder(null);
    try {
      localStorage.removeItem(`pokevend_active_order_${binderId}`);
    } catch (e) {}
  };

  // If no items in cart and no active order, don't show floating button
  if (items.length === 0 && !activeOrder) {
    return null;
  }

  return (
    <>
      {/* Floating Bottom Cart Bar */}
      <div className="fixed bottom-4 left-0 right-0 z-40 px-4 max-w-lg mx-auto">
        <button
          onClick={() => setIsOpen(true)}
          className="w-full py-3.5 px-4 rounded-2xl bg-[#E05A47] hover:bg-[#C94735] text-white shadow-[0_8px_25px_rgba(224,90,71,0.4)] border-2 border-[#FAF6F0] flex items-center justify-between transition-all transform active:scale-[0.98] cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-pixelify font-bold text-sm">
              {activeOrder ? '1' : items.length}
            </div>
            <div className="text-left">
              <div className="font-pixelify text-xs font-bold leading-tight">
                {activeOrder ? 'PESANAN AKTIF DI MEJA' : 'KERANJANG PESANAN'}
              </div>
              <div className="text-[10px] text-white/80">
                {activeOrder ? `Tiket #${activeOrder.orderNumber}` : `${items.length} kartu terpilih`}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-pixelify text-sm font-bold">
              {activeOrder ? formatCurrency(activeOrder.totalAmount, currency) : formatCurrency(totalAmount, currency)}
            </span>
            <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">
              ▶
            </span>
          </div>
        </button>
      </div>

      {/* Cart & Order Drawer Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
          <div
            className="w-full max-w-md bg-[#FAF6F0] border-2 border-[#D5CABE] rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-h-[90vh] flex flex-col animate-fadeInUp text-[#1E293B]"
            style={{ backgroundImage: 'radial-gradient(#D5CABE 0.75px, transparent 0.75px)', backgroundSize: '16px 16px' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#EAE3D8]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#E05A47] text-white flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-pixelify text-sm font-bold text-[#1E293B]">
                    {activeOrder ? 'TIKET PESANAN MEJA' : 'KERANJANG BELANJA'}
                  </h3>
                  <p className="text-[10px] text-[#7A6B58]">
                    {boothName} • {sellerName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-xl bg-white border border-[#D5CABE] text-[#7A6B58] hover:text-[#1E293B] flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content: Active Order Ticket Screen OR Cart List */}
            {activeOrder ? (
              <div className="py-4 space-y-4 overflow-y-auto flex-1">
                <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-2xl text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 border-2 border-emerald-400 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div className="font-pixelify text-lg font-bold text-emerald-800">
                    PESANAN SUDAH MASUK KE KASIR
                  </div>
                  <div className="inline-block px-3 py-1 bg-white border border-emerald-300 rounded-full font-mono-clean text-xs font-bold text-emerald-700">
                    TIKET #{activeOrder.orderNumber}
                  </div>
                  <p className="text-xs text-emerald-950 font-medium pt-1">
                    Halo <span className="font-bold underline">{activeOrder.buyerName}</span>, tunjukkan nomor tiket ini ke penjual di stand{' '}
                    <span className="font-bold">{boothName}</span> untuk cek kondisi kartu dan bayar.
                  </p>
                </div>

                <div className="bg-white border border-[#D5CABE] rounded-2xl p-3.5 space-y-2">
                  <div className="font-pixelify text-xs font-bold text-[#4A3E31] flex items-center justify-between">
                    <span>STATUS TRANSAKSI</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold border border-amber-300 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {activeOrder.status === 'COMPLETED' ? 'SELESAI / LUNAS' : 'MENUNGGU DI MEJA'}
                    </span>
                  </div>

                  <div className="divide-y divide-[#EAE3D8] text-xs pt-1">
                    {activeOrder.items?.map((item) => (
                      <div key={item.id} className="py-2 flex items-center justify-between">
                        <div className="min-w-0 pr-2">
                          <div className="font-bold text-[#1E293B] truncate">{item.cardName}</div>
                          <div className="text-[10px] text-[#7A6B58]">
                            Slot #{item.slotNumber} • {item.condition}
                          </div>
                        </div>
                        <div className="font-pixelify text-xs font-bold text-[#2E7D32]">
                          {formatCurrency(item.dealPrice || item.listedPrice, currency)}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-[#EAE3D8] flex items-center justify-between text-xs">
                    <span className="font-bold text-[#7A6B58]">Total yang Harus Dibayar:</span>
                    <span className="font-pixelify text-base font-bold text-[#1E293B]">
                      {formatCurrency(activeOrder.totalAmount, currency)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDismissActiveOrder}
                  className="w-full py-3 bg-white border border-[#D5CABE] text-[#7A6B58] hover:text-[#1E293B] rounded-2xl text-xs font-bold transition-all cursor-pointer"
                >
                  Tutup Tiket & Buat Pesanan Baru
                </button>
              </div>
            ) : (
              /* Normal Cart Form */
              <div className="py-3 space-y-3 overflow-y-auto flex-1">
                {/* List of cards */}
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {items.map((item) => (
                    <div
                      key={item.slotNumber}
                      className="p-2.5 bg-white border border-[#D5CABE] rounded-xl flex items-center justify-between gap-3 shadow-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-13 rounded-lg overflow-hidden bg-[#EAE3D8] flex-shrink-0 border border-[#D5CABE]">
                          {item.card.imageUrl ? (
                            <img
                              src={item.card.imageUrl}
                              alt={item.card.name}
                              className="w-full h-full object-contain p-0.5"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[9px] text-[#8C7E6D]">
                              #
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold truncate text-[#1E293B]">{item.card.name}</div>
                          <div className="font-mono-clean text-[10px] text-[#8C7E6D]">
                            Slot #{item.slotNumber} • {item.card.condition}
                          </div>
                          <div className="font-pixelify text-xs font-bold text-[#2E7D32] mt-0.5">
                            {formatCurrency(item.card.price, currency)}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onRemove(item.slotNumber)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Hapus dari keranjang"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Buyer Name Input */}
                <div className="pt-2">
                  <label className="font-pixelify block text-xs font-bold text-[#4A3E31] mb-1.5">
                    NAMA PANGGILAN DI MEJA *
                  </label>
                  <input
                    type="text"
                    value={buyerName}
                    onChange={(e) => {
                      setBuyerName(e.target.value);
                      if (errorMsg) setErrorMsg('');
                    }}
                    placeholder="Contoh: Budi / Kevin"
                    className="w-full px-3.5 py-2.5 bg-white border border-[#D5CABE] text-[#1E293B] rounded-xl text-xs font-bold focus:outline-none focus:border-[#E05A47] shadow-inner"
                  />
                  {errorMsg && (
                    <div className="mt-1 text-[11px] text-rose-600 font-bold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{errorMsg}</span>
                    </div>
                  )}
                </div>

                {/* Optional Note Input */}
                <div>
                  <label className="font-pixelify block text-[11px] font-bold text-[#7A6B58] mb-1">
                    CATATAN (OPSIONAL)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Misal: Mau cek kartu dulu / baju hitam dekat rak"
                    className="w-full px-3.5 py-2 bg-white border border-[#D5CABE] text-[#1E293B] rounded-xl text-xs focus:outline-none focus:border-[#E05A47]"
                  />
                </div>

                {/* Total & Submit */}
                <div className="pt-3 border-t-2 border-[#EAE3D8] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono-clean text-xs text-[#7A6B58]">TOTAL TRANSAKSI:</span>
                    <span className="font-pixelify text-lg font-bold text-[#1E293B]">
                      {formatCurrency(totalAmount, currency)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleSubmitOrder}
                    disabled={isSubmitting}
                    className="font-pixelify w-full py-3.5 bg-[#E05A47] hover:bg-[#C94735] disabled:opacity-50 text-white rounded-2xl text-xs font-bold shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isSubmitting ? 'MENGIRIM PESANAN...' : 'KIRIM PESANAN KE PENJUAL'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
