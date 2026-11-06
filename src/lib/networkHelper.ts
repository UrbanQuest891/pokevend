/**
 * networkHelper.ts
 * Utility to resolve shareable / scannable URLs across local network (LAN) devices.
 * If accessed on localhost/127.0.0.1, fetches the machine's LAN IP (e.g. 192.168.1.9)
 * so generated QR codes can be scanned and opened immediately by smartphones on the same Wi-Fi.
 */

let cachedNetworkOrigin: string | null = null;

export async function getNetworkOrigin(): Promise<string> {
  if (typeof window === 'undefined') return '';

  // If already accessed via LAN IP or public domain, current origin is already shareable
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return window.location.origin;
  }

  if (cachedNetworkOrigin) {
    return cachedNetworkOrigin;
  }

  try {
    const res = await fetch('/api/network-info', { cache: 'no-store' });
    const data = await res.json();
    if (data.success && data.networkOrigin) {
      cachedNetworkOrigin = data.networkOrigin;
      return data.networkOrigin;
    }
  } catch (err) {
    console.warn('[networkHelper] Failed to fetch network-info:', err);
  }

  return window.location.origin;
}

export async function resolveShareableUrl(pathOrUrl: string): Promise<string> {
  if (typeof window === 'undefined') return pathOrUrl;

  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    try {
      const parsed = new URL(pathOrUrl);
      if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
        const netOrigin = await getNetworkOrigin();
        return `${netOrigin}${parsed.pathname}${parsed.search}${parsed.hash}`;
      }
    } catch {
      // fallback
    }
    return pathOrUrl;
  }

  const netOrigin = await getNetworkOrigin();
  const cleanPath = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${netOrigin}${cleanPath}`;
}
