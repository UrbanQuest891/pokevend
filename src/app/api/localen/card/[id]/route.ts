import { NextRequest, NextResponse } from 'next/server';
import { getLocalEnCardById } from '@/lib/localEnCards';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const card = getLocalEnCardById(id);

    if (!card) {
      return NextResponse.json(
        { success: false, error: 'Card not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      card,
    });
  } catch (err) {
    console.error('[localen/card/[id]] Error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve card' },
      { status: 500 }
    );
  }
}
