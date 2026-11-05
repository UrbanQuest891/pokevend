/**
 * onepieceCards.ts
 * Reads, caches, and searches official One Piece Card Game (OPCG) databases:
 * - English (EN): ~4,940 cards from one_piece_cards_en.csv
 * - Japanese (JP): ~5,110 cards from one_piece_cards_jp.csv
 *
 * This module is SERVER-ONLY (uses fs/path).
 */

import fs from 'fs';
import path from 'path';
import { formatCardImageUrl } from './imageHelper';

export interface OnePieceCard {
  id: string;
  cardNumber: string;
  name: string;
  rarity: string;
  category: string;
  costLife: string;
  attribute: string;
  power: string;
  counter: string;
  color: string;
  blockIcon: string;
  type: string;
  effect: string;
  trigger: string;
  cardSet: string;
  seriesId: string;
  seriesName: string;
  imageUrl: string;
  lang: 'EN' | 'JP';
}

export interface OnePieceCardSummary {
  id: string;
  cardNumber: string;
  name: string;
  rarity: string;
  category: string;
  costLife: string;
  attribute: string;
  power: string;
  counter: string;
  color: string;
  type: string;
  cardSet: string;
  imageUrl: string;
  lang: 'EN' | 'JP';
}

export interface OnePieceSetInfo {
  name: string;
  count: number;
}

// ---------- CSV Parser ----------

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let inQuotes = false;
  let current = '';

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      row.push(current.trim());
      current = '';
    } else if ((ch === '\r' || ch === '\n') && !inQuotes) {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(current.trim());
      if (row.length > 1 || (row.length === 1 && row[0] !== '')) {
        rows.push(row);
      }
      row = [];
      current = '';
    } else {
      current += ch;
    }
  }
  if (current || row.length > 0) {
    row.push(current.trim());
    rows.push(row);
  }
  return rows;
}

// ---------- In-Memory Caches ----------

let _cacheEN: OnePieceCard[] | null = null;
let _cacheJP: OnePieceCard[] | null = null;

export function loadOnePieceCards(lang: 'EN' | 'JP'): OnePieceCard[] {
  if (lang === 'EN' && _cacheEN) return _cacheEN;
  if (lang === 'JP' && _cacheJP) return _cacheJP;

  const fileName = lang === 'EN' ? 'one_piece_cards_en.csv' : 'one_piece_cards_jp.csv';
  const csvPath = path.join(process.cwd(), 'data', fileName);

  if (!fs.existsSync(csvPath)) {
    console.warn(`[onepieceCards] CSV not found at ${csvPath}`);
    return [];
  }

  let raw = fs.readFileSync(csvPath, 'utf-8');
  // Strip UTF-8 BOM if present
  if (raw.charCodeAt(0) === 0xFEFF) {
    raw = raw.slice(1);
  }

  const rows = parseCsv(raw);
  if (rows.length < 2) return [];

  const headers = rows[0].map((h) =>
    h.replace(/^\uFEFF/, '').replace(/^["']|["']$/g, '').trim()
  );

  const seenIds = new Set<string>();
  const cards: OnePieceCard[] = [];

  for (let i = 1; i < rows.length; i++) {
    const cols = rows[i];
    if (cols.length < headers.length) continue;

    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      obj[h] = (cols[idx] ?? '').trim();
    });

    if (!obj.name && !obj.cardNumber) continue;

    // Generate unique ID based on image key or card number
    const imgMatch = (obj.imageUrl || '').match(/\/([^\/?#]+)\.(png|jpg|webp)$/i);
    const imgKey = imgMatch ? imgMatch[1] : `${obj.cardNumber || 'card'}-${i}`;
    let uniqueId = `op-${lang.toLowerCase()}-${imgKey}`;
    if (seenIds.has(uniqueId)) {
      uniqueId = `${uniqueId}-${i}`;
    }
    seenIds.add(uniqueId);

    cards.push({
      id: uniqueId,
      cardNumber: obj.cardNumber || '',
      name: obj.name || '',
      rarity: obj.rarity || '',
      category: obj.category || '',
      costLife: obj.costLife || '',
      attribute: obj.attribute || '',
      power: obj.power || '',
      counter: obj.counter || '',
      color: obj.color || '',
      blockIcon: obj.blockIcon || '',
      type: obj.type || '',
      effect: obj.effect || '',
      trigger: obj.trigger || '',
      cardSet: obj.cardSet || '',
      seriesId: obj.seriesId || '',
      seriesName: obj.seriesName || '',
      imageUrl: formatCardImageUrl(obj.imageUrl || ''),
      lang,
    });
  }

  if (lang === 'EN') _cacheEN = cards;
  else _cacheJP = cards;

  return cards;
}

// ---------- Search & Filtering ----------

export interface SearchOnePieceParams {
  query?: string;
  lang?: 'EN' | 'JP';
  set?: string;
  page?: number;
  limit?: number;
}

export function searchOnePieceCards({
  query = '',
  lang = 'EN',
  set = '',
  page = 1,
  limit = 24,
}: SearchOnePieceParams): {
  cards: OnePieceCardSummary[];
  total: number;
  page: number;
  totalPages: number;
} {
  const cards = loadOnePieceCards(lang);
  const q = query.toLowerCase().trim();
  const setFilter = set.toLowerCase().trim();

  let filtered = cards;

  if (setFilter) {
    filtered = filtered.filter(
      (c) =>
        c.cardSet.toLowerCase().includes(setFilter) ||
        c.seriesName.toLowerCase().includes(setFilter)
    );
  }

  if (q) {
    filtered = filtered.filter((c) => {
      return (
        c.name.toLowerCase().includes(q) ||
        c.cardNumber.toLowerCase().includes(q) ||
        c.cardSet.toLowerCase().includes(q) ||
        c.rarity.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.color.toLowerCase().includes(q) ||
        c.type.toLowerCase().includes(q) ||
        c.attribute.toLowerCase().includes(q)
      );
    });
  }

  const total = filtered.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const start = (page - 1) * limit;
  const paginated = filtered.slice(start, start + limit).map(toSummary);

  return {
    cards: paginated,
    total,
    page,
    totalPages,
  };
}

export function getOnePieceCardById(
  id: string,
  lang?: 'EN' | 'JP'
): OnePieceCard | null {
  if (lang) {
    const list = loadOnePieceCards(lang);
    return list.find((c) => c.id === id) || null;
  }
  // Try both
  const en = loadOnePieceCards('EN');
  const foundEn = en.find((c) => c.id === id);
  if (foundEn) return foundEn;

  const jp = loadOnePieceCards('JP');
  return jp.find((c) => c.id === id) || null;
}

export function getOnePieceSets(lang: 'EN' | 'JP'): OnePieceSetInfo[] {
  const cards = loadOnePieceCards(lang);
  const counts: Record<string, number> = {};

  for (const c of cards) {
    const s = c.cardSet || c.seriesName;
    if (!s) continue;
    counts[s] = (counts[s] || 0) + 1;
  }

  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

function toSummary(c: OnePieceCard): OnePieceCardSummary {
  return {
    id: c.id,
    cardNumber: c.cardNumber,
    name: c.name,
    rarity: c.rarity,
    category: c.category,
    costLife: c.costLife,
    attribute: c.attribute,
    power: c.power,
    counter: c.counter,
    color: c.color,
    type: c.type,
    cardSet: c.cardSet,
    imageUrl: c.imageUrl,
    lang: c.lang,
  };
}
