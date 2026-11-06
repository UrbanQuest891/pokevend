import { NextResponse } from 'next/server';
import { getSlotCard, updateSlotCard, removeCardFromSlot, quickToggleCardStatus, quickUpdatePrice } from '@/lib/storage';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface RouteContext {
  params: Promise<{ id: string; slotNumber: string }>;
}

export async function GET(req: Request, context: RouteContext) {
  try {
    const { id, slotNumber } = await context.params;
    const num = parseInt(slotNumber, 10);
    if (isNaN(num)) {
      return NextResponse.json({ success: false, error: 'Invalid slot number' }, { status: 400 });
    }

    const result = await getSlotCard(id, num);
    if (!result) {
      return NextResponse.json({ success: false, error: 'Binder not found' }, { status: 404 });
    }

    return NextResponse.json(
      {
        success: true,
        binder: result.binder,
        card: result.card,
        slotNumber: num,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (error) {
    console.error('Failed to get slot card:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request, context: RouteContext) {
  try {
    const { id, slotNumber } = await context.params;
    const num = parseInt(slotNumber, 10);
    if (isNaN(num)) {
      return NextResponse.json({ success: false, error: 'Invalid slot number' }, { status: 400 });
    }

    const body = await req.json();
    const result = await updateSlotCard(id, num, body);

    if (!result) {
      return NextResponse.json({ success: false, error: 'Binder not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, binder: result.binder, card: result.card });
  } catch (error) {
    console.error('Failed to update slot card:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: Request, context: RouteContext) {
  try {
    const { id, slotNumber } = await context.params;
    const num = parseInt(slotNumber, 10);
    if (isNaN(num)) {
      return NextResponse.json({ success: false, error: 'Invalid slot number' }, { status: 400 });
    }

    const body = await req.json();

    if (body.status) {
      const card = await quickToggleCardStatus(id, num, body.status);
      if (!card) return NextResponse.json({ success: false, error: 'Card not found in slot' }, { status: 404 });
      return NextResponse.json({ success: true, card });
    }

    if (body.price !== undefined) {
      const card = await quickUpdatePrice(id, num, Number(body.price));
      if (!card) return NextResponse.json({ success: false, error: 'Card not found in slot' }, { status: 404 });
      return NextResponse.json({ success: true, card });
    }

    return NextResponse.json({ success: false, error: 'No valid action provided' }, { status: 400 });
  } catch (error) {
    console.error('Failed to patch slot card:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: RouteContext) {
  try {
    const { id, slotNumber } = await context.params;
    const num = parseInt(slotNumber, 10);
    if (isNaN(num)) {
      return NextResponse.json({ success: false, error: 'Invalid slot number' }, { status: 400 });
    }

    const success = await removeCardFromSlot(id, num);
    if (!success) {
      return NextResponse.json({ success: false, error: 'Failed to clear slot or slot empty' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Slot cleared' });
  } catch (error) {
    console.error('Failed to clear slot:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
