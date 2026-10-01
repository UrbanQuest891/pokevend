import React from 'react';
import { getSlotCard } from '@/lib/storage';
import { formatCurrency } from '@/lib/qr';
import {
  Sparkles,
  Layers,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  MessageCircle,
  Tag,
  Store,
} from 'lucide-react';
import Link from 'next/link';

interface SlotPageProps {
  params: Promise<{ id: string; slotNumber: string }>;
}

export default async function SlotDetailPage(props: SlotPageProps) {
  const { id: binderId, slotNumber: slotStr } = await props.params;
  const slotNum = parseInt(slotStr, 10);

  const result = await getSlotCard(binderId, slotNum);

  if (!result) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="text-center p-6 bg-slate-900 border border-slate-800 rounded-3xl max-w-sm">
          <p className="text-sm font-bold text-slate-300">Binder tidak ditemukan.</p>
          <a href="/" className="mt-4 inline-block px-4 py-2 bg-red-600 rounded-xl text-xs font-bold text-white">
            Kembali ke Beranda
          </a>
        </div>
      </div>
    );
  }

  const { binder, card } = result;

  const pocketsPerPage = binder.layoutType === '4-pocket' ? 4 : binder.layoutType === '12-pocket' ? 12 : 9;
  const pageNumber = Math.ceil(slotNum / pocketsPerPage);

  const cleanPhone = (binder.contactNumber || '081234567890').replace(/[^0-9]/g, '');
  const waText = card
    ? encodeURIComponent(
        `Halo ${binder.sellerName}! Saya tertarik membeli kartu [Slot #${slotNum}] ${card.name} (${formatCurrency(
          card.price,
          binder.currency
        )}) di ${binder.name}. Apakah masih ready?`
      )
    : '';
  const waUrl = `https://wa.me/${cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone}?text=${waText}`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 p-3 sm:p-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <Link
            href={`/b/${binder.id}`}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Lihat Binder Lengkap</span>
          </Link>

          <div className="text-right">
            <span className="text-[10px] font-semibold text-slate-400 block">{binder.sellerName}</span>
            <span className="text-xs font-extrabold text-amber-400">{binder.boothName}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto w-full px-4 py-5 flex-1 flex flex-col justify-center">
        {/* Binder & Slot Breadcrumb Tag */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 text-xs font-black tracking-widest uppercase">
              SLOT #{slotNum}
            </span>
            <span className="text-xs font-medium text-slate-400">
              Hal. {pageNumber} • {binder.name}
            </span>
          </div>

          {card && (
            <span
              className={`text-xs font-black px-2.5 py-1 rounded-full border ${
                card.status === 'AVAILABLE'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : card.status === 'SOLD'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}
            >
              {card.status === 'AVAILABLE'
                ? '✅ READY DI MEJA'
                : card.status === 'SOLD'
                ? '❌ SUDAH TERJUAL'
                : '⏳ RESERVED'}
            </span>
          )}
        </div>

        {card ? (
          <div className="space-y-4">
            {/* Card Hero Image */}
            <div className="relative aspect-[3/4] max-h-80 w-full rounded-3xl overflow-hidden bg-slate-900 mx-auto shadow-2xl border-2 border-slate-800 holo-shine">
              {card.imageUrl ? (
                <img
                  src={card.imageUrl}
                  alt={card.name}
                  className="w-full h-full object-contain p-2"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sm text-slate-500">
                  Pokémon Card
                </div>
              )}

              {card.status === 'SOLD' && (
                <div className="absolute inset-0 bg-black/75 backdrop-blur-[2px] flex items-center justify-center">
                  <div className="px-6 py-2.5 bg-red-600 text-white font-black text-lg uppercase tracking-widest rounded-2xl rotate-[-12deg] shadow-2xl border-2 border-white/20">
                    SUDAH TERJUAL
                  </div>
                </div>
              )}
            </div>

            {/* Giant Price Box */}
            <div className="p-4 bg-gradient-to-br from-slate-900 to-slate-900/90 border-2 border-amber-500/60 rounded-3xl text-center shadow-xl">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Harga Resmi Seller:
              </span>
              <div className="text-3xl sm:text-4xl font-black text-amber-400 tracking-tight my-0.5">
                {formatCurrency(card.price, binder.currency)}
              </div>
              {card.originalPrice && card.originalPrice > card.price && (
                <div className="text-xs text-slate-400">
                  Harga Normal:{' '}
                  <span className="line-through">{formatCurrency(card.originalPrice, binder.currency)}</span>
                  <span className="ml-1.5 px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-bold">
                    HEMAT{' '}
                    {formatCurrency(card.originalPrice - card.price, binder.currency)}
                  </span>
                </div>
              )}
            </div>

            {/* Card Metadata Box */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 space-y-3">
              <div>
                <h2 className="text-lg font-black text-white">{card.name}</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {card.setName} {card.cardNumber ? `• #${card.cardNumber}` : ''}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs">
                <div className="p-2.5 bg-slate-950 rounded-xl">
                  <span className="text-[10px] uppercase text-slate-400 block font-semibold">Kondisi</span>
                  <span className="font-extrabold text-white text-xs">{card.condition}</span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-xl">
                  <span className="text-[10px] uppercase text-slate-400 block font-semibold">Rarity</span>
                  <span className="font-extrabold text-white text-xs">{card.rarity || '-'}</span>
                </div>
              </div>

              {card.notes && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-200/90">
                  <span className="font-bold block mb-0.5">Catatan Penjual:</span>
                  <span>{card.notes}</span>
                </div>
              )}
            </div>

            {/* In-Person Buying CTA */}
            <div className="space-y-2 pt-1">
              {card.status === 'AVAILABLE' ? (
                <div className="p-3.5 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl text-center space-y-2">
                  <p className="text-xs font-semibold text-emerald-300">
                    Tertarik dengan kartu ini? Katakan kepada penjual:
                  </p>
                  <div className="p-2.5 bg-emerald-500/20 rounded-xl font-extrabold text-sm text-emerald-200">
                    "Saya mau ambil Slot #{slotNum} ({card.name})"
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-rose-950/30 border border-rose-500/30 rounded-2xl text-center text-xs text-rose-300">
                  Kartu ini sudah dibeli orang lain. Silakan cek kartu menarik lainnya di binder ini!
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <Link
                  href={`/b/${binder.id}`}
                  className="w-full py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold text-center transition-colors flex items-center justify-center gap-1.5"
                >
                  <Layers className="w-4 h-4 text-amber-400" />
                  <span>Jelajahi Binder</span>
                </Link>

                {binder.contactNumber && (
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold text-center transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Chat WhatsApp</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Slot is Empty */
          <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-base text-white">Slot Ini Sedang Kosong</h3>
            <p className="text-xs text-slate-400">
              Kartu di Slot #{slotNum} belum dipasang atau baru saja dikeluarkan oleh seller.
            </p>
            <Link
              href={`/b/${binder.id}`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 text-white font-bold text-xs"
            >
              <span>Lihat Kartu Lain di Binder Ini</span>
            </Link>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-[11px] text-slate-400 border-t border-slate-800/60 max-w-md mx-auto w-full">
        <p>
          PokéVend App • Sistem QR Vending Kartu Pokémon untuk Card Show Event
        </p>
      </footer>
    </div>
  );
}
