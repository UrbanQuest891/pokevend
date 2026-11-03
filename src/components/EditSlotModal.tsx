'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  Sparkles,
  Trash2,
  CheckCircle2,
  Globe,
  TrendingUp,
  Loader2,
  ChevronDown,
  ZoomIn,
  Eye,
  Link2,
  Tag,
  ShieldCheck,
  Percent,
  Image as ImageIcon,
  Check,
  Clock,
  Ban,
  Sparkle,
} from 'lucide-react';
import { CardCondition, CardStatus, PokemonCard } from '@/types';
import { POKEMON_CARD_TEMPLATES, PokemonCardTemplate } from '@/lib/pokemonCatalog';
import { formatCurrency } from '@/lib/qr';
import { TcgdexCardSummary } from '@/lib/tcgdex';
import { LocalIdCardSummary } from '@/lib/localIdCards';
import CardImageLightbox from '@/components/CardImageLightbox';

interface EditSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  binderId: string;
  slotNumber: number;
  existingCard?: PokemonCard | null;
  currency?: 'IDR' | 'USD';
  onSaved: () => void;
}

const CONDITIONS: CardCondition[] = [
  'Raw - Mint',
  'Raw - NM',
  'Raw - LP',
  'Raw - MP',
  'Raw - HP',
  'Raw - Damaged',
  'Graded - PSA 10',
  'Graded - PSA 9',
  'Graded - PSA 8',
  'Graded - BGS 9.5',
  'Graded - CGC 10',
  'Graded - Other',
];

