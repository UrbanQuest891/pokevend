import { NextRequest, NextResponse } from 'next/server';
import { getOnePieceCardById } from '@/lib/onepieceCards';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const lang = searchParams.get('lang')?.toUpperCase() as 'EN' | 'JP' | undefined;

    const card = getOnePieceCardById(id, lang);
    if (!card) {
      return NextResponse.json(
        { success: false, error: 'Card not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, card });
  } catch (err) {
    console.error('[onepiece/card] Error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch card' },
      { status: 500 }
    );
  }
}
