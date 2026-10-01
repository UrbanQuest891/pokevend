'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Binder } from '@/types';
import { generateQrDataUrl } from '@/lib/qr';
import { Printer, ArrowLeft, QrCode, Sparkles } from 'lucide-react';

export default function PrintBinderStandPage() {
  const params = useParams();
  const binderId = params.id as string;

  const [binder, setBinder] = useState<Binder | null>(null);
  const [qrSrc, setQrSrc] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await fetch(`/api/binders/${binderId}`);
        const data = await res.json();
        if (data.success) {
          setBinder(data.binder);
          const fullUrl = `${window.location.origin}/b/${data.binder.id}`;
          const qr = await generateQrDataUrl(fullUrl, { width: 600, margin: 2 });
          setQrSrc(qr);
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
      <div className="min-h-screen bg-white text-black flex items-center justify-center p-6">
        <p className="text-sm font-bold">Menyiapkan cetakan stand meja...</p>
      </div>
    );
  }

  if (!binder) return null;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 sm:p-8 flex flex-col items-center">
      {/* Screen Control Bar (Hidden on Print) */}
      <div className="max-w-xl w-full mb-6 flex items-center justify-between no-print">
        <a
          href={`/admin/binder/${binder.id}`}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Editor Binder</span>
        </a>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-500 hover:brightness-110 active:scale-95 text-white font-black text-xs shadow-xl shadow-red-500/20 transition-all"
        >
          <Printer className="w-4 h-4" />
          <span>Cetak Stand Meja (Print / PDF)</span>
        </button>
      </div>

      {/* Printable Placard Card */}
      <div className="bg-white text-slate-900 w-full max-w-lg rounded-3xl p-8 sm:p-10 shadow-2xl border-4 border-slate-900 flex flex-col items-center text-center relative overflow-hidden print:border-2 print:shadow-none print:p-6 print:m-0 print:max-w-full">
        {/* Top Header Accent */}
        <div
          className="absolute top-0 inset-x-0 h-4"
          style={{ backgroundColor: binder.coverColor || '#DC2626' }}
        />

        {/* Booth & Seller Branding */}
        <div className="mt-2 mb-4">
          <div className="inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-black uppercase tracking-wider mb-2 border border-slate-200">
            {binder.boothName || 'Card Show Exhibition'}
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {binder.sellerName}
          </h2>
        </div>

        {/* Binder Specific Badge & Title */}
        <div className="p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl w-full mb-6">
          <span
            className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full text-white inline-block mb-1.5"
            style={{ backgroundColor: binder.coverColor || '#DC2626' }}
          >
            {binder.badge || 'Koleksi Binder'}
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
            {binder.name}
          </h1>
          {binder.description && (
            <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">{binder.description}</p>
          )}
        </div>

        {/* Big High-Contrast Scannable QR Code */}
        <div className="p-4 bg-white border-4 border-slate-900 rounded-3xl shadow-lg relative group mb-4">
          {qrSrc ? (
            <img src={qrSrc} alt="Binder QR Code" className="w-64 h-64 sm:w-72 sm:h-72 object-contain" />
          ) : (
            <div className="w-64 h-64 flex items-center justify-center text-xs text-slate-400">
              Memuat QR Code...
            </div>
          )}
        </div>

        {/* Call to action instructions */}
        <div className="space-y-1.5 max-w-sm">
          <div className="flex items-center justify-center gap-1.5 text-red-600 font-black text-sm tracking-wide uppercase">
            <QrCode className="w-4 h-4" />
            <span>SCAN DENGAN KAMERA HP ANDA</span>
          </div>
          <p className="text-xs text-slate-600 font-semibold leading-relaxed">
            Lihat daftar lengkap kartu, detail kondisi, dan <strong>harga live resmi</strong> di binder ini tanpa perlu menunggu seller!
          </p>
        </div>

        {/* Payment badges footer */}
        <div className="mt-6 pt-4 border-t border-slate-200 w-full flex items-center justify-center gap-4 text-[11px] font-bold text-slate-500">
          <span>✓ QRIS</span>
          <span>✓ Cash</span>
          <span>✓ Transfer Bank</span>
          <span>✓ Trade / Barter</span>
        </div>
      </div>
    </div>
  );
}
