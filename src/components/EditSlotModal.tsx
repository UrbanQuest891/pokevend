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
  Image as ImageIcon,
  Check,
  Clock,
  Layers,
  Sparkle,
  ArrowLeft,
  RotateCcw,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import { CardCondition, CardStatus, PokemonCard } from '@/types';
import { formatCurrency } from '@/lib/qr';
import { TcgdexCardSummary } from '@/lib/tcgdex';
import { LocalEnCardSummary, LocalEnSetInfo } from '@/lib/localEnCards';
import { LocalIdCardSummary } from '@/lib/localIdCards';
import { LocalJpCardSummary } from '@/lib/localJpCards';
import { LocalCnCardSummary, LocalCnSetInfo } from '@/lib/localCnCards';
import { RiftboundCardSummary, RiftboundSetInfo } from '@/lib/riftboundCards';
import { OnePieceCardSummary, OnePieceSetInfo } from '@/lib/onepieceCards';
import { formatCardImageUrl } from '@/lib/imageHelper';
import { formatCardDisplayName, translateCardSet } from '@/lib/cardTranslator';
import CardImageLightbox from '@/components/CardImageLightbox';

export type TcgGame = 'pokemon' | 'riftbound' | 'onepiece';
export type PokemonSubSource = 'tcgdex' | 'localid' | 'localjp' | 'localcn';

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
  'Graded - BGS 10 Black Label',
  'Graded - BGS 10 Gold Label',
  'Graded - BGS 9.5',
  'Graded - BGS 9',
  'Graded - CGC 10',
  'Graded - ARS 10+',
  'Graded - ARS 10',
  'Graded - ARS 9',
  'Graded - ARS 8 or below',
  'Graded - Other',
];

const formatRupiahInput = (val: number | undefined | null): string => {
  if (val === undefined || val === null || val <= 0 || isNaN(val)) {
    return 'Rp ';
  }
  return `Rp ${Math.round(val).toLocaleString('id-ID')}`;
};

