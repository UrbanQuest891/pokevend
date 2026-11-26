'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import Navbar from '@/components/Navbar';
import { SaleRecord } from '@/types';
import { formatCurrency } from '@/lib/qr';
import { formatCardImageUrl } from '@/lib/imageHelper';
import {
  TrendingUp,
  DollarSign,
  PackageCheck,
  Percent,
  Search,
  Filter,
  Trash2,
  Calendar,
  Layers,
  ArrowLeft,
  RefreshCw,
  Plus,
  ExternalLink,
  Tag,
  Store,
  Sparkles,
  Award,
  Flame,
  Clock3,
} from 'lucide-react';

export default function SalesHistoryPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGame, setSelectedGame] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/sales', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setSales(data.sales || []);
      }
    } catch (err) {
      console.error('Failed fetching sales:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const handleDeleteRecord = async (id: string, cardName: string) => {
    if (!confirm(`Hapus catatan penjualan "${cardName}" dari riwayat transaksi?`)) return;

    try {
      setDeletingId(id);
      const res = await fetch(`/api/sales?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setSales((prev) => prev.filter((s) => s.id !== id));
      } else {
        alert('Gagal menghapus catatan penjualan');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat menghapus');
    } finally {
      setDeletingId(null);
    }
  };

  // Filtered sales
  const filteredSales = useMemo(() => {
    return sales.filter((item) => {
      // Game Filter
      if (selectedGame !== 'all' && item.game !== selectedGame) {
        return false;
      }
      // Search Query
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.cardName.toLowerCase().includes(q);
        const matchesSet = (item.setName || '').toLowerCase().includes(q);
        const matchesNumber = (item.cardNumber || '').toLowerCase().includes(q);
        const matchesBinder = (item.binderName || '').toLowerCase().includes(q);
        const matchesNotes = (item.notes || '').toLowerCase().includes(q);
        if (!matchesName && !matchesSet && !matchesNumber && !matchesBinder && !matchesNotes) {
          return false;
        }
      }
      return true;
    });
  }, [sales, selectedGame, searchQuery]);

  // Overall Financial Metrics
  const metrics = useMemo(() => {
    let totalOmset = 0;
    let totalCards = filteredSales.length;
    let totalCost = 0;
    let costCount = 0;

    filteredSales.forEach((s) => {
      totalOmset += s.soldPrice || 0;
      if (s.costPrice && s.costPrice > 0) {
        totalCost += s.costPrice;
        costCount++;
      }
    });

    const avgPrice = totalCards > 0 ? Math.round(totalOmset / totalCards) : 0;
    const estimatedProfit = costCount > 0 ? totalOmset - totalCost : null;

    // Event highlights for Sprint 2
    const sortedByPrice = [...filteredSales].sort((a, b) => (b.soldPrice || 0) - (a.soldPrice || 0));
    const grailItem = sortedByPrice.length > 0 ? sortedByPrice[0] : null;

    const pokemonOmset = filteredSales.filter((s) => s.game === 'pokemon').reduce((a, b) => a + (b.soldPrice || 0), 0);
    const onepieceOmset = filteredSales.filter((s) => s.game === 'onepiece').reduce((a, b) => a + (b.soldPrice || 0), 0);
    const riftboundOmset = filteredSales.filter((s) => s.game === 'riftbound').reduce((a, b) => a + (b.soldPrice || 0), 0);

    let morningCount = 0;
    let afternoonCount = 0;
    let eveningCount = 0;
    filteredSales.forEach((s) => {
      const hour = new Date(s.soldAt).getHours();
      if (hour < 12) morningCount++;
      else if (hour < 17) afternoonCount++;
      else eveningCount++;
    });

    return {
      totalOmset,
      totalCards,
      avgPrice,
      estimatedProfit,
      grailItem,
      pokemonOmset,
      onepieceOmset,
      riftboundOmset,
      morningCount,
      afternoonCount,
      eveningCount,
    };
  }, [filteredSales]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-[#F5EFE6] text-[#1E293B] flex items-center justify-center p-4 font-clean">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full border-4 border-[#E05A47] border-t-transparent animate-spin mx-auto"></div>
          <p className="font-pixelify text-sm font-bold text-[#7A6B58]">MEMERIKSA AKSES SELLER HUB...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#F5EFE6] text-[#1E293B] flex flex-col font-clean selection:bg-[#E05A47] selection:text-white"
      style={{
        backgroundImage: 'radial-gradient(#E2D9CC 0.85px, transparent 0.85px)',
        backgroundSize: '20px 20px',
      }}
    >
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header Navigation & Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b-2 border-[#E5DACB]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <a
                href="/admin"
                className="font-pixelify text-xs text-[#7A6B58] hover:text-[#E05A47] flex items-center gap-1 transition-colors"
                title="Kembali ke Dashboard Kasir"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Dashboard Kasir</span>
              </a>
              <span className="text-[#B5A593]">/</span>
              <span className="font-pixelify text-xs font-bold text-[#E05A47]">Laporan Penjualan</span>
            </div>
            <h1 className="font-pixelify text-2xl sm:text-3xl font-bold tracking-tight text-[#1E293B] flex items-center gap-2.5">
              <TrendingUp className="w-7 h-7 text-[#2E7D32]" />
              <span>RIWAYAT PENJUALAN & OMSET</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#7A6B58] mt-1">
              Arsip permanen kartu yang laku terjual di meja event beserta harga deal dan waktu transaksi.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-pixelify text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Event Live Tracker</span>
            </div>

            <button
              type="button"
              onClick={fetchSales}
              disabled={loading}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-pixelify text-xs font-bold bg-white hover:bg-[#FAF6F0] text-[#1E293B] border border-[#D5CABE] transition-colors cursor-pointer shadow-2xs"
              title="Perbarui data penjualan"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Metric Cards Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Total Omset */}
          <div className="bg-[#FAF6F0] border-2 border-[#D5CABE] rounded-2xl p-4 sm:p-5 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="font-pixelify text-[11px] font-bold text-[#7A6B58] uppercase tracking-wider">
                Total Omset Event
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-[#2E7D32]">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="font-pixelify text-xl sm:text-2xl font-bold text-[#2E7D32]">
              {formatCurrency(metrics.totalOmset, 'IDR')}
            </div>
            <span className="font-mono-clean text-[10px] text-[#7A6B58] mt-1 block">Dari transaksi yang lunas</span>
          </div>

          {/* Card 2: Total Kartu Laku */}
          <div className="bg-[#FAF6F0] border-2 border-[#D5CABE] rounded-2xl p-4 sm:p-5 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="font-pixelify text-[11px] font-bold text-[#7A6B58] uppercase tracking-wider">
                Kartu Laku
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#EAE3D8] border border-[#D5CABE] flex items-center justify-center text-[#E05A47]">
                <PackageCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="font-pixelify text-xl sm:text-2xl font-bold text-[#1E293B]">
              {metrics.totalCards} <span className="text-xs font-mono-clean text-[#7A6B58]">Pcs</span>
            </div>
            <span className="font-mono-clean text-[10px] text-[#7A6B58] mt-1 block">Slot fisik berhasil keluar</span>
          </div>

          {/* Card 3: Rata-Rata Harga */}
          <div className="bg-[#FAF6F0] border-2 border-[#D5CABE] rounded-2xl p-4 sm:p-5 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="font-pixelify text-[11px] font-bold text-[#7A6B58] uppercase tracking-wider">
                Rata-Rata / Kartu
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#EAE3D8] border border-[#D5CABE] flex items-center justify-center text-[#4A3E31]">
                <Tag className="w-4 h-4" />
              </div>
            </div>
            <div className="font-pixelify text-xl sm:text-2xl font-bold text-[#1E293B]">
              {formatCurrency(metrics.avgPrice, 'IDR')}
            </div>
            <span className="font-mono-clean text-[10px] text-[#7A6B58] mt-1 block">Nilai deal per transaksi</span>
          </div>

          {/* Card 4: Grail of the Day */}
          <div className="bg-[#FAF6F0] border-2 border-[#D5CABE] rounded-2xl p-4 sm:p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-pixelify text-[11px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                Grail of The Day
              </span>
              <span className="text-[9px] font-pixelify font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                Top Hit
              </span>
            </div>

            {metrics.grailItem ? (
              <div>
                <div className="font-pixelify text-xs font-bold text-[#1E293B] truncate" title={metrics.grailItem.cardName}>
                  {metrics.grailItem.cardName}
                </div>
                <div className="font-pixelify text-base font-bold text-[#E05A47] mt-0.5">
                  {formatCurrency(metrics.grailItem.soldPrice, 'IDR')}
                </div>
                <span className="text-[10px] text-[#7A6B58] font-mono-clean block truncate">
                  {metrics.grailItem.condition} • {metrics.grailItem.setName || 'Rare Hit'}
                </span>
              </div>
            ) : (
              <div className="text-xs text-[#7A6B58] italic py-1">Belum ada penjualan</div>
            )}
          </div>
        </div>

        {/* Visual Event Analytics: Game Share & Activity Hours */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Game Share Breakdown */}
          <div className="p-4 bg-white border-2 border-[#D5CABE] rounded-2xl space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="font-pixelify text-xs font-bold text-[#1E293B] flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#E05A47]" />
                <span>Pangsa Omset per Game TCG</span>
              </span>
              <span className="font-pixelify text-[10px] text-[#7A6B58]">
                {metrics.totalCards} Kartu Total
              </span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between items-center text-[11px]">
                <span className="font-medium text-[#1E293B]">Pokémon:</span>
                <span className="font-pixelify font-bold text-[#E05A47]">
                  {formatCurrency(metrics.pokemonOmset, 'IDR')}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="font-medium text-[#1E293B]">One Piece:</span>
                <span className="font-pixelify font-bold text-blue-600">
                  {formatCurrency(metrics.onepieceOmset, 'IDR')}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="font-medium text-[#1E293B]">Riftbound:</span>
                <span className="font-pixelify font-bold text-purple-600">
                  {formatCurrency(metrics.riftboundOmset, 'IDR')}
                </span>
              </div>
            </div>
          </div>

          {/* Activity Hours Breakdown */}
          <div className="p-4 bg-white border-2 border-[#D5CABE] rounded-2xl space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="font-pixelify text-xs font-bold text-[#1E293B] flex items-center gap-1.5">
                <Clock3 className="w-4 h-4 text-emerald-600" />
                <span>Waktu Ramai Transaksi di Meja</span>
              </span>
              <span className="font-pixelify text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Booth Active
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 text-center">
              <div className="p-2 bg-[#FAF6F0] rounded-xl border border-[#D5CABE]">
                <span className="text-[10px] text-[#7A6B58] block">Pagi (&lt;12:00)</span>
                <span className="font-pixelify text-sm font-bold text-[#1E293B] mt-0.5 block">
                  {metrics.morningCount} Kartu
                </span>
              </div>
              <div className="p-2 bg-[#FAF6F0] rounded-xl border border-[#D5CABE]">
                <span className="text-[10px] text-[#7A6B58] block">Siang (12-17)</span>
                <span className="font-pixelify text-sm font-bold text-[#E05A47] mt-0.5 block">
                  {metrics.afternoonCount} Kartu
                </span>
              </div>
              <div className="p-2 bg-[#FAF6F0] rounded-xl border border-[#D5CABE]">
                <span className="text-[10px] text-[#7A6B58] block">Malam (&gt;17:00)</span>
                <span className="font-pixelify text-sm font-bold text-[#2E7D32] mt-0.5 block">
                  {metrics.eveningCount} Kartu
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-[#FAF6F0] border-2 border-[#D5CABE] rounded-2xl p-3 sm:p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xs">
          {/* Game Selector Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {[
              { id: 'all', label: 'Semua TCG' },
              { id: 'pokemon', label: 'Pokémon' },
              { id: 'onepiece', label: 'One Piece' },
              { id: 'riftbound', label: 'Riftbound' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedGame(tab.id)}
                className={`py-1.5 px-3 rounded-xl font-pixelify text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedGame === tab.id
                    ? 'bg-[#1E293B] text-white shadow-xs'
                    : 'bg-white text-[#7A6B58] hover:text-[#1E293B] border border-[#D5CABE] hover:bg-[#FAF6F0]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9C8E7D]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama kartu, binder, no kartu..."
              className="w-full pl-9 pr-3.5 py-2 bg-white border border-[#D5CABE] rounded-xl text-xs text-[#1E293B] placeholder-[#9C8E7D] focus:outline-none focus:border-[#E05A47] shadow-inner"
            />
          </div>
        </div>

        {/* Sales Table / List Container */}
        <div className="bg-[#FAF6F0] border-2 border-[#D5CABE] rounded-3xl overflow-hidden shadow-xs">
          {loading ? (
            <div className="p-12 text-center text-[#7A6B58] space-y-3 font-pixelify">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#E05A47]" />
              <div className="text-xs font-bold">MEMUAT DATA PENJUALAN...</div>
            </div>
          ) : filteredSales.length === 0 ? (
            <div className="p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-[#EAE3D8] border border-[#D5CABE] flex items-center justify-center mx-auto text-[#7A6B58]">
                <Store className="w-8 h-8 text-[#E05A47]" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="font-pixelify text-base font-bold text-[#1E293B]">Belum Ada Riwayat Penjualan</h3>
                <p className="text-xs text-[#7A6B58] leading-relaxed">
                  Ketika transaksi diselesaikan di meja atau kartu diubah statusnya menjadi{' '}
                  <span className="font-bold text-[#E05A47]">SOLD</span>, catatan transaksi otomatis tersimpan di sini secara permanen.
                </p>
              </div>
              <a
                href="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#E05A47] hover:bg-[#C94735] text-xs font-pixelify font-bold text-white shadow-md transition-colors"
              >
                <span>Buka Binder Sekarang</span>
              </a>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#EAE3D8] border-b-2 border-[#D5CABE] text-[#4A3E31] font-pixelify text-[10px] font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Waktu Terjual</th>
                    <th className="py-3 px-4">Kartu</th>
                    <th className="py-3 px-4">Asal Binder</th>
                    <th className="py-3 px-4">Kondisi</th>
                    <th className="py-3 px-4 text-right">Harga Terjual</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE3D8]">
                  {filteredSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-white/70 transition-colors">
                      {/* Date & Time */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-[#1E293B]">
                        <div className="font-bold text-[#1E293B]">
                          {new Date(sale.soldAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                        <div className="text-[10px] text-[#7A6B58] font-mono-clean">
                          {new Date(sale.soldAt).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>

                      {/* Card Details */}
                      <td className="py-3.5 px-4 min-w-[220px]">
                        <div className="flex items-center gap-3">
                          {sale.imageUrl ? (
                            <img
                              src={formatCardImageUrl(sale.imageUrl)}
                              alt=""
                              className="w-9 h-12 object-contain rounded-lg bg-[#EAE3D8] border border-[#D5CABE] shadow-xs flex-shrink-0 p-0.5"
                            />
                          ) : (
                            <div className="w-9 h-12 rounded-lg bg-[#EAE3D8] border border-[#D5CABE] flex items-center justify-center text-[10px] font-pixelify text-[#8C7E6D] font-bold flex-shrink-0">
                              TCG
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-[#1E293B] text-xs truncate" title={sale.cardName}>
                              {sale.cardName}
                            </div>
                            <div className="text-[11px] text-[#7A6B58] truncate mt-0.5 font-mono-clean">
                              {sale.setName ? `${sale.setName} ` : ''}
                              {sale.cardNumber ? `• ${sale.cardNumber} ` : ''}
                              {sale.rarity ? (
                                <span className="font-bold text-[#E05A47]">({sale.rarity})</span>
                              ) : null}
                            </div>
                            <div className="mt-0.5">
                              <span
                                className="font-pixelify text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-[#EAE3D8] text-[#4A3E31] border border-[#D5CABE]"
                              >
                                {sale.game}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Binder & Slot */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-[#1E293B]">
                        <div className="font-bold text-[#1E293B] truncate max-w-[180px]">
                          {sale.binderName}
                        </div>
                        <div className="text-[10px] font-pixelify font-bold text-[#E05A47]">
                          Slot #{sale.slotNumber}
                        </div>
                      </td>

                      {/* Condition / Grading */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-mono-clean px-2 py-0.5 rounded-lg bg-white text-[#4A3E31] font-bold text-[11px] border border-[#D5CABE]">
                          {sale.condition}
                        </span>
                      </td>

                      {/* Sold Price */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="font-pixelify font-bold text-sm text-[#2E7D32]">
                          {formatCurrency(sale.soldPrice, 'IDR')}
                        </div>
                        {sale.costPrice && sale.costPrice > 0 ? (
                          <div className="text-[10px] text-[#7A6B58] mt-0.5 font-mono-clean">
                            Modal: {formatCurrency(sale.costPrice, 'IDR')} •{' '}
                            <span className="text-[#2E7D32] font-bold">
                              +{formatCurrency(sale.soldPrice - sale.costPrice, 'IDR')}
                            </span>
                          </div>
                        ) : null}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleDeleteRecord(sale.id, sale.cardName)}
                          disabled={deletingId === sale.id}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Hapus catatan ini jika salah input"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
