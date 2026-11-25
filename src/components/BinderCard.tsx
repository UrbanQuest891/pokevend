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

  const buyerUrl = `/b/${binder.id}`;
  const printStandUrl = `/print/binder/${binder.id}`;
  const printSlotsUrl = `/print/slots/${binder.id}`;
  const editUrl = `/admin/binder/${binder.id}`;

  return (
    <>
      <div className="bg-[#FAF6F0] border-2 border-[#D5CABE] hover:border-[#B5A593] rounded-3xl p-5 shadow-xs transition-all flex flex-col justify-between group relative overflow-hidden text-[#1E293B]">
        {/* Accent Top Border */}
        <div
          className="absolute top-0 inset-x-0 h-1.5"
          style={{ backgroundColor: binder.coverColor || '#E05A47' }}
        />

        <div>
          {/* Header & Badges */}
          <div className="flex items-start justify-between gap-2 mb-3 pt-1">
            <span
              className="font-pixelify text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-white border-[#D5CABE] text-[#4A3E31]"
            >
              {binder.badge || 'Binder'}
            </span>
            <span className="font-mono-clean text-[10px] font-bold text-[#7A6B58] bg-[#EAE3D8] px-2 py-0.5 rounded-full border border-[#D5CABE]">
              {binder.layoutType} • {binder.totalPages} Hal. ({totalCapacity} Slot)
            </span>
          </div>

          {/* Title & Description */}
          <h3 className="font-pixelify text-lg font-bold text-[#1E293B] group-hover:text-[#E05A47] transition-colors">
            {binder.name}
          </h3>
          <p className="text-xs text-[#7A6B58] line-clamp-2 mt-1 mb-4 leading-relaxed font-clean">
            {binder.description || 'Tidak ada deskripsi binder.'}
          </p>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-2 p-3 bg-white rounded-2xl border border-[#D5CABE] mb-4 shadow-2xs">
            <div>
              <div className="font-pixelify text-[10px] font-bold uppercase text-[#7A6B58]">Total Kartu</div>
              <div className="text-base font-pixelify font-bold text-[#1E293B] flex items-center gap-1.5 mt-0.5">
                <span>{filledCount}</span>
                <span className="text-xs font-mono-clean text-[#7A6B58] font-normal">/ {totalCapacity} slot</span>
              </div>
            </div>

            <div>
              <div className="font-pixelify text-[10px] font-bold uppercase text-[#7A6B58]">Total Nilai Binder</div>
              <div className="text-base font-pixelify font-bold text-[#2E7D32] mt-0.5 truncate">
                {formatCurrency(totalValue, binder.currency)}
              </div>
            </div>

            <div className="pt-2 border-t border-[#EAE3D8]">
              <div className="font-pixelify text-[10px] font-bold uppercase text-[#2E7D32] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Ready ({availableCount})</span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#EAE3D8]">
              <div className="font-pixelify text-[10px] font-bold uppercase text-[#E05A47] flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" />
                <span>Terjual ({soldCount})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2 border-t border-[#EAE3D8]">
          <div className="grid grid-cols-2 gap-2">
            {/* View Buyer Catalog */}
            <a
              href={buyerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#E05A47] hover:bg-[#C94735] text-white font-pixelify text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Lihat Pembeli</span>
            </a>

            {/* Edit Slots */}
            <a
              href={editUrl}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white hover:bg-[#FAF6F0] border border-[#D5CABE] text-[#1E293B] font-pixelify text-xs font-bold transition-colors shadow-2xs cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-[#E05A47]" />
              <span>Kelola Slot</span>
            </a>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* QR Stand Placard */}
            <button
              onClick={() => setShowQrModal(true)}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white hover:bg-[#FAF6F0] border border-[#D5CABE] text-[#7A6B58] hover:text-[#1E293B] font-pixelify text-xs font-bold transition-colors cursor-pointer shadow-2xs"
            >
              <QrCode className="w-3.5 h-3.5 text-[#E05A47]" />
              <span>QR Meja Stand</span>
            </button>

            {/* Print Slot Stickers */}
            <a
              href={printSlotsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white hover:bg-[#FAF6F0] border border-[#D5CABE] text-[#7A6B58] hover:text-[#1E293B] font-pixelify text-xs font-bold transition-colors cursor-pointer shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-[#2E7D32]" />
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
