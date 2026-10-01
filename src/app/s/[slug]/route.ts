import { NextResponse } from 'next/server';

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(req: Request, context: RouteContext) {
  const { slug } = await context.params;
  const lastDashIndex = slug.lastIndexOf('-');

  if (lastDashIndex === -1) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  const binderId = slug.substring(0, lastDashIndex);
  const slotNumber = slug.substring(lastDashIndex + 1);

  return NextResponse.redirect(new URL(`/b/${binderId}/slot/${slotNumber}`, req.url));
}
