import TCGdex, { Query } from '@tcgdex/sdk';
import { POKEMON_CARD_TEMPLATES } from './pokemonCatalog';

// Singleton instance
const tcgdex = new TCGdex('en');

export interface TcgdexCardSummary {
  id: string;
  name: string;
  localId: string;
  setName?: string;
  imageUrl: string;
  rarity?: string;
  marketPriceUsd?: number;
  estimatedPriceIdr?: number;
}

export interface TcgdexCardDetail {
  id: string;
  name: string;
  setName: string;
  cardNumber: string;
  rarity: string;
  imageUrl: string;
  illustrator?: string;
  marketPriceUsd?: number;
  estimatedPriceIdr?: number;
  currency?: string;
}

const USD_TO_IDR_RATE = 16000;

export async function searchTcgdexCards(
  query: string,
  page: number = 1,
  limit: number = 15
): Promise<TcgdexCardSummary[]> {
  const cleanQ = query.trim();
  if (!cleanQ) return [];

  try {
    // If user typed an exact ID like "swsh7-215" or "sv03.5-199"
    if (cleanQ.includes('-') && cleanQ.length > 5) {
      const single = await tcgdex.fetchCard(cleanQ);
      if (single) {
        return [
          {
            id: single.id,
            name: single.name,
            localId: single.localId,
            setName: single.set?.name,
            imageUrl: single.image ? `${single.image}/high.webp` : '',
            rarity: single.rarity,
          },
        ];
      }
    }

    // Search by name
    const q = Query.create().contains('name', cleanQ).paginate(page, limit);
    const results = await tcgdex.fetchWithQuery<any[]>(['cards'], q.params);

    if (Array.isArray(results) && results.length > 0) {
      return results.map((item) => ({
        id: item.id,
        name: item.name,
        localId: item.localId,
        imageUrl: item.image ? `${item.image}/high.webp` : '',
      }));
    }

    return fallbackLocalSearch(cleanQ);
  } catch (err) {
    console.warn('TCGdex search error, using fallback catalog:', err);
    return fallbackLocalSearch(cleanQ);
  }
}

export async function getTcgdexCardDetail(cardId: string): Promise<TcgdexCardDetail | null> {
  try {
    const card = await tcgdex.fetchCard(cardId);
    if (!card) return null;

    const officialCount = card.set?.cardCount?.official;
    const cardNumber = officialCount ? `${card.localId}/${officialCount}` : card.localId;

    // Extract best market price from TCGPlayer
    let marketUsd: number | undefined;
    const tcgPricing = (card as any).pricing?.tcgplayer;
    if (tcgPricing) {
      const candidates = [
        tcgPricing.holofoil?.marketPrice,
        tcgPricing['1st-edition-holofoil']?.marketPrice,
        tcgPricing.normal?.marketPrice,
        tcgPricing.reverse?.marketPrice,
        tcgPricing.unlimited?.marketPrice,
        tcgPricing.holofoil?.midPrice,
        tcgPricing.normal?.midPrice,
      ].filter((p): p is number => typeof p === 'number' && p > 0);

      if (candidates.length > 0) {
        marketUsd = candidates[0];
      }
    }

    let estimatedIdr: number | undefined;
    if (marketUsd) {
      // Round to nearest 5,000 IDR
      estimatedIdr = Math.round((marketUsd * USD_TO_IDR_RATE) / 5000) * 5000;
    }

    return {
      id: card.id,
      name: card.name,
      setName: card.set?.name || 'Unknown Set',
      cardNumber,
      rarity: card.rarity || 'Common',
      imageUrl: card.image ? `${card.image}/high.webp` : '',
      illustrator: card.illustrator,
      marketPriceUsd: marketUsd,
      estimatedPriceIdr: estimatedIdr,
    };
  } catch (err) {
    console.error('Error fetching TCGdex card detail:', err);
    return null;
  }
}

function fallbackLocalSearch(cleanQ: string): TcgdexCardSummary[] {
  const q = cleanQ.toLowerCase();
  return POKEMON_CARD_TEMPLATES.filter(
    (t) => t.name.toLowerCase().includes(q) || t.setName.toLowerCase().includes(q)
  ).map((t, idx) => ({
    id: `local-${idx}`,
    name: t.name,
    localId: t.cardNumber,
    setName: t.setName,
    imageUrl: t.imageUrl,
    rarity: t.rarity,
    estimatedPriceIdr: t.defaultPrice,
    marketPriceUsd: Math.round(t.defaultPrice / 16000),
  }));
}
