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
  DollarSign,
  ArrowRight,
  Database,
  Flag,
  ChevronDown,
} from 'lucide-react';
import { CardCondition, CardStatus, PokemonCard } from '@/types';
import { POKEMON_CARD_TEMPLATES, PokemonCardTemplate } from '@/lib/pokemonCatalog';
import { formatCurrency } from '@/lib/qr';
import { TcgdexCardSummary } from '@/lib/tcgdex';
import { LocalIdCardSummary } from '@/lib/localIdCards';

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
  }, [tcgdexQuery]);

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
          // If current price is default, set to market price recommendation
          if (currency === 'IDR' && c.estimatedPriceIdr) {
            setPrice(c.estimatedPriceIdr);
          } else if (currency === 'USD' && c.marketPriceUsd) {
            setPrice(Math.round(c.marketPriceUsd));
          }
        }
      } else {
        // Fallback to summary
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
        setMarketRef(null); // Indonesian DB has no price data — seller sets manually
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
      ).slice(0, 6)
    : POKEMON_CARD_TEMPLATES.slice(0, 6);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto no-print">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl p-5 sm:p-6 my-8 overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-extrabold tracking-wider px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
              SLOT #{slotNumber}
            </span>
            <h2 className="text-lg sm:text-xl font-black text-white">
              {existingCard ? 'Edit Kartu di Slot' : 'Pasang Kartu ke Slot'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TCGdex & Catalog Search Box */}
        <div className="mt-4 p-3 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2.5">
          {/* Tabs */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 flex-wrap">
              <button
                type="button"
                onClick={() => setSearchSource('tcgdex')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
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
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
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
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  searchSource === 'preset'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Hits Populer</span>
              </button>
            </div>

            <span className="text-[10px] text-slate-400 hidden sm:inline">
              {searchSource === 'localid' ? 'Data dari pokemon-card.com/id' : 'Otomatis isi foto, set, & referensi harga'}
            </span>
          </div>

          {/* TCGdex Live Search Input */}
          {searchSource === 'tcgdex' ? (
            <div>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Ketik nama Pokémon resmi (contoh: Charizard ex, Moonbreon, Gengar, Pikachu 151, Mewtwo)..."
                  value={tcgdexQuery}
                  onChange={(e) => setTcgdexQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                {tcgdexSearching && (
                  <Loader2 className="w-4 h-4 absolute right-3 top-2.5 text-blue-400 animate-spin" />
                )}
              </div>

              {/* TCGdex Results */}
              {tcgdexResults.length > 0 && (
                <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                  {tcgdexResults.map((card) => (
                    <button
                      key={card.id}
                      type="button"
                      disabled={tcgdexFetchingCard}
                      onClick={() => handleSelectTcgdexCard(card)}
                      className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/50 flex items-center gap-2 text-left transition-all group"
                    >
                      {card.imageUrl ? (
                        <img
                          src={card.imageUrl}
                          alt=""
                          className="w-8 h-11 object-cover rounded shadow flex-shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-11 bg-slate-800 rounded flex items-center justify-center text-[8px] text-slate-500">
                          TCG
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-white group-hover:text-blue-300 truncate">
                          {card.name}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          #{card.localId} • {card.id.split('-')[0].toUpperCase()}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {tcgdexQuery.trim().length >= 2 && !tcgdexSearching && tcgdexResults.length === 0 && (
                <div className="mt-2 text-center text-xs text-slate-400 py-1">
                  Tidak ada kartu ditemukan dengan kata kunci &quot;{tcgdexQuery}&quot;.
                </div>
              )}
            </div>
          ) : searchSource === 'localid' ? (
            /* Indonesian Local Database */
            <div className="space-y-2">
              {/* Expansion filter */}
              <div className="relative">
                <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-2 text-slate-400 pointer-events-none" />
                <select
                  value={localIdExpansion}
                  onChange={(e) => setLocalIdExpansion(e.target.value)}
                  className="w-full pl-3 pr-8 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-red-500 appearance-none"
                >
                  <option value="">— Semua Seri / Produk —</option>
                  {expansions.map((exp) => (
                    <option key={exp.code} value={exp.code}>
                      {exp.productName} ({exp.count} kartu)
                    </option>
                  ))}
                </select>
              </div>

              {/* Search input */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama kartu dalam Bahasa Indonesia (misal: Charizard, Pikachu, Mewtwo)..."
                  value={localIdQuery}
                  onChange={(e) => setLocalIdQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                />
                {localIdSearching && (
                  <Loader2 className="w-4 h-4 absolute right-3 top-2.5 text-red-400 animate-spin" />
                )}
              </div>

              {/* Info badge */}
              <div className="flex items-center gap-1.5 px-2 py-1 bg-red-950/40 border border-red-500/20 rounded-lg">
                <span className="text-sm">🇮🇩</span>
                <span className="text-[10px] text-red-300">
                  Database kartu resmi Bahasa Indonesia dari pokemon-card.com/id — 4.100+ kartu
                </span>
              </div>

              {/* Results */}
              {localIdResults.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                  {localIdResults.map((card) => (
                    <button
                      key={card.id}
                      type="button"
                      disabled={localIdSearching}
                      onClick={() => handleSelectLocalIdCard(card)}
                      className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-red-500/50 flex items-center gap-2 text-left transition-all group"
                    >
                      {card.imageUrl ? (
                        <img
                          src={card.imageUrl}
                          alt=""
                          className="w-8 h-11 object-cover rounded shadow flex-shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-11 bg-slate-800 rounded flex items-center justify-center text-[8px] text-slate-500">
                          ID
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-white group-hover:text-red-300 truncate">
                          {card.name}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {card.collectorNumber && `#${card.collectorNumber} • `}{card.category}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {card.productName}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {!localIdSearching && localIdResults.length === 0 && localIdQuery.trim().length > 0 && (
                <div className="text-center text-xs text-slate-400 py-1">
                  Tidak ada kartu ditemukan untuk &quot;{localIdQuery}&quot;.
                </div>
              )}

              {!localIdSearching && localIdResults.length === 0 && localIdQuery.trim().length === 0 && (
                <div className="text-center text-xs text-slate-500 py-1">
                  Ketik nama kartu untuk mencari, atau pilih seri di atas.
                </div>
              )}
            </div>
          ) : (
            /* Local Preset Catalog */
            <div>
              <div className="relative mb-2">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter preset hits..."
                  value={presetSearch}
                  onChange={(e) => setPresetSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                {filteredPresets.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectPreset(item)}
                    className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 flex items-center gap-2 text-left transition-all group"
                  >
                    <img src={item.imageUrl} alt="" className="w-8 h-11 object-cover rounded shadow flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-white group-hover:text-amber-300 truncate">
                        {item.name}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {item.setName}
                      </div>
                      <div className="text-[10px] font-bold text-emerald-400">
                        {formatCurrency(item.defaultPrice, currency)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Market Price Recommendation Banner */}
        {marketRef && (
          <div className="mt-3 p-2.5 bg-blue-950/40 border border-blue-500/30 rounded-xl flex items-center justify-between text-xs text-blue-200">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <span>
                Harga Pasar TCGPlayer:{' '}
                <strong>
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
              className="px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold transition-colors"
            >
              Gunakan Harga Ini
            </button>
          </div>
        )}

        {/* Card Form */}
        <form onSubmit={handleSave} className="mt-4 space-y-3.5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Card Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nama Kartu Pokémon <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                placeholder="misal: Charizard ex SIR"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-red-500"
              />
            </div>

            {/* Set Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Set / Seri</label>
              <input
                type="text"
                value={cardSet}
                onChange={(e) => setCardSet(e.target.value)}
                placeholder="misal: Scarlet & Violet: 151"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-red-500"
              />
            </div>

            {/* Card Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Nomor Kartu</label>
              <input
                type="text"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                placeholder="misal: 199/165"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-red-500"
              />
            </div>

            {/* Rarity */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Rarity</label>
              <input
                type="text"
                value={rarity}
                onChange={(e) => setRarity(e.target.value)}
                placeholder="misal: Special illustration rare / Holo"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-red-500"
              />
            </div>

            {/* Condition */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Kondisi / Grading</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as CardCondition)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-red-500"
              >
                {CONDITIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Selling Price */}
            <div>
              <label className="block text-xs font-semibold text-amber-400 mb-1">
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
                  className="w-full pl-3 pr-24 py-2 bg-slate-950 border border-amber-500/50 rounded-xl text-sm sm:text-base font-bold text-amber-300 focus:outline-none focus:border-amber-400"
                />
                <div className="absolute right-3 top-2.5 text-xs font-medium text-slate-400">
                  {formatCurrency(price, currency)}
                </div>
              </div>
            </div>

            {/* Original Price / Discount Reference */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Harga Coret / Referensi (Opsional)
              </label>
              <input
                type="number"
                min={0}
                placeholder="misal untuk promo coret"
                value={originalPrice || ''}
                onChange={(e) => setOriginalPrice(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-red-500"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Status Ketersediaan</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as CardStatus)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-red-500"
              >
                <option value="AVAILABLE">✅ AVAILABLE (Ready di Meja)</option>
                <option value="RESERVED">⏳ RESERVED (Sedang Dipesan)</option>
                <option value="SOLD">❌ SOLD (Sudah Laku)</option>
              </select>
            </div>
          </div>

          {/* Image URL & Live Preview */}
          <div className="flex gap-3 items-center">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-300 mb-1">URL Foto Kartu</label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://assets.tcgdex.net/..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-red-500"
              />
            </div>
            {imageUrl && (
              <div className="w-12 h-16 rounded-lg border border-slate-700 overflow-hidden bg-slate-950 flex-shrink-0 shadow">
                <img src={imageUrl} alt="preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          {/* Seller Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Catatan Penjual (Swirl holo, centering, minus kecil, dll.)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="misal: Swirl holo jelas di bawah, centering 9.5, pack fresh"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-red-500"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            <div>
              {existingCard && (
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={clearing}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 border border-rose-500/30 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Kosongkan Slot
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving || tcgdexFetchingCard}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-red-600 to-amber-500 text-white shadow-lg shadow-red-600/30 hover:brightness-110 active:scale-95 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                {saving ? 'Menyimpan...' : 'Simpan ke Slot'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
