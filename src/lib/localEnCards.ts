/**
 * localEnCards.ts
 * High-performance, server-only database loader and search engine
 * for official English Pokémon cards (20,600+ cards across 176 sets).
 *
 * Scraped and synchronized from official Pokémon TCG card data.
 */

import fs from 'fs';
import path from 'path';
import { formatCardImageUrl } from './imageHelper';

export interface LocalEnCard {
  id: string;
  name: string;
  supertype: string;
  subtypes: string;
  hp: string;
  types: string;
  evolvesFrom: string;
  abilities: string;
  attacks: string;
  weaknesses: string;
  resistances: string;
  retreatCost: string;
  number: string;
  artist: string;
  rarity: string;
  flavorText: string;
  nationalPokedexNumbers: string;
  regulationMark: string;
  setId: string;
  setName: string;
  series: string;
  releaseDate: string;
  imageUrl: string;
  smallImageUrl: string;
  tcgplayerPrice: string;
  tcgplayerUrl: string;
  formattedNumber: string;
}

export interface LocalEnCardSummary {
  id: string;
  name: string;
  supertype: string;
  subtypes: string;
  hp: string;
  types: string;
  number: string;
  formattedNumber: string;
  rarity: string;
  setId: string;
  setName: string;
  series: string;
  releaseDate: string;
  imageUrl: string;
  smallImageUrl: string;
}

export interface LocalEnSetInfo {
  id: string;
  name: string;
  series: string;
  total: number;
  printedTotal?: number;
  releaseDate: string;
  logoUrl?: string;
  symbolUrl?: string;
}

// Popular English nicknames & abbreviations
const NICKNAMES: Record<string, string> = {
  moonbreon: 'umbreon vmax 215',
  bubblegum: 'mew vmax 269',
  giratinaalt: 'giratina v 186',
  rayquazaalt: 'rayquaza vmax 218',
  gengaralt: 'gengar vmax 271',
  'van gogh': 'pikachu 085',
  'grey felt hat': 'pikachu 085',
  zard: 'charizard',
  lugiaalt: 'lugia v 186',
  machampalt: 'machamp v 172',
  blazikenalt: 'blaziken vmax 201',
};

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
    if (row.some((c) => c.length > 0)) {
      rows.push(row);
    }
  }
  return rows;
}

// ---------- Loader & In-Memory Cache ----------

let _cardsCache: LocalEnCard[] | null = null;
let _setsCache: LocalEnSetInfo[] | null = null;
let _cardsById: Map<string, LocalEnCard> | null = null;
let _cardsBySet: Map<string, LocalEnCard[]> | null = null;
let _setPrintedTotalMap: Map<string, number> | null = null;

export function loadLocalEnSets(): LocalEnSetInfo[] {
  if (_setsCache) return _setsCache;

  const setsJsonPath = path.join(process.cwd(), 'data', 'pokemon_sets_en.json');
  if (!fs.existsSync(setsJsonPath)) {
    console.warn('[localEnCards] pokemon_sets_en.json not found at', setsJsonPath);
    return [];
  }

  try {
    const raw = fs.readFileSync(setsJsonPath, 'utf-8');
    const parsed = JSON.parse(raw);
    const sets: LocalEnSetInfo[] = parsed.map((s: any) => ({
      id: s.id,
      name: s.name,
      series: s.series || '',
      total: s.total || s.printedTotal || 0,
      printedTotal: s.printedTotal || s.total || 0,
      releaseDate: s.releaseDate || '',
      logoUrl: s.images?.logo || '',
      symbolUrl: s.images?.symbol || '',
    }));

    // Sort sets by release date descending (newest sets first)
    sets.sort((a, b) => (b.releaseDate || '').localeCompare(a.releaseDate || ''));

    _setsCache = sets;
    _setPrintedTotalMap = new Map();
    sets.forEach((s) => {
      if (s.printedTotal) {
        _setPrintedTotalMap!.set(s.id, s.printedTotal);
      }
    });

    return sets;
  } catch (err) {
    console.error('[localEnCards] Failed to parse pokemon_sets_en.json', err);
    return [];
  }
}

