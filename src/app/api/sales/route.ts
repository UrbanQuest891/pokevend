import { NextResponse } from 'next/server';
import { getSalesRecords, recordSale, deleteSaleRecord } from '@/lib/storage';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const sales = await getSalesRecords();
    return NextResponse.json(
      { success: true, sales },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (error) {
    console.error('Failed to get sales records:', error);
    return NextResponse.json({ success: false, error: 'Failed to retrieve sales' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.binderId || !body.cardName || body.soldPrice === undefined) {
      return NextResponse.json({ success: false, error: 'Missing required sale data' }, { status: 400 });
    }

    const sale = await recordSale({
      binderId: body.binderId,
      binderName: body.binderName || 'Binder',
      slotNumber: Number(body.slotNumber) || 1,
      cardName: body.cardName,
      setName: body.setName || '',
      cardNumber: body.cardNumber || '',
      rarity: body.rarity || '',
      condition: body.condition || 'Raw - NM',
      game: body.game || 'pokemon',
      imageUrl: body.imageUrl || '',
      soldPrice: Number(body.soldPrice),
      costPrice: body.costPrice != null ? Number(body.costPrice) : undefined,
      currency: body.currency || 'IDR',
      notes: body.notes || '',
      soldAt: body.soldAt || new Date().toISOString(),
    });

    return NextResponse.json({ success: true, sale });
  } catch (error) {
    console.error('Failed to record sale:', error);
    return NextResponse.json({ success: false, error: 'Failed to record sale' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing sale record ID' }, { status: 400 });
    }

    const ok = await deleteSaleRecord(id);
    return NextResponse.json({ success: ok });
  } catch (error) {
    console.error('Failed to delete sale record:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete sale' }, { status: 500 });
  }
}
