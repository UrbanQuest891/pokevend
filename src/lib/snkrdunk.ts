import * as cheerio from 'cheerio';
import { getGoogleFinanceJpyToIdrRate, ExchangeRateInfo } from './exchangeRate';

export interface SnkrdunkTransaction {
  date: string;
  priceIdr: number;
  priceFormatted: string;
  priceOrig: number;
  priceOrigFormatted: string;
  currency: 'JPY';
  title?: string;
  quantity?: string; // "1枚"
  conditionLabel?: string; // "A", "PSA10", etc.
}

export interface SnkrdunkResult {
  provider: 'snkrdunk';
  product: {
    id: string;
    name: string;
    consoleName: string;
    imageUri?: string;
    url: string;
    benchmarkPriceYen?: number; // Starting listing price (Nomor 1)
    benchmarkPriceIdr?: number;
    benchmarkFormatted?: string;
  };
  conditionApplied: string;
  exchangeRate: ExchangeRateInfo;
  transactions: SnkrdunkTransaction[];
}

function formatRupiah(num: number): string {
  return 'Rp ' + Math.round(num).toLocaleString('id-ID');
}

function formatSnkrdunkDate(isoStr?: string): string {
  if (!isoStr) return 'Baru Saja';
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const day = d.getDate();
    return `${y}/${m}/${day}`;
  } catch {
    return isoStr;
  }
}

interface SnkrdunkConditionMapping {
  code: string;
  label: string;
  displayName: string;
}

/**
 * Maps system CardCondition to official SNKRDUNK condition codes & Japanese labels:
 * - A = Mint (trading_card_single_nearly_unused)
 * - B = Near Mint / Lightly Played (trading_card_single_little_scratches)
 * - C = Mildly Played (trading_card_single_medium_scratches)
 * - D = Highly Played / Damaged (trading_card_single_large_damages)
 * - PSA10 / PSA9 / PSA8以下
 * - BGS10 BL / BGS10 GL / BGS9.5 / BGS9以下
 * - ARS10+ / ARS10 / ARS9 / ARS8以下
 */
