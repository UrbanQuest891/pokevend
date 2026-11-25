/**
 * imageHelper.ts
 * Helper utility to normalize card image URLs.
 * Proxies cross-origin protected domains (e.g., Bandai One Piece Card Game)
 * to bypass Cross-Origin-Resource-Policy (CORP) browser restrictions.
 */

export function formatCardImageUrl(url: string | null | undefined): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (trimmed.startsWith('/api/proxy-image')) return trimmed;

  // Upgrade pokemontcg.io small images to _hires.png (733x1024 HD)
  if (trimmed.includes('images.pokemontcg.io') && !trimmed.includes('_hires.png')) {
    return trimmed.replace(/\.png$/i, '_hires.png');
  }

  // Upgrade tcgdex images to /high.webp
  if (trimmed.includes('assets.tcgdex.net') && !trimmed.endsWith('/high.webp') && !trimmed.endsWith('/high.png')) {
    const cleanTcgdex = trimmed.replace(/\/(high\.webp|high\.png|low\.webp|low\.png)?$/, '');
    return `${cleanTcgdex}/high.webp`;
  }

  // Bandai One Piece and TCGCollector images benefit from local disk caching & proxying
  if (trimmed.includes('onepiece-cardgame.com') || trimmed.includes('tcgcollector.com')) {
    return `/api/proxy-image?url=${encodeURIComponent(trimmed)}`;
  }

  return trimmed;
}
