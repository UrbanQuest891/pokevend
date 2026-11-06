import { NextResponse } from 'next/server';
import { loadLocalEnSets } from '@/lib/localEnCards';

export async function GET() {
  try {
    const sets = loadLocalEnSets();
    return NextResponse.json({
      success: true,
      sets,
      total: sets.length,
    });
  } catch (err) {
    console.error('[localen/sets] Error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to load English Pokémon sets' },
      { status: 500 }
    );
  }
}
