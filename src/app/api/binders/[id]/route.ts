import { NextResponse } from 'next/server';
import { getBinderById, updateBinder, deleteBinder } from '@/lib/storage';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const binder = await getBinderById(id);
    if (!binder) {
      return NextResponse.json({ success: false, error: 'Binder not found' }, { status: 404 });
    }
    return NextResponse.json(
      { success: true, binder },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (error) {
    console.error('Failed to get binder:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const updated = await updateBinder(id, body);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Binder not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, binder: updated });
  } catch (error) {
    console.error('Failed to update binder:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const deleted = await deleteBinder(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Binder not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Binder deleted successfully' });
  } catch (error) {
    console.error('Failed to delete binder:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
