/**
 * onepieceCatalog.ts
 * Starter catalog & popular hits for One Piece Card Game (OPCG)
 * Supporting both Japanese (JP) and English (EN) sets.
 */

export interface OnePieceTemplate {
  id: string;
  name: string;
  nameJp?: string;
  setName: string;
  cardNumber: string;
  rarity: string;
  language: 'JP' | 'EN';
  imageUrl: string;
  defaultPriceIdr: number;
  category: 'Leader' | 'Character' | 'Event' | 'Stage';
}

export const ONE_PIECE_TEMPLATES: OnePieceTemplate[] = [
  {
    id: 'op05-119-manga',
    name: 'Monkey.D.Luffy (Gear 5 Manga Rare)',
    nameJp: 'モンキー・D・ルフィ (コミパラ / ニカ)',
    setName: 'OP-05 Awakening of the New Era / 新時代の主役',
    cardNumber: 'OP05-119',
    rarity: 'SEC-SP (Manga Rare)',
    language: 'EN',
    imageUrl: 'https://images.pokemontcg.io/sv3pt5/199_hires.png', // Fallback or direct high-res
    defaultPriceIdr: 35000000,
    category: 'Character',
  },
  {
    id: 'op05-119-manga-jp',
    name: 'モンキー・D・ルフィ (ギア5 コミパラ)',
    nameJp: 'モンキー・D・ルフィ (SEC-SP)',
    setName: 'OP-05 新時代の主役',
    cardNumber: 'OP05-119',
    rarity: 'SEC-SP (コミパラ)',
    language: 'JP',
    imageUrl: 'https://asia.pokemon-card.com/id/card-img/id00019876.png',
    defaultPriceIdr: 45000000,
    category: 'Character',
  },
  {
    id: 'op01-120-shanks',
    name: 'Shanks (Manga Rare)',
    nameJp: 'シャンクス (コミパラ)',
    setName: 'OP-01 Romance Dawn / 頂上決戦',
    cardNumber: 'OP01-120',
    rarity: 'SEC-SP (Manga Rare)',
    language: 'EN',
    imageUrl: '',
    defaultPriceIdr: 18000000,
    category: 'Character',
  },
  {
    id: 'op02-013-ace',
    name: 'Portgas.D.Ace (Manga Rare)',
    nameJp: 'ポートガス・D・エース (コミパラ)',
    setName: 'OP-02 Paramount War / 頂上決戦',
    cardNumber: 'OP02-013',
    rarity: 'SR-SP (Manga Rare)',
    language: 'EN',
    imageUrl: '',
    defaultPriceIdr: 15000000,
    category: 'Character',
  },
  {
    id: 'op06-118-zoro',
    name: 'Roronoa Zoro (Manga Rare)',
    nameJp: 'ロロノア・ゾロ (コミパラ)',
    setName: 'OP-06 Wings of the Captain / 双璧の覇者',
    cardNumber: 'OP06-118',
    rarity: 'SEC-SP (Manga Rare)',
    language: 'JP',
    imageUrl: '',
    defaultPriceIdr: 22000000,
    category: 'Character',
  },
  {
    id: 'op01-016-nami',
    name: 'Nami (Alternate Art / Parallel)',
    nameJp: 'ナミ (パラレル)',
    setName: 'OP-01 Romance Dawn',
    cardNumber: 'OP01-016',
    rarity: 'R-P (Parallel)',
    language: 'EN',
    imageUrl: '',
    defaultPriceIdr: 3500000,
    category: 'Character',
  },
  {
    id: 'op01-078-boa',
    name: 'Boa Hancock (Parallel / SP)',
    nameJp: 'ボア・ハンコック (パラレル)',
    setName: 'OP-01 Romance Dawn',
    cardNumber: 'OP01-078',
    rarity: 'SR-P (Parallel)',
    language: 'JP',
    imageUrl: '',
    defaultPriceIdr: 4500000,
    category: 'Character',
  },
  {
    id: 'op01-047-law',
    name: 'Trafalgar Law (Leader Parallel)',
    nameJp: 'トラファルガー・ロー (Lパラレル)',
    setName: 'OP-01 Romance Dawn',
    cardNumber: 'OP01-047',
    rarity: 'L-P (Leader Parallel)',
    language: 'EN',
    imageUrl: '',
    defaultPriceIdr: 2800000,
    category: 'Leader',
  },
];

export const ONE_PIECE_SETS = [
  { code: 'OP-09', name: 'OP-09 The New Emperor / 新たなる皇帝', lang: 'Both' },
  { code: 'OP-08', name: 'OP-08 Two Legends / 二つの伝説', lang: 'Both' },
  { code: 'OP-07', name: 'OP-07 500 Years in the Future / 500年後の未来', lang: 'Both' },
  { code: 'OP-06', name: 'OP-06 Wings of the Captain / 双璧の覇者', lang: 'Both' },
  { code: 'OP-05', name: 'OP-05 Awakening of the New Era / 新時代の主役', lang: 'Both' },
  { code: 'OP-04', name: 'OP-04 Kingdoms of Intrigue / 謀略の王国', lang: 'Both' },
  { code: 'OP-03', name: 'OP-03 Pillars of Strength / 強大な敵', lang: 'Both' },
  { code: 'OP-02', name: 'OP-02 Paramount War / 頂上決戦', lang: 'Both' },
  { code: 'OP-01', name: 'OP-01 Romance Dawn / ロマンスドーン', lang: 'Both' },
  { code: 'EB-01', name: 'EB-01 Extra Booster Memorial Collection / メモリアルコレクション', lang: 'Both' },
  { code: 'PRB-01', name: 'PRB-01 Premium Booster ONE PIECE CARD THE BEST', lang: 'Both' },
  { code: 'ST-10', name: 'ST-10 Ultra Deck: The Three Captains', lang: 'Both' },
];
