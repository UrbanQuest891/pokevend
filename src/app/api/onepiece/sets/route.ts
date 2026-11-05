import { NextRequest, NextResponse } from 'next/server';
import { getOnePieceSets } from '@/lib/onepieceCards';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lang = (searchParams.get('lang')?.toUpperCase() === 'JP' ? 'JP' : 'EN') as 'EN' | 'JP';

  try {
    const sets = getOnePieceSets(lang);
    return NextResponse.json({
      success: true,
      lang,
      sets,
      totalSets: sets.length,
    });
  } catch (err) {
    console.error('[onepiece/sets] Error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sets' },
      { status: 500 }
    );
  }
}
