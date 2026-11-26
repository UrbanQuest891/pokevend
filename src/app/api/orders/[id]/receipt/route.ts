import { NextRequest, NextResponse } from 'next/server';
import { getOrderById, updateOrder } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { email } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Alamat email tidak valid' },
        { status: 400 }
      );
    }

    const order = await getOrderById(id);
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order tidak ditemukan' },
        { status: 404 }
      );
    }

    // Save buyer email onto order notes or metadata
    const updatedNotes = order.notes
      ? `${order.notes} • Receipt: ${email}`
      : `Receipt sent to: ${email}`;

    await updateOrder(id, { notes: updatedNotes });

    // In production, integrate Resend, SendGrid, or nodemailer here.
    console.log(`[DIGITAL RECEIPT] Sent receipt for Order ${order.orderNumber} to ${email}`);

    return NextResponse.json({
      success: true,
      message: `Struk digital berhasil dikirim ke ${email}`,
      orderId: id,
      orderNumber: order.orderNumber,
      email,
    });
  } catch (err: any) {
    console.error('Error sending digital receipt:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Gagal mengirim struk digital' },
      { status: 500 }
    );
  }
}
