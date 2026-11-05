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

  // Bandai One Piece Card Game blocks direct cross-origin browser image embeds (CORP: same-site)
  if (trimmed.includes('onepiece-cardgame.com')) {
    return `/api/proxy-image?url=${encodeURIComponent(trimmed)}`;
  }

  return trimmed;
}
