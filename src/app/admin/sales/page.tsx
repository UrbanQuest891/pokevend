'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  Download,
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
} from 'lucide-react';

export default function SalesHistoryPage() {
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGame, setSelectedGame] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

    return { totalOmset, totalCards, avgPrice, estimatedProfit };
  }, [filteredSales]);

  // Export CSV
  const handleExportCsv = () => {
    if (filteredSales.length === 0) {
      alert('Tidak ada data penjualan untuk diekspor.');
      return;
    }

    const headers = [
      'ID Transaksi',
      'Tanggal Terjual',
      'Nama Kartu',
      'Set / Seri',
      'Nomor Kartu',
      'Rarity',
      'Kondisi',
      'Game TCG',
      'Binder Asal',
      'No Slot',
      'Harga Jual (IDR)',
      'Harga Modal (IDR)',
      'Catatan',
    ];

    const rows = filteredSales.map((s) => [
      `"${s.id}"`,
      `"${new Date(s.soldAt).toLocaleString('id-ID')}"`,
      `"${s.cardName.replace(/"/g, '""')}"`,
      `"${(s.setName || '').replace(/"/g, '""')}"`,
      `"${s.cardNumber || ''}"`,
      `"${s.rarity || ''}"`,
      `"${s.condition || ''}"`,
      `"${s.game.toUpperCase()}"`,
      `"${s.binderName.replace(/"/g, '""')}"`,
      s.slotNumber,
      s.soldPrice,
      s.costPrice || 0,
      `"${(s.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `pokevend-riwayat-penjualan-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header Navigation & Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <a
                href="/"
                className="text-xs text-slate-400 hover:text-amber-400 flex items-center gap-1 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </a>
              <span className="text-slate-600">/</span>
              <span className="text-xs font-bold text-amber-400">Laporan Penjualan</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <TrendingUp className="w-7 h-7 text-emerald-400" />
              <span>Riwayat Penjualan & Omset</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Arsip permanen kartu yang laku terjual di meja event beserta harga dan waktu transaksi.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchSales}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors cursor-pointer"
              title="Perbarui data penjualan"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              disabled={filteredSales.length === 0}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title="Unduh laporan dalam format CSV/Excel"
            >
              <Download className="w-4 h-4" />
              <span>Ekspor CSV</span>
            </button>
          </div>
        </div>

        {/* Metric Cards Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Total Omset */}
          <div className="bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                Total Omset
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-white">
              {formatCurrency(metrics.totalOmset, 'IDR')}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Dari kartu yang terjual</span>
          </div>

          {/* Card 2: Total Kartu Laku */}
          <div className="bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 border border-amber-500/30 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                Kartu Laku
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <PackageCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-white">
              {metrics.totalCards} <span className="text-xs font-semibold text-slate-400">Pcs</span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Transaksi berhasil</span>
          </div>

          {/* Card 3: Rata-Rata Harga */}
          <div className="bg-gradient-to-br from-blue-950/40 via-slate-900 to-slate-950 border border-blue-500/30 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">
                Rata-Rata / Kartu
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                <Tag className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-white">
              {formatCurrency(metrics.avgPrice, 'IDR')}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Nilai deal per transaksi</span>
          </div>

          {/* Card 4: Estimasi Keuntungan */}
          <div className="bg-gradient-to-br from-purple-950/40 via-slate-900 to-slate-950 border border-purple-500/30 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider">
                Gross Profit
              </span>
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                <Percent className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-white">
              {metrics.estimatedProfit !== null ? formatCurrency(metrics.estimatedProfit, 'IDR') : '—'}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              {metrics.estimatedProfit !== null ? 'Omset dikurangi modal' : 'Input modal untuk hitung'}
            </span>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 sm:p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-md">
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
                className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedGame === tab.id
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800 hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama kartu, binder, no kartu..."
              className="w-full pl-9 pr-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 shadow-inner"
            />
          </div>
        </div>

        {/* Sales Table / List Container */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          {loading ? (
            <div className="p-12 text-center text-slate-400 space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-amber-400" />
              <div className="text-xs font-bold">Memuat data penjualan...</div>
            </div>
          ) : filteredSales.length === 0 ? (
            <div className="p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center mx-auto text-slate-400 shadow-inner">
                <Store className="w-8 h-8 text-amber-400/80" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="font-extrabold text-base text-white">Belum Ada Riwayat Penjualan</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Ketika Anda mengubah status kartu di binder menjadi{' '}
                  <span className="font-bold text-rose-400">SOLD</span> (baik via Quick Sell di meja event atau Edit Slot), data transaksi kartu tersebut akan otomatis tersimpan di sini secara permanen.
                </p>
              </div>
              <a
                href="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-xs font-black text-amber-400 border border-amber-500/30 transition-colors"
              >
                <span>Buka Binder Sekarang</span>
              </a>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 text-[11px] font-black uppercase tracking-wider">
                    <th className="py-3 px-4">Waktu Terjual</th>
                    <th className="py-3 px-4">Kartu</th>
                    <th className="py-3 px-4">Asal Binder</th>
                    <th className="py-3 px-4">Kondisi</th>
                    <th className="py-3 px-4 text-right">Harga Terjual</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Date & Time */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-300">
                        <div className="font-bold text-white">
                          {new Date(sale.soldAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
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
                              className="w-9 h-12 object-contain rounded-lg bg-slate-950 border border-slate-800 shadow flex-shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-12 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-[10px] text-slate-600 font-bold flex-shrink-0">
                              TCG
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="font-black text-white text-xs truncate" title={sale.cardName}>
                              {sale.cardName}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate mt-0.5">
                              {sale.setName ? `${sale.setName} ` : ''}
                              {sale.cardNumber ? `• ${sale.cardNumber} ` : ''}
                              {sale.rarity ? (
                                <span className="font-semibold text-amber-400">({sale.rarity})</span>
                              ) : null}
                            </div>
                            <div className="mt-0.5">
                              <span
                                className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded border ${
                                  sale.game === 'onepiece'
                                    ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                                    : sale.game === 'riftbound'
                                    ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                                    : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                }`}
                              >
                                {sale.game}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Binder & Slot */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-300">
                        <div className="font-bold text-white truncate max-w-[180px]">
                          {sale.binderName}
                        </div>
                        <div className="text-[10px] text-amber-400 font-mono">
                          Slot #{sale.slotNumber}
                        </div>
                      </td>

                      {/* Condition / Grading */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 font-semibold text-[11px] border border-slate-700">
                          {sale.condition}
                        </span>
                      </td>

                      {/* Sold Price */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="font-black text-sm text-emerald-400">
                          {formatCurrency(sale.soldPrice, 'IDR')}
                        </div>
                        {sale.costPrice && sale.costPrice > 0 ? (
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Modal: {formatCurrency(sale.costPrice, 'IDR')} •{' '}
                            <span className="text-emerald-400 font-bold">
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
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
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
