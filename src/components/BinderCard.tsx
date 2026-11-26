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
      <div className="bg-[#FAF6F0] border-2 border-[#D5CABE] hover:border-[#B5A593] rounded-3xl pl-7 pr-5 py-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group relative overflow-hidden text-[#1E293B]">
        {/* Leather Top Accent */}
        <div
          className="absolute top-0 inset-x-0 h-2 shadow-xs"
          style={{ backgroundColor: binder.coverColor || '#E05A47' }}
        />

        {/* Vintage Binder Spine & Rings Detail on Left Edge */}
        <div className="absolute left-0 inset-y-0 w-4 bg-[#EDE5D8] border-r border-[#D5CABE] flex flex-col justify-around py-6 items-center shadow-inner">
          <div className="w-2.5 h-2.5 rounded-full bg-[#FAF6F0] border border-[#B5A593] shadow-xs flex items-center justify-center">
            <div className="w-1 h-1 rounded-full bg-[#7A6B58]"></div>
          </div>
          <div className="w-2.5 h-2.5 rounded-full bg-[#FAF6F0] border border-[#B5A593] shadow-xs flex items-center justify-center">
            <div className="w-1 h-1 rounded-full bg-[#7A6B58]"></div>
          </div>
          <div className="w-2.5 h-2.5 rounded-full bg-[#FAF6F0] border border-[#B5A593] shadow-xs flex items-center justify-center">
            <div className="w-1 h-1 rounded-full bg-[#7A6B58]"></div>
          </div>
        </div>

        <div>
          {/* Header & Badges */}
          <div className="flex items-start justify-between gap-2 mb-3 pt-1">
            <span
              className="font-pixelify text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-white border-[#D5CABE] text-[#4A3E31] shadow-2xs"
            >
              {binder.badge || 'Binder'}
            </span>
            <span className="font-mono-clean text-[10px] font-bold text-[#7A6B58] bg-[#EAE3D8] px-2.5 py-0.5 rounded-full border border-[#D5CABE]">
              {binder.layoutType} • {binder.totalPages} Hal. ({totalCapacity} Slot)
            </span>
          </div>

          {/* Title & Description */}
          <h3 className="font-pixelify text-lg sm:text-xl font-bold text-[#1E293B] group-hover:text-[#E05A47] transition-colors leading-snug">
            {binder.name}
          </h3>
          <p className="text-xs text-[#7A6B58] line-clamp-2 mt-1 mb-4 leading-relaxed font-clean">
            {binder.description || 'Tidak ada deskripsi binder.'}
          </p>

          {/* Stats Grid with Subtle Inset Plaque Look */}
          <div className="grid grid-cols-2 gap-2 p-3 bg-white rounded-2xl border border-[#D5CABE] mb-4 shadow-2xs">
            <div>
              <div className="font-clean text-[10px] font-bold uppercase tracking-wider text-[#7A6B58]">Total Kartu</div>
              <div className="text-base font-pixelify font-bold text-[#1E293B] flex items-center gap-1.5 mt-0.5">
                <span>{filledCount}</span>
                <span className="text-xs font-mono-clean text-[#7A6B58] font-normal">/ {totalCapacity} slot</span>
              </div>
            </div>

            <div>
              <div className="font-clean text-[10px] font-bold uppercase tracking-wider text-[#7A6B58]">Total Nilai Binder</div>
              <div className="text-base font-pixelify font-bold text-[#2E7D32] mt-0.5 truncate">
                {formatCurrency(totalValue, binder.currency)}
              </div>
            </div>

            <div className="pt-2 border-t border-[#EAE3D8]">
              <div className="font-clean text-[11px] font-bold text-[#2E7D32] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Ready ({availableCount})</span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#EAE3D8]">
              <div className="font-clean text-[11px] font-bold text-[#E05A47] flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" />
                <span>Terjual ({soldCount})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons: Unified 3-Tier Hierarchy */}
        <div className="space-y-2 pt-3 border-t border-[#EAE3D8]">
          {/* Row 1: Primary Action (100% Width) */}
          <a
            href={editUrl}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#E05A47] hover:bg-[#C94735] text-white font-pixelify text-xs sm:text-sm font-bold shadow-xs hover:shadow transition-all cursor-pointer active:translate-y-0.5 border border-black/10"
          >
            <Edit3 className="w-4 h-4" />
            <span>KELOLA SLOT BINDER</span>
          </a>

          {/* Row 2: Secondary Utility Actions (3 Balanced Clean Buttons) */}
          <div className="grid grid-cols-3 gap-1.5">
            {/* View Buyer Catalog */}
            <a
              href={buyerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl bg-white hover:bg-[#FAF6F0] border border-[#D5CABE] text-[#1E293B] font-pixelify text-[11px] font-bold transition-colors shadow-2xs cursor-pointer"
              title="Buka pratinjau tampilan pembeli di HP"
            >
              <ExternalLink className="w-3 h-3 text-[#E05A47]" />
              <span>Pembeli</span>
            </a>

            {/* QR Stand Placard */}
            <button
              onClick={() => setShowQrModal(true)}
              className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl bg-white hover:bg-[#FAF6F0] border border-[#D5CABE] text-[#1E293B] font-pixelify text-[11px] font-bold transition-colors cursor-pointer shadow-2xs"
              title="Tampilkan QR code untuk ditempel di stand meja"
            >
              <QrCode className="w-3 h-3 text-[#E05A47]" />
              <span>QR Meja</span>
            </button>

            {/* Print Slot Stickers */}
            <a
              href={printSlotsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl bg-white hover:bg-[#FAF6F0] border border-[#D5CABE] text-[#1E293B] font-pixelify text-[11px] font-bold transition-colors cursor-pointer shadow-2xs"
              title="Cetak lembar stiker QR per slot kartu"
            >
              <Printer className="w-3 h-3 text-[#2E7D32]" />
              <span>Stiker</span>
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