export function mapToSnkrdunkCondition(condition?: string): SnkrdunkConditionMapping {
  const c = (condition || '').toLowerCase().trim();

  // PSA
  if (c.includes('psa 10') || c.includes('psa10')) {
    return { code: 'trading_card_single_psa10', label: 'PSA10', displayName: 'PSA 10' };
  }
  if (c.includes('psa 9') || c.includes('psa9')) {
    return { code: 'trading_card_single_psa9', label: 'PSA9', displayName: 'PSA 9' };
  }
  if (c.includes('psa 8') || c.includes('psa8')) {
    return { code: 'trading_card_single_psa8_under', label: 'PSA8以下', displayName: 'PSA 8' };
  }

  // BGS
  if (c.includes('bgs 10 black') || c.includes('bgs10 bl') || c.includes('black label')) {
    return { code: 'trading_card_single_bgs10bl', label: 'BGS10 BL', displayName: 'BGS 10 Black Label' };
  }
  if (c.includes('bgs 10 gold') || c.includes('bgs10 gl') || c.includes('gold label')) {
    return { code: 'trading_card_single_bgs10gl', label: 'BGS10 GL', displayName: 'BGS 10 Gold Label' };
  }
  if (c.includes('bgs 9.5') || c.includes('bgs95') || c.includes('bgs 9,5')) {
    return { code: 'trading_card_single_bgs95', label: 'BGS9.5', displayName: 'BGS 9.5' };
  }
  if (c.includes('bgs 9') || c.includes('bgs9')) {
    return { code: 'trading_card_single_bgs9_less_than_or_equal', label: 'BGS9以下', displayName: 'BGS 9' };
  }

  // CGC 10 -> Setara PSA 10 di SNKRDUNK
  if (c.includes('cgc 10')) {
    return { code: 'trading_card_single_psa10', label: 'PSA10', displayName: 'CGC 10 (Setara PSA 10)' };
  }

  // ARS
  if (c.includes('ars 10+') || c.includes('ars10+')) {
    return { code: 'trading_card_single_ars10plus', label: 'ARS10+', displayName: 'ARS 10+' };
  }
  if (c.includes('ars 10') || c.includes('ars10')) {
    return { code: 'trading_card_single_ars10', label: 'ARS10', displayName: 'ARS 10' };
  }
  if (c.includes('ars 9') || c.includes('ars9')) {
    return { code: 'trading_card_single_ars9', label: 'ARS9', displayName: 'ARS 9' };
  }
  if (c.includes('ars 8') || c.includes('ars8')) {
    return { code: 'trading_card_single_ars8_less_than_or_equal', label: 'ARS8以下', displayName: 'ARS 8' };
  }

  // Raw Conditions:
  // A = Mint
  // B = Near Mint (NM) / Light played (LP)
  // C = Mildly Played (MP)
  // D = Highly Played (HP)
  if (c.includes('mint') && !c.includes('near')) {
    return { code: 'trading_card_single_nearly_unused', label: 'A', displayName: 'Kondisi A (Mint)' };
  }
  if (c.includes('nm') || c.includes('near mint') || c.includes('lp') || c.includes('lightly played') || c.includes('light played')) {
    return { code: 'trading_card_single_little_scratches', label: 'B', displayName: 'Kondisi B (NM / LP)' };
  }
  if (c.includes('mp') || c.includes('moderately played') || c.includes('mildly played') || c.includes('played')) {
    return { code: 'trading_card_single_medium_scratches', label: 'C', displayName: 'Kondisi C (Mildly Played)' };
  }
  if (c.includes('hp') || c.includes('heavily played') || c.includes('highly played') || c.includes('damaged') || c.includes('damage')) {
    return { code: 'trading_card_single_large_damages', label: 'D', displayName: 'Kondisi D (HP / Damaged)' };
  }

  if (c.includes('other') || c.includes('lainnya')) {
    return { code: 'trading_card_single_other_grading_company', label: '他鑑定品', displayName: 'Graded Other' };
  }

  // Default: Kondisi B (Near Mint)
  return { code: 'trading_card_single_little_scratches', label: 'B', displayName: 'Kondisi B (Near Mint)' };
}

