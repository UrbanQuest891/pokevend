import QRCode from 'qrcode';

export async function generateQrDataUrl(text: string, options?: QRCode.QRCodeToDataURLOptions): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width: options?.width || 300,
      margin: options?.margin ?? 1,
      color: {
        dark: options?.color?.dark || '#000000',
        light: options?.color?.light || '#ffffff',
      },
      errorCorrectionLevel: 'M',
      ...options,
    });
  } catch (err) {
    console.error('Error generating QR code:', err);
    return '';
  }
}

export async function generateQrSvg(text: string): Promise<string> {
  try {
    return await QRCode.toString(text, {
      type: 'svg',
      margin: 1,
      errorCorrectionLevel: 'M',
    });
  } catch (err) {
    console.error('Error generating QR SVG:', err);
    return '';
  }
}

export function formatCurrency(amount: number, currency: 'IDR' | 'USD' = 'IDR'): string {
  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    }).format(amount);
  }
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}
