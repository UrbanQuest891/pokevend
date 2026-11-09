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

interface ParsedCardCode {
  raw: string;
  beforeSlash: string;
  normNum?: string;
  rawNum?: string;
  prefix?: string;
  fullCode?: string;
  tokens: string[];
}

function parseCardCode(cardNumber?: string): ParsedCardCode | null {
  if (!cardNumber || !cardNumber.trim()) return null;
  const raw = cardNumber.trim();
  const beforeSlash = raw.split('/')[0].trim();
  const tokens = new Set<string>();

  tokens.add(beforeSlash.toLowerCase());

  let normNum: string | undefined;
  let rawNum: string | undefined;
  let prefix: string | undefined;
  let fullCode: string | undefined;

  // Pattern 1: Explicit separator e.g. "OGN-039", "OP05-060", "ST01-001", "SWSH-215"
  const separatedMatch = beforeSlash.match(/^([A-Za-z0-9]+)[-_ ]+0*([0-9]+)$/);
  if (separatedMatch) {
    prefix = separatedMatch[1];
    normNum = separatedMatch[2];
    rawNum = beforeSlash.replace(/^[A-Za-z0-9]+[-_ ]+/, '');
    fullCode = beforeSlash;

    tokens.add(normNum);
    tokens.add(rawNum);
    tokens.add(beforeSlash.toLowerCase());
    tokens.add(`${prefix.toLowerCase()}-${normNum}`);
    tokens.add(`${prefix.toLowerCase()}${normNum}`);
  } else {
    // Pattern 2: Pure number e.g. "215", "025", "199"
    const pureNumMatch = beforeSlash.match(/^0*([0-9]+)$/);
    if (pureNumMatch) {
      normNum = pureNumMatch[1];
      rawNum = beforeSlash;
      tokens.add(normNum);
      tokens.add(rawNum);
    } else {
      // Pattern 3: Prefix without separator e.g. "SWSH215" or "P001"
      const unseparatedMatch = beforeSlash.match(/^([A-Za-z]+)0*([0-9]+)$/);
      if (unseparatedMatch) {
        prefix = unseparatedMatch[1];
        normNum = unseparatedMatch[2];
        rawNum = beforeSlash.replace(/^[A-Za-z]+/, '');
        fullCode = beforeSlash;
        tokens.add(normNum);
        tokens.add(rawNum);
        tokens.add(beforeSlash.toLowerCase());
      }
    }
  }

  return {
    raw,
    beforeSlash,
    normNum,
    rawNum,
    prefix,
    fullCode,
    tokens: Array.from(tokens).filter((t) => t.length > 0),
  };
}

function buildSearchQueries(
  cardName: string,
  parsedCode: ParsedCardCode | null,
  cardSet?: string
): string[] {
  const cleanName = (cardName || '').trim();
  const queries: string[] = [];

  if (parsedCode) {
    // 1. Combined keyword: Card Name + Full Code (e.g. "Kai'Sa OGN-039", "Monkey.D.Luffy OP05-060")
    if (parsedCode.fullCode && /[A-Za-z]/.test(parsedCode.fullCode)) {
      queries.push(`${cleanName} ${parsedCode.fullCode}`);
    }

    // 2. Combined keyword: Card Name + Normalized Number (e.g. "Kai'Sa 39", "Umbreon VMAX 215", "Charizard ex 199")
    if (parsedCode.normNum) {
      queries.push(`${cleanName} ${parsedCode.normNum}`);
      queries.push(`${cleanName} #${parsedCode.normNum}`);
    }

    // 3. Full Code alone (especially effective for One Piece "OP05-060")
    if (parsedCode.fullCode && /[A-Za-z]/.test(parsedCode.fullCode)) {
      queries.push(parsedCode.fullCode);
    }

    // 4. Combined keyword: Card Name + Raw Number (e.g. "Kai'Sa 039", "Pikachu 025")
    if (parsedCode.rawNum && parsedCode.rawNum !== parsedCode.normNum) {
      queries.push(`${cleanName} ${parsedCode.rawNum}`);
    }
  }

  // 5. Combined with Set Name
  if (cardSet && cleanName) {
    const cleanSet = cardSet.replace(/\([^)]*\)/g, '').trim();
    if (parsedCode?.normNum) {
      queries.push(`${cleanName} ${parsedCode.normNum} ${cleanSet}`);
    }
    queries.push(`${cleanName} ${cleanSet}`);
  }

  // 6. Last fallback: Card Name alone
  if (cleanName) {
    queries.push(cleanName);
  }

  return Array.from(new Set(queries.map((q) => q.trim()))).filter((q) => q.length > 0);
}

function matchBestProduct(
  products: PriceChartingProduct[],
  cardName: string,
  parsedCode: ParsedCardCode | null,
  cardSet?: string,
  game?: string
): PriceChartingProduct | null {
  if (!products || products.length === 0) return null;

  const cleanName = (cardName || '').toLowerCase().replace(/[^a-z0-9]/g, ' ');
  const cleanSet = (cardSet || '').toLowerCase();
  const gLower = (game || '').toLowerCase();

  const scored = products.map((p) => {
    let score = 0;
    const pName = (p.productName || '').toLowerCase();
    const pConsole = (p.consoleName || '').toLowerCase();

    // 1. Card Code / Number Matching (Highest Priority)
    if (parsedCode) {
      const pNumMatch = pName.match(/#([0-9]+)/);
      const pProductNum = pNumMatch ? pNumMatch[1] : null;

      if (parsedCode.fullCode && pName.includes(parsedCode.fullCode.toLowerCase())) {
        score += 150;
      } else if (parsedCode.normNum && pProductNum === parsedCode.normNum) {
        score += 150;
      } else {
        for (const tok of parsedCode.tokens) {
          if (pName.includes('#' + tok) || pName.includes(' ' + tok) || pName.endsWith(tok)) {
            score += 90;
            break;
          }
        }
      }

      // Penalty if product explicitly contains a contradictory #number
      if (pProductNum && parsedCode.normNum && pProductNum !== parsedCode.normNum) {
        score -= 100;
      }
    }

    // 2. Card Name Matching
    const nameTokens = cleanName.split(/\s+/).filter((t) => t.length > 1);
    let matchedNameTokens = 0;
    for (const t of nameTokens) {
      if (pName.includes(t)) matchedNameTokens++;
    }
    if (nameTokens.length > 0) {
      score += (matchedNameTokens / nameTokens.length) * 40;
    }

    // 3. Game Matching (Riftbound, Pokemon, One Piece)
    if (gLower) {
      if (gLower === 'riftbound' && pConsole.includes('riftbound')) score += 50;
      else if (gLower === 'pokemon' && pConsole.includes('pokemon')) score += 50;
      else if (gLower === 'onepiece' && pConsole.includes('one piece')) score += 50;
    }

    // 4. Set Matching
    if (cleanSet) {
      const setTokens = cleanSet.split(/\s+/).filter((t) => t.length > 2);
      for (const st of setTokens) {
        if (pConsole.includes(st) || pName.includes(st)) {
          score += 25;
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
    const game = searchParams.get('game') || '';

    if (!cardName.trim()) {
      return NextResponse.json(
        { success: false, error: 'Nama kartu diperlukan untuk mencari harga referensi.' },
        { status: 400 }
      );
    }

    // Parse card code & number
    const parsedCode = parseCardCode(cardNumber);

    // Build targeted search queries using combined keyword: card name + card code
    const queries = buildSearchQueries(cardName, parsedCode, cardSet);

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
          const match = matchBestProduct(data.products, cardName, parsedCode, cardSet, game);
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