export async function fetchSnkrdunkPrices(
  cardName: string,
  cardNumber?: string,
  cardSet?: string,
  condition?: string
): Promise<SnkrdunkResult | null> {
  try {
    const cleanCode = (cardNumber || '').split('/')[0].trim();
    const cleanName = (cardName || '').trim();

    // 1. Build targeted search queries
    const queries: string[] = [];
    if (cleanName && cleanCode) queries.push(`${cleanName} ${cleanCode}`);
    if (cleanCode) queries.push(cleanCode);
    if (cleanName) queries.push(cleanName);

    const uniqueQueries = Array.from(new Set(queries.filter((q) => q.length > 0)));

    let productUrl: string | null = null;
    let productTitle: string = '';
    let productImageUrl: string | undefined;

    for (const q of uniqueQueries) {
      const searchUrl = `https://snkrdunk.com/search?keywords=${encodeURIComponent(q)}`;
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        const res = await fetch(searchUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
          },
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!res.ok) continue;

        const html = await res.text();
        const $ = cheerio.load(html);

        const links = $('a[class*="productTile"], a[href*="/apparels/"], a[href*="/products/"]').toArray();
        for (const el of links) {
          const href = $(el).attr('href') || '';
          const fullUrl = href.startsWith('http') ? href : `https://snkrdunk.com${href}`;
          const title =
            $(el).find('[class*="productName"]').text().trim() ||
            $(el).attr('aria-label') ||
            $(el).find('img').attr('alt') ||
            '';
          const img = $(el).find('img').attr('src') || '';

          if (fullUrl.includes('/apparels/') || fullUrl.includes('/products/')) {
            if (!cleanCode || title.includes(cleanCode)) {
              productUrl = fullUrl;
              productTitle = title.replace(/\s+/g, ' ');
              productImageUrl = img || undefined;
              break;
            }
          }
        }

        if (productUrl) break;
      } catch (err) {
        console.warn('SNKRDUNK search attempt failed:', q, err);
      }
    }

    if (!productUrl) {
      return null;
    }

    // 2. Fetch live JPY to IDR exchange rate from Google Finance
    const jpyRate = await getGoogleFinanceJpyToIdrRate();

    // 3. Fetch product page to retrieve productCatalogId and condition starting prices (Nomor 1 & 2)
    const pController = new AbortController();
    const pTimeout = setTimeout(() => pController.abort(), 8000);

    const pRes = await fetch(productUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
      },
      signal: pController.signal,
    });
    clearTimeout(pTimeout);

    if (!pRes.ok) {
      return null;
    }

    const pHtml = await pRes.text();

    // Extract productCatalogId
    let catalogId: string | null = null;
    const catMatch =
      pHtml.match(/productCatalogId\\*":\s*([0-9]+)/) ||
      pHtml.match(/\/products\/([0-9]+)\/size-guide/) ||
      pHtml.match(/\/products\/([0-9]+)\//);

    if (catMatch) {
      catalogId = catMatch[1];
    } else {
      const urlMatch = productUrl.match(/\/products\/([0-9]+)/) || productUrl.match(/\/apparels\/([0-9]+)/);
      if (urlMatch) catalogId = urlMatch[1];
    }

    // Extract starting prices per condition from React Query hydration chips (Nomor 1 & Nomor 2)
    const chips: Array<{ conditionCode: string; text: string; usedMinPrice?: number }> = [];
    const rqMatches = pHtml.matchAll(
      /window\["__RQ_[^"]+"\]\s*=\s*window\["__RQ_[^"]+"\]\s*\|\|\s*\[\];\s*window\["__RQ_[^"]+"\]\.push\((\{[\s\S]*?\})\);/g
    );
    for (const m of rqMatches) {
      try {
        const data = JSON.parse(m[1]);
        for (const q of data.queries || []) {
          if (Array.isArray(q.state?.data?.data?.chips)) {
            chips.push(...q.state.data.data.chips);
          }
        }
      } catch (e) {}
    }

    // Map condition to SNKRDUNK condition code
    const mappedCondition = mapToSnkrdunkCondition(condition);
    const matchedChip = chips.find(
      (ch) => ch.conditionCode === mappedCondition.code || ch.text === mappedCondition.label
    );
    const benchmarkYen = matchedChip?.usedMinPrice;
    const benchmarkIdr = benchmarkYen ? Math.round(benchmarkYen * jpyRate.rate) : undefined;

    // 4. Fetch trading history from /v3/products/{catalogId}/trading-history with condition & 1枚 (Nomor 3 & 4)
    let trades: any[] = [];

    if (catalogId) {
      // Step A: Find variant_id for "1枚" (Nomor 3)
      const baseThUrl = `https://snkrdunk.com/v3/products/${catalogId}/trading-history`;
      let variantId: number | undefined;

      try {
        const thController = new AbortController();
        const thTimeout = setTimeout(() => thController.abort(), 6000);
        const thRes = await fetch(baseThUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            Accept: 'application/json',
          },
          signal: thController.signal,
        });
        clearTimeout(thTimeout);

        if (thRes.ok) {
          const thJson = await thRes.json();
          const singleOpt = thJson.filters?.variants?.options?.find(
            (opt: any) => opt.name === '1枚' || opt.name?.includes('1枚')
          );
          if (singleOpt) {
            variantId = singleOpt.id;
          }
        }
      } catch (err) {
        console.warn('SNKRDUNK base trading history error:', err);
      }

      // Step B: Query with specific condition_code (Nomor 2) and variant_id for 1枚 (Nomor 3)
      let filterUrl = `https://snkrdunk.com/v3/products/${catalogId}/trading-history?condition_code=${mappedCondition.code}`;
      if (variantId) {
        filterUrl += `&variant_id=${variantId}`;
      }

      try {
        const fController = new AbortController();
        const fTimeout = setTimeout(() => fController.abort(), 6000);
        const fRes = await fetch(filterUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            Accept: 'application/json',
          },
          signal: fController.signal,
        });
        clearTimeout(fTimeout);

        if (fRes.ok) {
          const fJson = await fRes.json();
          trades = fJson.trades || [];
        }
      } catch (err) {
        console.warn('SNKRDUNK filtered trading history error:', err);
      }

      // If no trades found for that exact condition, query 1枚 (all conditions) and filter
      if (trades.length === 0 && variantId) {
        try {
          const fallbackRes = await fetch(
            `https://snkrdunk.com/v3/products/${catalogId}/trading-history?variant_id=${variantId}`,
            {
              headers: {
                'User-Agent':
                  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                Accept: 'application/json',
              },
            }
          );
          if (fallbackRes.ok) {
            const fallbackJson = await fallbackRes.json();
            const matchingTrades = (fallbackJson.trades || []).filter(
              (t: any) => t.title === mappedCondition.label
            );
            trades = matchingTrades.length > 0 ? matchingTrades : (fallbackJson.trades || []).slice(0, 5);
          }
        } catch (err) {}
      }
    }

    // 5. Construct 5 latest transactions (Nomor 4)
    const transactions: SnkrdunkTransaction[] = [];

    trades.slice(0, 5).forEach((t: any) => {
      const priceYen = typeof t.price === 'number' ? t.price : parseInt(String(t.price).replace(/[^0-9]/g, ''), 10) || 0;
      if (priceYen > 0) {
        const idr = Math.round(priceYen * jpyRate.rate);
        transactions.push({
          date: formatSnkrdunkDate(t.soldAt),
          priceIdr: idr,
          priceFormatted: formatRupiah(idr),
          priceOrig: priceYen,
          priceOrigFormatted: `¥${priceYen.toLocaleString('ja-JP')}`,
          currency: 'JPY',
          title: `${t.title || mappedCondition.label} • ${t.label || '1枚'}`,
          quantity: t.label || '1枚',
          conditionLabel: t.title || mappedCondition.label,
        });
      }
    });

    // Fallback if no individual trades recorded but starting price is available
    if (transactions.length === 0 && benchmarkYen && benchmarkYen > 0) {
      const idr = Math.round(benchmarkYen * jpyRate.rate);
      transactions.push({
        date: 'Harga Mulai Pasar',
        priceIdr: idr,
        priceFormatted: formatRupiah(idr),
        priceOrig: benchmarkYen,
        priceOrigFormatted: `¥${benchmarkYen.toLocaleString('ja-JP')}~`,
        currency: 'JPY',
        title: `${mappedCondition.label} • 1枚 (Nilai Pasaran SNKRDUNK)`,
        quantity: '1枚',
        conditionLabel: mappedCondition.label,
      });
    }

    if (transactions.length === 0) {
      return null;
    }

    return {
      provider: 'snkrdunk',
      product: {
        id: catalogId || productUrl.replace(/[^0-9]/g, ''),
        name: productTitle || cleanName,
        consoleName: cardSet || 'SNKRDUNK Japan Market',
        imageUri: productImageUrl,
        url: productUrl,
        benchmarkPriceYen: benchmarkYen,
        benchmarkPriceIdr: benchmarkIdr,
        benchmarkFormatted: benchmarkYen ? `¥${benchmarkYen.toLocaleString('ja-JP')}~` : undefined,
      },
      conditionApplied: `${mappedCondition.displayName}`,
      exchangeRate: jpyRate,
      transactions,
    };
  } catch (error) {
    console.error('fetchSnkrdunkPrices error:', error);
    return null;
  }
}
