import { NextResponse } from 'next/server';
import { loadLocalCnSets } from '@/lib/localCnCards';

export async function GET() {
  try {
    const sets = loadLocalCnSets();
    return NextResponse.json({
      success: true,
      sets,
      total: sets.length,
    });
  } catch (err) {
    console.error('[localcn/sets] Error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to load Chinese Pokémon sets' },
      { status: 500 }
    );
  }
}