const parseRupiahInput = (raw: string): number => {
  const digits = raw.replace(/\D/g, '');
  return digits ? parseInt(digits, 10) : 0;
};

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

  // Level 1: Primary TCG Game Selection (Step 1)
  const [selectedGame, setSelectedGame] = useState<TcgGame | null>(null);

  // Level 2 - Pokemon Sub-Sources (Step 2)
  const [pokemonSource, setPokemonSource] = useState<PokemonSubSource | null>(null);
  const [tcgdexQuery, setTcgdexQuery] = useState('');
  const [tcgdexResults, setTcgdexResults] = useState<TcgdexCardSummary[]>([]);
  const [tcgdexSearching, setTcgdexSearching] = useState(false);
  const [tcgdexFetchingCard, setTcgdexFetchingCard] = useState(false);
  const [marketRef, setMarketRef] = useState<{ usd?: number; idr?: number } | null>(null);

  // Pokemon English DB (20,600+ cards across 176 sets from local scraped data)
  const [enQuery, setEnQuery] = useState('');
  const [enSet, setEnSet] = useState('');
  const [enResults, setEnResults] = useState<LocalEnCardSummary[]>([]);
  const [enSearching, setEnSearching] = useState(false);
  const [enFetchingCard, setEnFetchingCard] = useState(false);
  const [enSets, setEnSets] = useState<LocalEnSetInfo[]>([]);
  const [enSetsLoaded, setEnSetsLoaded] = useState(false);
  const [enPage, setEnPage] = useState(1);
  const [enTotal, setEnTotal] = useState(0);
  const [enTotalPages, setEnTotalPages] = useState(1);

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

  // Pokemon Chinese DB (13,600+ cards across 147 sets from TCGCollector)
  const [cnQuery, setCnQuery] = useState('');
  const [cnSet, setCnSet] = useState('');
  const [cnResults, setCnResults] = useState<LocalCnCardSummary[]>([]);
  const [cnSearching, setCnSearching] = useState(false);
  const [cnFetchingCard, setCnFetchingCard] = useState(false);
  const [cnSets, setCnSets] = useState<LocalCnSetInfo[]>([]);
  const [cnSetsLoaded, setCnSetsLoaded] = useState(false);
  const [cnPage, setCnPage] = useState(1);
  const [cnTotal, setCnTotal] = useState(0);
  const [cnTotalPages, setCnTotalPages] = useState(1);

  // Level 2 - Riftbound
  const [riftboundLang, setRiftboundLang] = useState<'EN' | null>(null);
  const [riftboundQuery, setRiftboundQuery] = useState('');
  const [riftboundResults, setRiftboundResults] = useState<RiftboundCardSummary[]>([]);
  const [riftboundSearching, setRiftboundSearching] = useState(false);
  const [riftboundSet, setRiftboundSet] = useState('');
  const [riftboundSets, setRiftboundSets] = useState<RiftboundSetInfo[]>([]);
  const [riftboundSetsLoaded, setRiftboundSetsLoaded] = useState(false);

  // Level 2 - One Piece
  const [onePieceLang, setOnePieceLang] = useState<'JP' | 'EN' | null>(null);
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

  // Card Language & Market Provider Routing (EN: PriceCharting, JP: SNKRDUNK, ID: Pokepedia, CN: PriceCharting)
  const [cardLanguage, setCardLanguage] = useState<'EN' | 'JP' | 'ID' | 'CN'>('EN');
  const [priceProvider, setPriceProvider] = useState<'pricecharting' | 'snkrdunk' | 'pokepedia'>('pricecharting');

  // Price Reference State (5 Transaksi Terakhir)
  const [priceTransactions, setPriceTransactions] = useState<
    Array<{
      date: string;
      priceIdr: number;
      priceFormatted: string;
      priceOrig?: number;
      priceOrigFormatted?: string;
      currency?: string;
      priceUsd?: number;
      title?: string;
    }> | null
  >(null);
  const [priceRefMeta, setPriceRefMeta] = useState<{
    id?: string;
    name?: string;
    consoleName?: string;
    imageUri?: string;
    url?: string;
    benchmarkPriceYen?: number;
    benchmarkPriceIdr?: number;
    benchmarkFormatted?: string;
  } | null>(null);
  const [priceRefCondition, setPriceRefCondition] = useState<string | null>(null);
  const [priceCandidates, setPriceCandidates] = useState<
    Array<{
      id: string;
      title: string;
      url: string;
      imageUrl?: string;
      price?: string;
      badge?: string;
      isSelected?: boolean;
    }>
  >([]);
  const [priceExchangeRate, setPriceExchangeRate] = useState<{
    rate: number;
    formattedRate: string;
    source: string;
    label: string;
  } | null>(null);
  const [loadingPriceRef, setLoadingPriceRef] = useState(false);
  const [priceRefError, setPriceRefError] = useState<string | null>(null);
  const [appliedTxIndex, setAppliedTxIndex] = useState<number | null>(null);

  // Interactive Drilldown Transition State (Step 1 -> Step 2 -> Step 3)
  const [isExitingStep, setIsExitingStep] = useState<'step2' | 'step3' | null>(null);

  const handleSelectGame = (game: TcgGame) => {
    if (selectedGame === game) {
      handleBackToGames();
      return;
    }
    setSelectedGame(game);
    setPokemonSource(null);
    setOnePieceLang(null);
    setRiftboundLang(null);
    setIsExitingStep(null);
  };

  const handleBackToGames = () => {
    setIsExitingStep('step2');
    setTimeout(() => {
      setSelectedGame(null);
      setPokemonSource(null);
      setOnePieceLang(null);
      setRiftboundLang(null);
      setIsExitingStep(null);
    }, 200);
  };

  const handleSelectPokemonSource = (src: PokemonSubSource) => {
    setPokemonSource(src);
    if (src === 'localid') {
      setCardLanguage('ID');
      setPriceProvider('pokepedia');
    } else if (src === 'localjp') {
      setCardLanguage('JP');
      setPriceProvider('snkrdunk');
    } else if (src === 'localcn') {
      setCardLanguage('CN');
      setPriceProvider('pricecharting');
      setCnPage(1);
      setCnSet('');
    } else {
      setCardLanguage('EN');
      setPriceProvider('pricecharting');
    }
    setIsExitingStep(null);
  };

  const handleSelectOnePieceLang = (lang: 'EN' | 'JP') => {
    setOnePieceLang(lang);
    setCardLanguage(lang);
    setPriceProvider(lang === 'JP' ? 'snkrdunk' : 'pricecharting');
    setOnePiecePage(1);
    setOnePieceSet('');
    setIsExitingStep(null);
  };

  const handleSelectRiftboundLang = () => {
    setRiftboundLang('EN');
    setCardLanguage('EN');
    setPriceProvider('pricecharting');
    setIsExitingStep(null);
  };

  const handleBackToLanguage = () => {
    setIsExitingStep('step3');
    setTimeout(() => {
      setPokemonSource(null);
      setOnePieceLang(null);
      setRiftboundLang(null);
      setIsExitingStep(null);
    }, 200);
  };

  const isLanguageSelected = Boolean(
    (selectedGame === 'pokemon' && pokemonSource) ||
    (selectedGame === 'onepiece' && onePieceLang) ||
    (selectedGame === 'riftbound' && riftboundLang)
  );

  const effectiveGame: TcgGame = selectedGame || (existingCard?.game as TcgGame) || 'pokemon';

  // Initialize modal state on open or card change
  useEffect(() => {
    if (existingCard) {
      setCardName(formatCardDisplayName(existingCard.name, existingCard.cardNumber, existingCard.setName, existingCard.game));
      setCardSet(translateCardSet(existingCard.setName || '', existingCard.cardNumber, existingCard.game));
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

      // Infer card language & market provider
      const rawText = `${existingCard.name || ''} ${existingCard.setName || ''} ${existingCard.notes || ''}`;
      if (/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/.test(rawText) || (existingCard.notes && existingCard.notes.includes('[JP]'))) {
        setCardLanguage('JP');
        setPriceProvider('snkrdunk');
      } else if (existingCard.notes && existingCard.notes.includes('[ID]')) {
        setCardLanguage('ID');
        setPriceProvider('pokepedia');
      } else {
        setCardLanguage('EN');
        setPriceProvider('pricecharting');
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
      setCardLanguage('EN');
      setPriceProvider('pricecharting');
    }

    setSelectedGame(null);
    setPokemonSource(null);
    setOnePieceLang(null);
    setRiftboundLang(null);
    setIsExitingStep(null);
    setTcgdexQuery('');
    setTcgdexResults([]);
    setEnQuery('');
    setEnSet('');
    setEnResults([]);
    setEnPage(1);
    setMarketRef(null);
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
    setPriceTransactions(null);
    setPriceRefMeta(null);
    setPriceRefCondition(null);
    setPriceRefError(null);
    setAppliedTxIndex(null);
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

  // Load Pokemon Chinese sets (147 sets from TCGCollector)
  useEffect(() => {
    if (selectedGame === 'pokemon' && pokemonSource === 'localcn' && !cnSetsLoaded) {
      fetch('/api/localcn/sets')
        .then((r) => r.json())
        .then((data) => {
          if (data.success && Array.isArray(data.sets)) {
            setCnSets(data.sets);
            setCnSetsLoaded(true);
          }
        })
        .catch((err) => {
          console.error('Failed to load CN sets:', err);
          setCnSetsLoaded(true);
        });
    }
  }, [selectedGame, pokemonSource, cnSetsLoaded]);

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

  // Load Pokemon English sets (176 sets from local scraped data)
  useEffect(() => {
    if (selectedGame === 'pokemon' && pokemonSource === 'tcgdex' && !enSetsLoaded) {
      fetch('/api/localen/sets')
        .then((r) => r.json())
        .then((data) => {
          if (data.success && Array.isArray(data.sets)) {
            setEnSets(data.sets);
            setEnSetsLoaded(true);
          }
        })
        .catch((err) => console.error('Failed to load EN sets', err));
    }
  }, [selectedGame, pokemonSource, enSetsLoaded]);

  // Search Pokemon English cards (Local database with 20,600+ cards)
  useEffect(() => {
    if (selectedGame !== 'pokemon' || pokemonSource !== 'tcgdex') return;

    const timer = setTimeout(async () => {
      try {
        setEnSearching(true);
        const params = new URLSearchParams();
        if (enQuery.trim()) params.set('q', enQuery.trim());
        if (enSet) params.set('set', enSet);
        params.set('page', String(enPage));
        params.set('limit', '18');

        const res = await fetch(`/api/localen/search?${params.toString()}`);
        const data = await res.json();
        if (data.success) {
          setEnResults(data.cards || []);
          setEnTotal(data.total || 0);
          setEnTotalPages(data.totalPages || 1);
        } else {
          setEnResults([]);
          setEnTotal(0);
          setEnTotalPages(1);
        }
      } catch (err) {
        console.error('Failed to search EN cards', err);
        setEnResults([]);
      } finally {
        setEnSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [enQuery, enSet, enPage, selectedGame, pokemonSource]);

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

  // Debounced Chinese local DB search
  useEffect(() => {
    if (selectedGame !== 'pokemon' || pokemonSource !== 'localcn') return;

    const timer = setTimeout(async () => {
      try {
        setCnSearching(true);
        const params = new URLSearchParams({
          q: cnQuery.trim(),
          set: cnSet,
          page: String(cnPage),
          limit: '18',
        });
        const res = await fetch(`/api/localcn/search?${params.toString()}`);
        const data = await res.json();
        if (data.success) {
          setCnResults(data.cards || []);
          setCnTotal(data.total || 0);
          setCnTotalPages(data.totalPages || 1);
        }
      } catch (err) {
        console.error('LocalCn search failed:', err);
      } finally {
        setCnSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [cnQuery, cnSet, cnPage, selectedGame, pokemonSource]);

  // Debounced Riftbound search
  useEffect(() => {
    if (selectedGame !== 'riftbound' || !riftboundLang) return;

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
    if (selectedGame !== 'onepiece' || !onePieceLang) return;

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

  const resetPriceReference = () => {
    setPriceTransactions(null);
    setPriceRefMeta(null);
    setPriceRefCondition(null);
    setPriceExchangeRate(null);
    setPriceRefError(null);
    setAppliedTxIndex(null);
    setPriceCandidates([]);
  };

  // Handle picking card from TCGdex
  const handleSelectTcgdexCard = async (cardSummary: TcgdexCardSummary) => {
    resetPriceReference();
    setCardLanguage('EN');
    setPriceProvider('pricecharting');
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

  // Handle picking card from Local English Pokémon DB (20,600+ cards)
  const handleSelectLocalEnCard = async (cardSummary: LocalEnCardSummary) => {
    resetPriceReference();
    setCardLanguage('EN');
    setPriceProvider('pricecharting');
    try {
      setEnFetchingCard(true);
      const res = await fetch(`/api/localen/card/${cardSummary.id}`);
      const data = await res.json();

      if (data.success && data.card) {
        const c = data.card;
        setCardName(c.name);
        setCardSet(c.setName || cardSummary.setName);
        setCardNumber(c.formattedNumber || c.number || cardSummary.formattedNumber || cardSummary.number);
        setRarity(c.rarity || cardSummary.rarity || 'Rare');
        setImageUrl(c.imageUrl || cardSummary.imageUrl);
        setSelectedGame('pokemon');
      } else {
        setCardName(cardSummary.name);
        setCardSet(cardSummary.setName);
        setCardNumber(cardSummary.formattedNumber || cardSummary.number);
        setRarity(cardSummary.rarity || 'Rare');
        setImageUrl(cardSummary.imageUrl);
        setSelectedGame('pokemon');
      }
    } catch (err) {
      console.error('Failed to fetch English card details', err);
      setCardName(cardSummary.name);
      setCardSet(cardSummary.setName);
      setCardNumber(cardSummary.formattedNumber || cardSummary.number);
      setRarity(cardSummary.rarity || 'Rare');
      setImageUrl(cardSummary.imageUrl);
      setSelectedGame('pokemon');
    } finally {
      setEnFetchingCard(false);
    }
  };

  // Handle picking from Indonesian local DB
  const handleSelectLocalIdCard = async (summary: LocalIdCardSummary) => {
    resetPriceReference();
    setCardLanguage('ID');
    setPriceProvider('pokepedia');
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
    resetPriceReference();
    setCardLanguage('JP');
    setPriceProvider('snkrdunk');
    try {
      setLocalJpSearching(true);
      const res = await fetch(`/api/localjp/card/${summary.id}`);
      const data = await res.json();

      if (data.success && data.card) {
        const c = data.card;
        const translatedName = formatCardDisplayName(c.name, c.collectorNumber, c.expansion, 'pokemon');
        const translatedSet = translateCardSet(c.expansion || '', c.collectorNumber, 'pokemon');
        setCardName(translatedName);
        setCardSet(translatedSet);
        setCardNumber(c.collectorNumber || '');
        setImageUrl(c.imageUrl || '');
        setMarketRef(null);
      } else {
        const translatedName = formatCardDisplayName(summary.name, summary.collectorNumber, summary.expansion, 'pokemon');
        const translatedSet = translateCardSet(summary.expansion || '', summary.collectorNumber, 'pokemon');
        setCardName(translatedName);
        setCardSet(translatedSet);
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

  // Handle picking from Chinese local DB
  const handleSelectLocalCnCard = async (summary: LocalCnCardSummary) => {
    resetPriceReference();
    setCardLanguage('CN');
    setPriceProvider('pricecharting');
    try {
      setCnFetchingCard(true);
      const res = await fetch(`/api/localcn/card/${encodeURIComponent(summary.id)}`);
      const data = await res.json();

      if (data.success && data.card) {
        const c = data.card;
        const translatedName = formatCardDisplayName(c.name, c.number, c.setName, 'pokemon');
        const translatedSet = translateCardSet(c.setName || '', c.number, 'pokemon');
        setCardName(translatedName);
        setCardSet(translatedSet);
        setCardNumber(c.number || '');
        setRarity(c.rarity || 'Common');
        setImageUrl(c.imageUrl || '');
        setNotes(`[CN] ${c.fullName || c.name} • ${translatedSet}`);
        setMarketRef(null);
      } else {
        const translatedName = formatCardDisplayName(summary.name, summary.number, summary.setName, 'pokemon');
        const translatedSet = translateCardSet(summary.setName || '', summary.number, 'pokemon');
        setCardName(translatedName);
        setCardSet(translatedSet);
        setCardNumber(summary.number || '');
        setRarity(summary.rarity || '');
        setImageUrl(summary.imageUrl || '');
        setNotes(`[CN] ${summary.fullName || summary.name} • ${translatedSet}`);
      }
    } catch (err) {
      console.error(err);
      setCardName(summary.name);
      setImageUrl(summary.imageUrl || '');
    } finally {
      setCnFetchingCard(false);
    }
  };

  // Handle picking from Riftbound cards
  const handleSelectRiftboundCard = async (summary: RiftboundCardSummary) => {
    resetPriceReference();
    setCardLanguage('EN');
    setPriceProvider('pricecharting');
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
    resetPriceReference();
    const isOpEn = summary.lang === 'EN';
    setCardLanguage(isOpEn ? 'EN' : 'JP');
    setPriceProvider(isOpEn ? 'pricecharting' : 'snkrdunk');
    try {
      setOnePieceSearching(true);
      const res = await fetch(`/api/onepiece/card/${encodeURIComponent(summary.id)}?lang=${summary.lang}`);
      const data = await res.json();

      if (data.success && data.card) {
        const c = data.card;
        const translatedName = formatCardDisplayName(c.name, c.cardNumber, c.cardSet || c.seriesName, 'onepiece');
        const translatedSet = translateCardSet(c.cardSet || c.seriesName || '', c.cardNumber, 'onepiece');
        setCardName(translatedName);
        setCardSet(translatedSet);
        setCardNumber(c.cardNumber || '');
        setRarity(c.rarity || 'Common');
        setImageUrl(c.imageUrl || '');

        const details = [
          c.name !== translatedName ? `Original: ${c.name}` : null,
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
        const translatedName = formatCardDisplayName(summary.name, summary.cardNumber, summary.cardSet, 'onepiece');
        const translatedSet = translateCardSet(summary.cardSet || '', summary.cardNumber, 'onepiece');
        setCardName(translatedName);
        setCardSet(translatedSet);
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveCardName = cardName.trim() || notes.trim() || 'Kartu TCG';
    if (!effectiveCardName) {
      alert('Pilih kartu dari pencarian atau isi catatan penjual');
      return;
    }

    try {
      setSaving(true);
      const res = await fetch(`/api/binders/${binderId}/slots/${slotNumber}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: effectiveCardName,
          setName: cardSet,
          cardNumber,
          rarity,
          condition,
          price: Number(price),
          originalPrice: originalPrice ? Number(originalPrice) : undefined,
          status,
          imageUrl,
          notes,
          game: selectedGame || existingCard?.game || 'pokemon',
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

  const effectiveLanguage: 'EN' | 'JP' | 'ID' | 'CN' = (() => {
    if (pokemonSource === 'localid') return 'ID';
    if (pokemonSource === 'localjp') return 'JP';
    if (pokemonSource === 'localcn') return 'CN';
    if (pokemonSource === 'tcgdex') return 'EN';
    if (onePieceLang === 'JP') return 'JP';
    if (onePieceLang === 'EN') return 'EN';
    if (riftboundLang === 'EN') return 'EN';
    if (cardLanguage) return cardLanguage;
    const rawCheck = `${cardName} ${cardSet} ${notes}`;
    if (notes.includes('[CN]')) return 'CN';
    if (/[\u3040-\u30ff]/.test(rawCheck) || notes.includes('[JP]')) return 'JP';
    if (notes.includes('[ID]')) return 'ID';
    return 'EN';
  })();

  const activeProvider =
    priceProvider && priceTransactions
      ? priceProvider
      : effectiveLanguage === 'JP'
      ? 'snkrdunk'
      : effectiveLanguage === 'ID'
      ? 'pokepedia'
      : 'pricecharting';

  const providerLabel =
    activeProvider === 'snkrdunk'
      ? 'SNKRDUNK'
      : activeProvider === 'pokepedia'
      ? 'POKEPEDIA.ID'
      : 'PRICECHARTING';

  const providerBadgeColor =
    activeProvider === 'snkrdunk'
      ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
      : activeProvider === 'pokepedia'
      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
      : 'bg-amber-500/10 text-amber-400 border-amber-500/30';

  const providerSearchBtnClass =
    activeProvider === 'snkrdunk'
      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 shadow-md hover:shadow-cyan-500/20'
      : activeProvider === 'pokepedia'
      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-md hover:shadow-emerald-500/20'
      : 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-md hover:shadow-amber-500/20';

  const providerSearchBtnText = loadingPriceRef
    ? `Mencari di ${activeProvider === 'snkrdunk' ? 'SNKRDUNK' : activeProvider === 'pokepedia' ? 'Pokepedia' : 'PriceCharting'}...`
    : priceTransactions
    ? `Cari Ulang di ${activeProvider === 'snkrdunk' ? 'SNKRDUNK' : activeProvider === 'pokepedia' ? 'Pokepedia' : 'PriceCharting'}`
    : `Cari di ${activeProvider === 'snkrdunk' ? 'SNKRDUNK' : activeProvider === 'pokepedia' ? 'Pokepedia' : 'PriceCharting'}`;

  const providerEmptyHint =
    activeProvider === 'snkrdunk'
      ? 'Tekan tombol di atas untuk melihat 5 listing harga jual pasar Jepang dari SNKRDUNK.'
      : activeProvider === 'pokepedia'
      ? 'Tekan tombol di atas untuk melihat 5 referensi harga pasar Indonesia dari Pokepedia.id.'
      : 'Tekan tombol di atas untuk melihat 5 transaksi tanggal & harga jual terakhir dari PriceCharting.';

  // Cari Harga Referensi (EN: PriceCharting, JP: SNKRDUNK, ID: Pokepedia, CN: PriceCharting)
  const handleSearchPriceReference = async (
    overrideLang?: 'EN' | 'JP' | 'ID' | 'CN',
    overrideTargetUrl?: string
  ) => {
    if (!cardName.trim()) {
      setPriceRefError('Pilih kartu terlebih dahulu atau isi nama kartu di kolom detail.');
      return;
    }

    const targetLang = overrideLang || effectiveLanguage;

    setLoadingPriceRef(true);
    setPriceRefError(null);
    setPriceTransactions(null);
    setAppliedTxIndex(null);

    try {
      const params = new URLSearchParams({
        name: cardName.trim(),
        number: cardNumber.trim(),
        set: cardSet.trim(),
        condition: condition,
        game: effectiveGame,
        lang: targetLang,
        rarity: rarity.trim(),
        imageUrl: imageUrl.trim(),
        notes: notes.trim(),
      });

      if (overrideTargetUrl) {
        params.append('targetUrl', overrideTargetUrl);
      }

      const res = await fetch(`/api/pricecharting?${params.toString()}`);
      const data = await res.json();

      if (data.success && Array.isArray(data.transactions) && data.transactions.length > 0) {
        setPriceTransactions(data.transactions);
        setPriceRefMeta(data.product || null);
        setPriceRefCondition(data.conditionApplied || null);
        setPriceCandidates(data.candidates || []);
        setPriceProvider(
          data.provider ||
            (targetLang === 'JP' ? 'snkrdunk' : targetLang === 'ID' ? 'pokepedia' : 'pricecharting')
        );
        if (data.exchangeRate) {
          setPriceExchangeRate(data.exchangeRate);
        }
      } else {
        if (data.product) {
          setPriceRefMeta(data.product);
          setPriceRefCondition(data.conditionApplied || null);
        } else {
          setPriceRefMeta(null);
          setPriceRefCondition(null);
        }
        if (data.candidates) {
          setPriceCandidates(data.candidates);
        }
        setPriceProvider(
          data.provider ||
            (targetLang === 'JP' ? 'snkrdunk' : targetLang === 'ID' ? 'pokepedia' : 'pricecharting')
        );
        if (data.exchangeRate) {
          setPriceExchangeRate(data.exchangeRate);
        }
        setPriceTransactions([]);
        setPriceRefError(data.error || 'Data penjualan tidak ditemukan');
      }
    } catch (err) {
      console.error('Error fetching price reference:', err);
      setPriceTransactions([]);
      setPriceRefError('Data penjualan tidak ditemukan');
    } finally {
      setLoadingPriceRef(false);
    }
  };

  const handleApplyPrice = (newPrice: number, index: number) => {
    setPrice(newPrice);
    setAppliedTxIndex(index);
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
    game: selectedGame || existingCard?.game || 'pokemon',
    updatedAt: new Date().toISOString(),
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md overflow-y-auto no-print">
        <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl my-auto overflow-hidden text-slate-100 flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="flex-shrink-0 px-5 sm:px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
            <div className="flex items-center gap-3">
              <span className="font-pixelify text-xs uppercase font-bold tracking-wider px-3 py-1 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 shadow-sm flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                SLOT #{slotNumber}
              </span>
              <div>
                <h2 className="font-pixelify text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  {existingCard ? 'EDIT KARTU DI SLOT' : 'PASANG KARTU KE SLOT'}
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
            <div className="flex flex-col lg:grid lg:grid-cols-12 gap-5 lg:gap-6 items-stretch lg:items-start">
              {/* LEFT COLUMN: High Visibility Card Preview Showcase (lg:col-span-5) */}
              <div className="contents lg:flex lg:flex-col lg:col-span-5 items-center gap-4">
                <div className="order-1 lg:order-none w-full bg-slate-950/80 border border-slate-800/80 rounded-3xl p-3 sm:p-4 flex flex-col items-center shadow-inner relative">
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
                    className={`relative w-full max-w-[320px] sm:max-w-[340px] aspect-[63/88] rounded-2xl overflow-hidden border-2 border-slate-700/80 bg-slate-950 shadow-2xl transition-all duration-300 group ${
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
                          style={{ imageRendering: '-webkit-optimize-contrast' }}
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

                {/* 5 Transaksi Terakhir Table (Table 1: Order 3 di HP agar di bawah Pemilihan Kartu) */}
                <div className="order-3 lg:order-none w-full bg-slate-950/80 border border-slate-800/80 rounded-3xl p-4 sm:p-5 flex flex-col gap-3 shadow-inner">
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                    <span className="font-extrabold text-slate-300 text-xs flex items-center gap-1.5">
                      <TrendingUp className={`w-3.5 h-3.5 ${
                        activeProvider === 'snkrdunk'
                          ? 'text-cyan-400'
                          : activeProvider === 'pokepedia'
                          ? 'text-emerald-400'
                          : 'text-amber-400'
                      }`} />
                      5 Transaksi Terakhir
                    </span>
                    <span className={`px-2 py-0.5 rounded-full border text-[10px] font-black tracking-wider uppercase ${providerBadgeColor}`}>
                      {providerLabel}
                    </span>
                  </div>

                  {/* Provider / Language Quick Switch Pills */}
                  <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800/80 text-[10px]">
                    <button
                      type="button"
                      onClick={() => {
                        setCardLanguage('EN');
                        setPriceProvider('pricecharting');
                        setPriceTransactions(null);
                        setPriceRefError(null);
                        setPriceRefMeta(null);
                        setPriceCandidates([]);
                      }}
                      className={`flex-1 py-1 px-1.5 rounded-lg font-bold text-center transition-all ${
                        effectiveLanguage === 'EN'
                          ? 'bg-amber-500 text-slate-950 shadow-sm'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                      }`}
                      title="Pencarian harga pasar kartu Bahasa Inggris via PriceCharting.com"
                    >
                      EN • PriceCharting
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCardLanguage('CN');
                        setPriceProvider('pricecharting');
                        setPriceTransactions(null);
                        setPriceRefError(null);
                        setPriceRefMeta(null);
                        setPriceCandidates([]);
                      }}
                      className={`flex-1 py-1 px-1.5 rounded-lg font-bold text-center transition-all ${
                        effectiveLanguage === 'CN'
                          ? 'bg-rose-500 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                      }`}
                      title="Pencarian harga pasar kartu Bahasa China via PriceCharting.com"
                    >
                      CN • PriceCharting
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCardLanguage('JP');
                        setPriceProvider('snkrdunk');
                        setPriceTransactions(null);
                        setPriceRefError(null);
                        setPriceRefMeta(null);
                        setPriceCandidates([]);
                      }}
                      className={`flex-1 py-1 px-1.5 rounded-lg font-bold text-center transition-all ${
                        effectiveLanguage === 'JP'
                          ? 'bg-cyan-500 text-slate-950 shadow-sm'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                      }`}
                      title="Pencarian harga pasar kartu Bahasa Jepang via SNKRDUNK.com"
                    >
                      JP • SNKRDUNK
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCardLanguage('ID');
                        setPriceProvider('pokepedia');
                        setPriceTransactions(null);
                        setPriceRefError(null);
                        setPriceRefMeta(null);
                        setPriceCandidates([]);
                      }}
                      className={`flex-1 py-1 px-1.5 rounded-lg font-bold text-center transition-all ${
                        effectiveLanguage === 'ID'
                          ? 'bg-emerald-500 text-slate-950 shadow-sm'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                      }`}
                      title="Pencarian harga pasar kartu Bahasa Indonesia via Pokepedia.id"
                    >
                      ID • Pokepedia
                    </button>
                  </div>

                  {/* Pilihan Kondisi / Grading untuk Harga Pasar & Kartu */}
                  <div className="flex items-center justify-between gap-2 px-1 text-xs">
                    <span className="text-[11px] font-bold text-slate-400">Kondisi / Grading:</span>
                    <select
                      value={condition}
                      onChange={(e) => {
                        const newCond = e.target.value as CardCondition;
                        setCondition(newCond);
                        resetPriceReference();
                      }}
                      className="py-1 px-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-amber-300 font-bold focus:outline-none focus:border-amber-400 shadow-inner cursor-pointer"
                    >
                      {CONDITIONS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Tombol Cari Harga Referensi */}
                  <button
                    type="button"
                    onClick={() => handleSearchPriceReference()}
                    disabled={loadingPriceRef}
                    className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed ${providerSearchBtnClass}`}
                  >
                    {loadingPriceRef ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>{providerSearchBtnText}</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-3.5 h-3.5" />
                        <span>{providerSearchBtnText}</span>
                      </>
                    )}
                  </button>

                  {/* Error Message */}
                  {priceRefError && priceTransactions === null && (
                    <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-[11px] text-red-300 text-center leading-relaxed">
                      {priceRefError}
                    </div>
                  )}

                  {/* Matched Product info if available */}
                  {priceRefMeta && (
                    <div className="px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] flex flex-col gap-2">
                      <div className="flex items-start gap-2.5">
                        {priceRefMeta.imageUri ? (
                          <img
                            src={priceRefMeta.imageUri}
                            alt={priceRefMeta.name || 'Kartu'}
                            className="w-10 h-14 object-contain rounded-md bg-slate-950 border border-slate-800 shrink-0 shadow-sm"
                          />
                        ) : null}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-200 font-bold truncate text-[11px]" title={priceRefMeta.name}>
                              {priceRefMeta.name}
                            </span>
                            {priceRefMeta.url && (
                              <a
                                href={priceRefMeta.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`text-[10px] font-bold flex items-center gap-1 shrink-0 underline transition-colors ${
                                  activeProvider === 'snkrdunk'
                                    ? 'text-cyan-400 hover:text-cyan-300'
                                    : activeProvider === 'pokepedia'
                                    ? 'text-emerald-400 hover:text-emerald-300'
                                    : 'text-amber-400 hover:text-amber-300'
                                }`}
                                onClick={(e) => e.stopPropagation()}
                                title={`Buka di ${providerLabel} (tab baru)`}
                              >
                                <span>{providerLabel}</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate flex items-center justify-between mt-0.5">
                            <span className="truncate">{priceRefMeta.consoleName || `${providerLabel} Data`}</span>
                            {priceRefCondition && (
                              <span className={`font-semibold shrink-0 ml-1 ${
                                activeProvider === 'snkrdunk'
                                  ? 'text-cyan-400'
                                  : activeProvider === 'pokepedia'
                                  ? 'text-emerald-400'
                                  : 'text-amber-400'
                              }`}>
                                {priceRefCondition}
                              </span>
                            )}
                          </div>
                          {priceRefMeta.benchmarkFormatted && (
                            <div className="flex items-center justify-between text-[10px] bg-slate-950/70 px-2 py-1 rounded-lg border border-slate-800/80 mt-1">
                              <span className="text-slate-400 font-medium">Mulai ({priceRefCondition || 'Kondisi'}):</span>
                              <span className="text-cyan-400 font-black">
                                {priceRefMeta.benchmarkFormatted}{' '}
                                {priceRefMeta.benchmarkPriceIdr && (
                                  <span className="text-slate-400 font-normal">
                                    (Rp {priceRefMeta.benchmarkPriceIdr.toLocaleString('id-ID')})
                                  </span>
                                )}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Candidate Variants Strip (Multi-variant Picker for One Piece / SNKRDUNK) */}
                      {priceCandidates && priceCandidates.length > 1 && (
                        <div className="pt-2 border-t border-slate-800/80">
                          <div className="flex items-center justify-between mb-1.5 text-[10px]">
                            <span className="font-bold text-slate-300 flex items-center gap-1.5">
                              <span>Varian Kartu di SNKRDUNK</span>
                              <span className="text-cyan-400 font-extrabold px-1.5 py-0.2 rounded-full bg-cyan-950/70 border border-cyan-800/50">
                                {priceCandidates.length}
                              </span>
                            </span>
                            <span className="text-[9px] text-slate-400 italic">Klik varian untuk ganti</span>
                          </div>
                          <div className="flex items-stretch gap-1.5 overflow-x-auto pb-1.5 custom-scrollbar">
                            {priceCandidates.map((cand) => {
                              const isCurrent = cand.url === priceRefMeta.url || cand.isSelected;
                              return (
                                <button
                                  key={cand.id || cand.url}
                                  type="button"
                                  onClick={() => handleSearchPriceReference(effectiveLanguage, cand.url)}
                                  className={`flex-shrink-0 flex flex-col items-center p-1.5 rounded-xl border text-center transition-all w-20 cursor-pointer ${
                                    isCurrent
                                      ? 'bg-cyan-500/20 border-cyan-400 ring-1 ring-cyan-400/60 shadow-sm'
                                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60'
                                  }`}
                                  title={cand.title}
                                >
                                  {cand.imageUrl ? (
                                    <img
                                      src={cand.imageUrl}
                                      alt={cand.title}
                                      className="w-12 h-16 object-contain rounded bg-slate-900 border border-slate-800 mb-1"
                                      loading="lazy"
                                    />
                                  ) : (
                                    <div className="w-12 h-16 rounded bg-slate-900 border border-slate-800 flex items-center justify-center mb-1 text-[9px] text-slate-500">
                                      Kartu
                                    </div>
                                  )}
                                  <span className="text-[9px] font-bold text-slate-200 line-clamp-1 w-full leading-tight">
                                    {cand.badge || cand.title.slice(0, 10)}
                                  </span>
                                  {cand.price && (
                                    <span className="text-[8px] font-extrabold text-cyan-400 truncate w-full mt-0.5">
                                      ¥{cand.price}~
                                    </span>
                                  )}
                                  {isCurrent && (
                                    <span className="mt-1 text-[7px] font-black uppercase tracking-wider text-slate-950 bg-cyan-400 px-1.5 py-0.5 rounded-full">
                                      Dipilih
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tabel 5 Transaksi Terakhir (Hanya 2 Kolom: Tanggal & Harga Terakhir Terjual) */}
                  {priceTransactions && priceTransactions.length > 0 && (
                    <div className="w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-900/90 shadow-sm">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-800 bg-slate-950/90 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            <th className="py-2.5 px-3">
                              {activeProvider === 'snkrdunk' ? 'Tanggal & Kondisi' : 'Tanggal'}
                            </th>
                            <th className="py-2.5 px-3 text-right">Harga Terakhir Terjual</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {priceTransactions.map((tx, idx) => (
                            <tr
                              key={idx}
                              onClick={() => handleApplyPrice(tx.priceIdr, idx)}
                              className={`transition-colors cursor-pointer group hover:bg-slate-800/60 ${
                                appliedTxIndex === idx ? 'bg-amber-500/20 text-amber-300' : 'text-slate-200'
                              }`}
                              title={
                                tx.title
                                  ? `${tx.title}\n• Klik baris ini untuk menerapkan harga ke kolom Harga Jual`
                                  : 'Klik baris ini untuk menerapkan harga ke kolom Harga Jual'
                              }
                            >
                              <td className="py-2.5 px-3 text-slate-400 group-hover:text-slate-200 font-medium whitespace-nowrap">
                                <div className="flex flex-col">
                                  <span className="flex items-center gap-1.5">
                                    <Clock className={`w-3 h-3 ${
                                      activeProvider === 'snkrdunk'
                                        ? 'text-cyan-500 group-hover:text-cyan-400'
                                        : activeProvider === 'pokepedia'
                                        ? 'text-emerald-500 group-hover:text-emerald-400'
                                        : 'text-slate-500 group-hover:text-amber-400'
                                    }`} />
                                    {tx.date}
                                  </span>
                                  {activeProvider === 'snkrdunk' && tx.title && (
                                    <span className="text-[10px] text-slate-500 group-hover:text-slate-400 pl-4.5">
                                      {tx.title}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-right font-bold whitespace-nowrap">
                                <div className="flex items-center justify-end gap-2">
                                  <div className="flex flex-col items-end">
                                    <span className={`font-black ${
                                      activeProvider === 'snkrdunk'
                                        ? 'text-cyan-400'
                                        : activeProvider === 'pokepedia'
                                        ? 'text-emerald-400'
                                        : 'text-amber-400'
                                    }`}>
                                      {tx.priceFormatted}
                                    </span>
                                    {tx.priceOrigFormatted ? (
                                      <span className="text-[10px] text-slate-400 font-normal">
                                        ({tx.priceOrigFormatted})
                                      </span>
                                    ) : typeof tx.priceUsd === 'number' ? (
                                      <span className="text-[10px] text-slate-400 font-normal">
                                        (${tx.priceUsd.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })})
                                      </span>
                                    ) : null}
                                  </div>
                                  {appliedTxIndex === idx ? (
                                    <span className="text-[10px] font-black text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-500/40">
                                      ✓ Digunakan
                                    </span>
                                  ) : (
                                    <span className="opacity-0 group-hover:opacity-100 text-[10px] font-bold text-slate-400 group-hover:text-amber-300 bg-slate-800 px-1.5 py-0.5 rounded transition-opacity">
                                      Gunakan
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="px-3 py-1.5 bg-slate-950/70 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>
                            {activeProvider === 'snkrdunk' ? (
                              <>
                                Kurs Google Finance:{' '}
                                <strong className="text-cyan-400 font-bold">
                                  1 JPY = Rp {priceExchangeRate?.formattedRate || '114.4'}
                                </strong>
                              </>
                            ) : activeProvider === 'pokepedia' ? (
                              <strong className="text-emerald-400 font-bold">
                                Mata Uang Langsung IDR (Pokepedia)
                              </strong>
                            ) : (
                              <>
                                Kurs Google Finance:{' '}
                                <strong className="text-emerald-400 font-bold">
                                  $1 = Rp {priceExchangeRate?.formattedRate || '18.109'}
                                </strong>
                              </>
                            )}
                          </span>
                        </span>
                        <span className="text-amber-400/90 font-medium">Klik baris untuk pasang harga</span>
                      </div>
                    </div>
                  )}

                  {/* Empty state: data penjualan tidak ditemukan */}
                  {priceTransactions && priceTransactions.length === 0 && !loadingPriceRef && (
                    <div className="w-full py-6 px-4 rounded-xl border border-slate-800 bg-slate-900/90 text-center flex flex-col items-center justify-center gap-1.5 shadow-sm">
                      <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-0.5">
                        <AlertCircle className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-amber-400">
                        data penjualan tidak ditemukan
                      </span>
                      <span className="text-[11px] text-slate-400 max-w-[280px] leading-relaxed">
                        {priceRefCondition
                          ? `Tidak ditemukan riwayat transaksi penjualan untuk kondisi "${priceRefCondition}" di ${providerLabel}.`
                          : `Tidak ditemukan riwayat transaksi penjualan untuk kartu ini di ${providerLabel}.`}
                      </span>
                      {priceRefMeta?.url && (
                        <a
                          href={priceRefMeta.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 text-[10px] text-cyan-400 hover:text-cyan-300 underline flex items-center gap-1 font-semibold"
                        >
                          <span>Lihat halaman resmi {providerLabel}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  )}

                  {!priceTransactions && !loadingPriceRef && !priceRefError && (
                    <p className="text-[11px] text-slate-400 text-center leading-relaxed py-1">
                      {providerEmptyHint}
                    </p>
                  )}
                </div>
              </div>

              {/* RIGHT COLUMN: Search + Details & Pricing Form (lg:col-span-7) */}
              <div className="contents lg:block lg:col-span-7 lg:space-y-5">
                {/* 1. Database Card Search Box with Progressive 3-Step Interactive Drilldown (Table 2: Order 2 di HP agar di atas Transaksi Terakhir) */}
                <div className="order-2 lg:order-none w-full bg-slate-950/80 border border-slate-800 rounded-3xl p-4 sm:p-5 space-y-4">
                  {/* LEVEL 1: Primary TCG Game Selector */}
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-blue-400" />
                        <span>Langkah 1: Pilih Jenis Kartu TCG</span>
                      </span>
                      {selectedGame && (
                        <button
                          type="button"
                          onClick={handleBackToGames}
                          className="text-[11px] text-slate-400 hover:text-amber-400 flex items-center gap-1 transition-colors px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-400/50 shadow-sm"
                          title="Reset / Ganti Game TCG"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Ganti Game</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5">
                      {/* Pokemon Game Tab */}
                      <button
                        type="button"
                        onClick={() => handleSelectGame('pokemon')}
                        title="Pokémon"
                        className={`group relative flex items-center justify-center h-16 sm:h-20 md:h-22 p-2 sm:p-2.5 rounded-2xl transition-all border overflow-hidden cursor-pointer ${
                          selectedGame === 'pokemon'
                            ? 'bg-gradient-to-r from-red-600/90 to-amber-500/90 text-white border-amber-400 shadow-lg shadow-red-600/30 ring-2 ring-amber-400/40 scale-[1.02]'
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
                        onClick={() => handleSelectGame('riftbound')}
                        title="Riftbound"
                        className={`group relative flex items-center justify-center h-16 sm:h-20 md:h-22 p-2 sm:p-2.5 rounded-2xl transition-all border overflow-hidden cursor-pointer ${
                          selectedGame === 'riftbound'
                            ? 'bg-gradient-to-r from-cyan-600/90 to-blue-600/90 text-white border-cyan-400 shadow-lg shadow-cyan-600/30 ring-2 ring-cyan-400/40 scale-[1.02]'
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
                        onClick={() => handleSelectGame('onepiece')}
                        title="One Piece"
                        className={`group relative flex items-center justify-center h-16 sm:h-20 md:h-22 p-2 sm:p-2.5 rounded-2xl transition-all border overflow-hidden cursor-pointer ${
                          selectedGame === 'onepiece'
                            ? 'bg-gradient-to-r from-rose-600/90 to-red-600/90 text-white border-rose-400 shadow-lg shadow-rose-600/30 ring-2 ring-rose-400/40 scale-[1.02]'
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

                    {!selectedGame && (
                      <div className="mt-3 py-3 px-4 rounded-2xl bg-slate-900/40 border border-slate-800/70 text-center text-xs text-slate-400 flex items-center justify-center gap-2 animate-fadeInUp">
                        <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                        <span>Pilih salah satu game TCG di atas untuk mencari data kartu resmi</span>
                      </div>
                    )}
                  </div>

                  {/* LEVEL 2: Sub-Menu / Language Selection (Step 2) */}
                  {selectedGame !== null && (
                    <div
                      className={`space-y-3 pt-3 border-t border-slate-800/80 ${
                        isExitingStep === 'step2' ? 'animate-fadeOutDown' : 'animate-fadeInUp'
                      }`}
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-emerald-400" />
                          <span>
                            Langkah 2: Pilih Bahasa / Kategori ({selectedGame === 'pokemon' ? 'Pokémon' : selectedGame === 'onepiece' ? 'One Piece' : 'Riftbound'})
                          </span>
                        </span>

                        <button
                          type="button"
                          onClick={handleBackToGames}
                          className="text-[11px] text-slate-400 hover:text-amber-400 flex items-center gap-1 transition-colors px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-400/50 shadow-sm"
                        >
                          <ArrowLeft className="w-3 h-3" />
                          <span>Kembali ke Pilihan Game</span>
                        </button>
                      </div>

                      {/* Pokemon Sub-tabs */}
                      {selectedGame === 'pokemon' && (
                        <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-2xl border border-slate-800/90 flex-wrap">
                          <button
                            type="button"
                            onClick={() => handleSelectPokemonSource('tcgdex')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                              pokemonSource === 'tcgdex'
                                ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400/50'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                            }`}
                          >
                            <Globe className="w-3.5 h-3.5" />
                            <span>Inggris (43.000+)</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSelectPokemonSource('localid')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                              pokemonSource === 'localid'
                                ? 'bg-red-600 text-white shadow-sm ring-1 ring-red-400/50'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                            }`}
                          >
                            <span className="text-sm leading-none">🇮🇩</span>
                            <span>Indonesia (18.000+ HD)</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSelectPokemonSource('localjp')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                              pokemonSource === 'localjp'
                                ? 'bg-purple-600 text-white shadow-sm ring-1 ring-purple-400/50'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                            }`}
                          >
                            <span className="text-sm leading-none">🇯🇵</span>
                            <span>Jepang (51.000+)</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSelectPokemonSource('localcn')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                              pokemonSource === 'localcn'
                                ? 'bg-rose-600 text-white shadow-sm ring-1 ring-rose-400/50'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                            }`}
                          >
                            <span className="text-sm leading-none">🇨🇳</span>
                            <span>China (13.600+ HD)</span>
                          </button>
                        </div>
                      )}

                      {/* One Piece Sub-tabs */}
                      {selectedGame === 'onepiece' && (
                        <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-2xl border border-slate-800/90 flex-wrap">
                          <button
                            type="button"
                            onClick={() => handleSelectOnePieceLang('EN')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                              onePieceLang === 'EN'
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm ring-1 ring-blue-400/50'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                            }`}
                          >
                            <Globe className="w-3.5 h-3.5" />
                            <span>Inggris (EN)</span>
                            <span className="text-[10px] opacity-80 font-mono">4.940+</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSelectOnePieceLang('JP')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                              onePieceLang === 'JP'
                                ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-sm ring-1 ring-rose-400/50'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                            }`}
                          >
                            <span className="text-sm leading-none">🇯🇵</span>
                            <span>Jepang (JP)</span>
                            <span className="text-[10px] opacity-80 font-mono">5.110+</span>
                          </button>
                        </div>
                      )}

                      {/* Riftbound Sub-tabs */}
                      {selectedGame === 'riftbound' && (
                        <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-2xl border border-slate-800/90 flex-wrap">
                          <button
                            type="button"
                            onClick={handleSelectRiftboundLang}
                            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                              riftboundLang === 'EN'
                                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-sm ring-1 ring-cyan-400/50'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                            }`}
                          >
                            <Globe className="w-3.5 h-3.5" />
                            <span>Bahasa Inggris / Global (1.400+ Kartu)</span>
                          </button>
                        </div>
                      )}

                      {!isLanguageSelected && (
                        <div className="py-2.5 px-3.5 rounded-2xl bg-slate-900/40 border border-slate-800/60 text-center text-xs text-slate-400 flex items-center justify-center gap-2 animate-fadeInUp">
                          <Search className="w-3.5 h-3.5 text-blue-400" />
                          <span>Pilih bahasa kartu di atas untuk membuka kolom pencarian kartu</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* LEVEL 3: Search Column, Filters & Results Grid (Step 3) */}
                  {selectedGame !== null && isLanguageSelected && (
                    <div
                      className={`space-y-3 pt-3 border-t border-slate-800/80 ${
                        isExitingStep === 'step3' ? 'animate-fadeOutDown' : 'animate-fadeInUp'
                      }`}
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <Search className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Langkah 3: Cari & Pilih Kartu</span>
                        </span>

                        <button
                          type="button"
                          onClick={handleBackToLanguage}
                          className="text-[11px] text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition-colors px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-400/50 shadow-sm"
                        >
                          <ArrowLeft className="w-3 h-3" />
                          <span>Kembali ke Pilihan Bahasa</span>
                        </button>
                      </div>

                      {/* --- SUB-VIEW: POKEMON --- */}
                      {selectedGame === 'pokemon' && (
                        <div className="space-y-3">
                          {/* English Pokémon (20,600+ Local Instant Database) */}
                          {pokemonSource === 'tcgdex' && (
                            <div className="space-y-2.5">
                              {/* Sets dropdown */}
                              <div className="relative">
                                <ChevronDown className="w-4 h-4 absolute right-3.5 top-3 text-slate-400 pointer-events-none" />
                                <select
                                  value={enSet}
                                  onChange={(e) => {
                                    setEnSet(e.target.value);
                                    setEnPage(1);
                                  }}
                                  className="w-full pl-3.5 pr-10 py-2.5 bg-slate-900 border border-slate-700/80 rounded-2xl text-xs text-white focus:outline-none focus:border-blue-500 appearance-none shadow-inner"
                                >
                                  <option value="">— Semua Seri / Set Inggris (176 Set Resmi) —</option>
                                  {enSets.map((s) => (
                                    <option key={s.id} value={s.id}>
                                      {s.name} ({s.total} kartu)
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* Search input */}
                              <div className="relative">
                                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                                <input
                                  type="text"
                                  placeholder="Cari nama Inggris / nomor / nickname (contoh: Moonbreon, Charizard 151, 199/165)..."
                                  value={enQuery}
                                  onChange={(e) => {
                                    setEnQuery(e.target.value);
                                    setEnPage(1);
                                  }}
                                  className="w-full pl-10 pr-10 py-2.5 bg-slate-900 border border-slate-700/80 rounded-2xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 shadow-inner"
                                />
                                {(enSearching || enFetchingCard) && (
                                  <Loader2 className="w-4 h-4 absolute right-3.5 top-3 text-blue-400 animate-spin" />
                                )}
                              </div>

                              {/* Info & Pagination Bar */}
                              <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-blue-950/40 border border-blue-500/20 rounded-xl text-blue-200 text-xs">
                                <div className="flex items-center gap-1.5 truncate">
                                  <Globe className="w-3.5 h-3.5 flex-shrink-0 text-blue-400" />
                                  <span className="text-[11px] truncate">
                                    {enTotal > 0 ? (
                                      <>Ditemukan <b>{enTotal.toLocaleString()}</b> kartu Inggris</>
                                    ) : (
                                      '20.600+ database lokal Pokémon EN instant & offline'
                                    )}
                                  </span>
                                </div>
                                {enTotalPages > 1 && (
                                  <div className="flex items-center gap-1.5 flex-shrink-0 text-[11px]">
                                    <button
                                      type="button"
                                      disabled={enPage <= 1}
                                      onClick={() => setEnPage((p) => Math.max(1, p - 1))}
                                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-white font-medium"
                                    >
                                      &larr; Prev
                                    </button>
                                    <span className="text-slate-400 font-medium">
                                      {enPage} / {enTotalPages}
                                    </span>
                                    <button
                                      type="button"
                                      disabled={enPage >= enTotalPages}
                                      onClick={() => setEnPage((p) => Math.min(enTotalPages, p + 1))}
                                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-white font-medium"
                                    >
                                      Next &rarr;
                                    </button>
                                  </div>
                                )}
                              </div>

                              {/* Results Grid */}
                              {enResults.length > 0 && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
                                  {enResults.map((card, idx) => (
                                    <button
                                      key={`localen-${card.id || idx}-${idx}`}
                                      type="button"
                                      disabled={enFetchingCard}
                                      onClick={() => handleSelectLocalEnCard(card)}
                                      className="p-2 rounded-2xl bg-slate-900 hover:bg-slate-800/90 border border-slate-800 hover:border-blue-500/60 flex items-center gap-2.5 text-left transition-all group shadow hover:shadow-blue-500/10 cursor-pointer"
                                    >
                                      {card.imageUrl ? (
                                        <img
                                          src={card.imageUrl}
                                          alt=""
                                          className="w-10 h-14 object-contain rounded-lg bg-slate-950 shadow flex-shrink-0 group-hover:scale-105 transition-transform"
                                        />
                                      ) : (
                                        <div className="w-10 h-14 bg-slate-800 rounded-lg flex items-center justify-center text-[9px] text-slate-500 flex-shrink-0">
                                          EN
                                        </div>
                                      )}
                                      <div className="min-w-0 flex-1">
                                        <div className="text-xs font-black text-white group-hover:text-blue-300 truncate">
                                          {card.name}
                                        </div>
                                        <div className="text-[11px] text-slate-400 truncate mt-0.5">
                                          {card.formattedNumber || `#${card.number}`}
                                        </div>
                                        <div className="text-[10px] text-blue-400/80 font-bold truncate">
                                          {card.setName}
                                        </div>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              )}

                              {!enSearching && enResults.length === 0 && (enQuery.trim().length > 0 || enSet) && (
                                <div className="text-center text-xs text-slate-400 py-3">
                                  Tidak ada kartu Pokémon Inggris ditemukan untuk &quot;{enQuery || enSet}&quot;.
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
                                      className="p-2 rounded-2xl bg-slate-900 hover:bg-slate-800/90 border border-slate-800 hover:border-red-500/60 flex items-center gap-2.5 text-left transition-all group shadow hover:shadow-red-500/10 cursor-pointer"
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
                                      className="p-2 rounded-2xl bg-slate-900 hover:bg-slate-800/90 border border-slate-800 hover:border-purple-500/60 flex items-center gap-2.5 text-left transition-all group shadow hover:shadow-purple-500/10 cursor-pointer"
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
                                          {formatCardDisplayName(card.name, card.collectorNumber, card.expansion, 'pokemon')}
                                        </div>
                                        {formatCardDisplayName(card.name, card.collectorNumber, card.expansion, 'pokemon') !== card.name && (
                                          <div className="text-[10px] text-slate-400 truncate">
                                            {card.name}
                                          </div>
                                        )}
                                        <div className="text-[11px] text-slate-400 truncate mt-0.5">
                                          {card.collectorNumber ? `#${card.collectorNumber}` : card.category}
                                        </div>
                                        <div className="text-[10px] text-purple-400/80 font-bold truncate">
                                          {translateCardSet(card.expansion, card.collectorNumber, 'pokemon')}
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

                          {/* Chinese Pokemon Card Search View */}
                          {pokemonSource === 'localcn' && (
                            <div className="space-y-3">
                              {/* Set Selector Dropdown */}
                              <div className="relative">
                                <ChevronDown className="w-4 h-4 absolute right-3.5 top-3 text-slate-400 pointer-events-none" />
                                <select
                                  value={cnSet}
                                  onChange={(e) => {
                                    setCnSet(e.target.value);
                                    setCnPage(1);
                                  }}
                                  className="w-full pl-3.5 pr-10 py-2.5 bg-slate-900 border border-slate-700/80 rounded-2xl text-xs text-white focus:outline-none focus:border-rose-500 appearance-none shadow-inner"
                                >
                                  <option value="">— Semua Set China ({cnSets.length || 147} Set) —</option>
                                  {cnSets.map((s) => (
                                    <option key={s.id} value={s.id}>
                                      {s.name} ({s.count} kartu)
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* Search Input */}
                              <div className="relative">
                                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                                <input
                                  type="text"
                                  placeholder="Cari kartu Pokémon China (contoh: Pikachu, Charizard, 001/086, Secret Rare)..."
                                  value={cnQuery}
                                  onChange={(e) => {
                                    setCnQuery(e.target.value);
                                    setCnPage(1);
                                  }}
                                  className="w-full pl-10 pr-10 py-2.5 bg-slate-900 border border-slate-700/80 rounded-2xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 shadow-inner"
                                />
                                {cnSearching && (
                                  <Loader2 className="w-4 h-4 absolute right-3.5 top-3 text-rose-400 animate-spin" />
                                )}
                              </div>

                              {/* Info & Result count / Pagination */}
                              <div className="flex items-center justify-between text-xs px-1 text-slate-400">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-sm">🇨🇳</span>
                                  <span className="text-[11px]">
                                    {cnSearching ? (
                                      'Sedang mencari kartu China...'
                                    ) : (
                                      <>
                                        Ditemukan <strong className="text-white">{cnTotal.toLocaleString()}</strong> kartu Pokémon China
                                      </>
                                    )}
                                  </span>
                                </div>

                                {cnTotalPages > 1 && (
                                  <div className="flex items-center gap-1.5 text-[11px]">
                                    <button
                                      type="button"
                                      onClick={() => setCnPage((p) => Math.max(1, p - 1))}
                                      disabled={cnPage <= 1 || cnSearching}
                                      className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white font-bold cursor-pointer"
                                    >
                                      &larr; Prev
                                    </button>
                                    <span className="font-mono text-slate-300">
                                      {cnPage}/{cnTotalPages}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => setCnPage((p) => Math.min(cnTotalPages, p + 1))}
                                      disabled={cnPage >= cnTotalPages || cnSearching}
                                      className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white font-bold cursor-pointer"
                                    >
                                      Next &rarr;
                                    </button>
                                  </div>
                                )}
                              </div>

                              {/* Results Grid */}
                              {cnResults.length > 0 && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto pr-1">
                                  {cnResults.map((card, idx) => (
                                    <button
                                      key={`cn-${card.id || idx}-${idx}`}
                                      type="button"
                                      disabled={cnSearching || cnFetchingCard}
                                      onClick={() => handleSelectLocalCnCard(card)}
                                      className="p-2 rounded-2xl bg-slate-900 hover:bg-slate-800/90 border border-slate-800 hover:border-rose-500/60 flex items-center gap-2.5 text-left transition-all group shadow hover:shadow-rose-500/10 cursor-pointer"
                                    >
                                      {card.imageUrl ? (
                                        <img
                                          src={formatCardImageUrl(card.imageUrl)}
                                          alt=""
                                          className="w-10 h-14 object-contain rounded-lg bg-slate-950 shadow flex-shrink-0 group-hover:scale-105 transition-transform"
                                          style={{ imageRendering: '-webkit-optimize-contrast' }}
                                        />
                                      ) : (
                                        <div className="w-10 h-14 bg-slate-800 rounded-lg flex items-center justify-center text-[9px] font-bold text-rose-400 flex-shrink-0">
                                          CN
                                        </div>
                                      )}
                                      <div className="min-w-0 flex-1">
                                        <div className="text-xs font-black text-white group-hover:text-rose-300 truncate">
                                          {card.chineseName ? `${card.chineseName} (${card.name})` : card.name}
                                        </div>
                                        <div className="text-[11px] text-slate-400 truncate mt-0.5">
                                          {card.number ? `#${card.number}` : ''} {card.rarity ? `• ${card.rarity}` : ''}
                                        </div>
                                        <div className="text-[10px] text-rose-400/80 font-bold truncate">
                                          {card.setName}
                                        </div>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              )}

                              {!cnSearching && cnResults.length === 0 && (cnQuery.trim().length > 0 || cnSet) && (
                                <div className="text-center text-xs text-slate-400 py-4">
                                  Tidak ada kartu ditemukan untuk pencarian ini.
                                </div>
                              )}
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

                      {/* --- SUB-VIEW: RIFTBOUND TCG SEARCH --- */}
                      {selectedGame === 'riftbound' && riftboundLang === 'EN' && (
                        <div className="space-y-3">
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
                                  className="p-2 rounded-2xl bg-slate-900 hover:bg-slate-800/90 border border-slate-800 hover:border-cyan-500/60 flex items-center gap-2.5 text-left transition-all group shadow hover:shadow-cyan-500/10 cursor-pointer"
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

                      {/* --- SUB-VIEW: ONE PIECE SEARCH --- */}
                      {selectedGame === 'onepiece' && onePieceLang && (
                        <div className="space-y-3">
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
                                  className="p-2 rounded-2xl bg-slate-900 hover:bg-slate-800/90 border border-slate-800 hover:border-rose-500/60 flex items-center gap-2.5 text-left transition-all group shadow hover:shadow-rose-500/10 cursor-pointer"
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
                                      {formatCardDisplayName(card.name, card.cardNumber, card.cardSet, 'onepiece')}
                                    </div>
                                    {formatCardDisplayName(card.name, card.cardNumber, card.cardSet, 'onepiece') !== card.name && (
                                      <div className="text-[10px] text-slate-400 truncate">
                                        {card.name}
                                      </div>
                                    )}
                                    <div className="text-[11px] text-slate-400 truncate mt-0.5">
                                      {card.cardNumber} • <span className="font-semibold text-rose-400">{card.rarity}</span>
                                    </div>
                                    <div className="text-[10px] text-amber-400/90 font-bold truncate">
                                      {card.category} {card.color ? `• ${card.color}` : ''}
                                    </div>
                                    <div className="text-[9px] text-slate-500 truncate">
                                      {translateCardSet(card.cardSet, card.cardNumber, 'onepiece')}
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
                  )}
                </div>

                {/* 2. Main Edit Form (Order 4 di HP) */}
                <form onSubmit={handleSave} className="order-4 lg:order-none w-full space-y-4">
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
                          Harga Jual <span className="text-red-400">*</span>
                        </label>
                        <div className="relative flex items-center">
                          <input
                            type="text"
                            inputMode="numeric"
                            required
                            value={price > 0 ? formatRupiahInput(price) : 'Rp '}
                            onChange={(e) => setPrice(parseRupiahInput(e.target.value))}
                            onFocus={(e) => {
                              if (e.target.value === 'Rp ') {
                                e.target.setSelectionRange(3, 3);
                              }
                            }}
                            placeholder="Rp "
                            className="w-full pl-3.5 pr-10 py-2.5 bg-slate-900 border-2 border-amber-500/60 rounded-2xl text-base sm:text-lg font-black text-amber-300 focus:outline-none focus:border-amber-400 shadow-inner"
                          />
                          {price > 0 && (
                            <button
                              type="button"
                              onClick={() => setPrice(0)}
                              className="absolute right-3 p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Reset harga jual ke Rp "
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Cost / Modal Price (Seller Only) */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-bold text-slate-300">
                            Harga Modal
                          </label>
                        </div>
                        <div className="relative flex items-center">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={originalPrice && originalPrice > 0 ? formatRupiahInput(originalPrice) : 'Rp '}
                            onChange={(e) => {
                              const val = parseRupiahInput(e.target.value);
                              setOriginalPrice(val > 0 ? val : undefined);
                            }}
                            onFocus={(e) => {
                              if (e.target.value === 'Rp ') {
                                e.target.setSelectionRange(3, 3);
                              }
                            }}
                            placeholder="Rp "
                            className="w-full pl-3.5 pr-10 py-2.5 bg-slate-900 border border-slate-700 rounded-2xl text-base sm:text-lg font-black text-slate-200 focus:outline-none focus:border-blue-500 shadow-inner"
                          />
                          {Boolean(originalPrice && originalPrice > 0) && (
                            <button
                              type="button"
                              onClick={() => setOriginalPrice(undefined)}
                              className="absolute right-3 p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Reset harga modal ke Rp "
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 italic block mt-1.5">
                          *Harga modal hanya dapat dilihat oleh seller
                        </span>
                      </div>
                    </div>

                    {/* Status Pill Selector (Available & Reserved Only) */}
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-2">
                        Status Ketersediaan di Meja
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setStatus('AVAILABLE')}
                          className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl text-xs font-black transition-all border cursor-pointer ${
                            status === 'AVAILABLE'
                              ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-600/30 ring-2 ring-emerald-500/30'
                              : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          <Check className="w-4 h-4 flex-shrink-0" />
                          <span>AVAILABLE</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setStatus('RESERVED')}
                          className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl text-xs font-black transition-all border cursor-pointer ${
                            status === 'RESERVED'
                              ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-md shadow-amber-500/30 ring-2 ring-amber-500/30'
                              : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          <Clock className="w-4 h-4 flex-shrink-0" />
                          <span>RESERVED</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Card Metadata Section */}
                  <div className="p-4 sm:p-5 bg-slate-950/60 border border-slate-800 rounded-3xl space-y-3">
                    <span className="text-xs font-black uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      Detail Informasi Kartu
                    </span>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">
                        Catatan Penjual (Deskripsi, status card, swirl holo, dll.)
                      </label>
                      <input
                        type="text"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="misal: Unit • Domain Fury • Might 5 / Pack Fresh / Swirl Holo"
                        className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-2xl text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500 shadow-inner"
                      />
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
                        disabled={saving || tcgdexFetchingCard || enFetchingCard}
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
