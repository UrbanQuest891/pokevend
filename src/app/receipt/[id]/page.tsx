'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Order, OrderItem } from '@/types';
import { formatCurrency } from '@/lib/qr';
import {
  CheckCircle2,
  Printer,
  Share2,
  ArrowLeft,
  Sparkles,
  ShoppingBag,
  Store,
  Clock,
  Calendar,
  Layers,
} from 'lucide-react';

export default function DigitalReceiptPage() {
  const params = useParams();
  const orderId = params.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadReceipt() {
      try {
        setLoading(true);
        const res = await fetch(`/api/orders/${orderId}`, { cache: 'no-store' });
        const data = await res.json();
        if (data.success && data.order) {
          setOrder(data.order);
        }
      } catch (err) {
        console.error('Failed to load receipt:', err);
      } finally {
        setLoading(false);
      }
    }
    if (orderId) loadReceipt();
  }, [orderId]);

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5EFE6] text-[#1E293B] flex items-center justify-center p-4 font-clean">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full border-4 border-[#E05A47] border-t-transparent animate-spin mx-auto"></div>
          <p className="font-pixelify text-sm font-bold text-[#7A6B58]">MEMBUAT STRUK DIGITAL...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#F5EFE6] text-[#1E293B] flex items-center justify-center p-4 font-clean">
        <div className="text-center p-6 bg-[#FAF6F0] border-2 border-[#D5CABE] rounded-3xl max-w-sm shadow-xl space-y-3">
          <p className="font-pixelify text-sm font-bold text-[#1E293B]">Struk transaksi tidak ditemukan.</p>
          <a
            href="/"
            className="inline-block px-4 py-2 bg-[#E05A47] text-white rounded-xl font-pixelify text-xs font-bold shadow-md"
          >
            Kembali ke Beranda
          </a>
        </div>
      </div>
    );
  }

  const activeItems = order.items.filter((it) => it.status === 'IN_ORDER');

  return (
    <div
      className="min-h-screen bg-[#F5EFE6] text-[#1E293B] flex flex-col justify-between py-6 px-4 font-clean"
      style={{
        backgroundImage: 'radial-gradient(#E2D9CC 0.85px, transparent 0.85px)',
        backgroundSize: '20px 20px',
      }}
    >
      {/* Top Controls (Hidden on print) */}
      <div className="max-w-md mx-auto w-full mb-4 flex items-center justify-between no-print">
        <div className="flex items-center gap-2">
          <a
            href="/b"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#D5CABE] text-[#7A6B58] hover:text-[#1E293B] text-xs font-pixelify font-bold shadow-2xs transition-colors"
            title="Kembali ke Rak Stand Meja Pembeli"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#E05A47]" />
            <span>Rak Meja</span>
          </a>
          <a
            href="/admin"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white border border-[#D5CABE] text-[#7A6B58] hover:text-[#1E293B] text-[11px] font-pixelify font-bold shadow-2xs transition-colors"
            title="Masuk ke Dashboard Kasir"
          >
            <Store className="w-3.5 h-3.5 text-[#7A6B58]" />
            <span>Kasir</span>
          </a>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#D5CABE] text-[#1E293B] hover:bg-[#FAF6F0] text-xs font-pixelify font-bold shadow-2xs cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-blue-600" />
            <span>{copied ? 'Tersalin!' : 'Bagikan'}</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#E05A47] text-white text-xs font-pixelify font-bold shadow-xs cursor-pointer hover:bg-[#D04936]"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak / PDF</span>
          </button>
        </div>
      </div>

      {/* Retro Receipt Card Container */}
      <main className="max-w-md mx-auto w-full">
        <div className="bg-[#FAF6F0] border-2 border-[#D5CABE] rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-6">
          {/* Perforated Top Header Accent */}
          <div className="text-center space-y-2 border-b-2 border-dashed border-[#D5CABE] pb-5">
            <div className="w-12 h-12 rounded-2xl bg-[#E05A47] mx-auto p-0.5 shadow-sm flex items-center justify-center border border-black/10">
              <div className="w-full h-full bg-[#FAF6F0] rounded-[14px] flex items-center justify-center relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-1/2 bg-[#E05A47]"></div>
                <div className="absolute bottom-0 inset-x-0 h-1/2 bg-white"></div>
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 bg-[#1E293B]"></div>
                <div className="w-4 h-4 rounded-full bg-white border-2 border-[#1E293B] z-10 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#E05A47]"></div>
                </div>
              </div>
            </div>

            <h1 className="font-pixelify text-2xl font-bold tracking-tight text-[#1E293B]">
              POKÉVEND RECEIPT
            </h1>
            <p className="text-xs text-[#7A6B58] font-medium">
              Struk Resmi Transaksi Meja Event & Bazaar TCG
            </p>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-pixelify text-xs font-bold mt-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>TRANSAKSI RESMI LUNAS</span>
            </div>
          </div>

          {/* Transaction Metadata */}
          <div className="grid grid-cols-2 gap-3 text-xs bg-white p-3.5 rounded-2xl border border-[#D5CABE]">
            <div>
              <span className="text-[#7A6B58] block text-[10px] font-pixelify font-bold uppercase">
                NOMOR TIKET
              </span>
              <span className="font-pixelify font-bold text-sm text-[#1E293B]">
                {order.orderNumber}
              </span>
            </div>
            <div>
              <span className="text-[#7A6B58] block text-[10px] font-pixelify font-bold uppercase">
                NAMA PEMBELI
              </span>
              <span className="font-bold text-sm text-[#1E293B] truncate block">
                {order.buyerName}
              </span>
            </div>
            <div className="col-span-2 pt-2 border-t border-[#EAE3D8] flex items-center justify-between text-[11px] text-[#7A6B58]">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#E05A47]" />
                {new Date(order.createdAt).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              <span className="font-pixelify font-bold text-[#1E293B]">
                Table Stand Verified
              </span>
            </div>
          </div>

          {/* Purchased Items Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-pixelify font-bold text-[#7A6B58] pb-1 border-b border-[#EAE3D8]">
              <span>KARTU DIBELI</span>
              <span>HARGA DEAL</span>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {activeItems.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-white border border-[#D5CABE]"
                >
                  <div className="pr-3">
                    <div className="font-pixelify font-bold text-[#1E293B] text-[13px]">
                      Slot #{item.slotNumber}: {item.cardName}
                    </div>
                    <div className="text-[10px] text-[#7A6B58] flex items-center gap-1.5 mt-0.5">
                      <span>{item.setName || 'TCG Hit'}</span>
                      <span>•</span>
                      <span className="font-bold text-[#1E293B]">{item.condition}</span>
                    </div>
                  </div>
                  <div className="font-pixelify font-bold text-[#1E293B] text-xs whitespace-nowrap">
                    {formatCurrency(item.dealPrice, 'IDR')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total Payment Box */}
          <div className="p-4 rounded-2xl bg-[#FAF6F0] border-2 border-[#D5CABE] space-y-1.5">
            <div className="flex justify-between items-center text-xs text-[#7A6B58]">
              <span>Jumlah Kartu:</span>
              <span className="font-bold font-pixelify text-[#1E293B]">{activeItems.length} Pcs</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-[#D5CABE]">
              <span className="font-pixelify font-bold text-sm text-[#1E293B]">TOTAL DEAL AKHIR:</span>
              <span className="font-pixelify font-bold text-lg text-[#2E7D32]">
                {formatCurrency(order.totalAmount, 'IDR')}
              </span>
            </div>
          </div>

          {/* Barcode & Thank You Footer */}
          <div className="text-center pt-2 border-t-2 border-dashed border-[#D5CABE] space-y-2">
            <p className="font-pixelify text-xs font-bold text-[#1E293B]">
              Terima Kasih Telah Berbelanja di Stand Kami
            </p>
            <p className="text-[10px] text-[#7A6B58] max-w-xs mx-auto">
              Struk ini bukti pembelian kartu fisik di meja stand. Simpan tautan ini untuk catatan koleksi Anda.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center font-pixelify text-[10px] text-[#7A6B58] mt-6 no-print">
        PokéVend Digital Receipt System • {new Date().getFullYear()}
      </footer>
    </div>
  );
}
