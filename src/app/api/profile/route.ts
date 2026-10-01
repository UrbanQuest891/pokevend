import { NextResponse } from 'next/server';
import { getProfile, updateProfile } from '@/lib/storage';

export async function GET() {
  try {
    const profile = await getProfile();
    return NextResponse.json({ success: true, profile });
  } catch (error) {
    console.error('Failed to get profile:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const updated = await updateProfile(body);
    return NextResponse.json({ success: true, profile: updated });
  } catch (error) {
    console.error('Failed to update profile:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
