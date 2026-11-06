'use client';

import React from 'react';
import { Monitor, Smartphone, X, ShieldAlert, Check } from 'lucide-react';

interface MobileNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileNoticeModal({ isOpen, onClose }: MobileNoticeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 no-print">
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-6 text-slate-100 shadow-2xl text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Dual Device Icon */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/40 text-blue-400 flex items-center justify-center shadow-lg">
            <Monitor className="w-6 h-6" />
          </div>
          <span className="text-slate-600 font-bold">vs</span>
          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 flex items-center justify-center opacity-60">
            <Smartphone className="w-5 h-5" />
          </div>
        </div>

        <h3 className="text-base font-black text-white">Fitur Drag & Drop Khusus PC</h3>
        <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
          Fitur geser dan tukar posisi slot kartu (**Drag & Drop**) dirancang khusus untuk kenyamanan di web browser komputer/laptop (PC).
        </p>

        <div className="my-4 p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-left text-xs text-slate-300 space-y-1.5">
          <p className="font-semibold text-amber-300 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>Kenapa dinonaktifkan di HP?</span>
          </p>
          <p className="text-[11px] text-slate-400 leading-normal">
            Di perangkat layar sentuh (HP / tablet), gestur drag dinonaktifkan agar navigasi dan scroll halaman tetap lancar tanpa risiko kartu tergeser tidak sengaja.
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-red-600 to-amber-500 hover:brightness-110 text-white text-xs font-bold transition-all shadow-lg shadow-red-500/20 flex items-center justify-center gap-1.5"
        >
          <Check className="w-4 h-4" />
          <span>Saya Mengerti</span>
        </button>
      </div>
    </div>
  );
}
