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
  Layers,
  Sparkle,
} from 'lucide-react';
import { CardCondition, CardStatus, PokemonCard } from '@/types';
import { POKEMON_CARD_TEMPLATES, PokemonCardTemplate } from '@/lib/pokemonCatalog';
import { formatCurrency } from '@/lib/qr';
import { TcgdexCardSummary } from '@/lib/tcgdex';
import { LocalIdCardSummary } from '@/lib/localIdCards';
import { LocalJpCardSummary } from '@/lib/localJpCards';
import { RiftboundCardSummary, RiftboundSetInfo } from '@/lib/riftboundCards';
import { OnePieceCardSummary, OnePieceSetInfo } from '@/lib/onepieceCards';
import { formatCardImageUrl } from '@/lib/imageHelper';
import CardImageLightbox from '@/components/CardImageLightbox';

export type TcgGame = 'pokemon' | 'riftbound' | 'onepiece';
export type PokemonSubSource = 'tcgdex' | 'localid' | 'localjp' | 'preset';

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

  // Level 1: Primary TCG Game Selection
  const [selectedGame, setSelectedGame] = useState<TcgGame>('pokemon');

  // Level 2 - Pokemon Sub-Sources
  const [pokemonSource, setPokemonSource] = useState<PokemonSubSource>('tcgdex');
  const [tcgdexQuery, setTcgdexQuery] = useState('');
  const [tcgdexResults, setTcgdexResults] = useState<TcgdexCardSummary[]>([]);
  const [tcgdexSearching, setTcgdexSearching] = useState(false);
  const [tcgdexFetchingCard, setTcgdexFetchingCard] = useState(false);
  const [marketRef, setMarketRef] = useState<{ usd?: number; idr?: number } | null>(null);

  // Pokemon Indonesian DB
  const [localIdQuery, setLocalIdQuery] = useState('');
  const [localIdResults, setLocalIdResults] = useState<LocalIdCardSummary[]>([]);
  const [localIdSearching, setLocalIdSearching] = useState(false);
  const [localIdExpansion, setLocalIdExpansion] = useState('');
  const [expansions, setExpansions] = useState<{ code: string; productName: string; count: number }[]>([]);
  const [expansionsLoaded, setExpansionsLoaded] = useState(false);

  // Pokemon Japanese DB
  const [localJpQuery, setLocalJpQuery] = useState('');
  const [localJpResults, setLocalJpResults] = useState<LocalJpCardSummary[]>([]);
  const [localJpSearching, setLocalJpSearching] = useState(false);
  const [localJpExpansion, setLocalJpExpansion] = useState('');
  const [jpExpansions, setJpExpansions] = useState<{ code: string; productName: string; count: number }[]>([]);
  const [jpExpansionsLoaded, setJpExpansionsLoaded] = useState(false);

  // Pokemon Preset Hits
  const [presetSearch, setPresetSearch] = useState('');

  // Level 2 - Riftbound
  const [riftboundQuery, setRiftboundQuery] = useState('');
  const [riftboundResults, setRiftboundResults] = useState<RiftboundCardSummary[]>([]);
  const [riftboundSearching, setRiftboundSearching] = useState(false);
  const [riftboundSet, setRiftboundSet] = useState('');
  const [riftboundSets, setRiftboundSets] = useState<RiftboundSetInfo[]>([]);
  const [riftboundSetsLoaded, setRiftboundSetsLoaded] = useState(false);

  // Level 2 - One Piece
  const [onePieceLang, setOnePieceLang] = useState<'JP' | 'EN'>('EN');
  const [onePieceQuery, setOnePieceQuery] = useState('');
  const [onePieceSet, setOnePieceSet] = useState('');
  const [onePieceResults, setOnePieceResults] = useState<OnePieceCardSummary[]>([]);
  const [onePieceSearching, setOnePieceSearching] = useState(false);
  const [onePieceEnSets, setOnePieceEnSets] = useState<OnePieceSetInfo[]>([]);
  const [onePieceJpSets, setOnePieceJpSets] = useState<OnePieceSetInfo[]>([]);
  const [onePieceSetsLoaded, setOnePieceSetsLoaded] = useState<{ EN: boolean; JP: boolean }>({ EN: false, JP: false });
  const [onePiecePage, setOnePiecePage] = useState(1);
  const [onePieceTotal, setOnePieceTotal] = useState(0);
  const [onePieceTotalPages, setOnePieceTotalPages] = useState(1);

  // Initialize modal state on open or card change
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
      setImageUrl(formatCardImageUrl(existingCard.imageUrl || ''));
      setNotes(existingCard.notes || '');

      // Infer game
      if (existingCard.game === 'riftbound' || existingCard.setName?.includes('Origins') || existingCard.setName?.includes('Spiritforged')) {
        setSelectedGame('riftbound');
      } else if (existingCard.game === 'onepiece' || existingCard.setName?.includes('OP-') || existingCard.setName?.includes('One Piece')) {
        setSelectedGame('onepiece');
      } else {
        setSelectedGame('pokemon');
      }
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
    setLocalJpQuery('');
    setLocalJpResults([]);
    setLocalJpExpansion('');
    setRiftboundQuery('');
    setRiftboundResults([]);
    setRiftboundSet('');
    setOnePieceQuery('');
    setOnePieceResults([]);
    setOnePieceSet('');
    setOnePiecePage(1);
    setShowHoloPreview(false);
    setShowUrlInput(false);
  }, [existingCard, isOpen, currency]);

  // Load Pokemon Indonesian expansions
  useEffect(() => {
    if (selectedGame === 'pokemon' && pokemonSource === 'localid' && !expansionsLoaded) {
      fetch('/api/localid/expansions')
        .then((r) => r.json())
        .then((data) => {
          if (data.success) setExpansions(data.expansions);
          setExpansionsLoaded(true);
        })
        .catch(() => setExpansionsLoaded(true));
    }
  }, [selectedGame, pokemonSource, expansionsLoaded]);

  // Load Pokemon Japanese expansions
  useEffect(() => {
    if (selectedGame === 'pokemon' && pokemonSource === 'localjp' && !jpExpansionsLoaded) {
      fetch('/api/localjp/expansions')
        .then((r) => r.json())
        .then((data) => {
          if (data.success) setJpExpansions(data.expansions);
          setJpExpansionsLoaded(true);
        })
        .catch(() => setJpExpansionsLoaded(true));
    }
  }, [selectedGame, pokemonSource, jpExpansionsLoaded]);

  // Load Riftbound sets
  useEffect(() => {
    if (selectedGame === 'riftbound' && !riftboundSetsLoaded) {
      fetch('/api/riftbound/sets')
        .then((r) => r.json())
        .then((data) => {
          if (data.success) setRiftboundSets(data.sets);
          setRiftboundSetsLoaded(true);
        })
        .catch(() => setRiftboundSetsLoaded(true));
    }
  }, [selectedGame, riftboundSetsLoaded]);

  // Debounced TCGdex search
  useEffect(() => {
    if (selectedGame !== 'pokemon' || pokemonSource !== 'tcgdex') return;
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
  }, [tcgdexQuery, selectedGame, pokemonSource]);

  // Debounced Indonesian local DB search
  useEffect(() => {
    if (selectedGame !== 'pokemon' || pokemonSource !== 'localid') return;

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
  }, [localIdQuery, localIdExpansion, selectedGame, pokemonSource]);

  // Debounced Japanese local DB search
  useEffect(() => {
    if (selectedGame !== 'pokemon' || pokemonSource !== 'localjp') return;

    const timer = setTimeout(async () => {
      try {
        setLocalJpSearching(true);
        const params = new URLSearchParams({
          q: localJpQuery.trim(),
          limit: '15',
        });
        if (localJpExpansion) params.set('expansion', localJpExpansion);
        const res = await fetch(`/api/localjp/search?${params.toString()}`);
        const data = await res.json();
        if (data.success) {
          setLocalJpResults(data.cards || []);
        }
      } catch (err) {
        console.error('LocalJp search failed:', err);
      } finally {
        setLocalJpSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [localJpQuery, localJpExpansion, selectedGame, pokemonSource]);

  // Debounced Riftbound search
  useEffect(() => {
    if (selectedGame !== 'riftbound') return;

    const timer = setTimeout(async () => {
      try {
        setRiftboundSearching(true);
        const params = new URLSearchParams({
          q: riftboundQuery.trim(),
          limit: '15',
        });
        if (riftboundSet) params.set('set', riftboundSet);
        const res = await fetch(`/api/riftbound/search?${params.toString()}`);
        const data = await res.json();
        if (data.success) {
          setRiftboundResults(data.cards || []);
        }
      } catch (err) {
        console.error('Riftbound search failed:', err);
      } finally {
        setRiftboundSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [riftboundQuery, riftboundSet, selectedGame]);

  // Load One Piece sets
  useEffect(() => {
    if (selectedGame === 'onepiece') {
      if (onePieceLang === 'EN' && !onePieceSetsLoaded.EN) {
        fetch('/api/onepiece/sets?lang=EN')
          .then((r) => r.json())
          .then((data) => {
            if (data.success) setOnePieceEnSets(data.sets || []);
            setOnePieceSetsLoaded((prev) => ({ ...prev, EN: true }));
          })
          .catch(() => setOnePieceSetsLoaded((prev) => ({ ...prev, EN: true })));
      } else if (onePieceLang === 'JP' && !onePieceSetsLoaded.JP) {
        fetch('/api/onepiece/sets?lang=JP')
          .then((r) => r.json())
          .then((data) => {
            if (data.success) setOnePieceJpSets(data.sets || []);
            setOnePieceSetsLoaded((prev) => ({ ...prev, JP: true }));
          })
          .catch(() => setOnePieceSetsLoaded((prev) => ({ ...prev, JP: true })));
      }
    }
  }, [selectedGame, onePieceLang, onePieceSetsLoaded]);

  // Debounced One Piece search
  useEffect(() => {
    if (selectedGame !== 'onepiece') return;

    const timer = setTimeout(async () => {
      try {
        setOnePieceSearching(true);
        const params = new URLSearchParams({
          lang: onePieceLang,
          page: String(onePiecePage),
          limit: '24',
        });
        if (onePieceQuery.trim()) params.set('q', onePieceQuery.trim());
        if (onePieceSet) params.set('set', onePieceSet);

        const res = await fetch(`/api/onepiece/search?${params.toString()}`);
        const data = await res.json();
        if (data.success) {
          setOnePieceResults(data.cards || []);
          setOnePieceTotal(data.total || 0);
          setOnePieceTotalPages(data.totalPages || 1);
        }
      } catch (err) {
        console.error('One Piece search failed:', err);
      } finally {
        setOnePieceSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [onePieceQuery, onePieceSet, onePieceLang, onePiecePage, selectedGame]);

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

  // Handle picking from Japanese local DB
  const handleSelectLocalJpCard = async (summary: LocalJpCardSummary) => {
    try {
      setLocalJpSearching(true);
      const res = await fetch(`/api/localjp/card/${summary.id}`);
      const data = await res.json();

      if (data.success && data.card) {
        const c = data.card;
        setCardName(c.name);
        setCardSet(c.expansion || '');
        setCardNumber(c.collectorNumber || '');
        setImageUrl(c.imageUrl || '');
        setMarketRef(null);
      } else {
        setCardName(summary.name);
        setCardSet(summary.expansion || '');
        setCardNumber(summary.collectorNumber || '');
        setImageUrl(summary.imageUrl || '');
      }
    } catch (err) {
      console.error(err);
      setCardName(summary.name);
      setImageUrl(summary.imageUrl || '');
    } finally {
      setLocalJpSearching(false);
    }
  };

  // Handle picking from Riftbound cards
  const handleSelectRiftboundCard = async (summary: RiftboundCardSummary) => {
    try {
      setRiftboundSearching(true);
      const res = await fetch(`/api/riftbound/card/${encodeURIComponent(summary.id)}`);
      const data = await res.json();

      if (data.success && data.card) {
        const c = data.card;
        setCardName(c.name);
        setCardSet(c.setName ? `${c.setName} (${c.setCode})` : c.setCode);
        setCardNumber(c.publicCode || c.collectorNumber || '');
        setRarity(c.rarity || 'Common');
        setImageUrl(c.imageUrl || '');
        setNotes([
          c.cardType,
          c.domain ? `Domain: ${c.domain}` : null,
          c.might ? `Might: ${c.might}` : null,
          c.tags ? `Tags: ${c.tags}` : null,
        ].filter(Boolean).join(' • '));
        setMarketRef(null);
      } else {
        setCardName(summary.name);
        setCardSet(summary.setName || summary.setCode);
        setCardNumber(summary.publicCode || summary.collectorNumber);
        setRarity(summary.rarity || '');
        setImageUrl(summary.imageUrl || '');
      }
    } catch (err) {
      console.error(err);
      setCardName(summary.name);
      setImageUrl(summary.imageUrl || '');
    } finally {
      setRiftboundSearching(false);
    }
  };

  // Handle picking from One Piece cards
  const handleSelectOnePieceCard = async (summary: OnePieceCardSummary) => {
    try {
      setOnePieceSearching(true);
      const res = await fetch(`/api/onepiece/card/${encodeURIComponent(summary.id)}?lang=${summary.lang}`);
      const data = await res.json();

      if (data.success && data.card) {
        const c = data.card;
        setCardName(c.name);
        setCardSet(c.cardSet || c.seriesName || '');
        setCardNumber(c.cardNumber || '');
        setRarity(c.rarity || 'Common');
        setImageUrl(c.imageUrl || '');

        const details = [
          c.category,
          c.color,
          c.attribute && c.attribute !== '-' ? c.attribute : null,
          c.type,
          c.costLife && c.costLife !== '-' ? `Cost/Life: ${c.costLife}` : null,
          c.power && c.power !== '-' ? `Power: ${c.power}` : null,
          c.counter && c.counter !== '-' ? `Counter: ${c.counter}` : null,
        ].filter(Boolean).join(' • ');

        setNotes(`[${c.lang}] ${details}`);
        setMarketRef(null);
      } else {
        setCardName(summary.name);
        setCardSet(summary.cardSet || '');
        setCardNumber(summary.cardNumber || '');
        setRarity(summary.rarity || '');
        setImageUrl(summary.imageUrl || '');
      }
    } catch (err) {
      console.error(err);
      setCardName(summary.name);
      setImageUrl(summary.imageUrl || '');
    } finally {
      setOnePieceSearching(false);
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
          game: selectedGame,
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
    name: cardName || 'Nama Kartu TCG',
    setName: cardSet || 'Set / Seri Kartu',
    cardNumber: cardNumber || '000/000',
    rarity: rarity || 'Rare',
    condition,
    price,
    originalPrice,
    status,
    imageUrl: imageUrl || '',
    notes,
    game: selectedGame,
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
                  Pilih jenis kartu TCG (Pokémon, Riftbound, One Piece), cari kartu resmi, sesuaikan harga jual & tinjau visual kartu.
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
                    <span className="px-3 py-1.5 rounded-full bg-slate-900 border border-slate-700/80 flex items-center justify-center shadow-sm">
                      {selectedGame === 'pokemon' && (
                        <img src="/logos/pokemon.svg" alt="Pokémon" className="h-5 sm:h-6 w-auto max-h-6 object-contain" />
                      )}
                      {selectedGame === 'riftbound' && (
                        <img src="/logos/riftbound.png" alt="Riftbound" className="h-5 sm:h-6 w-auto max-h-6 object-contain" />
                      )}
                      {selectedGame === 'onepiece' && (
                        <img src="/logos/onepiece.png?v=2" alt="One Piece" className="h-5 sm:h-6 w-auto max-h-6 object-contain" />
                      )}
                    </span>
                  </div>

                  {/* Main Large Card Container */}
                  <div
                    onClick={() => imageUrl && setIsLightboxOpen(true)}
                    role={imageUrl ? 'button' : undefined}
                    tabIndex={imageUrl ? 0 : undefined}
                    onKeyDown={(e) => {
                      if (imageUrl && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        setIsLightboxOpen(true);
                      }
                    }}
                    className={`relative w-full max-w-[270px] sm:max-w-[290px] aspect-[63/88] rounded-2xl overflow-hidden border-2 border-slate-700/80 bg-slate-950 shadow-2xl transition-all duration-300 group ${
                      imageUrl ? 'cursor-pointer hover:border-blue-500 hover:shadow-blue-500/20 hover:scale-[1.02]' : ''
                    }`}
                    title={imageUrl ? 'Klik kartu untuk memperbesar (zoom)' : undefined}
                  >
                    {imageUrl ? (
                      <>
                        <img
                          src={formatCardImageUrl(imageUrl)}
                          alt={cardName || 'Preview Kartu'}
                          className="w-full h-full object-contain bg-slate-950 select-none transition-transform duration-300 group-hover:scale-105"
                        />

                        {/* Hover Overlay Hint for Zoom */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-3 text-center pointer-events-none">
                          <span className="p-3 rounded-full bg-blue-600/90 text-white shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
                            <ZoomIn className="w-6 h-6" />
                          </span>
                          <span className="text-xs font-black text-white drop-shadow-md">
                            Klik untuk Zoom
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
                          Pilih kartu dari database TCG di sebelah kanan atau masukkan URL gambar langsung.
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
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Search + Details & Pricing Form (lg:col-span-7) */}
              <div className="lg:col-span-7 space-y-5">
                {/* 1. Database Card Search Box with Hierarchical TCG Structure */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-4 sm:p-5 space-y-4">
                  {/* LEVEL 1: Primary TCG Game Selector */}
                  <div>
                    <div className="flex items-center mb-2">
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-blue-400" />
                        PILIH JENIS KARTU TCG
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5">
                      {/* Pokemon Game Tab */}
                      <button
                        type="button"
                        onClick={() => setSelectedGame('pokemon')}
                        title="Pokémon"
                        className={`group relative flex items-center justify-center h-16 sm:h-20 md:h-22 p-2 sm:p-2.5 rounded-2xl transition-all border overflow-hidden ${
                          selectedGame === 'pokemon'
                            ? 'bg-gradient-to-r from-red-600/90 to-amber-500/90 text-white border-amber-400 shadow-lg shadow-red-600/30 ring-2 ring-amber-400/40'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800/80 hover:border-slate-700 hover:text-white'
                        }`}
                      >
                        <img
                          src="/logos/pokemon.svg"
                          alt="Pokémon"
                          className="w-full h-full object-contain filter drop-shadow-md transition-transform duration-200 group-hover:scale-105"
                        />
                      </button>

                      {/* Riftbound Game Tab */}
                      <button
                        type="button"
                        onClick={() => setSelectedGame('riftbound')}
                        title="Riftbound"
                        className={`group relative flex items-center justify-center h-16 sm:h-20 md:h-22 p-2 sm:p-2.5 rounded-2xl transition-all border overflow-hidden ${
                          selectedGame === 'riftbound'
                            ? 'bg-gradient-to-r from-cyan-600/90 to-blue-600/90 text-white border-cyan-400 shadow-lg shadow-cyan-600/30 ring-2 ring-cyan-400/40'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800/80 hover:border-slate-700 hover:text-white'
                        }`}
                      >
                        <img
                          src="/logos/riftbound.png"
                          alt="Riftbound"
                          className="w-full h-full object-contain filter drop-shadow-md transition-transform duration-200 group-hover:scale-105"
                        />
                      </button>

                      {/* One Piece Game Tab */}
                      <button
                        type="button"
                        onClick={() => setSelectedGame('onepiece')}
                        title="One Piece"
                        className={`group relative flex items-center justify-center h-16 sm:h-20 md:h-22 p-2 sm:p-2.5 rounded-2xl transition-all border overflow-hidden ${
                          selectedGame === 'onepiece'
                            ? 'bg-gradient-to-r from-rose-600/90 to-red-600/90 text-white border-rose-400 shadow-lg shadow-rose-600/30 ring-2 ring-rose-400/40'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800/80 hover:border-slate-700 hover:text-white'
                        }`}
                      >
                        <img
                          src="/logos/onepiece.png?v=2"
                          alt="One Piece"
                          className="w-full h-full object-contain filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] brightness-105 transition-transform duration-200 group-hover:scale-105"
                        />
                      </button>
                    </div>
                  </div>

                  {/* LEVEL 2: Sub-Menu / Language / Database per Game */}

                  {/* --- SUB-VIEW: POKEMON --- */}
                  {selectedGame === 'pokemon' && (
                    <div className="space-y-3 pt-1 border-t border-slate-800/80">
                      {/* Pokemon Source Sub-tabs */}
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-2xl border border-slate-800/90 flex-wrap">
                          <button
                            type="button"
                            onClick={() => setPokemonSource('tcgdex')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                              pokemonSource === 'tcgdex'
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            <Globe className="w-3.5 h-3.5" />
                            <span>Inggris (EN)</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setPokemonSource('localid')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                              pokemonSource === 'localid'
                                ? 'bg-red-600 text-white shadow-sm'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            <span className="text-sm leading-none">🇮🇩</span>
                            <span>Indonesia (4.100+)</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setPokemonSource('localjp')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                              pokemonSource === 'localjp'
                                ? 'bg-purple-600 text-white shadow-sm ring-1 ring-purple-400/40'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            <span className="text-sm leading-none">🇯🇵</span>
                            <span>Jepang (23.000+)</span>
                          </button>
                        </div>
                      </div>

                      {/* TCGdex View */}
                      {pokemonSource === 'tcgdex' && (
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

                      {/* Indonesian View */}
                      {pokemonSource === 'localid' && (
                        <div className="space-y-2.5">
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
                        </div>
                      )}

                      {/* Japanese View */}
                      {pokemonSource === 'localjp' && (
                        <div className="space-y-2.5">
                          <div className="relative">
                            <ChevronDown className="w-4 h-4 absolute right-3.5 top-3 text-slate-400 pointer-events-none" />
                            <select
                              value={localJpExpansion}
                              onChange={(e) => setLocalJpExpansion(e.target.value)}
                              className="w-full pl-3.5 pr-10 py-2.5 bg-slate-900 border border-slate-700/80 rounded-2xl text-xs text-white focus:outline-none focus:border-purple-500 appearance-none shadow-inner"
                            >
                              <option value="">— Semua Seri / Set Jepang (1.300+ Seri) —</option>
                              {jpExpansions.slice(0, 100).map((exp) => (
                                <option key={exp.code} value={exp.code}>
                                  {exp.productName} ({exp.count} kartu)
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="relative">
                            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                            <input
                              type="text"
                              placeholder="Cari kartu Jepang (contoh: リザードン, Pikachu, 151, VSTAR, 001/078)..."
                              value={localJpQuery}
                              onChange={(e) => setLocalJpQuery(e.target.value)}
                              className="w-full pl-10 pr-10 py-2.5 bg-slate-900 border border-slate-700/80 rounded-2xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 shadow-inner"
                            />
                            {localJpSearching && (
                              <Loader2 className="w-4 h-4 absolute right-3.5 top-3 text-purple-400 animate-spin" />
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-950/40 border border-purple-500/20 rounded-xl text-purple-200">
                            <span className="text-sm">🇯🇵</span>
                            <span className="text-[11px]">
                              Bisa cari dengan nama Jepang (リザードン), nama Inggris (Charizard), atau nomor kartu.
                            </span>
                          </div>

                          {localJpResults.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
                              {localJpResults.map((card, idx) => (
                                <button
                                  key={`localjp-${card.id || idx}-${idx}`}
                                  type="button"
                                  disabled={localJpSearching}
                                  onClick={() => handleSelectLocalJpCard(card)}
                                  className="p-2 rounded-2xl bg-slate-900 hover:bg-slate-800/90 border border-slate-800 hover:border-purple-500/60 flex items-center gap-2.5 text-left transition-all group shadow hover:shadow-purple-500/10"
                                >
                                  {card.imageUrl ? (
                                    <img
                                      src={card.imageUrl}
                                      alt=""
                                      className="w-10 h-14 object-contain rounded-lg bg-slate-950 shadow flex-shrink-0 group-hover:scale-105 transition-transform"
                                    />
                                  ) : (
                                    <div className="w-10 h-14 bg-slate-800 rounded-lg flex items-center justify-center text-[9px] text-slate-500 flex-shrink-0">
                                      JP
                                    </div>
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <div className="text-xs font-black text-white group-hover:text-purple-300 truncate">
                                      {card.name}
                                    </div>
                                    <div className="text-[11px] text-slate-400 truncate mt-0.5">
                                      {card.collectorNumber ? `#${card.collectorNumber}` : card.category}
                                    </div>
                                    <div className="text-[10px] text-purple-400/80 font-bold truncate">
                                      {card.expansion}
                                    </div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}

                          {!localJpSearching && localJpResults.length === 0 && localJpQuery.trim().length > 0 && (
                            <div className="text-center text-xs text-slate-400 py-2">
                              Tidak ada kartu ditemukan untuk &quot;{localJpQuery}&quot;.
                            </div>
                          )}
                        </div>
                      )}

                      {/* Preset Hits View */}
                      {pokemonSource === 'preset' && (
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

                      {/* Market Price Banner */}
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
                  )}

                  {/* --- SUB-VIEW: RIFTBOUND TCG --- */}
                  {selectedGame === 'riftbound' && (
                    <div className="space-y-3 pt-1 border-t border-slate-800/80">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-black">
                          <img src="/logos/riftbound.png" alt="Riftbound" className="h-4 w-auto object-contain" />
                          <span>Riftbound TCG Official Data</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-200">
                            1.400+ Kartu
                          </span>
                        </div>
                      </div>

                      {/* Set Filter Dropdown */}
                      <div className="relative">
                        <ChevronDown className="w-4 h-4 absolute right-3.5 top-3 text-slate-400 pointer-events-none" />
                        <select
                          value={riftboundSet}
                          onChange={(e) => setRiftboundSet(e.target.value)}
                          className="w-full pl-3.5 pr-10 py-2.5 bg-slate-900 border border-slate-700/80 rounded-2xl text-xs text-white focus:outline-none focus:border-cyan-500 appearance-none shadow-inner"
                        >
                          <option value="">— Semua Set Riftbound —</option>
                          {riftboundSets.map((s) => (
                            <option key={s.code} value={s.setName}>
                              {s.setName} ({s.code}) — {s.count} kartu
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Search Input */}
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Cari kartu Riftbound (contoh: Blazing Scorcher, OGN-001, Fury, Unit, Spell, Dragon)..."
                          value={riftboundQuery}
                          onChange={(e) => setRiftboundQuery(e.target.value)}
                          className="w-full pl-10 pr-10 py-2.5 bg-slate-900 border border-slate-700/80 rounded-2xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 shadow-inner"
                        />
                        {riftboundSearching && (
                          <Loader2 className="w-4 h-4 absolute right-3.5 top-3 text-cyan-400 animate-spin" />
                        )}
                      </div>

                      {/* Riftbound Card Grid */}
                      {riftboundResults.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
                          {riftboundResults.map((card, idx) => (
                            <button
                              key={`rb-${card.id || idx}-${idx}`}
                              type="button"
                              disabled={riftboundSearching}
                              onClick={() => handleSelectRiftboundCard(card)}
                              className="p-2 rounded-2xl bg-slate-900 hover:bg-slate-800/90 border border-slate-800 hover:border-cyan-500/60 flex items-center gap-2.5 text-left transition-all group shadow hover:shadow-cyan-500/10"
                            >
                              {card.imageUrl ? (
                                <img
                                  src={formatCardImageUrl(card.imageUrl)}
                                  alt=""
                                  className="w-10 h-14 object-contain rounded-lg bg-slate-950 shadow flex-shrink-0 group-hover:scale-105 transition-transform"
                                />
                              ) : (
                                <div className="w-10 h-14 bg-slate-800 rounded-lg flex items-center justify-center text-[9px] text-slate-500 flex-shrink-0">
                                  RB
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-black text-white group-hover:text-cyan-300 truncate">
                                  {card.name}
                                </div>
                                <div className="text-[11px] text-slate-400 truncate mt-0.5">
                                  {card.publicCode || `#${card.collectorNumber}`} • {card.cardType}
                                </div>
                                <div className="text-[10px] text-cyan-400/80 font-bold truncate">
                                  {card.setName} {card.domain ? `(${card.domain})` : ''}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {!riftboundSearching && riftboundResults.length === 0 && riftboundQuery.trim().length > 0 && (
                        <div className="text-center text-xs text-slate-400 py-2">
                          Tidak ada kartu Riftbound ditemukan untuk &quot;{riftboundQuery}&quot;.
                        </div>
                      )}

                      {!riftboundSearching && riftboundResults.length === 0 && riftboundQuery.trim().length === 0 && (
                        <div className="text-center text-xs text-slate-500 py-1.5 flex items-center justify-center gap-1.5">
                          <span>🌀</span>
                          <span>Ketik nama kartu Riftbound atau pilih set rilis di atas.</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* --- SUB-VIEW: ONE PIECE CARD GAME --- */}
                  {selectedGame === 'onepiece' && (
                    <div className="space-y-3 pt-1 border-t border-slate-800/80">
                      {/* Language Selection Sub-Menu for One Piece */}
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-2xl border border-slate-800/90">
                          {/* English Sub-menu */}
                          <button
                            type="button"
                            onClick={() => {
                              setOnePieceLang('EN');
                              setOnePiecePage(1);
                              setOnePieceSet('');
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                              onePieceLang === 'EN'
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm ring-1 ring-blue-400/50'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            <Globe className="w-3.5 h-3.5" />
                            <span>Inggris (EN)</span>
                            <span className="text-[10px] opacity-80 font-mono">4.940+</span>
                          </button>

                          {/* Japanese Sub-menu */}
                          <button
                            type="button"
                            onClick={() => {
                              setOnePieceLang('JP');
                              setOnePiecePage(1);
                              setOnePieceSet('');
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                              onePieceLang === 'JP'
                                ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-sm ring-1 ring-rose-400/50'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            <span className="text-sm leading-none">🇯🇵</span>
                            <span>Jepang (JP)</span>
                            <span className="text-[10px] opacity-80 font-mono">5.110+</span>
                          </button>
                        </div>
                      </div>

                      {/* Filters: Sets & Search */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="relative">
                          <ChevronDown className="w-4 h-4 absolute right-3.5 top-2.5 text-slate-400 pointer-events-none" />
                          <select
                            value={onePieceSet}
                            onChange={(e) => {
                              setOnePieceSet(e.target.value);
                              setOnePiecePage(1);
                            }}
                            className="w-full pl-3 pr-8 py-2 bg-slate-900 border border-slate-700/80 rounded-2xl text-xs text-white focus:outline-none focus:border-rose-500 appearance-none shadow-inner"
                          >
                            <option value="">
                              — Semua Seri {onePieceLang === 'EN' ? 'Inggris' : 'Jepang'} (
                              {(onePieceLang === 'EN' ? onePieceEnSets : onePieceJpSets).length} Seri) —
                            </option>
                            {(onePieceLang === 'EN' ? onePieceEnSets : onePieceJpSets).map((s) => (
                              <option key={s.name} value={s.name}>
                                {s.name} ({s.count} kartu)
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="relative">
                          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                          <input
                            type="text"
                            placeholder={
                              onePieceLang === 'EN'
                                ? 'Cari One Piece (Luffy, Zoro, Nami, OP05-119, SEC, Leader...)...'
                                : 'Cari One Piece JP (ルフィ, ゾロ, OP05-119, SEC, リーダー...)...'
                            }
                            value={onePieceQuery}
                            onChange={(e) => {
                              setOnePieceQuery(e.target.value);
                              setOnePiecePage(1);
                            }}
                            className="w-full pl-9 pr-9 py-2 bg-slate-900 border border-slate-700/80 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 shadow-inner"
                          />
                          {onePieceSearching && (
                            <Loader2 className="w-4 h-4 absolute right-3 top-2.5 text-rose-400 animate-spin" />
                          )}
                        </div>
                      </div>

                      {/* Info & Result count */}
                      <div className="flex items-center justify-between text-xs px-1 text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs">🏴‍☠️</span>
                          <span className="text-[11px]">
                            {onePieceSearching ? (
                              'Sedang mencari...'
                            ) : (
                              <>
                                Ditemukan <strong className="text-white">{onePieceTotal.toLocaleString()}</strong> kartu{' '}
                                {onePieceLang === 'EN' ? 'Inggris' : 'Jepang'}
                              </>
                            )}
                          </span>
                        </div>

                        {onePieceTotalPages > 1 && (
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <button
                              type="button"
                              onClick={() => setOnePiecePage((p) => Math.max(1, p - 1))}
                              disabled={onePiecePage <= 1 || onePieceSearching}
                              className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white font-bold"
                            >
                              &larr; Prev
                            </button>
                            <span className="font-mono text-slate-300">
                              {onePiecePage}/{onePieceTotalPages}
                            </span>
                            <button
                              type="button"
                              onClick={() => setOnePiecePage((p) => Math.min(onePieceTotalPages, p + 1))}
                              disabled={onePiecePage >= onePieceTotalPages || onePieceSearching}
                              className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white font-bold"
                            >
                              Next &rarr;
                            </button>
                          </div>
                        )}
                      </div>

                      {/* One Piece Cards Grid */}
                      {onePieceResults.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto pr-1">
                          {onePieceResults.map((card, idx) => (
                            <button
                              key={`op-${card.id || idx}-${idx}`}
                              type="button"
                              disabled={onePieceSearching}
                              onClick={() => handleSelectOnePieceCard(card)}
                              className="p-2 rounded-2xl bg-slate-900 hover:bg-slate-800/90 border border-slate-800 hover:border-rose-500/60 flex items-center gap-2.5 text-left transition-all group shadow hover:shadow-rose-500/10"
                            >
                              {card.imageUrl ? (
                                <img
                                  src={formatCardImageUrl(card.imageUrl)}
                                  alt=""
                                  className="w-10 h-14 object-contain rounded-lg bg-slate-950 shadow flex-shrink-0 group-hover:scale-105 transition-transform"
                                />
                              ) : (
                                <div className="w-10 h-14 bg-slate-800 rounded-lg flex items-center justify-center text-[9px] font-bold text-rose-400 flex-shrink-0">
                                  OP
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-black text-white group-hover:text-rose-300 truncate">
                                  {card.name}
                                </div>
                                <div className="text-[11px] text-slate-400 truncate mt-0.5">
                                  {card.cardNumber} • <span className="font-semibold text-rose-400">{card.rarity}</span>
                                </div>
                                <div className="text-[10px] text-amber-400/90 font-bold truncate">
                                  {card.category} {card.color ? `• ${card.color}` : ''}
                                </div>
                                <div className="text-[9px] text-slate-500 truncate">
                                  {card.cardSet}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {!onePieceSearching && onePieceResults.length === 0 && onePieceQuery.trim().length > 0 && (
                        <div className="text-center text-xs text-slate-400 py-3">
                          Tidak ada kartu One Piece {onePieceLang === 'EN' ? 'Inggris' : 'Jepang'} ditemukan untuk &quot;{onePieceQuery}&quot;.
                        </div>
                      )}

                      {!onePieceSearching && onePieceResults.length === 0 && onePieceQuery.trim().length === 0 && (
                        <div className="text-center text-xs text-slate-500 py-2 flex items-center justify-center gap-1.5">
                          <span>🏴‍☠️</span>
                          <span>Ketik nama karakter One Piece, nomor kartu, atau pilih seri rilis di atas.</span>
                        </div>
                      )}
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
                          Nama Kartu <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value)}
                          placeholder="misal: Charizard ex SIR / Blazing Scorcher / Luffy"
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
                          placeholder="misal: Scarlet & Violet: 151 / Origins / OP-05"
                          className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-2xl text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500 shadow-inner"
                        />
                      </div>

                      {/* Card Number */}
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">Nomor / Kode Kartu</label>
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          placeholder="misal: 199/165 / OGN-001/298 / OP05-119"
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
                          placeholder="misal: Illustration Rare / Common / Manga Rare"
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
                          Catatan Penjual (Deskripsi, status card, swirl holo, dll.)
                        </label>
                        <input
                          type="text"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="misal: Unit • Domain Fury • Might 5 / Pack Fresh"
                          className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-2xl text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500 shadow-inner"
                        />
                      </div>

                      {/* Image URL Input */}
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          URL Gambar Kartu (Otomatis dari pencarian kartu atau dapat diubah manual)
                        </label>
                        <input
                          type="url"
                          value={imageUrl}
                          onChange={(e) => setImageUrl(e.target.value)}
                          placeholder="https://..."
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
