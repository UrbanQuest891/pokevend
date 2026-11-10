import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Allowed image source hosts for security
const ALLOWED_HOSTS = [
  'en.onepiece-cardgame.com',
  'www.onepiece-cardgame.com',
  'onepiece-cardgame.com',
  'asia.pokemon-card.com',
  'www.pokemon-card.com',
  'pokemon-card.com',
  'images.pokemontcg.io',
  'assets.tcgdex.net',
  'cmsassets.rgpub.io',
  'static.tcgcollector.com',
  'tcgcollector.com',
];

const CACHE_DIR = path.join(process.cwd(), '.cache', 'card_images');

function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return new NextResponse('Missing url parameter', { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(targetUrl);
  } catch {
    return new NextResponse('Invalid URL', { status: 400 });
  }

  const isAllowed = ALLOWED_HOSTS.some(
    (h) => parsed.hostname === h || parsed.hostname.endsWith(`.${h}`)
  );

  if (!isAllowed) {
    return new NextResponse('Host not allowed', { status: 403 });
  }

  // Derive cache filename
  const extMatch = parsed.pathname.match(/\.(png|jpg|jpeg|webp|gif)$/i);
  const ext = extMatch ? extMatch[1].toLowerCase() : 'png';
  const hash = crypto.createHash('sha256').update(targetUrl).digest('hex');
  const cacheFile = path.join(CACHE_DIR, `${hash}.${ext}`);

  // Serve from local disk cache if present
  try {
    if (fs.existsSync(cacheFile)) {
      const cached = fs.readFileSync(cacheFile);
      const mime =
        ext === 'webp'
          ? 'image/webp'
          : ext === 'jpg' || ext === 'jpeg'
          ? 'image/jpeg'
          : 'image/png';

      return new NextResponse(cached, {
        headers: {
          'Content-Type': mime,
          'Cache-Control': 'public, max-age=604800, stale-while-revalidate=86400',
          'Access-Control-Allow-Origin': '*',
          'Cross-Origin-Resource-Policy': 'cross-origin',
        },
      });
    }
  } catch (err) {
    console.warn('[proxy-image] Cache read failed:', err);
  }

  // Fetch from upstream
  try {
    const upstreamRes = await fetch(targetUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      },
    });

    if (!upstreamRes.ok) {
      return new NextResponse(`Upstream returned ${upstreamRes.status}`, {
        status: upstreamRes.status,
      });
    }

    const contentType = upstreamRes.headers.get('content-type') || 'image/png';
    const buffer = Buffer.from(await upstreamRes.arrayBuffer());

    // Save to disk cache asynchronously
    try {
      ensureCacheDir();
      fs.writeFileSync(cacheFile, buffer);
    } catch (saveErr) {
      console.warn('[proxy-image] Cache write failed:', saveErr);
    }

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=604800, stale-while-revalidate=86400',
        'Access-Control-Allow-Origin': '*',
        'Cross-Origin-Resource-Policy': 'cross-origin',
      },
    });
  } catch (err: any) {
    console.error('[proxy-image] Fetch failed:', err);
    return new NextResponse('Failed to fetch image', { status: 502 });
  }
}
