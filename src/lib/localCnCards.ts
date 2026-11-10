/**
 * localCnCards.ts
 * High-performance, server-only database loader and search engine
 * for Simplified Chinese (CN) Pokémon cards (13,600+ cards across 147 sets).
 *
 * Scraped and synchronized from TCGCollector official CN database.
 */

import fs from 'fs';
import path from 'path';
import { formatCardImageUrl } from './imageHelper';

export interface LocalCnCard {
  id: string;
  name: string;
  fullName: string;
  number: string;
  rarity: string;
  cardSlug?: string;
  detailUrl?: string;
  imageUrl: string;
  setId: string;
  setName: string;
  setSymbolUrl?: string;
  language: string;
}

export interface LocalCnCardSummary {
  id: string;
  name: string;
  fullName: string;
  number: string;
  rarity: string;
  imageUrl: string;
  setId: string;
  setName: string;
  setSymbolUrl?: string;
  language: string;
}

export interface LocalCnSetInfo {
  id: string;
  slug?: string;
  name: string;
  url?: string;
  symbolUrl?: string;
  count: number;
}

// In-memory cache
let _cachedCards: LocalCnCard[] | null = null;
let _cachedSets: LocalCnSetInfo[] | null = null;

export function loadLocalCnCards(): LocalCnCard[] {
  if (_cachedCards) return _cachedCards;

  const jsonPath = path.join(process.cwd(), 'data', 'pokemon_cards_cn.json');
  if (!fs.existsSync(jsonPath)) {
    console.warn(`[localCnCards] File not found at ${jsonPath}`);
    return [];
  }

  try {
    const raw = fs.readFileSync(jsonPath, 'utf-8');
    const cards: LocalCnCard[] = JSON.parse(raw);
    _cachedCards = cards.map((c) => ({
      ...c,
      imageUrl: formatCardImageUrl(c.imageUrl),
    }));
    return _cachedCards;
  } catch (err) {
    console.error('[localCnCards] Failed to load pokemon_cards_cn.json:', err);
    return [];
  }
}

export function loadLocalCnSets(): LocalCnSetInfo[] {
  if (_cachedSets) return _cachedSets;

  const setsPath = path.join(process.cwd(), 'data', 'pokemon_sets_cn.json');
  if (!fs.existsSync(setsPath)) {
    console.warn(`[localCnCards] Sets file not found at ${setsPath}`);
    return [];
  }

  try {
    const raw = fs.readFileSync(setsPath, 'utf-8');
    const setsData: any[] = JSON.parse(raw);
    const cards = loadLocalCnCards();

    // Compute card count per set
    const counts: Record<string, number> = {};
    for (const c of cards) {
      counts[c.setId] = (counts[c.setId] || 0) + 1;
    }

    _cachedSets = setsData.map((s) => ({
      id: String(s.id),
      slug: s.slug,
      name: s.name,
      url: s.url,
      symbolUrl: s.symbolUrl,
      count: counts[String(s.id)] || 0,
    }));

    return _cachedSets;
  } catch (err) {
    console.error('[localCnCards] Failed to load pokemon_sets_cn.json:', err);
    return [];
  }
}

export interface SearchCnCardsResult {
  cards: LocalCnCardSummary[];
  total: number;
  page: number;
  totalPages: number;
}

export function searchLocalCnCards(
  query = '',
  setFilter = '',
  page = 1,
  limit = 24
): SearchCnCardsResult {
  const cards = loadLocalCnCards();
  const q = query.trim().toLowerCase();
  const set = setFilter.trim().toLowerCase();

  let filtered = cards;

  // 1. Filter by Set (by setId or setName)
  if (set) {
    filtered = filtered.filter(
      (c) =>
        c.setId.toLowerCase() === set ||
        c.setName.toLowerCase() === set ||
        c.setName.toLowerCase().includes(set)
    );
  }

  // 2. Filter by search query
  if (q) {
    const qTokens = q.split(/\s+/).filter(Boolean);
    filtered = filtered.filter((c) => {
      const name = c.name.toLowerCase();
      const fullName = (c.fullName || '').toLowerCase();
      const num = (c.number || '').toLowerCase();
      const rarity = (c.rarity || '').toLowerCase();
      const setName = (c.setName || '').toLowerCase();

      return qTokens.every(
        (tok) =>
          name.includes(tok) ||
          fullName.includes(tok) ||
          num.includes(tok) ||
          rarity.includes(tok) ||
          setName.includes(tok)
      );
    });
  }

  const total = filtered.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const clampedPage = Math.min(Math.max(1, page), totalPages);
  const start = (clampedPage - 1) * limit;

  const paginated = filtered.slice(start, start + limit).map(toSummary);

  return {
    cards: paginated,
    total,
    page: clampedPage,
    totalPages,
  };
}

export function getLocalCnCardById(id: string): LocalCnCard | null {
  const cards = loadLocalCnCards();
  return cards.find((c) => c.id === id) || null;
}

function toSummary(c: LocalCnCard): LocalCnCardSummary {
  return {
    id: c.id,
    name: c.name,
    fullName: c.fullName,
    number: c.number,
    rarity: c.rarity,
    imageUrl: c.imageUrl,
    setId: c.setId,
    setName: c.setName,
    setSymbolUrl: c.setSymbolUrl,
    language: c.language,
  };
}