export function loadLocalEnCards(): LocalEnCard[] {
  if (_cardsCache) return _cardsCache;

  // Ensure sets map is available for printedTotal computation
  if (!_setPrintedTotalMap) {
    loadLocalEnSets();
  }

  const csvPath = path.join(process.cwd(), 'data', 'pokemon_cards_en.csv');
  if (!fs.existsSync(csvPath)) {
    console.warn('[localEnCards] CSV not found at', csvPath);
    return [];
  }

  let raw = fs.readFileSync(csvPath, 'utf-8');
  if (raw.charCodeAt(0) === 0xfeff) {
    raw = raw.slice(1);
  }

  const rows = parseCsv(raw);
  if (rows.length < 2) return [];

  const headers = rows[0].map((h) =>
    h.replace(/^\uFEFF/, '').replace(/^["']|["']$/g, '').trim()
  );

  const colIdx: Record<string, number> = {};
  headers.forEach((h, idx) => {
    colIdx[h] = idx;
  });

  const cards: LocalEnCard[] = [];
  const byId = new Map<string, LocalEnCard>();
  const bySet = new Map<string, LocalEnCard[]>();

  for (let i = 1; i < rows.length; i++) {
    const cols = rows[i];
    const id = cols[colIdx['id'] || 0] || '';
    if (!id) continue;

    const name = cols[colIdx['name']] || '';
    const number = cols[colIdx['number']] || '';
    const setId = cols[colIdx['setId']] || '';
    const setName = cols[colIdx['setName']] || '';
    const rarity = cols[colIdx['rarity']] || '';
    const imageUrl = cols[colIdx['imageUrl']] || '';
    const smallImageUrl = cols[colIdx['smallImageUrl']] || '';

    // Calculate formatted number (e.g. 199/165)
    let formattedNumber = number;
    if (number && !number.includes('/')) {
      const printedTotal = _setPrintedTotalMap?.get(setId);
      if (printedTotal && printedTotal > 0) {
        formattedNumber = `${number}/${printedTotal}`;
      }
    }

    const card: LocalEnCard = {
      id,
      name,
      supertype: cols[colIdx['supertype']] || '',
      subtypes: cols[colIdx['subtypes']] || '',
      hp: cols[colIdx['hp']] || '',
      types: cols[colIdx['types']] || '',
      evolvesFrom: cols[colIdx['evolvesFrom']] || '',
      abilities: cols[colIdx['abilities']] || '',
      attacks: cols[colIdx['attacks']] || '',
      weaknesses: cols[colIdx['weaknesses']] || '',
      resistances: cols[colIdx['resistances']] || '',
      retreatCost: cols[colIdx['retreatCost']] || '',
      number,
      artist: cols[colIdx['artist']] || '',
      rarity,
      flavorText: cols[colIdx['flavorText']] || '',
      nationalPokedexNumbers: cols[colIdx['nationalPokedexNumbers']] || '',
      regulationMark: cols[colIdx['regulationMark']] || '',
      setId,
      setName,
      series: cols[colIdx['series']] || '',
      releaseDate: cols[colIdx['releaseDate']] || '',
      imageUrl: imageUrl || smallImageUrl,
      smallImageUrl: smallImageUrl || imageUrl,
      tcgplayerPrice: cols[colIdx['tcgplayerPrice']] || '',
      tcgplayerUrl: cols[colIdx['tcgplayerUrl']] || '',
      formattedNumber,
    };

    cards.push(card);
    byId.set(id, card);

    if (!bySet.has(setId)) {
      bySet.set(setId, []);
    }
    bySet.get(setId)!.push(card);
  }

  _cardsCache = cards;
  _cardsById = byId;
  _cardsBySet = bySet;

  return cards;
}

export function getLocalEnCardById(id: string): LocalEnCard | null {
  if (!_cardsById) {
    loadLocalEnCards();
  }
  return _cardsById?.get(id) || null;
}

function toSummary(card: LocalEnCard): LocalEnCardSummary {
  return {
    id: card.id,
    name: card.name,
    supertype: card.supertype,
    subtypes: card.subtypes,
    hp: card.hp,
    types: card.types,
    number: card.number,
    formattedNumber: card.formattedNumber,
    rarity: card.rarity,
    setId: card.setId,
    setName: card.setName,
    series: card.series,
    releaseDate: card.releaseDate,
    imageUrl: formatCardImageUrl(card.imageUrl),
    smallImageUrl: formatCardImageUrl(card.smallImageUrl),
  };
}

// Helper to sort cards by collector number naturally (e.g. 1, 2, 10, 100, TG01, etc.)
function sortCardsByNumber(a: LocalEnCard, b: LocalEnCard): number {
  const numA = parseInt(a.number, 10);
  const numB = parseInt(b.number, 10);
  if (!isNaN(numA) && !isNaN(numB)) {
    return numA - numB;
  }
  return a.number.localeCompare(b.number);
}

// ---------- Search Engine ----------

export function searchLocalEnCards(
  query: string,
  setId?: string,
  page = 1,
  limit = 15
): { cards: LocalEnCardSummary[]; total: number; totalPages: number } {
  loadLocalEnCards();
  const allCards = _cardsCache || [];

  let candidates: LocalEnCard[] = allCards;

  // Filter by setId first if provided
  if (setId && setId.trim()) {
    const sId = setId.trim();
    candidates = _cardsBySet?.get(sId) || allCards.filter((c) => c.setId === sId || c.setName.toLowerCase() === sId.toLowerCase());
  }

  let q = query.toLowerCase().trim();

  // Check nickname alias
  if (NICKNAMES[q]) {
    q = NICKNAMES[q];
  }

  // If query is empty:
  if (!q) {
    // If set was selected, sort by card number naturally
    let sortedList = candidates;
    if (setId) {
      sortedList = [...candidates].sort(sortCardsByNumber);
    } else {
      // If no query and no set, show modern hits (Scarlet & Violet / modern first)
      sortedList = [...candidates].reverse();
    }

    const total = sortedList.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const offset = Math.max(0, (page - 1) * limit);
    const paginated = sortedList.slice(offset, offset + limit).map(toSummary);

    return { cards: paginated, total, totalPages };
  }

  // Multi-token search
  const tokens = q.split(/\s+/).filter(Boolean);

  interface ScoredCard {
    card: LocalEnCard;
    score: number;
  }

  const scored: ScoredCard[] = [];

  for (const card of candidates) {
    const nameLower = card.name.toLowerCase();
    const numLower = card.number.toLowerCase();
    const fmtNumLower = card.formattedNumber.toLowerCase();
    const setLower = card.setName.toLowerCase();
    const seriesLower = card.series.toLowerCase();
    const rarityLower = card.rarity.toLowerCase();
    const idLower = card.id.toLowerCase();

    // All tokens must match somewhere
    let matchesAllTokens = true;
    for (const token of tokens) {
      if (
        !nameLower.includes(token) &&
        !numLower.includes(token) &&
        !fmtNumLower.includes(token) &&
        !setLower.includes(token) &&
        !seriesLower.includes(token) &&
        !rarityLower.includes(token) &&
        !idLower.includes(token)
      ) {
        matchesAllTokens = false;
        break;
      }
    }

    if (!matchesAllTokens) continue;

    // Relevance scoring
    let score = 0;

    // Exact matches
    if (nameLower === q) score += 200;
    else if (nameLower.startsWith(q)) score += 100;
    else if (nameLower.includes(q)) score += 50;

    // Exact card number match
    if (numLower === q || fmtNumLower === q) score += 120;
    else if (numLower.startsWith(q)) score += 60;

    // Exact id match (e.g. sv3pt5-199)
    if (idLower === q) score += 250;

    // Rarity bonus for collector cards
    if (rarityLower.includes('illustration') || rarityLower.includes('secret') || rarityLower.includes('special')) {
      score += 15;
    }

    scored.push({ card, score });
  }

  // Sort by score descending, then by release date descending
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (b.card.releaseDate || '').localeCompare(a.card.releaseDate || '');
  });

  const total = scored.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const offset = Math.max(0, (page - 1) * limit);
  const paginated = scored.slice(offset, offset + limit).map((s) => toSummary(s.card));

  return { cards: paginated, total, totalPages };
}
