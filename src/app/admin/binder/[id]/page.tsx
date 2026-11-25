'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import EditSlotModal from '@/components/EditSlotModal';
import QrCodeModal from '@/components/QrCodeModal';
import SaveSlotsConfirmModal, { SlotChangeItem } from '@/components/SaveSlotsConfirmModal';
import MobileNoticeModal from '@/components/MobileNoticeModal';
import { Binder, PokemonCard } from '@/types';
import { formatCurrency } from '@/lib/qr';
import { formatCardImageUrl } from '@/lib/imageHelper';
import { smoothScrollToElement } from '@/lib/scrollHelper';
import { formatCardDisplayName, translateCardSet } from '@/lib/cardTranslator';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit3,
  ExternalLink,
  Printer,
  QrCode,
  Tag,
  Percent,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Layers,
  Move,
  GripVertical,
  RotateCcw,
  Save,
  ArrowRightLeft,
  ShieldAlert,
  Monitor,
  Info,
} from 'lucide-react';

export default function BinderEditorPage() {
  const params = useParams();
  const router = useRouter();
  const binderId = params.id as string;

  const [binder, setBinder] = useState<Binder | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const contentTopRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  // Smooth glide to top of content when target page content displays
  const handlePageChange = (newPage: number) => {
    if (!binder || newPage < 1 || newPage > binder.totalPages || newPage === currentPage) return;
    setCurrentPage(newPage);
    smoothScrollToElement(contentTopRef.current, 75);
  };

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    smoothScrollToElement(contentTopRef.current, 75);
  }, [currentPage]);
  const [discountPercent, setDiscountPercent] = useState('');
  const [applyingDiscount, setApplyingDiscount] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  // Reorder / Drag and Drop state
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);
  const [draftSlots, setDraftSlots] = useState<Record<number, PokemonCard> | null>(null);
  const [draggedSlot, setDraggedSlot] = useState<number | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);
  const [transitCard, setTransitCard] = useState<{ sourceSlot: number; card: PokemonCard } | null>(null);
  const [showSaveConfirmModal, setShowSaveConfirmModal] = useState(false);
  const [showMobileNoticeModal, setShowMobileNoticeModal] = useState(false);
  const [isSavingSlots, setIsSavingSlots] = useState(false);
  const isDraggingRef = useRef(false);
  const dragTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Desktop vs Mobile Detection (PC only)
  useEffect(() => {
    const checkDesktop = () => {
      if (typeof window === 'undefined' || typeof navigator === 'undefined') {
        setIsDesktop(true);
        return;
      }
      const ua = navigator.userAgent || '';
      // Only detect actual mobile phones
      const isMobilePhone = /iPhone|iPod|Android.*Mobile|Windows Phone|IEMobile|BlackBerry|Opera Mini/i.test(ua);
      const isSmallMobile = window.innerWidth < 640 && (navigator.maxTouchPoints > 1 || 'ontouchstart' in window);
      setIsDesktop(!isMobilePhone && !isSmallMobile);
    };

    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // Compute differences between binder.slots and draftSlots
  const getSlotChanges = (): SlotChangeItem[] => {
    if (!binder || !draftSlots) return [];
    const list: SlotChangeItem[] = [];
    const pocketsPerPage = binder.layoutType === '4-pocket' ? 4 : binder.layoutType === '12-pocket' ? 12 : 9;
    const maxSlot = binder.totalPages * pocketsPerPage;

    for (let s = 1; s <= maxSlot; s++) {
      const orig = binder.slots[s] || null;
      const draft = draftSlots[s] || null;
      const origId = orig?.id || '';
      const draftId = draft?.id || '';
      if (origId !== draftId) {
        list.push({
          slotNumber: s,
          originalCard: orig,
          newCard: draft,
        });
      }
    }
    return list;
  };

  const slotChanges = getSlotChanges();
  const changedCount = slotChanges.length;

  // Protect against tab exit while editing with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isReorderMode && draftSlots && changedCount > 0) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isReorderMode, draftSlots, changedCount]);

  const handleToggleReorderMode = () => {
    if (!isDesktop) {
      setShowMobileNoticeModal(true);
      return;
    }

    if (isReorderMode) {
      if (changedCount > 0) {
        setShowSaveConfirmModal(true);
      } else {
        setIsReorderMode(false);
        setDraftSlots(null);
        setTransitCard(null);
      }
    } else {
      if (!binder) return;
      setDraftSlots(JSON.parse(JSON.stringify(binder.slots || {})));
      setIsReorderMode(true);
    }
  };

  const handleCancelReorder = () => {
    if (changedCount > 0) {
      if (!confirm(`Batalkan ${changedCount} perubahan posisi slot kartu dan kembalikan ke susunan semula?`)) {
        return;
      }
    }
    setIsReorderMode(false);
    setDraftSlots(null);
    setTransitCard(null);
    setDraggedSlot(null);
    setDragOverSlot(null);
  };

  const handleDragStart = (e: React.DragEvent, slotNum: number) => {
    if (!isDesktop) return;

    isDraggingRef.current = true;
    if (dragTimeoutRef.current) clearTimeout(dragTimeoutRef.current);

    // Auto-activate reorder mode if not already active
    if (!isReorderMode) {
      if (!binder) return;
      setDraftSlots(JSON.parse(JSON.stringify(binder.slots || {})));
      setIsReorderMode(true);
    }

    e.stopPropagation();
    try {
      e.dataTransfer.setData('text/plain', String(slotNum));
      e.dataTransfer.setData('application/x-pokevend-slot', String(slotNum));
      e.dataTransfer.effectAllowed = 'move';
    } catch {}

    setDraggedSlot(slotNum);
  };

  const handleDragOver = (e: React.DragEvent, slotNum: number) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      e.dataTransfer.dropEffect = 'move';
    } catch {}

    if (dragOverSlot !== slotNum) {
      setDragOverSlot(slotNum);
    }
  };

  const handleDragLeave = (e: React.DragEvent, slotNum: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    if (dragOverSlot === slotNum) {
      setDragOverSlot(null);
    }
  };

  const handleDropOnSlot = (e: React.DragEvent | null, targetSlot: number) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const currentMap = draftSlots || (binder ? JSON.parse(JSON.stringify(binder.slots || {})) : {});

    // Case 1: Drop from transit tray
    if (transitCard) {
      const newSlots = { ...currentMap };
      const existingAtTarget = newSlots[targetSlot] || null;
      newSlots[targetSlot] = transitCard.card;

      if (existingAtTarget) {
        newSlots[transitCard.sourceSlot] = existingAtTarget;
      } else {
        delete newSlots[transitCard.sourceSlot];
      }

      setDraftSlots(newSlots);
      if (!isReorderMode) setIsReorderMode(true);
      setTransitCard(null);
      setDraggedSlot(null);
      setDragOverSlot(null);
      return;
    }

    // Determine source slot from state or dataTransfer
    let sourceSlot = draggedSlot;
    if (sourceSlot === null && e) {
      try {
        const textData = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('application/x-pokevend-slot');
        if (textData) {
          sourceSlot = parseInt(textData, 10);
        }
      } catch {}
    }

    if (sourceSlot === null || isNaN(sourceSlot) || sourceSlot === targetSlot) {
      setDraggedSlot(null);
      setDragOverSlot(null);
      return;
    }

    const newSlots = { ...currentMap };
    const sourceCard = newSlots[sourceSlot];
    const targetCard = newSlots[targetSlot];

    if (!sourceCard) {
      setDraggedSlot(null);
      setDragOverSlot(null);
      return;
    }

    if (targetCard) {
      newSlots[targetSlot] = sourceCard;
      newSlots[sourceSlot] = targetCard;
    } else {
      newSlots[targetSlot] = sourceCard;
      delete newSlots[sourceSlot];
    }

    setDraftSlots(newSlots);
    if (!isReorderMode) setIsReorderMode(true);
    setDraggedSlot(null);
    setDragOverSlot(null);
  };

  const handleDropOnTransitTray = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    let slotNum: number | null = draggedSlot;
    if (slotNum === null && e) {
      try {
        const textData = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('application/x-pokevend-slot');
        if (textData) {
          const parsed = parseInt(textData, 10);
          if (!isNaN(parsed)) slotNum = parsed;
        }
      } catch {}
    }

    const currentMap = draftSlots || (binder ? JSON.parse(JSON.stringify(binder.slots || {})) : {});
    if (slotNum === null || !currentMap[slotNum]) {
      setDraggedSlot(null);
      setDragOverSlot(null);
      return;
    }

    const card = currentMap[slotNum];
    setTransitCard({ sourceSlot: slotNum, card });
    if (!isReorderMode) setIsReorderMode(true);
    if (!draftSlots) setDraftSlots(currentMap);
    setDraggedSlot(null);
    setDragOverSlot(null);
  };

  const handleConfirmSaveSlots = async () => {
    if (!binder || !draftSlots) return;
    try {
      setIsSavingSlots(true);
      const res = await fetch(`/api/binders/${binder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slots: draftSlots }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBinder(data.binder);
        setIsReorderMode(false);
        setDraftSlots(null);
        setTransitCard(null);
        setShowSaveConfirmModal(false);
        alert('✅ Susunan posisi slot kartu berhasil disimpan!');
      } else {
        alert(data.error || 'Gagal menyimpan perubahan slot');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat menyimpan perubahan slot');
    } finally {
      setIsSavingSlots(false);
    }
  };

  // Edit slot modal state
  const [editModalData, setEditModalData] = useState<{
    isOpen: boolean;
    slotNumber: number;
    existingCard?: PokemonCard | null;
  }>({
    isOpen: false,
    slotNumber: 1,
    existingCard: null,
  });

  const fetchBinder = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/binders/${binderId}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setBinder(data.binder);
      } else {
        alert('Binder tidak ditemukan');
        router.push('/');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (binderId) fetchBinder();
  }, [binderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5EFE6] text-[#1E293B] flex items-center justify-center font-clean">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 border-4 border-[#E05A47] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="font-pixelify text-xs text-[#7A6B58]">MEMUAT DATA BINDER...</p>
        </div>
      </div>
    );
  }

  if (!binder) return null;

  const pocketsPerPage = binder.layoutType === '4-pocket' ? 4 : binder.layoutType === '12-pocket' ? 12 : 9;
  const startSlot = (currentPage - 1) * pocketsPerPage + 1;
  const endSlot = currentPage * pocketsPerPage;
  const slotsList = Object.values(binder.slots || {});
  const totalCards = slotsList.length;
  const totalValue = slotsList.reduce((sum, c) => sum + (c.price || 0), 0);

  const handleApplyDiscount = async () => {
    const val = Number(discountPercent);
    if (isNaN(val) || val <= 0 || val >= 90) {
      alert('Masukkan persentase diskon antara 1% - 89%');
      return;
    }
    if (!confirm(`Terapkan diskon ${val}% ke SEMUA kartu yang masih AVAILABLE di binder ini?`)) return;

    try {
      setApplyingDiscount(true);
      const res = await fetch(`/api/binders/${binder.id}/discount`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discount: val }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(`Berhasil memberikan diskon ${val}% ke ${data.modifiedCount} kartu!`);
        setDiscountPercent('');
        fetchBinder();
      } else {
        alert(data.error || 'Gagal menerapkan diskon');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setApplyingDiscount(false);
    }
  };

  const handleQuickToggleSold = async (slotNumber: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const current = binder.slots[slotNumber];
    if (!current) return;

    const newStatus = current.status === 'AVAILABLE' ? 'SOLD' : 'AVAILABLE';
    try {
      const res = await fetch(`/api/binders/${binder.id}/slots/${slotNumber}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchBinder();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div
      className="min-h-screen bg-[#F5EFE6] text-[#1E293B] flex flex-col font-clean selection:bg-[#E05A47] selection:text-white"
      style={{
        backgroundImage: 'radial-gradient(#E2D9CC 0.85px, transparent 0.85px)',
        backgroundSize: '20px 20px',
      }}
    >
      <Navbar sellerName={binder.sellerName} boothName={binder.boothName} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Top Header & Breadcrumb */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b-2 border-[#E5DACB]">
          <div className="flex items-center gap-3">
            <a
              href="/"
              className="p-2 rounded-xl bg-white border border-[#D5CABE] hover:bg-[#FAF6F0] text-[#7A6B58] hover:text-[#1E293B] transition-colors shadow-2xs"
            >
              <ArrowLeft className="w-5 h-5" />
            </a>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: binder.coverColor || '#E05A47' }}
                />
                <h1 className="font-pixelify text-xl sm:text-2xl font-bold text-[#1E293B]">{binder.name}</h1>
                <span className="font-pixelify text-xs px-2.5 py-0.5 rounded-full bg-[#EAE3D8] text-[#4A3E31] font-bold border border-[#D5CABE]">
                  {binder.layoutType}
                </span>
              </div>
              <p className="text-xs text-[#7A6B58] mt-0.5">
                {totalCards} Kartu terisi • Total Nilai: {formatCurrency(totalValue, binder.currency)} •{' '}
                {binder.totalPages} Halaman
              </p>
            </div>
          </div>

          {/* Quick Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={`/b/${binder.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#E05A47] hover:bg-[#C94735] text-white font-pixelify text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Preview Pembeli</span>
            </a>

            <button
              onClick={() => setShowQrModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-[#FAF6F0] border border-[#D5CABE] text-[#1E293B] font-pixelify text-xs font-bold transition-colors shadow-2xs cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5 text-[#E05A47]" />
              <span>QR Meja Stand</span>
            </button>

            <a
              href={`/print/slots/${binder.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-[#FAF6F0] border border-[#D5CABE] text-[#1E293B] font-pixelify text-xs font-bold transition-colors shadow-2xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-[#2E7D32]" />
              <span>Cetak Stiker QR</span>
            </a>
          </div>
        </div>

        {/* Reorder Mode Banner & Control Dock (Active during Edit Slot Mode) */}
        {isReorderMode && (
          <div className="bg-slate-900/95 border-2 border-amber-500/50 rounded-2xl p-4 shadow-2xl space-y-3 animate-in fade-in slide-in-from-top-2">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-400 flex items-center justify-center flex-shrink-0 animate-pulse shadow-md">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-white">Mode Atur Posisi Slot Aktif</h3>
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[10px] font-bold">
                      💻 Khusus Web Browser PC
                    </span>
                    {changedCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-extrabold animate-pulse">
                        {changedCount} Slot Berubah (Draft Tersimpan Sementara)
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Drag kartu dan lepas (drop) pada slot tujuan untuk menukar/memindahkan posisi. Anda bebas berpindah halaman, perubahan tersimpan sementara.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
                <button
                  type="button"
                  onClick={handleCancelReorder}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Batal</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowSaveConfirmModal(true)}
                  disabled={changedCount === 0}
                  className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-lg ${
                    changedCount > 0
                      ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:brightness-110 text-white shadow-emerald-500/30 cursor-pointer animate-pulse'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                  }`}
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Perubahan Slot ({changedCount})</span>
                </button>
              </div>
            </div>

            {/* Quick Transit Dock (Drop here to easily move a card across pages) */}
            <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-slate-400">
                <Info className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span className="text-[11px] font-semibold">
                  Tips Pindah Halaman: Taruh kartu di Kotak Transit di samping, lalu buka halaman tujuan dan drop kartu ke slot yang diinginkan.
                </span>
              </div>

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                }}
                onDrop={handleDropOnTransitTray}
                className={`px-3 py-1.5 rounded-xl border border-dashed transition-all flex items-center gap-2 ${
                  transitCard
                    ? 'bg-amber-500/15 border-amber-500 text-amber-300 shadow-md shadow-amber-500/10'
                    : 'bg-slate-950/80 border-slate-700 hover:border-amber-400/50 text-slate-400'
                }`}
              >
                {transitCard ? (
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    <span className="text-xs font-bold text-white truncate max-w-[150px]">
                      {transitCard.card.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">(Slot #{transitCard.sourceSlot})</span>
                    <button
                      type="button"
                      onClick={() => setTransitCard(null)}
                      className="text-slate-400 hover:text-white p-0.5 ml-1 text-sm font-bold"
                      title="Batalkan kartu transit"
                    >
                      &times;
                    </button>
                  </div>
                ) : (
                  <span className="text-[11px] font-bold text-slate-400">
                    📥 Kotak Transit (Drop kartu di sini untuk dibawa ke halaman lain)
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Event Flash Sale / Bulk Discount Ribbon */}
        <div className="bg-[#FAF6F0] border-2 border-[#E5DACB] rounded-2xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-2xs">
          <div className="flex items-center gap-2">
            <Percent className="w-4 h-4 text-[#E05A47]" />
            <div>
              <span className="font-pixelify font-bold text-[#1E293B]">Flash Sale Binder: </span>
              <span className="text-[#7A6B58]">
                Potong harga otomatis untuk semua kartu yang masih tersedia di binder ini
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="number"
              min={1}
              max={80}
              placeholder="% Diskon"
              value={discountPercent}
              onChange={(e) => setDiscountPercent(e.target.value)}
              className="w-24 px-2.5 py-1.5 bg-white border border-[#D5CABE] rounded-xl text-xs font-bold text-center text-[#1E293B] focus:outline-none focus:border-[#E05A47] font-pixelify"
            />
            <button
              onClick={handleApplyDiscount}
              disabled={applyingDiscount || !discountPercent}
              className="px-3 py-1.5 rounded-xl font-pixelify text-xs font-bold bg-[#E05A47] hover:bg-[#C94735] disabled:opacity-40 text-white transition-all shadow-xs cursor-pointer"
            >
              {applyingDiscount ? 'Memproses...' : 'Terapkan Diskon'}
            </button>
          </div>
        </div>

        {/* Page Switcher Navigation */}
        <div
          ref={contentTopRef}
          className="flex flex-wrap items-center justify-between gap-2 bg-[#FAF6F0] border-2 border-[#E5DACB] rounded-2xl p-2.5 shadow-2xs scroll-mt-20"
        >
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (currentPage > 1) handlePageChange(currentPage - 1);
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-[#D5CABE] hover:bg-[#FAF6F0] disabled:opacity-30 font-pixelify text-xs font-bold text-[#1E293B] transition-colors shadow-2xs cursor-pointer"
            title={currentPage > 1 ? 'Buka halaman sebelumnya (bisa drop kartu di sini)' : undefined}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Halaman Sebelumnya</span>
          </button>

          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 text-center">
              <span className="font-pixelify text-xs font-bold text-[#1E293B]">
                Halaman {currentPage} dari {binder.totalPages}
              </span>
              <span className="font-mono-clean text-[11px] text-[#7A6B58] hidden sm:inline">
                (Slot #{startSlot} - #{endSlot})
              </span>
            </div>

            <button
              type="button"
              onClick={handleToggleReorderMode}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-pixelify text-xs font-bold transition-all shadow-xs cursor-pointer ${
                isReorderMode
                  ? 'bg-[#E05A47] text-white shadow-md ring-2 ring-[#E05A47]/40'
                  : 'bg-white hover:bg-[#FAF6F0] text-[#1E293B] border border-[#D5CABE]'
              }`}
              title="Atur posisi kartu dengan drag & drop (khusus PC)"
            >
              <Move className={`w-3.5 h-3.5 ${isReorderMode ? 'text-white stroke-[3]' : 'text-[#E05A47]'}`} />
              <span>{isReorderMode ? 'Mode Edit Aktif' : 'Edit Slot (Drag & Drop)'}</span>
              {isReorderMode && changedCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-red-600 text-white text-[10px] font-bold">
                  {changedCount}
                </span>
              )}
            </button>
          </div>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === binder.totalPages}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (currentPage < binder.totalPages) handlePageChange(currentPage + 1);
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-[#D5CABE] hover:bg-[#FAF6F0] disabled:opacity-30 font-pixelify text-xs font-bold text-[#1E293B] transition-colors shadow-2xs cursor-pointer"
            title={currentPage < binder.totalPages ? 'Buka halaman berikutnya (bisa drop kartu di sini)' : undefined}
          >
            <span>Halaman Berikutnya</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Interactive Visual Binder Grid Layout */}
        <div
          className={`grid gap-4 ${
            binder.layoutType === '4-pocket'
              ? 'grid-cols-2 max-w-2xl mx-auto'
              : binder.layoutType === '12-pocket'
              ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4'
              : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
          }`}
        >
          {Array.from({ length: pocketsPerPage }, (_, i) => {
            const slotNum = startSlot + i;
            const currentSlots = isReorderMode && draftSlots ? draftSlots : binder.slots;
            const card = currentSlots[slotNum];
            const isDragged = draggedSlot === slotNum;
            const isOver = dragOverSlot === slotNum;

            return (
              <div
                key={slotNum}
                draggable={isDesktop && Boolean(card)}
                onDragStart={(e) => card && handleDragStart(e, slotNum)}
                onDragEnd={() => {
                  setDraggedSlot(null);
                  setDragOverSlot(null);
                  if (dragTimeoutRef.current) clearTimeout(dragTimeoutRef.current);
                  dragTimeoutRef.current = setTimeout(() => {
                    isDraggingRef.current = false;
                  }, 200);
                }}
                onDragOver={(e) => handleDragOver(e, slotNum)}
                onDragLeave={(e) => handleDragLeave(e, slotNum)}
                onDrop={(e) => handleDropOnSlot(e, slotNum)}
                onClick={() => {
                  if (isDraggingRef.current) {
                    return;
                  }
                  if (isReorderMode) {
                    if (transitCard) {
                      handleDropOnSlot(null, slotNum);
                    }
                    return;
                  }
                  setEditModalData({
                    isOpen: true,
                    slotNumber: slotNum,
                    existingCard: card || null,
                  });
                }}
                className={`bg-[#FAF6F0] border-2 rounded-2xl p-3 flex flex-col justify-between transition-all group min-h-[290px] relative overflow-hidden select-none shadow-xs text-[#1E293B] ${
                  isOver
                    ? 'ring-4 ring-[#E05A47] border-[#E05A47] bg-rose-50 scale-[1.03] z-30 shadow-2xl'
                    : isDragged
                    ? 'opacity-30 border-2 border-dashed border-[#E05A47] scale-95'
                    : isReorderMode
                    ? card
                      ? 'border-2 border-dashed border-amber-500/60 hover:border-amber-500 cursor-grab active:cursor-grabbing hover:shadow-sm'
                      : 'border-2 border-dashed border-[#D5CABE] hover:border-amber-400/60'
                    : card && isDesktop
                    ? 'border-[#D5CABE] hover:border-[#B5A593] cursor-pointer hover:shadow-sm cursor-grab'
                    : 'border-[#D5CABE] hover:border-[#B5A593] cursor-pointer hover:shadow-sm'
                }`}
              >
                {/* Drag-over indicator overlay */}
                {isOver && (
                  <div className="absolute inset-0 bg-[#E05A47]/15 backdrop-blur-[1px] rounded-2xl flex flex-col items-center justify-center p-3 z-30 pointer-events-none">
                    <ArrowRightLeft className="w-8 h-8 text-[#E05A47] animate-bounce mb-1" />
                    <span className="font-pixelify text-xs font-bold text-white bg-[#1E293B] px-2.5 py-1 rounded-lg border border-[#D5CABE] shadow-xl">
                      {card ? `Tukar dengan Slot #${slotNum}` : `Pindahkan ke Slot #${slotNum}`}
                    </span>
                  </div>
                )}

                {/* Top Slot Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded bg-[#EAE3D8] text-[10px] font-pixelify font-bold text-[#4A3E31] tracking-wider">
                      SLOT #{slotNum}
                    </span>
                    {!isReorderMode && (
                      <a
                        href={`/b/${binder.id}/slot/${slotNum}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 text-[#7A6B58] hover:text-[#1E293B] rounded hover:bg-[#EAE3D8] transition-colors"
                        title="Lihat Halaman QR Slot Ini"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {isDesktop && card && (
                      <span className={`px-1.5 py-0.5 rounded border text-[9px] font-pixelify font-bold flex items-center gap-0.5 ${
                        isReorderMode
                          ? 'bg-[#E05A47] text-white border-[#E05A47] shadow-xs'
                          : 'bg-white text-[#7A6B58] border-[#D5CABE] opacity-80 group-hover:opacity-100'
                      }`}>
                        <GripVertical className="w-3 h-3" />
                        <span>DRAG</span>
                      </span>
                    )}
                  </div>

                  {card && (
                    <button
                      onClick={(e) => handleQuickToggleSold(slotNum, e)}
                      className={`font-pixelify text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all ${
                        isReorderMode ? 'pointer-events-none opacity-60 ' : ''
                      }${
                        card.status === 'AVAILABLE'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                          : card.status === 'SOLD'
                          ? 'bg-rose-100 text-rose-800 border-rose-300 hover:bg-rose-200'
                          : 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200'
                      }`}
                      title={isReorderMode ? undefined : 'Klik untuk ubah status cepat'}
                    >
                      {card.status}
                    </button>
                  )}
                </div>

                {/* Explicit Reorder Drag Handle */}
                {isReorderMode && card && (
                  <div className="w-full py-1 px-2 bg-amber-50 border border-amber-300 rounded-lg flex items-center justify-center gap-1.5 text-[10px] font-pixelify font-bold text-amber-800 cursor-grab active:cursor-grabbing mb-1.5 select-none shadow-2xs">
                    <GripVertical className="w-3.5 h-3.5 text-amber-700" />
                    <span>DRAG UNTUK GESER SLOT</span>
                  </div>
                )}

                {/* Card Content or Empty Pocket */}
                {card ? (
                  <div className={`flex-1 flex flex-col justify-between ${isReorderMode ? 'pointer-events-none select-none' : ''}`}>
                    {/* Image & Overlay */}
                    <div className="pocket-reflection relative aspect-[3/4] max-h-48 w-full rounded-xl overflow-hidden bg-[#E2D9CC] mx-auto shadow-inner mb-2 border border-[#D5CABE] pointer-events-none select-none">
                      {card.imageUrl ? (
                        <img
                          src={formatCardImageUrl(card.imageUrl)}
                          alt={card.name}
                          draggable={false}
                          className="w-full h-full object-contain p-1 pointer-events-none select-none"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-pixelify text-xs text-[#8C7E6D] pointer-events-none">
                          POKÉMON
                        </div>
                      )}
                      {card.status === 'SOLD' && (
                        <div className="absolute inset-0 bg-black/65 flex items-center justify-center pointer-events-none">
                          <span className="font-pixelify px-3 py-1 bg-red-600 text-white font-bold text-xs uppercase tracking-widest rounded-lg shadow-lg rotate-[-12deg]">
                            SOLD
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Card Info */}
                    <div className="pointer-events-none select-none">
                      <div className="font-bold text-xs text-[#1E293B] line-clamp-1 group-hover:text-[#E05A47] transition-colors">
                        {formatCardDisplayName(card.name, card.cardNumber, card.setName, card.game)}
                      </div>
                      <div className="font-mono-clean text-[10px] text-[#7A6B58] truncate flex items-center gap-1 mt-0.5">
                        <span className="truncate">{card.condition} • {translateCardSet(card.setName, card.cardNumber, card.game)}</span>
                      </div>

                      {/* Price Tag */}
                      <div className="mt-1.5 flex items-baseline justify-between pointer-events-none">
                        <span className="font-pixelify text-sm font-bold text-[#2E7D32]">
                          {formatCurrency(card.price, binder.currency)}
                        </span>
                        {card.originalPrice && card.originalPrice > card.price && (
                          <span className="text-[10px] line-through text-[#7A6B58]">
                            {formatCurrency(card.originalPrice, binder.currency)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={`flex-1 flex flex-col items-center justify-center text-center p-4 border-2 border-dashed border-[#D5CABE] bg-[#EAE3D8]/40 rounded-xl group-hover:border-[#B5A593] transition-colors ${isReorderMode ? 'pointer-events-none select-none' : ''}`}>
                    <div className="w-10 h-10 rounded-full bg-white border border-[#D5CABE] flex items-center justify-center text-[#7A6B58] group-hover:text-[#E05A47] transition-all mb-2 shadow-2xs">
                      <Plus className="w-5 h-5" />
                    </div>
                    <span className="font-pixelify text-xs font-bold text-[#4A3E31]">
                      SLOT KOSONG
                    </span>
                    <span className="text-[10px] text-[#7A6B58] mt-0.5">
                      {isReorderMode ? 'Drop kartu di sini' : 'Klik untuk pasang kartu'}
                    </span>
                  </div>
                )}

                {/* Bottom Click to Edit or Drag Hint */}
                <div className="mt-2 pt-2 border-t border-[#EAE3D8] flex items-center justify-center text-[10px] font-pixelify font-bold text-[#7A6B58] group-hover:text-[#1E293B]">
                  {isReorderMode ? (
                    <div className="flex items-center text-amber-700 font-bold">
                      <Move className="w-3 h-3 mr-1" />
                      <span>{card ? 'Drag untuk tukar/pindah' : 'Drop kartu di sini'}</span>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Edit3 className="w-3 h-3 mr-1 text-[#E05A47]" />
                      <span>Klik untuk edit kartu</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Page Switcher Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-2 mt-4 shadow-lg">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (currentPage > 1) handlePageChange(currentPage - 1);
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-[#D5CABE] hover:bg-[#FAF6F0] disabled:opacity-30 font-pixelify text-xs font-bold text-[#1E293B] transition-colors shadow-2xs cursor-pointer"
            title={currentPage > 1 ? 'Buka halaman sebelumnya (bisa drop kartu di sini)' : undefined}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Halaman Sebelumnya</span>
          </button>

          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 text-center">
              <span className="font-pixelify text-xs font-bold text-[#1E293B]">
                Halaman {currentPage} dari {binder.totalPages}
              </span>
              <span className="font-mono-clean text-[11px] text-[#7A6B58] hidden sm:inline">
                (Slot #{startSlot} - #{endSlot})
              </span>
            </div>

            <button
              type="button"
              onClick={handleToggleReorderMode}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-pixelify text-xs font-bold transition-all shadow-xs cursor-pointer ${
                isReorderMode
                  ? 'bg-[#E05A47] text-white shadow-md ring-2 ring-[#E05A47]/40'
                  : 'bg-white hover:bg-[#FAF6F0] text-[#1E293B] border border-[#D5CABE]'
              }`}
              title="Atur posisi kartu dengan drag & drop (khusus PC)"
            >
              <Move className={`w-3.5 h-3.5 ${isReorderMode ? 'text-white stroke-[3]' : 'text-[#E05A47]'}`} />
              <span>{isReorderMode ? 'Mode Edit Aktif' : 'Edit Slot (Drag & Drop)'}</span>
              {isReorderMode && changedCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-red-600 text-white text-[10px] font-bold">
                  {changedCount}
                </span>
              )}
            </button>
          </div>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === binder.totalPages}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (currentPage < binder.totalPages) handlePageChange(currentPage + 1);
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-[#D5CABE] hover:bg-[#FAF6F0] disabled:opacity-30 font-pixelify text-xs font-bold text-[#1E293B] transition-colors shadow-2xs cursor-pointer"
            title={currentPage < binder.totalPages ? 'Buka halaman berikutnya (bisa drop kartu di sini)' : undefined}
          >
            <span>Halaman Berikutnya</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </main>

      {/* Floating Reorder Dock at screen bottom for instant saving/canceling from any scroll position */}
      {isReorderMode && (
        <aside
          aria-label="Floating Reorder Dock"
          className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 border-2 border-amber-500/80 rounded-2xl px-4 py-2.5 shadow-2xl shadow-black/80 flex items-center gap-3 backdrop-blur-md max-w-lg w-[92vw] sm:w-auto justify-between animate-in fade-in slide-in-from-bottom-4"
        >
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping flex-shrink-0" />
            <span className="text-xs font-black text-amber-300 whitespace-nowrap">
              Mode Edit Slot
            </span>
            {changedCount > 0 ? (
              <span className="hidden sm:inline-block text-[11px] font-bold text-slate-300">
                • <span className="text-amber-400">{changedCount}</span> slot berubah
              </span>
            ) : (
              <span className="hidden sm:inline-block text-[11px] text-slate-400">
                • Siap drag & drop
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCancelReorder}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Batal</span>
            </button>

            <button
              type="button"
              onClick={() => setShowSaveConfirmModal(true)}
              disabled={changedCount === 0}
              className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-md ${
                changedCount > 0
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:brightness-110 text-white animate-pulse'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
              }`}
            >
              <Save className="w-3 h-3" />
              <span>Simpan ({changedCount})</span>
            </button>
          </div>
        </aside>
      )}

      {/* Edit Slot Modal */}
      <EditSlotModal
        isOpen={editModalData.isOpen}
        onClose={() => setEditModalData((prev) => ({ ...prev, isOpen: false }))}
        binderId={binder.id}
        slotNumber={editModalData.slotNumber}
        existingCard={editModalData.existingCard}
        currency={binder.currency}
        onSaved={fetchBinder}
      />

      {/* QR Modal for Table Placard */}
      <QrCodeModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        title={binder.name}
        subtitle="Scan untuk melihat seluruh isi kartu di binder ini langsung di HP pembeli"
        targetUrl={`/b/${binder.id}`}
        printUrl={`/print/binder/${binder.id}`}
      />

      {/* Save Slots Confirmation Modal with Warning Message */}
      <SaveSlotsConfirmModal
        isOpen={showSaveConfirmModal}
        onClose={() => setShowSaveConfirmModal(false)}
        onConfirm={handleConfirmSaveSlots}
        isSaving={isSavingSlots}
        changes={slotChanges}
        currency={binder.currency}
      />

      {/* Mobile Notice Modal (explaining PC-only Drag & Drop) */}
      <MobileNoticeModal
        isOpen={showMobileNoticeModal}
        onClose={() => setShowMobileNoticeModal(false)}
      />
    </div>
  );
}
