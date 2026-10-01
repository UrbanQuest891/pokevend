import { NextResponse } from 'next/server';
import { bulkApplyDiscount } from '@/lib/storage';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const discount = Number(body.discount) || 0;

    if (discount <= 0 || discount >= 90) {
      return NextResponse.json({ success: false, error: 'Discount must be between 1% and 90%' }, { status: 400 });
    }

    const modifiedCount = await bulkApplyDiscount(id, discount);
    return NextResponse.json({ success: true, modifiedCount });
  } catch (error) {
    console.error('Failed to apply discount:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