export default function EditSlotModal({
  isOpen,
  onClose,
  binderId,
  slotNumber,
  existingCard,
  currency = 'IDR',
  onSaved,
}: EditSlotModalProps) {
  // Form fields
  const [cardName, setCardName] = useState('');
  const [cardSet, setCardSet] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [rarity, setRarity] = useState('');
  const [condition, setCondition] = useState<CardCondition>('Raw - NM');
  const [price, setPrice] = useState<number>(0);
  const [originalPrice, setOriginalPrice] = useState<number | undefined>(undefined);
  const [status, setStatus] = useState<CardStatus>('AVAILABLE');
  const [imageUrl, setImageUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);

  // UI state
  const [showHoloPreview, setShowHoloPreview] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // TCGdex integration state
  const [searchSource, setSearchSource] = useState<'tcgdex' | 'localid' | 'preset'>('tcgdex');
  const [tcgdexQuery, setTcgdexQuery] = useState('');
  const [tcgdexResults, setTcgdexResults] = useState<TcgdexCardSummary[]>([]);
  const [tcgdexSearching, setTcgdexSearching] = useState(false);
  const [tcgdexFetchingCard, setTcgdexFetchingCard] = useState(false);
  const [marketRef, setMarketRef] = useState<{ usd?: number; idr?: number } | null>(null);

  // Indonesian local card database state
  const [localIdQuery, setLocalIdQuery] = useState('');
  const [localIdResults, setLocalIdResults] = useState<LocalIdCardSummary[]>([]);
  const [localIdSearching, setLocalIdSearching] = useState(false);
  const [localIdExpansion, setLocalIdExpansion] = useState('');
  const [expansions, setExpansions] = useState<{ code: string; productName: string; count: number }[]>([]);
  const [expansionsLoaded, setExpansionsLoaded] = useState(false);

  // Local preset search
  const [presetSearch, setPresetSearch] = useState('');

  useEffect(() => {
    if (existingCard) {
      setCardName(existingCard.name || '');
      setCardSet(existingCard.setName || '');
      setCardNumber(existingCard.cardNumber || '');
      setRarity(existingCard.rarity || '');
      setCondition(existingCard.condition || 'Raw - NM');
      setPrice(existingCard.price || 0);
      setOriginalPrice(existingCard.originalPrice);
      setStatus(existingCard.status || 'AVAILABLE');
      setImageUrl(existingCard.imageUrl || '');
      setNotes(existingCard.notes || '');
    } else {
      setCardName('');
      setCardSet('');
      setCardNumber('');
      setRarity('Illustration Rare');
      setCondition('Raw - NM');
      setPrice(currency === 'IDR' ? 150000 : 15);
      setOriginalPrice(undefined);
      setStatus('AVAILABLE');
      setImageUrl('https://images.pokemontcg.io/sv3pt5/199_hires.png');
      setNotes('');
    }
    setTcgdexQuery('');
    setTcgdexResults([]);
    setMarketRef(null);
    setPresetSearch('');
    setLocalIdQuery('');
    setLocalIdResults([]);
    setLocalIdExpansion('');
    setShowHoloPreview(false);
    setShowUrlInput(false);
  }, [existingCard, isOpen, currency]);

  // Load expansions when Indonesian tab is first opened
  useEffect(() => {
    if (searchSource === 'localid' && !expansionsLoaded) {
      fetch('/api/localid/expansions')
        .then((r) => r.json())
        .then((data) => {
          if (data.success) setExpansions(data.expansions);
          setExpansionsLoaded(true);
        })
        .catch(() => setExpansionsLoaded(true));
    }
  }, [searchSource, expansionsLoaded]);

  // Debounced TCGdex search
  useEffect(() => {
    if (searchSource !== 'tcgdex') return;
    if (!tcgdexQuery.trim() || tcgdexQuery.trim().length < 2) {
      setTcgdexResults([]);
      setTcgdexSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setTcgdexSearching(true);
        const res = await fetch(`/api/tcgdex/search?q=${encodeURIComponent(tcgdexQuery.trim())}&limit=12`);
        const data = await res.json();
        if (data.success) {
          setTcgdexResults(data.cards || []);
        }
      } catch (err) {
        console.error('TCGdex search failed:', err);
      } finally {
        setTcgdexSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [tcgdexQuery, searchSource]);

  // Debounced Indonesian local DB search
  useEffect(() => {
    if (searchSource !== 'localid') return;

    const timer = setTimeout(async () => {
      try {
        setLocalIdSearching(true);
        const params = new URLSearchParams({
          q: localIdQuery.trim(),
          limit: '15',
        });
        if (localIdExpansion) params.set('expansion', localIdExpansion);
        const res = await fetch(`/api/localid/search?${params.toString()}`);
        const data = await res.json();
        if (data.success) {
          setLocalIdResults(data.cards || []);
        }
      } catch (err) {
        console.error('LocalId search failed:', err);
      } finally {
        setLocalIdSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [localIdQuery, localIdExpansion, searchSource]);

  if (!isOpen) return null;

  // Handle picking card from TCGdex
  const handleSelectTcgdexCard = async (cardSummary: TcgdexCardSummary) => {
    try {
      setTcgdexFetchingCard(true);
      const res = await fetch(`/api/tcgdex/card/${cardSummary.id}`);
      const data = await res.json();

      if (data.success && data.card) {
        const c = data.card;
        setCardName(c.name);
        setCardSet(c.setName);
        setCardNumber(c.cardNumber);
        setRarity(c.rarity || 'Raw');
        setImageUrl(c.imageUrl);

        if (c.marketPriceUsd || c.estimatedPriceIdr) {
          setMarketRef({ usd: c.marketPriceUsd, idr: c.estimatedPriceIdr });
          if (currency === 'IDR' && c.estimatedPriceIdr) {
            setPrice(c.estimatedPriceIdr);
          } else if (currency === 'USD' && c.marketPriceUsd) {
            setPrice(Math.round(c.marketPriceUsd));
          }
        }
      } else {
        setCardName(cardSummary.name);
        setCardNumber(cardSummary.localId);
        setImageUrl(cardSummary.imageUrl);
      }
    } catch (err) {
      console.error(err);
      setCardName(cardSummary.name);
      setImageUrl(cardSummary.imageUrl);
    } finally {
      setTcgdexFetchingCard(false);
    }
  };

  // Handle picking from local preset catalog
  const handleSelectPreset = (template: PokemonCardTemplate) => {
    setCardName(template.name);
    setCardSet(template.setName);
    setCardNumber(template.cardNumber);
    setRarity(template.rarity);
    setPrice(currency === 'USD' ? Math.round(template.defaultPrice / 16000) : template.defaultPrice);
    setImageUrl(template.imageUrl);
    setMarketRef({
      idr: template.defaultPrice,
      usd: Math.round(template.defaultPrice / 16000),
    });
  };

  // Handle picking from Indonesian local DB
  const handleSelectLocalIdCard = async (summary: LocalIdCardSummary) => {
    try {
      setLocalIdSearching(true);
      const res = await fetch(`/api/localid/card/${summary.id}`);
      const data = await res.json();

      if (data.success && data.card) {
        const c = data.card;
        setCardName(c.name);
        setCardSet(c.productName || c.expansionCode || '');
        setCardNumber(c.collectorNumber || '');
        setImageUrl(c.imageUrl || '');
        setMarketRef(null);
      } else {
        setCardName(summary.name);
        setCardSet(summary.productName || '');
        setCardNumber(summary.collectorNumber || '');
        setImageUrl(summary.imageUrl || '');
      }
    } catch (err) {
      console.error(err);
      setCardName(summary.name);
      setImageUrl(summary.imageUrl || '');
    } finally {
      setLocalIdSearching(false);
    }
  };

  const filteredPresets = presetSearch.trim()
    ? POKEMON_CARD_TEMPLATES.filter(
        (t) =>
          t.name.toLowerCase().includes(presetSearch.toLowerCase()) ||
          t.setName.toLowerCase().includes(presetSearch.toLowerCase())
      ).slice(0, 8)
    : POKEMON_CARD_TEMPLATES.slice(0, 8);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardName.trim()) {
      alert('Nama kartu wajib diisi');
      return;
    }

    try {
      setSaving(true);
      const res = await fetch(`/api/binders/${binderId}/slots/${slotNumber}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cardName,
          setName: cardSet,
          cardNumber,
          rarity,
          condition,
          price: Number(price),
          originalPrice: originalPrice ? Number(originalPrice) : undefined,
          status,
          imageUrl,
          notes,
        }),
      });

      if (res.ok) {
        onSaved();
        onClose();
      } else {
        alert('Gagal menyimpan kartu');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    if (!confirm(`Hapus kartu dari Slot #${slotNumber}?`)) return;
    try {
      setClearing(true);
      const res = await fetch(`/api/binders/${binderId}/slots/${slotNumber}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        onSaved();
        onClose();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setClearing(false);
    }
  };

  // Simulated PokemonCard for lightbox preview
  const currentPreviewCard: PokemonCard = {
    id: existingCard?.id || `preview-${slotNumber}`,
    name: cardName || 'Nama Kartu Pokémon',
    setName: cardSet || 'Set / Seri Kartu',
    cardNumber: cardNumber || '000/000',
    rarity: rarity || 'Rare',
    condition,
    price,
    originalPrice,
    status,
    imageUrl: imageUrl || '',
    notes,
    updatedAt: new Date().toISOString(),
  };

  const discountPercent =
    originalPrice && originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md overflow-y-auto no-print">
        <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl my-auto overflow-hidden text-slate-100 flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="flex-shrink-0 px-5 sm:px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
            <div className="flex items-center gap-3">
              <span className="text-xs uppercase font-black tracking-wider px-3 py-1 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 shadow-sm flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                SLOT #{slotNumber}
              </span>
              <div>
                <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  {existingCard ? 'Edit Kartu di Slot' : 'Pasang Kartu ke Slot'}
                </h2>
                <p className="text-xs text-slate-400 hidden sm:block">
                  Cari kartu dari database resmi, sesuaikan harga jual, dan tinjau visual kartu secara detail.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/80 border border-transparent hover:border-slate-700 transition-all"
              title="Tutup Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Body - 2 Columns on Desktop */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* LEFT COLUMN: High Visibility Card Preview Showcase (lg:col-span-5) */}
              <div className="lg:col-span-5 flex flex-col items-center gap-4">
                <div className="w-full bg-slate-950/80 border border-slate-800/80 rounded-3xl p-4 sm:p-5 flex flex-col items-center shadow-inner relative">
                  {/* Preview Header Label */}
                  <div className="w-full flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80 text-xs">
                    <span className="font-extrabold text-slate-300 flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-blue-400" />
                      Preview Visual Kartu
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">Rasio Resmi 2.5:3.5</span>
                  </div>

                  {/* Main Large Card Container */}
                  <div
                    onClick={() => imageUrl && setIsLightboxOpen(true)}
                    className={`relative w-full max-w-[270px] sm:max-w-[290px] aspect-[63/88] rounded-2xl overflow-hidden border-2 border-slate-700/80 bg-slate-950 shadow-2xl transition-all duration-300 group ${
                      imageUrl ? 'cursor-pointer hover:border-blue-500 hover:shadow-blue-500/20 hover:scale-[1.02]' : ''
                    } ${showHoloPreview ? 'holo-shine' : ''}`}
                  >
                    {imageUrl ? (
                      <>
                        <img
                          src={imageUrl}
                          alt={cardName || 'Preview Kartu'}
                          className="w-full h-full object-contain bg-slate-950 select-none transition-transform duration-300 group-hover:scale-105"
                        />

                        {/* Hover Overlay Hint for Zoom */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-3 text-center">
                          <span className="p-3 rounded-full bg-blue-600/90 text-white shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
                            <ZoomIn className="w-6 h-6" />
                          </span>
                          <span className="text-xs font-black text-white drop-shadow-md">
                            Klik untuk Zoom Penuh
                          </span>
                        </div>
                      </>
                    ) : (
                      /* Placeholder when no image */
                      <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-slate-500 bg-gradient-to-b from-slate-900 to-slate-950">
                        <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center mb-3 text-slate-400">
                          <ImageIcon className="w-8 h-8" />
                        </div>
                        <span className="text-xs font-bold text-slate-300 mb-1">Belum Ada Gambar Kartu</span>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          Pilih kartu dari database di sebelah kanan atau masukkan URL gambar langsung.
                        </p>
                      </div>
                    )}

                    {/* Floating Badges on Card */}
                    <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none">
                      <span className="px-2 py-0.5 rounded-lg bg-black/80 text-white text-[10px] font-black tracking-wider border border-white/20 backdrop-blur-md shadow">
                        #{slotNumber}
                      </span>
                    </div>

                    <div className="absolute top-2.5 right-2.5 z-10 pointer-events-none">
                      {status === 'AVAILABLE' && (
                        <span className="px-2 py-0.5 rounded-lg bg-emerald-500/90 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow">
                          AVAILABLE
                        </span>
                      )}
                      {status === 'RESERVED' && (
                        <span className="px-2 py-0.5 rounded-lg bg-amber-500/90 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow">
                          RESERVED
                        </span>
                      )}
                      {status === 'SOLD' && (
                        <span className="px-2 py-0.5 rounded-lg bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider shadow">
                          SOLD
                        </span>
                      )}
                    </div>

                    {/* Bottom Floating Price Badge */}
                    <div className="absolute bottom-2.5 inset-x-2.5 z-10 pointer-events-none">
                      <div className="p-2 rounded-xl bg-slate-900/95 border border-slate-700/90 backdrop-blur-md shadow-xl flex items-center justify-between">
                        <div className="min-w-0">
                          <div className="text-[10px] text-slate-400 font-semibold truncate">
                            {condition}
                          </div>
                          <div className="text-sm font-black text-amber-300 leading-tight">
                            {formatCurrency(price, currency)}
                          </div>
                        </div>
                        {originalPrice && originalPrice > price && (
                          <div className="text-right">
                            <div className="text-[9px] line-through text-slate-400">
                              {formatCurrency(originalPrice, currency)}
                            </div>
                            <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 text-[9px] font-extrabold border border-rose-500/30">
                              -{discountPercent}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quick Preview Toolbar */}
                  <div className="w-full mt-4 flex items-center justify-center gap-2">
                    <button
                      type="button"
                      disabled={!imageUrl}
                      onClick={() => setIsLightboxOpen(true)}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                        imageUrl
                          ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30'
                          : 'bg-slate-800/60 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      <ZoomIn className="w-4 h-4" />
                      <span>Zoom Penuh</span>
                    </button>

                    <button
                      type="button"
                      disabled={!imageUrl}
                      onClick={() => setShowHoloPreview(!showHoloPreview)}
                      className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                        showHoloPreview
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                          : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Holo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowUrlInput(!showUrlInput)}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
                      title="Ubah URL Foto Manual"
                    >
                      <Link2 className="w-3.5 h-3.5" />
                      <span>URL</span>
                    </button>
                  </div>

                  {/* Collapsible Image URL Input */}
                  {showUrlInput && (
                    <div className="w-full mt-3 p-3 bg-slate-900 border border-slate-700 rounded-2xl animate-in fade-in duration-150">
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        URL Gambar Kartu Langsung
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={imageUrl}
                          onChange={(e) => setImageUrl(e.target.value)}
                          placeholder="https://assets.tcgdex.net/..."
                          className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                        />
                        {imageUrl && (
                          <button
                            type="button"
                            onClick={() => setImageUrl('')}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-bold"
                          >
                            Hapus
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Card Art Summary Bar */}
                  <div className="w-full mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="truncate max-w-[160px] font-semibold text-slate-300">
                      {cardName || 'Nama Belum Diisi'}
                    </span>
                    <span className="truncate max-w-[100px] text-slate-500">
                      {cardNumber ? `#${cardNumber}` : 'No Slot'}
                    </span>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Search + Details & Pricing Form (lg:col-span-7) */}
              <div className="lg:col-span-7 space-y-5">
                {/* 1. Database Card Search Box */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-4 sm:p-5 space-y-3.5">
                  {/* Source Tabs */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-2xl border border-slate-800/90">
                      <button
                        type="button"
                        onClick={() => setSearchSource('tcgdex')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          searchSource === 'tcgdex'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Globe className="w-3.5 h-3.5" />
                        <span>TCGdex Live (EN)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSearchSource('localid')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          searchSource === 'localid'
                            ? 'bg-red-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <span className="text-sm leading-none">🇮🇩</span>
                        <span>Kartu Indonesia (4.100+)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSearchSource('preset')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          searchSource === 'preset'
                            ? 'bg-amber-500 text-slate-950 shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Hits Populer</span>
                      </button>
                    </div>

                    <span className="text-[11px] text-slate-400 font-medium">
                      Otomatis isi gambar & metadata
                    </span>
                  </div>

                  {/* Search Views */}
                  {searchSource === 'tcgdex' && (
                    <div className="space-y-2.5">
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Cari nama Pokémon resmi (contoh: Charizard ex, Moonbreon, Gengar, Pikachu 151)..."
                          value={tcgdexQuery}
                          onChange={(e) => setTcgdexQuery(e.target.value)}
                          className="w-full pl-10 pr-10 py-2.5 bg-slate-900 border border-slate-700/80 rounded-2xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 shadow-inner"
                        />
                        {tcgdexSearching && (
                          <Loader2 className="w-4 h-4 absolute right-3.5 top-3 text-blue-400 animate-spin" />
                        )}
                      </div>

                      {/* TCGdex Results - Large Visual Grid */}
                      {tcgdexResults.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
                          {tcgdexResults.map((card, idx) => (
                            <button
                              key={`tcgdex-${card.id || idx}-${idx}`}
                              type="button"
                              disabled={tcgdexFetchingCard}
                              onClick={() => handleSelectTcgdexCard(card)}
                              className="p-2 rounded-2xl bg-slate-900 hover:bg-slate-800/90 border border-slate-800 hover:border-blue-500/60 flex items-center gap-2.5 text-left transition-all group shadow hover:shadow-blue-500/10"
                            >
                              {card.imageUrl ? (
                                <img
                                  src={card.imageUrl}
                                  alt=""
                                  className="w-10 h-14 object-contain rounded-lg bg-slate-950 shadow flex-shrink-0 group-hover:scale-105 transition-transform"
                                />
                              ) : (
                                <div className="w-10 h-14 bg-slate-800 rounded-lg flex items-center justify-center text-[9px] text-slate-500 flex-shrink-0">
                                  TCG
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-black text-white group-hover:text-blue-300 truncate">
                                  {card.name}
                                </div>
                                <div className="text-[11px] text-slate-400 truncate mt-0.5">
                                  #{card.localId}
                                </div>
                                <div className="text-[10px] text-blue-400/80 font-bold truncate">
                                  {card.id.split('-')[0].toUpperCase()}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {tcgdexQuery.trim().length >= 2 && !tcgdexSearching && tcgdexResults.length === 0 && (
                        <div className="text-center text-xs text-slate-400 py-2">
                          Tidak ada kartu ditemukan dengan kata kunci &quot;{tcgdexQuery}&quot;.
                        </div>
                      )}
                    </div>
                  )}

                  {searchSource === 'localid' && (
                    <div className="space-y-2.5">
                      {/* Expansion filter dropdown */}
                      <div className="relative">
                        <ChevronDown className="w-4 h-4 absolute right-3.5 top-3 text-slate-400 pointer-events-none" />
                        <select
                          value={localIdExpansion}
                          onChange={(e) => setLocalIdExpansion(e.target.value)}
                          className="w-full pl-3.5 pr-10 py-2.5 bg-slate-900 border border-slate-700/80 rounded-2xl text-xs text-white focus:outline-none focus:border-red-500 appearance-none shadow-inner"
                        >
                          <option value="">— Semua Seri / Produk Indonesia —</option>
                          {expansions.map((exp) => (
                            <option key={exp.code} value={exp.code}>
                              {exp.productName} ({exp.count} kartu)
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Indonesian Search input */}
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Cari nama kartu dalam Bahasa Indonesia (misal: Charizard, Pikachu, Mewtwo)..."
                          value={localIdQuery}
                          onChange={(e) => setLocalIdQuery(e.target.value)}
                          className="w-full pl-10 pr-10 py-2.5 bg-slate-900 border border-slate-700/80 rounded-2xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500 shadow-inner"
                        />
                        {localIdSearching && (
                          <Loader2 className="w-4 h-4 absolute right-3.5 top-3 text-red-400 animate-spin" />
                        )}
                      </div>

                      {/* Indonesian Results */}
                      {localIdResults.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
                          {localIdResults.map((card, idx) => (
                            <button
                              key={`localid-${card.id || idx}-${idx}`}
                              type="button"
                              disabled={localIdSearching}
                              onClick={() => handleSelectLocalIdCard(card)}
                              className="p-2 rounded-2xl bg-slate-900 hover:bg-slate-800/90 border border-slate-800 hover:border-red-500/60 flex items-center gap-2.5 text-left transition-all group shadow hover:shadow-red-500/10"
                            >
                              {card.imageUrl ? (
                                <img
                                  src={card.imageUrl}
                                  alt=""
                                  className="w-10 h-14 object-contain rounded-lg bg-slate-950 shadow flex-shrink-0 group-hover:scale-105 transition-transform"
                                />
                              ) : (
                                <div className="w-10 h-14 bg-slate-800 rounded-lg flex items-center justify-center text-[9px] text-slate-500 flex-shrink-0">
                                  ID
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-black text-white group-hover:text-red-300 truncate">
                                  {card.name}
                                </div>
                                <div className="text-[11px] text-slate-400 truncate mt-0.5">
                                  {card.collectorNumber ? `#${card.collectorNumber}` : card.category}
                                </div>
                                <div className="text-[10px] text-red-400/80 font-bold truncate">
                                  {card.productName}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {!localIdSearching && localIdResults.length === 0 && localIdQuery.trim().length > 0 && (
                        <div className="text-center text-xs text-slate-400 py-2">
                          Tidak ada kartu ditemukan untuk &quot;{localIdQuery}&quot;.
                        </div>
                      )}

                      {!localIdSearching && localIdResults.length === 0 && localIdQuery.trim().length === 0 && (
                        <div className="text-center text-xs text-slate-500 py-1.5 flex items-center justify-center gap-1.5">
                          <span>🇮🇩</span>
                          <span>Ketik nama Pokémon Indonesia atau pilih seri di atas.</span>
                        </div>
                      )}
                    </div>
                  )}

                  {searchSource === 'preset' && (
                    <div className="space-y-2.5">
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Filter preset hits populer..."
                          value={presetSearch}
                          onChange={(e) => setPresetSearch(e.target.value)}
                          className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-2xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 shadow-inner"
                        />
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto pr-1">
                        {filteredPresets.map((item, idx) => (
                          <button
                            key={`preset-${item.cardNumber || idx}-${idx}`}
                            type="button"
                            onClick={() => handleSelectPreset(item)}
                            className="p-2 rounded-2xl bg-slate-900 hover:bg-slate-800/90 border border-slate-800 hover:border-amber-500/60 flex flex-col items-center text-center transition-all group shadow hover:shadow-amber-500/10"
                          >
                            <img
                              src={item.imageUrl}
                              alt=""
                              className="w-14 h-20 object-contain rounded-lg bg-slate-950 shadow mb-1.5 group-hover:scale-105 transition-transform"
                            />
                            <div className="w-full text-xs font-black text-white group-hover:text-amber-300 truncate">
                              {item.name}
                            </div>
                            <div className="w-full text-[10px] text-slate-400 truncate">
                              {item.setName}
                            </div>
                            <div className="text-[11px] font-black text-emerald-400 mt-0.5">
                              {formatCurrency(item.defaultPrice, currency)}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {marketRef && (
                    <div className="p-3 bg-blue-950/50 border border-blue-500/40 rounded-2xl flex items-center justify-between gap-3 text-xs text-blue-200">
                      <div className="flex items-center gap-2 min-w-0">
                        <TrendingUp className="w-4 h-4 text-blue-400 flex-shrink-0" />
                        <span className="truncate">
                          Rekomendasi Pasar TCGPlayer:{' '}
                          <strong className="text-white">
                            {marketRef.usd ? `$${marketRef.usd}` : ''}{' '}
                            {marketRef.idr ? `(~${formatCurrency(marketRef.idr, 'IDR')})` : ''}
                          </strong>
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (currency === 'IDR' && marketRef.idr) setPrice(marketRef.idr);
                          if (currency === 'USD' && marketRef.usd) setPrice(Math.round(marketRef.usd));
                        }}
                        className="px-3 py-1 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-sm flex-shrink-0"
                      >
                        Pakai Harga Ini
                      </button>
                    </div>
                  )}
                </div>

                {/* 2. Main Edit Form */}
                <form onSubmit={handleSave} className="space-y-4">
                  {/* Pricing & Status Section */}
                  <div className="p-4 sm:p-5 bg-slate-950/60 border border-slate-800 rounded-3xl space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                        <Tag className="w-4 h-4" />
                        Harga Jual & Ketersediaan
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Selling Price */}
                      <div>
                        <label className="block text-xs font-bold text-slate-200 mb-1.5">
                          Harga Jual Seller ({currency}) <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            required
                            min={0}
                            step={currency === 'IDR' ? 1000 : 0.5}
                            value={price}
                            onChange={(e) => setPrice(Number(e.target.value))}
                            className="w-full pl-3.5 pr-28 py-2.5 bg-slate-900 border-2 border-amber-500/60 rounded-2xl text-base sm:text-lg font-black text-amber-300 focus:outline-none focus:border-amber-400 shadow-inner"
                          />
                          <div className="absolute right-3.5 top-3 text-xs font-extrabold text-slate-400 pointer-events-none">
                            {formatCurrency(price, currency)}
                          </div>
                        </div>

                        {/* Quick price increment chips */}
                        {currency === 'IDR' ? (
                          <div className="flex items-center gap-1.5 mt-2">
                            {[10000, 25000, 50000, 100000].map((inc) => (
                              <button
                                key={inc}
                                type="button"
                                onClick={() => setPrice((p) => p + inc)}
                                className="px-2 py-0.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] font-bold text-slate-300 hover:text-white transition-colors"
                              >
                                +{(inc / 1000).toFixed(0)}k
                              </button>
                            ))}
                            <button
                              type="button"
                              onClick={() => setPrice(0)}
                              className="px-2 py-0.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] font-bold text-slate-400 hover:text-white transition-colors ml-auto"
                            >
                              Reset
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 mt-2">
                            {[1, 5, 10, 20].map((inc) => (
                              <button
                                key={inc}
                                type="button"
                                onClick={() => setPrice((p) => p + inc)}
                                className="px-2 py-0.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] font-bold text-slate-300 hover:text-white transition-colors"
                              >
                                +${inc}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Original / Strikethrough Price */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-bold text-slate-300">
                            Harga Coret / Referensi
                          </label>
                          {discountPercent && (
                            <span className="text-[10px] font-black text-rose-400 px-1.5 py-0.2 rounded bg-rose-500/10 border border-rose-500/20">
                              DISKON -{discountPercent}%
                            </span>
                          )}
                        </div>
                        <input
                          type="number"
                          min={0}
                          placeholder="Kosongkan jika bukan promo"
                          value={originalPrice || ''}
                          onChange={(e) => setOriginalPrice(e.target.value ? Number(e.target.value) : undefined)}
                          className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-2xl text-xs sm:text-sm text-white focus:outline-none focus:border-red-500 shadow-inner"
                        />
                        <span className="text-[10px] text-slate-500 block mt-1.5">
                          Pembeli akan melihat harga coret menarik di katalog.
                        </span>
                      </div>
                    </div>

                    {/* Status Pill Selector */}
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-2">
                        Status Ketersediaan di Meja
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setStatus('AVAILABLE')}
                          className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl text-xs font-black transition-all border ${
                            status === 'AVAILABLE'
                              ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-600/30 ring-2 ring-emerald-500/30'
                              : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>AVAILABLE</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setStatus('RESERVED')}
                          className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl text-xs font-black transition-all border ${
                            status === 'RESERVED'
                              ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-md shadow-amber-500/30 ring-2 ring-amber-500/30'
                              : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>RESERVED</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setStatus('SOLD')}
                          className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl text-xs font-black transition-all border ${
                            status === 'SOLD'
                              ? 'bg-rose-600 text-white border-rose-400 shadow-md shadow-rose-600/30 ring-2 ring-rose-500/30'
                              : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          <Ban className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>SOLD</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Card Metadata Section */}
                  <div className="p-4 sm:p-5 bg-slate-950/60 border border-slate-800 rounded-3xl space-y-3.5">
                    <span className="text-xs font-black uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      Detail Informasi Kartu
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {/* Card Name */}
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          Nama Kartu Pokémon <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value)}
                          placeholder="misal: Charizard ex SIR"
                          className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-2xl text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500 shadow-inner"
                        />
                      </div>

                      {/* Set / Seri */}
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">Set / Seri</label>
                        <input
                          type="text"
                          value={cardSet}
                          onChange={(e) => setCardSet(e.target.value)}
                          placeholder="misal: Scarlet & Violet: 151"
                          className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-2xl text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500 shadow-inner"
                        />
                      </div>

                      {/* Card Number */}
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">Nomor Kartu</label>
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          placeholder="misal: 199/165"
                          className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-2xl text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500 shadow-inner"
                        />
                      </div>

                      {/* Rarity */}
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">Rarity</label>
                        <input
                          type="text"
                          value={rarity}
                          onChange={(e) => setRarity(e.target.value)}
                          placeholder="misal: Illustration Rare / Holo"
                          className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-2xl text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500 shadow-inner"
                        />
                      </div>

                      {/* Condition */}
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">Kondisi / Grading</label>
                        <select
                          value={condition}
                          onChange={(e) => setCondition(e.target.value as CardCondition)}
                          className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-2xl text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500 shadow-inner"
                        >
                          {CONDITIONS.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Seller Notes */}
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          Catatan Penjual (Swirl holo, centering, minus kecil, dll.)
                        </label>
                        <input
                          type="text"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="misal: Swirl holo jelas di bawah, centering 9.5, pack fresh"
                          className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-2xl text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500 shadow-inner"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer Inside Form */}
                  <div className="flex items-center justify-between pt-2">
                    <div>
                      {existingCard && (
                        <button
                          type="button"
                          onClick={handleClear}
                          disabled={clearing}
                          className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 border border-rose-500/30 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Kosongkan Slot</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-2xl text-xs font-bold text-slate-300 hover:bg-slate-800 transition-colors"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        disabled={saving || tcgdexFetchingCard}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-2xl text-xs font-black bg-gradient-to-r from-red-600 via-amber-500 to-amber-400 text-slate-950 shadow-lg shadow-red-600/25 hover:brightness-110 active:scale-95 transition-all"
                      >
                        <CheckCircle2 className="w-4 h-4 text-slate-950" />
                        <span>{saving ? 'Menyimpan...' : 'Simpan ke Slot'}</span>
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Modal for high-res zoom preview */}
      <CardImageLightbox
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        card={currentPreviewCard}
        slotNumber={slotNumber}
        currency={currency}
      />
    </>
  );
}
