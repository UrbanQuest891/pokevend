import { NextResponse } from 'next/server';
import { getTcgdexCardDetail } from '@/lib/tcgdex';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const card = await getTcgdexCardDetail(id);

    if (!card) {
      return NextResponse.json({ success: false, error: 'Card not found in TCGdex' }, { status: 404 });
    }

    return NextResponse.json({ success: true, card });
  } catch (error) {
    console.error('TCGdex card detail route error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
