import { NextResponse } from 'next/server';
import os from 'os';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const nets = os.networkInterfaces();
  const ips: string[] = [];

  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        ips.push(net.address);
      }
    }
  }

  const primaryIp = ips[0] || 'localhost';
  const port = process.env.PORT || '3000';
  const networkOrigin = `http://${primaryIp}:${port}`;

  return NextResponse.json(
    {
      success: true,
      localIp: primaryIp,
      port,
      networkOrigin,
      allIps: ips,
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    }
  );
}
