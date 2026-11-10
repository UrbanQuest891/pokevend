import translations from './translationsData.json';

// Basic Kana to Romaji table for fallback
const KANA_MAP: Record<string, string> = {
  ア: 'a', イ: 'i', ウ: 'u', エ: 'e', オ: 'o',
  カ: 'ka', キ: 'ki', ク: 'ku', ケ: 'ke', コ: 'ko',
  サ: 'sa', シ: 'shi', ス: 'su', セ: 'se', ソ: 'so',
  タ: 'ta', チ: 'chi', ツ: 'tsu', テ: 'te', ト: 'to',
  ナ: 'na', ニ: 'ni', ヌ: 'nu', ネ: 'ne', ノ: 'no',
  ハ: 'ha', ヒ: 'hi', フ: 'fu', ヘ: 'he', ホ: 'ho',
  マ: 'ma', ミ: 'mi', ム: 'mu', メ: 'me', モ: 'mo',
  ヤ: 'ya', ユ: 'yu', ヨ: 'yo',
  ラ: 'ra', リ: 'ri', ル: 'ru', レ: 're', ロ: 'ro',
  ワ: 'wa', ヲ: 'wo', ン: 'n',
  ガ: 'ga', ギ: 'gi', グ: 'gu', ゲ: 'ge', ゴ: 'go',
  ザ: 'za', ジ: 'ji', ズ: 'zu', ゼ: 'ze', ゾ: 'zo',
  ダ: 'da', ヂ: 'ji', ヅ: 'zu', デ: 'de', ド: 'do',
  バ: 'ba', ビ: 'bi', ブ: 'bu', ベ: 'be', ボ: 'bo',
  パ: 'pa', ピ: 'pi', プ: 'pu', ペ: 'pe', ポ: 'po',
  キャ: 'kya', キュ: 'kyu', キョ: 'kyo',
  シャ: 'sha', シュ: 'shu', ショ: 'sho',
  チャ: 'cha', チュ: 'chu', チョ: 'cho',
  ニャ: 'nya', ニュ: 'nyu', ニョ: 'nyo',
  ヒャ: 'hya', ヒュ: 'hyu', ヒョ: 'hyo',
  ミャ: 'mya', ミュ: 'myu', ミョ: 'myo',
  リャ: 'rya', リュ: 'ryu', リョ: 'ryo',
  ギャ: 'gya', ギュ: 'gyu', ギョ: 'gyo',
  ジャ: 'ja', ジュ: 'ju', ジョ: 'jo',
  ビャ: 'bya', ビュ: 'byu', ビョ: 'byo',
  ピャ: 'pya', ピュ: 'pyu', ピョ: 'pyo',
  ヴ: 'v', ッ: '', ー: '', '・': ' ',
};

export function hasNonLatin(text?: string): boolean {
  if (!text) return false;
  return /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/.test(text);
}

export function kanaToRomaji(kana: string): string {
  let result = '';
  let i = 0;
  while (i < kana.length) {
    // Check 2-character combo first (e.g. キャ, チュ)
    const two = kana.slice(i, i + 2);
    if (KANA_MAP[two]) {
      result += KANA_MAP[two];
      i += 2;
      continue;
    }
    const one = kana[i];
    if (one === 'ッ' && i + 1 < kana.length) {
      // Double the consonant of next kana
      const nextOne = kana[i + 1];
      const nextRom = KANA_MAP[nextOne] || '';
      if (nextRom) {
        result += nextRom[0];
      }
      i++;
      continue;
    }
    if (KANA_MAP[one] !== undefined) {
      result += KANA_MAP[one];
    } else {
      result += one;
    }
    i++;
  }
  // Capitalize words
  return result
    .split(' ')
    .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1).toLowerCase() : ''))
    .join(' ')
    .trim();
}

/**
 * Translates a card name to official English / Latin alphabet.
 */
