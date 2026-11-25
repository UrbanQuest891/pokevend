'use client';

import React, { useState } from 'react';
import { Layers, QrCode, ExternalLink, Printer, Edit3, Sparkles, Tag, CheckCircle2, TrendingUp } from 'lucide-react';
import { Binder } from '@/types';
import { formatCurrency } from '@/lib/qr';
import QrCodeModal from './QrCodeModal';

interface BinderCardProps {
  binder: Binder;
  onRefresh: () => void;
}

export default function BinderCard({ binder, onRefresh }: BinderCardProps) {
  const [showQrModal, setShowQrModal] = useState(false);

  // Calculate statistics
  const slotsList = Object.values(binder.slots || {});
  const filledCount = slotsList.length;
  const pocketsPerPage = binder.layoutType === '4-pocket' ? 4 : binder.layoutType === '12-pocket' ? 12 : 9;
  const totalCapacity = binder.totalPages * pocketsPerPage;
  
  const availableCount = slotsList.filter((c) => c.status === 'AVAILABLE').length;
  const soldCount = slotsList.filter((c) => c.status === 'SOLD').length;
  const totalValue = slotsList.reduce((sum, c) => sum + (c.price || 0), 0);
  const soldValue = slotsList.filter((c) => c.status === 'SOLD').reduce((sum, c) => sum + (c.price || 0), 0);

  const buyerUrl = `/b/${binder.id}`;
  const printStandUrl = `/print/binder/${binder.id}`;
  const printSlotsUrl = `/print/slots/${binder.id}`;
  const editUrl = `/admin/binder/${binder.id}`;

  return (
    <>
      <div className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl p-5 shadow-xl transition-all flex flex-col justify-between group relative overflow-hidden">
        {/* Accent Top Border */}
        <div
          className="absolute top-0 inset-x-0 h-1.5"
          style={{ backgroundColor: binder.coverColor || '#DC2626' }}
        />

        <div>
          {/* Header & Badges */}
          <div className="flex items-start justify-between gap-2 mb-3 pt-1">
            <span
              className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border"
              style={{
                backgroundColor: `${binder.coverColor || '#DC2626'}20`,
                borderColor: `${binder.coverColor || '#DC2626'}50`,
                color: '#f8fafc',
              }}
            >
              {binder.badge || 'Binder'}
            </span>
            <span className="text-[11px] font-bold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full">
              {binder.layoutType} • {binder.totalPages} Hal. ({totalCapacity} Slot)
            </span>
          </div>

          {/* Title & Description */}
          <h3 className="font-pixelify text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
            {binder.name}
          </h3>
          <p className="text-xs text-slate-400 line-clamp-2 mt-1 mb-4 leading-relaxed">
            {binder.description || 'Tidak ada deskripsi binder.'}
          </p>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-2 p-3 bg-slate-950/80 rounded-2xl border border-slate-800/80 mb-4">
            <div>
              <div className="font-pixelify text-[10px] font-bold uppercase text-slate-400">Total Kartu</div>
              <div className="text-base font-pixelify font-bold text-white flex items-center gap-1.5 mt-0.5">
                <span>{filledCount}</span>
                <span className="text-xs font-clean text-slate-400 font-normal">/ {totalCapacity} slot</span>
              </div>
            </div>

            <div>
              <div className="font-pixelify text-[10px] font-bold uppercase text-slate-400">Total Nilai Binder</div>
              <div className="text-base font-pixelify font-bold text-amber-400 mt-0.5 truncate">
                {formatCurrency(totalValue, binder.currency)}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/60">
              <div className="text-[10px] font-semibold uppercase text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Ready ({availableCount})</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/60">
              <div className="text-[10px] font-semibold uppercase text-rose-400 flex items-center gap-1">
                <Tag className="w-3 h-3" />
                <span>Terjual ({soldCount})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <div className="grid grid-cols-2 gap-2">
            {/* View Buyer Catalog */}
            <a
              href={buyerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
              <span>Lihat Pembeli</span>
            </a>

            {/* Edit Slots */}
            <a
              href={editUrl}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-300 text-xs font-bold transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Kelola Slot</span>
            </a>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* QR Stand Placard */}
            <button
              onClick={() => setShowQrModal(true)}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-colors"
            >
              <QrCode className="w-3.5 h-3.5 text-red-400" />
              <span>QR Meja Stand</span>
            </button>

            {/* Print Slot Stickers */}
            <a
              href={printSlotsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-400" />
              <span>Stiker QR Slot</span>
            </a>
          </div>
        </div>
      </div>

      {/* QR Modal for Table Placard */}
      <QrCodeModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        title={binder.name}
        subtitle="Scan untuk melihat seluruh isi kartu di binder ini langsung di HP pembeli"
        targetUrl={buyerUrl}
        printUrl={printStandUrl}
      />
    </>
  );
}
