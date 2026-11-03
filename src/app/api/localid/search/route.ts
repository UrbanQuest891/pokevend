import { NextRequest, NextResponse } from 'next/server';
import { searchLocalIdCards } from '@/lib/localIdCards';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') ?? '';
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const limit = parseInt(searchParams.get('limit') ?? '15', 10);
  const expansion = searchParams.get('expansion') ?? '';

  try {
    let cards = searchLocalIdCards(q, page, Math.min(limit, 30));

    // Optional: filter by expansion code
    if (expansion) {
      const expLower = expansion.toLowerCase();
      cards = cards.filter(
        (c) =>
          c.expansionCode.toLowerCase() === expLower ||
          c.productName.toLowerCase().includes(expLower)
      );
    }

    return NextResponse.json({ success: true, cards, total: cards.length });
  } catch (err) {
    console.error('[localid/search] Error:', err);
    return NextResponse.json(
      { success: false, error: 'Search failed' },
      { status: 500 }
    );
  }
}
