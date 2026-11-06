'use client';

import React, { useState, useEffect } from 'react';
import { X, QrCode, Copy, ExternalLink, Printer, Check, Wifi } from 'lucide-react';
import { generateQrDataUrl } from '@/lib/qr';
import { resolveShareableUrl } from '@/lib/networkHelper';

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  targetUrl: string;
  printUrl?: string;
}

export default function QrCodeModal({
  isOpen,
  onClose,
  title,
  subtitle,
  targetUrl,
  printUrl,
}: QrCodeModalProps) {
  const [qrSrc, setQrSrc] = useState<string>('');
  const [resolvedUrl, setResolvedUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (isOpen && targetUrl) {
      resolveShareableUrl(targetUrl).then((url) => {
        if (!isMounted) return;
        setResolvedUrl(url);
        generateQrDataUrl(url, { width: 400, margin: 2 }).then((qr) => {
          if (isMounted) setQrSrc(qr);
        });
      });
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen, targetUrl]);

  if (!isOpen) return null;

  const displayUrl = resolvedUrl || targetUrl;
  const isLanReady = displayUrl.includes('192.168.') || displayUrl.includes('10.') || displayUrl.includes('172.');

  const handleCopy = () => {
    navigator.clipboard.writeText(displayUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm no-print">
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-6 text-center shadow-2xl text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center mx-auto mb-3">
          <QrCode className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-black text-white">{title}</h3>
        {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}

        {isLanReady && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 mt-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
            <Wifi className="w-3 h-3" />
            <span>Wi-Fi Network Ready (Dapat discan semua HP)</span>
          </div>
        )}

        {/* QR Code Container with High Contrast & Pokeball badge */}
        <div className="my-5 p-4 bg-white rounded-2xl shadow-inner inline-block mx-auto border-4 border-slate-800 relative group">
          {qrSrc ? (
            <img src={qrSrc} alt="QR Code" className="w-56 h-56 mx-auto object-contain" />
          ) : (
            <div className="w-56 h-56 flex items-center justify-center text-slate-400 text-xs">
              Membuat QR Code...
            </div>
          )}
          <div className="mt-2 text-[10px] font-bold text-slate-600 tracking-wider uppercase">
            Arahkan Kamera HP ke Sini
          </div>
        </div>

        {/* URL Pill & Copy */}
        <div className="flex items-center gap-2 p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs mb-4">
          <span className="truncate text-slate-400 flex-1 text-left font-mono pl-1">{displayUrl}</span>
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex-shrink-0"
            title="Salin Link"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <a
            href={displayUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Buka Halaman
          </a>

          {printUrl ? (
            <a
              href={printUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-gradient-to-r from-red-600 to-amber-500 hover:brightness-110 text-white text-xs font-bold transition-all shadow-lg shadow-red-500/20"
            >
              <Printer className="w-4 h-4" />
              Cetak Stand
            </a>
          ) : (
            <button
              onClick={() => window.print()}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-gradient-to-r from-red-600 to-amber-500 hover:brightness-110 text-white text-xs font-bold transition-all shadow-lg shadow-red-500/20"
            >
              <Printer className="w-4 h-4" />
              Cetak
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
