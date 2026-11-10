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

  // Bandai One Piece and TCGCollector images benefit from local disk caching & proxying
  if (trimmed.includes('onepiece-cardgame.com') || trimmed.includes('tcgcollector.com')) {
    return `/api/proxy-image?url=${encodeURIComponent(trimmed)}`;
  }

  return trimmed;
}
