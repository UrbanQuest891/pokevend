import { NextResponse } from 'next/server';
import { getExpansions } from '@/lib/localIdCards';

export async function GET() {
  try {
    const expansions = getExpansions();
    return NextResponse.json({ success: true, expansions });
  } catch (err) {
    console.error('[localid/expansions] Error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to load expansions' },
      { status: 500 }
    );
  }
}
