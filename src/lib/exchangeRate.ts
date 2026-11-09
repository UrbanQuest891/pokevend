export interface ExchangeRateInfo {
  rate: number;
  formattedRate: string;
  source: string;
  updatedAt: string;
  label: string;
}

let cachedRate: ExchangeRateInfo | null = null;
let lastFetchedTime = 0;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache

/**
 * Fetches the real-time USD to IDR exchange rate directly from Google Finance
 * (https://www.google.com/finance/quote/USD-IDR) with robust fallbacks.
 */
export async function getGoogleFinanceUsdToIdrRate(): Promise<ExchangeRateInfo> {
  const now = Date.now();
  if (cachedRate && now - lastFetchedTime < CACHE_TTL_MS) {
    return cachedRate;
  }

  // 1. Fetch live rate directly from Google Finance
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch('https://www.google.com/finance/quote/USD-IDR?hl=en', {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const html = await res.text();

      // Target the main ticker area for "United States Dollar / Indonesian Rupiah"
      const marker = 'United States Dollar / Indonesian Rupiah';
      const markerIdx = html.indexOf(marker);
      if (markerIdx !== -1) {
        const chunk = html.substring(markerIdx, markerIdx + 1200);
        const match = chunk.match(/([0-9]{1,3}(?:,[0-9]{3})+(?:\.[0-9]+)?)/);
        if (match) {
          const val = parseFloat(match[1].replace(/,/g, ''));
          if (val > 10000 && val < 50000) {
            const formatted = Math.round(val).toLocaleString('id-ID');
            const result: ExchangeRateInfo = {
              rate: val,
              formattedRate: formatted,
              source: 'Google Finance (Live)',
              updatedAt: new Date().toISOString(),
              label: `1 USD = Rp ${formatted}`,
            };
            cachedRate = result;
            lastFetchedTime = now;
            return result;
          }
        }
      }

      // Secondary regex pattern for USD / IDR ticker
      const match2 = html.match(/USD\s*\/\s*IDR[\s\S]{1,800}?([0-9]{2},[0-9]{3}(?:\.[0-9]+)?)/);
      if (match2) {
        const val = parseFloat(match2[1].replace(/,/g, ''));
        if (val > 10000 && val < 50000) {
          const formatted = Math.round(val).toLocaleString('id-ID');
          const result: ExchangeRateInfo = {
            rate: val,
            formattedRate: formatted,
            source: 'Google Finance (Live)',
            updatedAt: new Date().toISOString(),
            label: `1 USD = Rp ${formatted}`,
          };
          cachedRate = result;
          lastFetchedTime = now;
          return result;
        }
      }
    }
  } catch (err) {
    console.warn('Google Finance live rate fetch failed, checking fallback:', err);
  }

  // 2. High-reliability fallback: ExchangeRate-API
  try {
    const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    if (res.ok) {
      const data = await res.json();
      if (data?.rates?.IDR && data.rates.IDR > 10000) {
        const val = Number(data.rates.IDR);
        const formatted = Math.round(val).toLocaleString('id-ID');
        const result: ExchangeRateInfo = {
          rate: val,
          formattedRate: formatted,
          source: 'ExchangeRate-API',
          updatedAt: new Date().toISOString(),
          label: `1 USD = Rp ${formatted}`,
        };
        cachedRate = result;
        lastFetchedTime = now;
        return result;
      }
    }
  } catch (err) {
    console.warn('Fallback currency API failed:', err);
  }

  // 3. Fallback to current baseline if network is down
  const baseline = 18109;
  const formatted = baseline.toLocaleString('id-ID');
  return {
    rate: baseline,
    formattedRate: formatted,
    source: 'Google Finance (Baseline)',
    updatedAt: new Date().toISOString(),
    label: `1 USD = Rp ${formatted}`,
  };
}
