/**
 * riftboundCards.ts
 * Reads and searches the local Riftbound TCG card database
 * scraped from Riot Games / Riftbound official data.
 *
 * This module is SERVER-ONLY (uses fs/path).
 */

import fs from 'fs';
import path from 'path';

export interface RiftboundCard {
  id: string;
  publicCode: string;
  collectorNumber: string;
  name: string;
  setCode: string;
  setName: string;
  cardType: string;
  superType: string;
  rarity: string;
  domain: string;
  energyCost: string;
  power: string;
  might: string;
  tags: string;
  illustrator: string;
  rulesText: string;
  accessibilityText: string;
  imageUrl: string;
  imageWidth: string;
  imageHeight: string;
}

export interface RiftboundCardSummary {
  id: string;
  publicCode: string;
  collectorNumber: string;
  name: string;
  setCode: string;
  setName: string;
  cardType: string;
  rarity: string;
  domain: string;
  might: string;
  energyCost: string;
  tags: string;
  imageUrl: string;
}

export interface RiftboundSetInfo {
  code: string;
  setName: string;
  count: number;
}

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

let _cache: RiftboundCard[] | null = null;

export function loadRiftboundCards(): RiftboundCard[] {
  if (_cache) return _cache;

  const csvPath = path.join(process.cwd(), 'data', 'riftbound_cards.csv');

  if (!fs.existsSync(csvPath)) {
    console.warn('[riftboundCards] CSV not found at', csvPath);
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

  const cards: RiftboundCard[] = [];
  for (let i = 1; i < rows.length; i++) {
    const cols = rows[i];
    if (cols.length < headers.length) continue;

    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      obj[h] = (cols[idx] ?? '').trim();
    });

    if (!obj.id && !obj.name) continue;

    cards.push({
      id: obj.id || `rb-${i}`,
      publicCode: obj.publicCode || '',
      collectorNumber: obj.collectorNumber || '',
      name: obj.name || '',
      setCode: obj.setCode || '',
      setName: obj.setName || '',
      cardType: obj.cardType || '',
      superType: obj.superType || '',
      rarity: obj.rarity || '',
      domain: obj.domain || '',
      energyCost: obj.energyCost || '',
      power: obj.power || '',
      might: obj.might || '',
      tags: obj.tags || '',
      illustrator: obj.illustrator || '',
      rulesText: obj.rulesText || '',
      accessibilityText: obj.accessibilityText || '',
      imageUrl: obj.imageUrl || '',
      imageWidth: obj.imageWidth || '',
      imageHeight: obj.imageHeight || '',
    });
  }

  _cache = cards;
  return cards;
}

// ---------- Search ----------

export function searchRiftboundCards(
  query: string,
  page = 1,
  limit = 15
): RiftboundCardSummary[] {
  const cards = loadRiftboundCards();
  const q = query.toLowerCase().trim();

  if (!q) {
    return cards.slice(0, limit).map(toSummary);
  }

  const matched = cards.filter((c) => {
    return (
      c.name.toLowerCase().includes(q) ||
      c.publicCode.toLowerCase().includes(q) ||
      c.collectorNumber.toLowerCase().includes(q) ||
      c.setName.toLowerCase().includes(q) ||
      c.setCode.toLowerCase().includes(q) ||
      c.cardType.toLowerCase().includes(q) ||
      c.rarity.toLowerCase().includes(q) ||
      c.domain.toLowerCase().includes(q) ||
      c.tags.toLowerCase().includes(q) ||
      c.illustrator.toLowerCase().includes(q)
    );
  });

  const start = (page - 1) * limit;
  return matched.slice(start, start + limit).map(toSummary);
}

function toSummary(c: RiftboundCard): RiftboundCardSummary {
  return {
    id: c.id,
    publicCode: c.publicCode,
    collectorNumber: c.collectorNumber,
    name: c.name,
    setCode: c.setCode,
    setName: c.setName,
    cardType: c.cardType,
    rarity: c.rarity,
    domain: c.domain,
    might: c.might,
    energyCost: c.energyCost,
    tags: c.tags,
    imageUrl: c.imageUrl,
  };
}

export function getRiftboundCardById(id: string): RiftboundCard | null {
  const cards = loadRiftboundCards();
  return cards.find((c) => c.id === id || c.publicCode === id) ?? null;
}

// ---------- Sets list (for filter dropdown) ----------

export function getRiftboundSets(): RiftboundSetInfo[] {
  const cards = loadRiftboundCards();
  const map = new Map<string, { setCode: string; count: number }>();

  for (const c of cards) {
    const key = c.setName?.trim() || 'Unknown';
    const existing = map.get(key);
    if (existing) {
      existing.count++;
    } else {
      map.set(key, { setCode: c.setCode, count: 1 });
    }
  }

  return Array.from(map.entries())
    .map(([setName, val]) => ({
      code: val.setCode || setName,
      setName,
      count: val.count,
    }))
    .sort((a, b) => b.count - a.count);
}
