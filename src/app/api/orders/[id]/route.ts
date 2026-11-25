import { NextRequest, NextResponse } from 'next/server';
import {
  getOrderById,
  updateOrder,
  updateOrderItemDealPrice,
  removeOrderItemFromOrder,
  addCardToOrder,
  finalizeAndArchiveOrder,
} from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const order = await getOrderById(id);
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, order });
  } catch (err: any) {
    console.error('Error in GET /api/orders/[id]:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { action } = body;

    if (action === 'update_deal_price') {
      const { itemId, newDealPrice } = body;
      if (!itemId || newDealPrice === undefined) {
        return NextResponse.json(
          { success: false, error: 'itemId dan newDealPrice wajib diisi' },
          { status: 400 }
        );
      }
      const updatedOrder = await updateOrderItemDealPrice(id, itemId, Number(newDealPrice));
      return NextResponse.json({ success: true, order: updatedOrder });
    }

    if (action === 'remove_item') {
      const { itemId } = body;
      if (!itemId) {
        return NextResponse.json(
          { success: false, error: 'itemId wajib diisi' },
          { status: 400 }
        );
      }
      const updatedOrder = await removeOrderItemFromOrder(id, itemId);
      return NextResponse.json({ success: true, order: updatedOrder });
    }

    if (action === 'add_item') {
      const { cardData } = body;
      if (!cardData || !cardData.cardName || cardData.slotNumber === undefined) {
        return NextResponse.json(
          { success: false, error: 'Data kartu tidak valid' },
          { status: 400 }
        );
      }
      const updatedOrder = await addCardToOrder(id, cardData);
      return NextResponse.json({ success: true, order: updatedOrder });
    }

    if (action === 'finalize') {
      // Finalizes transaction, records to SaleRecord, clears binder slots!
      const result = await finalizeAndArchiveOrder(id);
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: 'Gagal memproses finalisasi order' },
          { status: 400 }
        );
      }
      return NextResponse.json({
        success: true,
        order: result.order,
        soldSlots: result.soldSlots,
      });
    }

    if (action === 'cancel') {
      const updatedOrder = await updateOrder(id, { status: 'CANCELLED' });
      return NextResponse.json({ success: true, order: updatedOrder });
    }

    // Default update (e.g. buyerName, notes)
    const { buyerName, notes, status } = body;
    const updatedOrder = await updateOrder(id, {
      ...(buyerName && { buyerName }),
      ...(notes !== undefined && { notes }),
      ...(status && { status }),
    });

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (err: any) {
    console.error('Error in PATCH /api/orders/[id]:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to update order' },
      { status: 500 }
    );
  }
}
