import { NextResponse } from 'next/server';
import { getRiftboundSets } from '@/lib/riftboundCards';

export async function GET() {
  try {
    const sets = getRiftboundSets();
    return NextResponse.json({ success: true, sets });
  } catch (err) {
    console.error('[riftbound/sets] Error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to load sets' },
      { status: 500 }
    );
  }
}
