import { NextRequest, NextResponse } from 'next/server';
import { searchOnePieceCards } from '@/lib/onepieceCards';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') ?? '';
  const lang = (searchParams.get('lang')?.toUpperCase() === 'JP' ? 'JP' : 'EN') as 'EN' | 'JP';
  const set = searchParams.get('set') ?? '';
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '24', 10) || 24));

  try {
    const result = searchOnePieceCards({
      query: q,
      lang,
      set,
      page,
      limit,
    });

    return NextResponse.json({
      success: true,
      cards: result.cards,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
      lang,
    });
  } catch (err) {
    console.error('[onepiece/search] Error:', err);
    return NextResponse.json(
      { success: false, error: 'Search failed' },
      { status: 500 }
    );
  }
}
