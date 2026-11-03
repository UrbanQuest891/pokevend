/**
 * localIdCards.ts
 * Reads and searches the local Indonesian Pokémon card database
 * scraped from asia.pokemon-card.com/id — 4,100+ cards in Bahasa Indonesia.
 *
 * This module is SERVER-ONLY (uses fs/path).
 */

import fs from 'fs';
import path from 'path';

export interface LocalIdCard {
  id: string;
  name: string;
  category: string;
  subCategory: string;
  stage: string;
  hp: string;
  type: string;
  attack1_name: string;
  attack1_cost: string;
  attack1_damage: string;
  attack1_effect: string;
  attack2_name: string;
  attack2_cost: string;
  attack2_damage: string;
  attack2_effect: string;
  weakness: string;
  resistance: string;
  retreatCost: string;
  regulationMark: string;
  collectorNumber: string;
  productName: string;
  expansionCode: string;
  pokedexNumber: string;
  species: string;
  illustrator: string;
  imageUrl: string;
  detailUrl: string;
}

// ---------- CSV parser ----------

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

// ---------- Loader (cached in module scope for server-side reuse) ----------

let _cache: LocalIdCard[] | null = null;

export function loadLocalIdCards(): LocalIdCard[] {
  if (_cache) return _cache;

  const csvPath = path.join(process.cwd(), 'data', 'pokemon_cards_id.csv');

  if (!fs.existsSync(csvPath)) {
    console.warn('[localIdCards] CSV not found at', csvPath);
    return [];
  }

  const raw = fs.readFileSync(csvPath, 'utf-8');
  const lines = raw.split(/\r?\n/).filter(Boolean);

  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]);

  const cards: LocalIdCard[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    if (cols.length < headers.length) continue;

    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      obj[h] = (cols[idx] ?? '').trim();
    });

    cards.push({
      id: obj.id,
      name: obj.name,
      category: obj.category,
      subCategory: obj.subCategory,
      stage: obj.stage,
      hp: obj.hp,
      type: obj.type,
      attack1_name: obj.attack1_name,
      attack1_cost: obj.attack1_cost,
      attack1_damage: obj.attack1_damage,
      attack1_effect: obj.attack1_effect,
      attack2_name: obj.attack2_name,
      attack2_cost: obj.attack2_cost,
      attack2_damage: obj.attack2_damage,
      attack2_effect: obj.attack2_effect,
      weakness: obj.weakness,
      resistance: obj.resistance,
      retreatCost: obj.retreatCost,
      regulationMark: obj.regulationMark,
      collectorNumber: obj.collectorNumber,
      productName: obj.productName,
      expansionCode: obj.expansionCode,
      pokedexNumber: obj.pokedexNumber,
      species: obj.species,
      illustrator: obj.illustrator,
      imageUrl: obj.imageUrl,
      detailUrl: obj.detailUrl,
    });
  }

  _cache = cards;
  return cards;
}

// ---------- Search ----------

export interface LocalIdCardSummary {
  id: string;
  name: string;
  productName: string;
  collectorNumber: string;
  category: string;
  subCategory: string;
  type: string;
  imageUrl: string;
  expansionCode: string;
  regulationMark: string;
}

export function searchLocalIdCards(
  query: string,
  page = 1,
  limit = 15
): LocalIdCardSummary[] {
  const cards = loadLocalIdCards();
  const q = query.toLowerCase().trim();

  if (!q) {
    // Return latest cards (highest id first)
    return cards
      .slice(0, limit)
      .map(toSummary);
  }

  const matched = cards.filter((c) => {
    return (
      c.name.toLowerCase().includes(q) ||
      c.productName.toLowerCase().includes(q) ||
      c.expansionCode.toLowerCase().includes(q) ||
      c.collectorNumber.toLowerCase().includes(q) ||
      c.species.toLowerCase().includes(q)
    );
  });

  const start = (page - 1) * limit;
  return matched.slice(start, start + limit).map(toSummary);
}

function toSummary(c: LocalIdCard): LocalIdCardSummary {
  return {
    id: c.id,
    name: c.name,
    productName: c.productName,
    collectorNumber: c.collectorNumber,
    category: c.category,
    subCategory: c.subCategory,
    type: c.type,
    imageUrl: c.imageUrl,
    expansionCode: c.expansionCode,
    regulationMark: c.regulationMark,
  };
}

export function getLocalIdCardById(id: string): LocalIdCard | null {
  const cards = loadLocalIdCards();
  return cards.find((c) => c.id === id) ?? null;
}

// ---------- Expansion list (for filter dropdown) ----------

export interface ExpansionInfo {
  code: string;
  productName: string;
  count: number;
}

export function getExpansions(): ExpansionInfo[] {
  const cards = loadLocalIdCards();
  const map = new Map<string, { productName: string; count: number }>();

  for (const c of cards) {
    const key = c.expansionCode || 'unknown';
    const existing = map.get(key);
    if (existing) {
      existing.count++;
    } else {
      map.set(key, { productName: c.productName, count: 1 });
    }
  }

  return Array.from(map.entries())
    .map(([code, val]) => ({ code, ...val }))
    .sort((a, b) => b.count - a.count);
}
