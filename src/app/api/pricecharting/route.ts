import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { getGoogleFinanceUsdToIdrRate } from '@/lib/exchangeRate';

function formatRupiah(num: number): string {
  return 'Rp ' + Math.round(num).toLocaleString('id-ID');
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9&]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseDateStr(rawDate: string): string {
  const parts = rawDate.split('-');
  if (parts.length === 3) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const y = parts[0];
    const mIdx = parseInt(parts[1], 10) - 1;
    const d = parts[2].padStart(2, '0');
    if (mIdx >= 0 && mIdx < 12) {
      return `${d} ${months[mIdx]} ${y}`;
    }
  }
  return rawDate;
}

interface PriceChartingProduct {
  id: string;
  productName: string;
  consoleName: string;
  consoleUid?: string;
  imageUri?: string;
  price1?: string; // Ungraded
  price2?: string; // PSA 10
  price3?: string; // Grade 9
}

function matchBestProduct(
  products: PriceChartingProduct[],
  cardName: string,
  cardNumber?: string,
  cardSet?: string
): PriceChartingProduct | null {
  if (!products || products.length === 0) return null;

  const cleanNum = cardNumber
    ? cardNumber.split('/')[0].replace(/[^0-9a-zA-Z]/g, '').toLowerCase()
    : '';
  const cleanName = (cardName || '').toLowerCase().replace(/[^a-z0-9]/g, ' ');
  const cleanSet = (cardSet || '').toLowerCase();

  const scored = products.map((p) => {
    let score = 0;
    const pName = (p.productName || '').toLowerCase();
    const pConsole = (p.consoleName || '').toLowerCase();

    if (cleanNum) {
      if (
        pName.includes('#' + cleanNum) ||
        pName.includes(' ' + cleanNum) ||
        pName.endsWith(cleanNum) ||
        pName.includes(cleanNum)
      ) {
        score += 55;
      }
    }

    const nameTokens = cleanName.split(/\s+/).filter((t) => t.length > 1);
    let matchedTokens = 0;
    for (const t of nameTokens) {
      if (pName.includes(t)) matchedTokens++;
    }
    if (nameTokens.length > 0) {
      score += (matchedTokens / nameTokens.length) * 35;
    }

    if (cleanSet) {
      const setTokens = cleanSet.split(/\s+/).filter((t) => t.length > 2);
      for (const st of setTokens) {
        if (pConsole.includes(st) || pName.includes(st)) {
          score += 15;
        }
      }
    }

    return { product: p, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.product || null;
}

async function fetchRealSalesFromPriceCharting(
  consoleName: string,
  productName: string,
  condition: string,
  conversionRate: number
): Promise<Array<{ date: string; priceIdr: number; priceFormatted: string; priceUsd: number; title?: string }> | null> {
  try {
    const cSlug = slugify(consoleName);
    const pSlug = slugify(productName);
    const targetUrl = `https://www.pricecharting.com/game/${cSlug}/${pSlug}`;

    // Read full rendered HTML via Jina Reader to get the exact completed auctions table
    const jinaUrl = `https://r.jina.ai/${targetUrl}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(jinaUrl, {
      headers: {
        'X-Return-Format': 'html',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) return null;

    const html = await res.text();
    const $ = cheerio.load(html);

    // Determine target container based on condition
    let selector = '.completed-auctions-used';
    const condLower = (condition || '').toLowerCase();
    if (
      condLower.includes('psa 10') ||
      condLower.includes('cgc 10') ||
      condLower.includes('bgs 10')
    ) {
      selector = '.completed-auctions-manual-only';
    } else if (
      condLower.includes('psa 9') ||
      condLower.includes('grade 9') ||
      condLower.includes('bgs 9')
    ) {
      selector = '.completed-auctions-graded';
    } else if (condLower.includes('grade 8')) {
      selector = '.completed-auctions-box-only';
    } else if (condLower.includes('grade 7')) {
      selector = '.completed-auctions-cib';
    }

    const parseSales = (sel: string) => {
      const list: Array<{ date: string; priceIdr: number; priceFormatted: string; priceUsd: number; title?: string }> = [];
      $(`${sel} table tbody tr`).each((_, el) => {
        if (list.length >= 5) return false;
        const rawDate = $(el).find('td.date').text().trim();
        const rawTitle = $(el).find('td.title').text().trim().replace(/\[eBay\]/g, '').trim();
        const rawPrice = $(el).find('td.numeric .js-price').first().text().trim();

        const match = rawPrice.match(/\$\s*([0-9,]+(?:\.[0-9]{1,2})?)/);
        if (rawDate && match) {
          const usd = parseFloat(match[1].replace(/,/g, ''));
          const idr = Math.round(usd * conversionRate);
          list.push({
            date: parseDateStr(rawDate),
            priceIdr: idr,
            priceFormatted: formatRupiah(idr),
            priceUsd: usd,
            title: rawTitle || undefined,
          });
        }
      });
      return list;
    };

    let sales = parseSales(selector);
    if (sales.length === 0 && selector !== '.completed-auctions-used') {
      sales = parseSales('.completed-auctions-used');
    }
    if (sales.length === 0) {
      sales = parseSales('.completed-auctions-manual-only');
    }

    return sales.length > 0 ? sales : null;
  } catch (err) {
    console.warn('Real sales fetch from PriceCharting failed:', err);
    return null;
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const cardName = searchParams.get('name') || '';
    const cardNumber = searchParams.get('number') || '';
    const cardSet = searchParams.get('set') || '';
    const condition = searchParams.get('condition') || 'Raw - NM';

    if (!cardName.trim()) {
      return NextResponse.json(
        { success: false, error: 'Nama kartu diperlukan untuk mencari harga referensi.' },
        { status: 400 }
      );
    }

    const cleanNum = cardNumber ? cardNumber.split('/')[0].trim() : '';

    // Search variants on PriceCharting
    const queries = [
      `${cardName} ${cleanNum} ${cardSet}`.trim(),
      `${cardName} ${cleanNum}`.trim(),
      `${cardName} ${cardSet}`.trim(),
      cardName.trim(),
    ].filter((q, idx, arr) => q.length > 0 && arr.indexOf(q) === idx);

    let matchedProduct: PriceChartingProduct | null = null;

    for (const q of queries) {
      try {
        const pcRes = await fetch(
          `https://www.pricecharting.com/api/search-products?q=${encodeURIComponent(q)}`,
          {
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
              Accept: 'application/json',
            },
            next: { revalidate: 3600 },
          }
        );

        if (!pcRes.ok) continue;

        const data = await pcRes.json();
        if (Array.isArray(data.products) && data.products.length > 0) {
          const match = matchBestProduct(data.products, cardName, cardNumber, cardSet);
          if (match) {
            matchedProduct = match;
            break;
          }
        }
      } catch (err) {
        console.warn('Error fetching PriceCharting search query:', q, err);
      }
    }

    if (!matchedProduct) {
      return NextResponse.json({
        success: false,
        error: `Kartu "${cardName}" tidak ditemukan di PriceCharting. Coba periksa nama atau nomor kartu.`,
      });
    }

    // Determine condition label
    const condLower = (condition || '').toLowerCase();
    let conditionLabel = 'Ungraded / Raw';
    if (condLower.includes('psa 10') || condLower.includes('cgc 10') || condLower.includes('bgs 10')) {
      conditionLabel = 'Graded PSA 10';
    } else if (condLower.includes('psa 9') || condLower.includes('grade 9') || condLower.includes('bgs 9')) {
      conditionLabel = 'Graded 9';
    } else if (condLower.includes('grade 8')) {
      conditionLabel = 'Graded 8';
    } else if (condLower.includes('grade 7')) {
      conditionLabel = 'Graded 7';
    } else if (condLower.includes('lp')) {
      conditionLabel = 'Raw - Lightly Played (LP)';
    }

    const cSlug = slugify(matchedProduct.consoleName);
    const pSlug = slugify(matchedProduct.productName);
    const productUrl = `https://www.pricecharting.com/game/${cSlug}/${pSlug}`;

    // Fetch live Google Finance USD to IDR exchange rate
    const exchangeInfo = await getGoogleFinanceUsdToIdrRate();

    // Fetch REAL historical completed sales directly from the PriceCharting product page
    const realTransactions = await fetchRealSalesFromPriceCharting(
      matchedProduct.consoleName,
      matchedProduct.productName,
      condition,
      exchangeInfo.rate
    );

    if (realTransactions && realTransactions.length > 0) {
      return NextResponse.json({
        success: true,
        product: {
          id: matchedProduct.id,
          name: matchedProduct.productName,
          consoleName: matchedProduct.consoleName,
          imageUri: matchedProduct.imageUri,
          url: productUrl,
        },
        conditionApplied: conditionLabel,
        exchangeRate: exchangeInfo,
        transactions: realTransactions,
      });
    }

    // If real transaction list is not available on page, use official aggregate benchmark price
    let fallbackUsd = 0;
    if (conditionLabel === 'Graded PSA 10') {
      fallbackUsd = parseFloat((matchedProduct.price2 || '').replace(/[^0-9.]/g, '')) || 0;
    } else if (conditionLabel === 'Graded 9') {
      fallbackUsd = parseFloat((matchedProduct.price3 || '').replace(/[^0-9.]/g, '')) || 0;
    } else {
      fallbackUsd = parseFloat((matchedProduct.price1 || '').replace(/[^0-9.]/g, '')) || 0;
    }

    if (fallbackUsd > 0) {
      const fallbackIdr = Math.round(fallbackUsd * exchangeInfo.rate);
      return NextResponse.json({
        success: true,
        product: {
          id: matchedProduct.id,
          name: matchedProduct.productName,
          consoleName: matchedProduct.consoleName,
          imageUri: matchedProduct.imageUri,
          url: productUrl,
        },
        conditionApplied: conditionLabel,
        exchangeRate: exchangeInfo,
        transactions: [
          {
            date: 'Benchmark Pasar',
            priceIdr: fallbackIdr,
            priceFormatted: formatRupiah(fallbackIdr),
            priceUsd: fallbackUsd,
            title: `Harga Rata-Rata ${conditionLabel} PriceCharting`,
          },
        ],
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Tidak ditemukan riwayat transaksi untuk kartu ini di PriceCharting.',
    });
  } catch (error) {
    console.error('PriceCharting route error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kendala saat menghubungkan ke PriceCharting.' },
      { status: 500 }
    );
  }
}
