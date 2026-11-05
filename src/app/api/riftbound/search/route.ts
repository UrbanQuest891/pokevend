import { NextRequest, NextResponse } from 'next/server';
import { searchRiftboundCards } from '@/lib/riftboundCards';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') ?? '';
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const limit = parseInt(searchParams.get('limit') ?? '15', 10);
  const set = searchParams.get('set') ?? '';

  try {
    let cards = searchRiftboundCards(q, page, Math.min(limit, 30));

    // Optional: filter by set name or set code
    if (set) {
      const setLower = set.toLowerCase();
      cards = cards.filter(
        (c) =>
          c.setName.toLowerCase().includes(setLower) ||
          c.setCode.toLowerCase() === setLower
      );
    }

    return NextResponse.json({ success: true, cards, total: cards.length });
  } catch (err) {
    console.error('[riftbound/search] Error:', err);
    return NextResponse.json(
      { success: false, error: 'Search failed' },
      { status: 500 }
    );
  }
}
