'use client';

import React, { useState } from 'react';
import { ShoppingBag, X, Trash2, MessageCircle, Check, ArrowRight } from 'lucide-react';
import { PokemonCard } from '@/types';
import { formatCurrency } from '@/lib/qr';

export interface WishlistItem {
  slotNumber: number;
  binderName: string;
  binderId: string;
  card: PokemonCard;
}

interface WishlistDrawerProps {
  items: WishlistItem[];
  onRemove: (slotNumber: number, binderId: string) => void;
  onClear: () => void;
  sellerPhone?: string;
  currency?: 'IDR' | 'USD';
}

export default function WishlistDrawer({
  items,
  onRemove,
  onClear,
  sellerPhone = '081234567890',
  currency = 'IDR',
}: WishlistDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCounterView, setShowCounterView] = useState(false);

  if (items.length === 0) return null;

  const totalPrice = items.reduce((sum, item) => sum + (item.card.price || 0), 0);

  const getWhatsAppMessage = () => {
    let msg = `Halo! Saya tertarik membeli ${items.length} kartu dari binder di booth Anda:\n\n`;
    items.forEach((item, idx) => {
      msg += `${idx + 1}. [Slot #${item.slotNumber}] ${item.card.name} (${item.card.condition}) - ${formatCurrency(
        item.card.price,
        currency
      )}\n`;
    });
    msg += `\nTotal: ${formatCurrency(totalPrice, currency)}\nApakah masih tersedia? Terima kasih!`;
    return encodeURIComponent(msg);
  };

  const cleanPhone = sellerPhone.replace(/[^0-9]/g, '');
  const waUrl = `https://wa.me/${cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone}?text=${getWhatsAppMessage()}`;

  return (
    <>
      {/* Floating Bottom Bar */}
      <div className="fixed bottom-4 inset-x-4 max-w-lg mx-auto z-40 no-print">
        <div className="bg-slate-900/95 border-2 border-amber-500/80 rounded-2xl p-3 shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-red-500 flex items-center justify-center font-bold text-white shadow-lg shadow-amber-500/20">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-amber-300">
                {items.length} Kartu Dipilih
              </div>
              <div className="text-sm font-extrabold text-white">
                Total: {formatCurrency(totalPrice, currency)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setShowCounterView(true);
                setIsOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
            >
              <span>Tunjukkan ke Seller</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Slide-over / Modal Detail */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 no-print">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-t-3xl sm:rounded-2xl shadow-2xl p-6 max-h-[85vh] flex flex-col text-slate-100">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-extrabold text-lg text-white flex items-center gap-2">
                  <span className="text-amber-400">📋</span>
                  {showCounterView ? 'Tunjukkan ke Penjual di Meja' : 'Daftar Kartu Incaran'}
                </h3>
                <p className="text-xs text-slate-400">
                  {showCounterView
                    ? 'Tunjukkan layar HP ini agar seller langsung ambilkan kartu dari binder!'
                    : 'Kartu yang Anda tandai selama melihat binder'}
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List of cards */}
            <div className="flex-1 overflow-y-auto py-3 space-y-2.5 my-2">
              {items.map((item, idx) => (
                <div
                  key={`${item.binderId}-${item.slotNumber}`}
                  className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 font-extrabold text-xs">
                      SLOT #{item.slotNumber}
                    </div>
                    {item.card.imageUrl && (
                      <img
                        src={item.card.imageUrl}
                        alt=""
                        className="w-10 h-14 object-cover rounded shadow-sm flex-shrink-0"
                      />
                    )}
                    <div>
                      <div className="font-bold text-sm text-white line-clamp-1">{item.card.name}</div>
                      <div className="text-[11px] text-slate-400">
                        {item.card.condition} • {item.card.setName}
                      </div>
                      <div className="text-xs font-extrabold text-emerald-400">
                        {formatCurrency(item.card.price, currency)}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onRemove(item.slotNumber, item.binderId)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded hover:bg-rose-500/10 transition-colors"
                    title="Hapus"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Total & Call to Action */}
            <div className="pt-3 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Estimasi Total Harga:</span>
                <span className="text-lg font-black text-amber-400">
                  {formatCurrency(totalPrice, currency)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-lg shadow-emerald-600/20"
                >
                  <MessageCircle className="w-4 h-4" />
                  Chat WhatsApp
                </a>

                <button
                  onClick={onClear}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Kosongkan List
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
