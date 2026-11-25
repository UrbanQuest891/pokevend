import { NextRequest, NextResponse } from 'next/server';
import { createOrder, getOrders } from '@/lib/storage';
import { OrderStatus } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const binderId = searchParams.get('binderId') || undefined;
    const status = (searchParams.get('status') as OrderStatus) || undefined;

    const orders = await getOrders({ binderId, status });
    return NextResponse.json({ success: true, orders });
  } catch (err: any) {
    console.error('Error in GET /api/orders:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { binderId, buyerName, notes, items } = body;

    if (!binderId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Binder ID dan minimal 1 item kartu diperlukan' },
        { status: 400 }
      );
    }

    const newOrder = await createOrder({
      binderId,
      buyerName: buyerName || 'Pembeli Walk-in',
      notes,
      items,
    });

    return NextResponse.json({ success: true, order: newOrder }, { status: 201 });
  } catch (err: any) {
    console.error('Error in POST /api/orders:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to create order' },
      { status: 500 }
    );
  }
}
