import { NextResponse } from 'next/server';
import { getJpExpansions } from '@/lib/localJpCards';

export async function GET() {
  try {
    const expansions = getJpExpansions();
    return NextResponse.json({ success: true, expansions });
  } catch (err) {
    console.error('[localjp/expansions] Error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to load expansions' },
      { status: 500 }
    );
  }
}
