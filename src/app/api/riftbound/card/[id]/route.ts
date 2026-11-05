import { NextRequest, NextResponse } from 'next/server';
import { getRiftboundCardById } from '@/lib/riftboundCards';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const card = getRiftboundCardById(id);

    if (!card) {
      return NextResponse.json(
        { success: false, error: 'Card not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, card });
  } catch (err) {
    console.error('[riftbound/card] Error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch card' },
      { status: 500 }
    );
  }
}
