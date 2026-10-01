import { NextResponse } from 'next/server';
import { searchTcgdexCards } from '@/lib/tcgdex';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '12', 10);

    if (!q.trim()) {
      return NextResponse.json({ success: true, cards: [] });
    }

    const cards = await searchTcgdexCards(q, page, limit);
    return NextResponse.json({ success: true, cards });
  } catch (error) {
    console.error('TCGdex search route error:', error);
    return NextResponse.json({ success: false, error: 'Failed to search TCGdex' }, { status: 500 });
  }
}
