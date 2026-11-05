import { NextRequest, NextResponse } from 'next/server';
import { searchLocalJpCards } from '@/lib/localJpCards';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') ?? '';
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const limit = parseInt(searchParams.get('limit') ?? '15', 10);
  const expansion = searchParams.get('expansion') ?? '';

  try {
    let cards = searchLocalJpCards(q, page, Math.min(limit, 30));

    // Optional: filter by expansion name
    if (expansion) {
      const expLower = expansion.toLowerCase();
      cards = cards.filter((c) =>
        c.expansion.toLowerCase().includes(expLower)
      );
    }

    return NextResponse.json({ success: true, cards, total: cards.length });
  } catch (err) {
    console.error('[localjp/search] Error:', err);
    return NextResponse.json(
      { success: false, error: 'Search failed' },
      { status: 500 }
    );
  }
}
