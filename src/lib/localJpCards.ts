/**
 * localJpCards.ts
 * Reads and searches the local Japanese Pokémon card database
 * scraped from pokemon-card.com — 23,000+ cards in Japanese.
 *
 * This module is SERVER-ONLY (uses fs/path).
 */

import fs from 'fs';
import path from 'path';
import { formatCardDisplayName, translateCardSet } from './cardTranslator';

export interface LocalJpCard {
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
  collectorNumber: string;
  expansion: string;
  pokedexNumber: string;
  species: string;
  height: string;
  weight: string;
  illustrator: string;
  imageUrl: string;
  detailUrl: string;
}

export interface LocalJpCardSummary {
  id: string;
  name: string;
  expansion: string;
  collectorNumber: string;
  category: string;
  subCategory: string;
  type: string;
  imageUrl: string;
  stage: string;
  pokedexNumber: string;
}

export interface ExpansionInfo {
  code: string;
  productName: string;
  count: number;
}

// Popular English-to-Japanese Pokémon name mapping to allow sellers to search English names
const EN_TO_JP_NAME: Record<string, string> = {
  pikachu: 'ピカチュウ',
  charizard: 'リザードン',
  blastoise: 'カメックス',
  venusaur: 'フシギバナ',
  mewtwo: 'ミュウツー',
  mew: 'ミュウ',
  gengar: 'ゲンガー',
  eevee: 'イーブイ',
  umbreon: 'ブラッキー',
  espeon: 'エーフィ',
  sylveon: 'ニンフィア',
  glaceon: 'グレイシア',
  leafeon: 'リーフィア',
  vaporeon: 'シャワーズ',
  jolteon: 'サンダース',
  flareon: 'ブースター',
  rayquaza: 'レックウザ',
  lugia: 'ルギア',
  'ho-oh': 'ホウオウ',
  hooh: 'ホウオウ',
  giratina: 'ギラティナ',
  dialga: 'ディアルガ',
  palkia: 'パルキア',
  arceus: 'アルセウス',
  garchomp: 'ガブリアス',
  lucario: 'ルカリオ',
  mimikyu: 'ミミッキュ',
  greninja: 'ゲッコウガ',
  snorlax: 'カビゴン',
  dragonite: 'カイリュー',
  tyranitar: 'バンギラス',
  gardevoir: 'サーナイト',
  gyarados: 'ギャラドス',
  alakazam: 'フーディン',
  machamp: 'カイリキー',
  raichu: 'ライチュウ',
  squirtle: 'ゼニガメ',
  charmander: 'ヒトカゲ',
  bulbasaur: 'フシギダネ',
  lillie: 'リーリエ',
  marnie: 'マリィ',
  iono: 'ナンジャモ',
  cynthia: 'シロナ',
  erika: 'エリカ',
  misty: 'カスミ',
  brock: 'タケシ',
  oak: 'オーキド',
  red: 'レッド',
  blue: 'グリーン',
  green: 'ブルー',
  koraidon: 'コライドン',
  miraidon: 'ミライドン',
  ogerpon: 'オーガポン',
  terapagos: 'テラパゴス',
  iron: 'テツノ',
  roaring: 'トドロク',
  moon: 'ツキ',
  celebi: 'セレビィ',
  jirachi: 'ジラーチ',
  deoxys: 'デオキシス',
  darkrai: 'ダークライ',
  shaymin: 'シェイミ',
  suicune: 'スイクン',
  entei: 'エンテイ',
  raikou: 'ライコウ',
  zapdos: 'サンダー',
  articuno: 'フリーザー',
  moltres: 'ファイヤー',
};

// ---------- CSV parser ----------

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

// ---------- Loader (cached in module scope for server-side reuse) ----------

let _cache: LocalJpCard[] | null = null;

export function loadLocalJpCards(): LocalJpCard[] {
  if (_cache) return _cache;

  const csvPath = path.join(process.cwd(), 'data', 'pokemon_cards_jp.csv');

  if (!fs.existsSync(csvPath)) {
    console.warn('[localJpCards] CSV not found at', csvPath);
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

  const cards: LocalJpCard[] = [];
  for (let i = 1; i < rows.length; i++) {
    const cols = rows[i];
    if (cols.length < headers.length) continue;

    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      obj[h] = (cols[idx] ?? '').trim();
    });

    if (!obj.id) continue;

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
      collectorNumber: obj.collectorNumber,
      expansion: obj.expansion,
      pokedexNumber: obj.pokedexNumber,
      species: obj.species,
      height: obj.height,
      weight: obj.weight,
      illustrator: obj.illustrator,
      imageUrl: obj.imageUrl,
      detailUrl: obj.detailUrl,
    });
  }

  _cache = cards;
  return cards;
}

// ---------- Search ----------

export function searchLocalJpCards(
  query: string,
  page = 1,
  limit = 15
): LocalJpCardSummary[] {
  const cards = loadLocalJpCards();
  const q = query.toLowerCase().trim();

  if (!q) {
    // Return latest cards (highest id first)
    return cards.slice(0, limit).map(toSummary);
  }

  // Check if query matches an English Pokemon name
  const translatedJpName = EN_TO_JP_NAME[q] || null;

  const matched = cards.filter((c) => {
    const nameLower = c.name.toLowerCase();
    const transName = formatCardDisplayName(c.name, c.collectorNumber, c.expansion, 'pokemon').toLowerCase();
    const expLower = c.expansion.toLowerCase();
    const transSet = translateCardSet(c.expansion, c.collectorNumber, 'pokemon').toLowerCase();
    const numLower = c.collectorNumber.toLowerCase();
    const speciesLower = c.species.toLowerCase();
    const pokeNumLower = c.pokedexNumber.toLowerCase();
    const illLower = c.illustrator.toLowerCase();
    const imgLower = c.imageUrl.toLowerCase();

    // Direct matches
    if (
      nameLower.includes(q) ||
      transName.includes(q) ||
      expLower.includes(q) ||
      transSet.includes(q) ||
      numLower.includes(q) ||
      speciesLower.includes(q) ||
      pokeNumLower.includes(q) ||
      illLower.includes(q) ||
      imgLower.includes(q)
    ) {
      return true;
    }

    // English-to-Japanese translated match
    if (translatedJpName && c.name.includes(translatedJpName)) {
      return true;
    }

    return false;
  });

  const start = (page - 1) * limit;
  return matched.slice(start, start + limit).map(toSummary);
}

function toSummary(c: LocalJpCard): LocalJpCardSummary {
  return {
    id: c.id,
    name: c.name,
    expansion: c.expansion,
    collectorNumber: c.collectorNumber,
    category: c.category,
    subCategory: c.subCategory,
    type: c.type,
    imageUrl: c.imageUrl,
    stage: c.stage,
    pokedexNumber: c.pokedexNumber,
  };
}

export function getLocalJpCardById(id: string): LocalJpCard | null {
  const cards = loadLocalJpCards();
  return cards.find((c) => c.id === id) ?? null;
}

// ---------- Expansion list (for filter dropdown) ----------

export function getJpExpansions(): ExpansionInfo[] {
  const cards = loadLocalJpCards();
  const map = new Map<string, number>();

  for (const c of cards) {
    const key = c.expansion?.trim() || '';
    if (!key) continue;
    map.set(key, (map.get(key) || 0) + 1);
  }

  return Array.from(map.entries())
    .map(([exp, count]) => ({
      code: exp,
      productName: exp,
      count,
    }))
    .sort((a, b) => b.count - a.count);
}
