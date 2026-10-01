import { NextResponse } from 'next/server';
import { resetToDefault } from '@/lib/storage';

export async function POST() {
  try {
    const data = await resetToDefault();
    return NextResponse.json({ success: true, message: 'Data reset to default', data });
  } catch (error) {
    console.error('Failed to reset data:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
