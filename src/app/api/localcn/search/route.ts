import { NextRequest, NextResponse } from 'next/server';
import { searchLocalCnCards } from '@/lib/localCnCards';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') ?? '';
  const set = searchParams.get('set') ?? '';
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
  const limit = Math.min(60, Math.max(1, parseInt(searchParams.get('limit') ?? '18', 10) || 18));

  try {
    const result = searchLocalCnCards(q, set, page, limit);

    return NextResponse.json({
      success: true,
      cards: result.cards,
      total: result.total,
      page,
      totalPages: result.totalPages,
    });
  } catch (err) {
    console.error('[localcn/search] Error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to search Chinese Pokémon cards' },
      { status: 500 }
    );
  }
}