export function translateCardName(
  rawName: string,
  cardNumber?: string,
  game?: string,
  lang?: string
): string {
  if (!rawName) return '';

  const cleanName = rawName.trim();
  const cleanCode = (cardNumber || '').split('/')[0].trim().toUpperCase();

  // 1. If game is One Piece:
  if (game === 'onepiece' || /^(OP|EB|ST|PRB|P)-/i.test(cleanCode)) {
    // Check direct English card code mapping
    if (cleanCode && (translations.opCodeToName as Record<string, string>)[cleanCode]) {
      const en = (translations.opCodeToName as Record<string, string>)[cleanCode];
      // Format dots in One Piece names: "Monkey.D.Luffy" -> "Monkey D. Luffy"
      return en.replace(/\./g, ' ').replace(/\s+/g, ' ').trim();
    }

    // Check character name dictionary
    for (const [jp, en] of Object.entries(translations.opJpNameToEn)) {
      if (cleanName.includes(jp)) {
        return cleanName.replace(jp, en).replace(/[・]/g, ' ').trim();
      }
    }
  }

  // 2. If game is Pokémon or contains Pokémon patterns:
  // Separate suffixes like " ex", " VMAX", " VSTAR", " V", " GX"
  const suffixMatch = cleanName.match(/\s*(ex|EX|VMAX|VSTAR|V-UNION|V|GX|TAG TEAM|LV\.X|BREAK|Star|Prime)$/i);
  const suffix = suffixMatch ? ' ' + suffixMatch[1] : '';
  const baseName = suffixMatch ? cleanName.replace(suffixMatch[0], '').trim() : cleanName;

  // Check Pokemon Japanese Species dictionary
  if ((translations.pkmnJpToEn as Record<string, string>)[baseName]) {
    return (translations.pkmnJpToEn as Record<string, string>)[baseName] + suffix;
  }

  // Check Pokemon Japanese Trainer dictionary
  if ((translations.pkmnTrainerJpToEn as Record<string, string>)[baseName]) {
    return (translations.pkmnTrainerJpToEn as Record<string, string>)[baseName];
  }

  // Check Pokemon Chinese dictionary
  if ((translations.pkmnCnToEn as Record<string, string>)[baseName]) {
    return (translations.pkmnCnToEn as Record<string, string>)[baseName] + suffix;
  }

  // Check partial match for Pokemon names (e.g. かがやくリザードン -> Radiant Charizard)
  if (baseName.startsWith('かがやく')) {
    const core = baseName.replace('かがやく', '').trim();
    if ((translations.pkmnJpToEn as Record<string, string>)[core]) {
      return `Radiant ${(translations.pkmnJpToEn as Record<string, string>)[core]}${suffix}`;
    }
  }
  if (baseName.startsWith('わるい')) {
    const core = baseName.replace('わるい', '').trim();
    if ((translations.pkmnJpToEn as Record<string, string>)[core]) {
      return `Dark ${(translations.pkmnJpToEn as Record<string, string>)[core]}${suffix}`;
    }
  }

  // Fallback: If it has Japanese Kana, transliterate to Romaji
  if (hasNonLatin(cleanName)) {
    const romaji = kanaToRomaji(baseName);
    if (romaji && romaji !== baseName) {
      return romaji + suffix;
    }
  }

  return cleanName;
}

/**
 * Translates a card set name to official English / Latin alphabet.
 */
export function translateCardSet(
  rawSet: string,
  cardNumber?: string,
  game?: string,
  lang?: string
): string {
  if (!rawSet) return '';
  const cleanSet = rawSet.trim();
  const cleanCode = (cardNumber || '').split('/')[0].trim().toUpperCase();

  // 1. One Piece:
  if (game === 'onepiece' || /^(OP|EB|ST|PRB|P)-/i.test(cleanCode)) {
    if (cleanCode && (translations.opCodeToSet as Record<string, string>)[cleanCode]) {
      return (translations.opCodeToSet as Record<string, string>)[cleanCode];
    }
    for (const [jp, en] of Object.entries(translations.opSetNames)) {
      if (cleanSet.includes(jp)) {
        return cleanSet.replace(jp, en);
      }
    }
  }

  // 2. Pokemon:
  for (const [jp, en] of Object.entries(translations.pkmnSetJpToEn)) {
    if (cleanSet.includes(jp)) {
      return cleanSet.replace(jp, en);
    }
  }

  return cleanSet;
}

/**
 * Formats a display title for UI:
 * If the card name was in Japanese/Chinese, returns the Latin name,
 * and optionally includes the original in parentheses if desired.
 */
export function formatCardDisplayName(
  name?: string,
  cardNumber?: string,
  setName?: string,
  game?: string
): string {
  if (!name) return 'Unknown Card';
  if (!hasNonLatin(name)) {
    return name;
  }
  const translated = translateCardName(name, cardNumber, game);
  if (translated && translated !== name) {
    return translated;
  }
  return name;
}
