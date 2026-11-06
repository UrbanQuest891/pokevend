import { NextResponse } from 'next/server';
import { getBinders, createBinder, getProfile } from '@/lib/storage';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const binders = await getBinders();
    const profile = await getProfile();
    return NextResponse.json(
      { success: true, binders, profile },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (error) {
    console.error('Failed to get binders:', error);
    return NextResponse.json({ success: false, error: 'Failed to retrieve binders' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.name) {
      return NextResponse.json({ success: false, error: 'Binder name is required' }, { status: 400 });
    }

    const id = body.id || `binder-${Date.now()}`;
    const newBinder = await createBinder({
      id,
      name: body.name,
      description: body.description || '',
      sellerName: body.sellerName || 'PokéSeller',
      boothName: body.boothName || '',
      contactNumber: body.contactNumber || '',
      coverColor: body.coverColor || '#DC2626',
      badge: body.badge || 'Binder',
      currency: body.currency || 'IDR',
      layoutType: body.layoutType || '9-pocket',
      totalPages: Number(body.totalPages) || 5,
      slots: body.slots || {},
    });

    return NextResponse.json({ success: true, binder: newBinder });
  } catch (error) {
    console.error('Failed to create binder:', error);
    return NextResponse.json({ success: false, error: 'Failed to create binder' }, { status: 500 });
  }
}
