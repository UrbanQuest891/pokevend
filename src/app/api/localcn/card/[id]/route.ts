import { NextRequest, NextResponse } from 'next/server';
import { getLocalCnCardById } from '@/lib/localCnCards';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const card = getLocalCnCardById(id);

    if (!card) {
      return NextResponse.json(
        { success: false, error: 'Card not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        card,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    );
  } catch (err) {
    console.error('[localcn/card/[id]] Error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve card' },
      { status: 500 }
    );
  }
}
