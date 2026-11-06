import fs from 'fs/promises';
import path from 'path';
import { AppData, Binder, PokemonCard, SellerProfile } from '@/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');

const INITIAL_PROFILE: SellerProfile = {
  sellerName: 'PokeVault Indonesia',
  boothName: 'Table #A-14 • Jakarta Card Show',
  eventCity: 'Jakarta',
  contactNumber: '081234567890',
  instagram: '@pokevault_id',
  currency: 'IDR',
  bannerNotice: '⚡ Flash Sale! Diskon 10% untuk pembelian 3 kartu atau lebih. QRIS / BCA / Cash Ready.',
};

const SAMPLE_BINDERS: Binder[] = [
  {
    id: 'binder-grail-hits',
    name: '🔥 Grail & Secret Rare Hits',
    description: 'Koleksi kartu top tier, Alternate Art, Special Illustration Rare (SIR), dan Vintage Holos terpilih.',
    sellerName: 'PokeVault Indonesia',
    boothName: 'Table #A-14',
    contactNumber: '081234567890',
    coverColor: '#DC2626', // Red
    badge: '🏆 Top Tier Hits',
    currency: 'IDR',
    layoutType: '9-pocket',
    totalPages: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    slots: {
      1: {
        id: 'card-1',
        name: 'Charizard ex #199/165',
        setName: 'Scarlet & Violet: 151',
        cardNumber: '199/165',
        rarity: 'Special Illustration Rare',
        condition: 'Raw - NM',
        price: 2450000,
        originalPrice: 2700000,
        status: 'AVAILABLE',
        imageUrl: 'https://images.pokemontcg.io/sv3pt5/199_hires.png',
        notes: 'Pack fresh, centering sangat bagus (9.5 candidate), swirl tidak ada.',
        updatedAt: new Date().toISOString(),
      },
      2: {
        id: 'card-2',
        name: 'Umbreon VMAX "Moonbreon" #215/203',
        setName: 'Sword & Shield: Evolving Skies',
        cardNumber: '215/203',
        rarity: 'Secret Rare Alt Art',
        condition: 'Graded - PSA 10',
        price: 15500000,
        originalPrice: 16500000,
        status: 'AVAILABLE',
        imageUrl: 'https://images.pokemontcg.io/swsh7/215_hires.png',
        notes: 'PSA 10 Gem Mint. Case mulus tanpa baret. Grail item!',
        updatedAt: new Date().toISOString(),
      },
      3: {
        id: 'card-3',
        name: 'Gengar VMAX Alt Art #271/264',
        setName: 'Sword & Shield: Fusion Strike',
        cardNumber: '271/264',
        rarity: 'Secret Rare Alt Art',
        condition: 'Raw - NM',
        price: 4800000,
        status: 'AVAILABLE',
        imageUrl: 'https://images.pokemontcg.io/swsh8/271_hires.png',
        notes: 'Sangat bersih, texture tajam, tidak ada whitening di sudut.',
        updatedAt: new Date().toISOString(),
      },
      4: {
        id: 'card-4',
        name: 'Pikachu "Grey Felt Hat" #085',
        setName: 'SVP Black Star Promos (Van Gogh)',
        cardNumber: '085',
        rarity: 'Promo',
        condition: 'Raw - Mint',
        price: 1850000,
        originalPrice: 2000000,
        status: 'AVAILABLE',
        imageUrl: 'https://images.pokemontcg.io/smp/SM85_hires.png',
        notes: 'Masih segel original sleeve (Sealed). Museum edition.',
        updatedAt: new Date().toISOString(),
      },
      5: {
        id: 'card-5',
        name: 'Giratina V Alt Art #186/196',
        setName: 'Sword & Shield: Lost Origin',
        cardNumber: '186/196',
        rarity: 'Ultra Rare Alt Art',
        condition: 'Raw - NM',
        price: 5200000,
        status: 'RESERVED',
        imageUrl: 'https://images.pokemontcg.io/swsh11/186_hires.png',
        notes: 'Sedang di-hold oleh buyer hingga pkl 14:00.',
        updatedAt: new Date().toISOString(),
      },
      6: {
        id: 'card-6',
        name: 'Rayquaza VMAX Alt Art #218/203',
        setName: 'Sword & Shield: Evolving Skies',
        cardNumber: '218/203',
        rarity: 'Secret Rare Alt Art',
        condition: 'Raw - NM',
        price: 6800000,
        originalPrice: 7200000,
        status: 'AVAILABLE',
        imageUrl: 'https://images.pokemontcg.io/swsh7/218_hires.png',
        notes: 'Kondisi istimewa, centering 50/50 simetris.',
        updatedAt: new Date().toISOString(),
      },
      7: {
        id: 'card-7',
        name: 'Mew ex Special Illustration Rare #232/091',
        setName: 'Paldean Fates',
        cardNumber: '232/091',
        rarity: 'Special Illustration Rare',
        condition: 'Raw - NM',
        price: 1650000,
        status: 'SOLD',
        imageUrl: 'https://images.pokemontcg.io/sv4pt5/232_hires.png',
        notes: 'Sudah laku terjual pagi tadi.',
        updatedAt: new Date().toISOString(),
      },
      8: {
        id: 'card-8',
        name: 'Iono Special Illustration Rare #269/193',
        setName: 'Scarlet & Violet: Paldea Evolved',
        cardNumber: '269/193',
        rarity: 'Special Illustration Rare',
        condition: 'Raw - NM',
        price: 1350000,
        originalPrice: 1500000,
        status: 'AVAILABLE',
        imageUrl: 'https://images.pokemontcg.io/sv2/269_hires.png',
        notes: 'Waifu card terfavorit SV era. Foil sangat bersih.',
        updatedAt: new Date().toISOString(),
      },
      9: {
        id: 'card-9',
        name: 'Charizard Base Set Unlimited #4/102',
        setName: 'Base Set (Vintage 1999)',
        cardNumber: '4/102',
        rarity: 'Holo Rare',
        condition: 'Raw - LP',
        price: 4900000,
        originalPrice: 5500000,
        status: 'AVAILABLE',
        imageUrl: 'https://images.pokemontcg.io/base1/4_hires.png',
        notes: 'Light Played vintage asli 1999. Holo foil terawat, minor edge wear di belakang.',
        updatedAt: new Date().toISOString(),
      },
      10: {
        id: 'card-10',
        name: 'Blastoise ex SIR #200/165',
        setName: 'Scarlet & Violet: 151',
        cardNumber: '200/165',
        rarity: 'Special Illustration Rare',
        condition: 'Raw - NM',
        price: 1100000,
        status: 'AVAILABLE',
        imageUrl: 'https://images.pokemontcg.io/sv3pt5/200_hires.png',
        notes: 'Artwork bawah laut legendaris. Flawless.',
        updatedAt: new Date().toISOString(),
      },
      11: {
        id: 'card-11',
        name: 'Venusaur ex SIR #198/165',
        setName: 'Scarlet & Violet: 151',
        cardNumber: '198/165',
        rarity: 'Special Illustration Rare',
        condition: 'Raw - NM',
        price: 950000,
        status: 'AVAILABLE',
        imageUrl: 'https://images.pokemontcg.io/sv3pt5/198_hires.png',
        notes: 'Cocok melengkapi trio starter Kanto 151.',
        updatedAt: new Date().toISOString(),
      },
      12: {
        id: 'card-12',
        name: 'Magikarp Illustration Rare #203/193',
        setName: 'Scarlet & Violet: Paldea Evolved',
        cardNumber: '203/193',
        rarity: 'Illustration Rare',
        condition: 'Raw - Mint',
        price: 1950000,
        originalPrice: 2200000,
        status: 'AVAILABLE',
        imageUrl: 'https://images.pokemontcg.io/sv2/203_hires.png',
        notes: 'Artwork Shinji Kanda terpopuler. Sangat langka ditarik!',
        updatedAt: new Date().toISOString(),
      },
    },
  },
  {
    id: 'binder-budget-singles',
    name: '⭐ Popular Singles & AR (Under Rp 500k)',
    description: 'Binder pilihan untuk kolektor budget, Art Rare (AR), Trainer Gallery, dan kartu playable.',
    sellerName: 'PokeVault Indonesia',
    boothName: 'Table #A-14',
    contactNumber: '081234567890',
    coverColor: '#2563EB', // Blue
    badge: '💸 Budget Friendly',
    currency: 'IDR',
    layoutType: '9-pocket',
    totalPages: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    slots: {
      1: {
        id: 'budget-1',
        name: 'Pikachu AR #173/165',
        setName: 'Scarlet & Violet: 151',
        cardNumber: '173/165',
        rarity: 'Illustration Rare',
        condition: 'Raw - NM',
        price: 380000,
        originalPrice: 420000,
        status: 'AVAILABLE',
        imageUrl: 'https://images.pokemontcg.io/sv3pt5/173_hires.png',
        notes: 'Pikachu manis bersama teman-teman starter.',
        updatedAt: new Date().toISOString(),
      },
      2: {
        id: 'budget-2',
        name: 'Mewtwo Promo #052',
        setName: 'Scarlet & Violet: 151 Ultra Premium',
        cardNumber: '052',
        rarity: 'Promo',
        condition: 'Raw - NM',
        price: 250000,
        status: 'AVAILABLE',
        imageUrl: 'https://images.pokemontcg.io/sv3pt5/52_hires.png',
        notes: 'Mewtwo AR gedung perkotaan malam hari.',
        updatedAt: new Date().toISOString(),
      },
      3: {
        id: 'budget-3',
        name: 'Charmander AR #168/165',
        setName: 'Scarlet & Violet: 151',
        cardNumber: '168/165',
        rarity: 'Illustration Rare',
        condition: 'Raw - NM',
        price: 450000,
        status: 'AVAILABLE',
        imageUrl: 'https://images.pokemontcg.io/sv3pt5/168_hires.png',
        notes: 'Artwork tebing ngintip.',
        updatedAt: new Date().toISOString(),
      },
      4: {
        id: 'budget-4',
        name: 'Squirtle AR #170/165',
        setName: 'Scarlet & Violet: 151',
        cardNumber: '170/165',
        rarity: 'Illustration Rare',
        condition: 'Raw - NM',
        price: 420000,
        status: 'AVAILABLE',
        imageUrl: 'https://images.pokemontcg.io/sv3pt5/170_hires.png',
        notes: 'Squirtle santai di pantai.',
        updatedAt: new Date().toISOString(),
      },
      5: {
        id: 'budget-5',
        name: 'Bulbasaur AR #166/165',
        setName: 'Scarlet & Violet: 151',
        cardNumber: '166/165',
        rarity: 'Illustration Rare',
        condition: 'Raw - NM',
        price: 390000,
        status: 'AVAILABLE',
        imageUrl: 'https://images.pokemontcg.io/sv3pt5/166_hires.png',
        notes: 'Bulbasaur tidur di dahan pohon.',
        updatedAt: new Date().toISOString(),
      },
    },
  },
];

async function ensureDataFile(): Promise<AppData> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const content = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(content);
  } catch {
    const defaultData: AppData = {
      profile: INITIAL_PROFILE,
      binders: SAMPLE_BINDERS,
    };
    try {
      await fs.writeFile(DATA_FILE, JSON.stringify(defaultData, null, 2), 'utf-8');
    } catch (err) {
      console.warn('Could not write to local store.json:', err);
    }
    return defaultData;
  }
}

async function persistData(data: AppData): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Failed to persist to file:', err);
  }
}

export async function getAppData(): Promise<AppData> {
  return await ensureDataFile();
}

export async function getProfile(): Promise<SellerProfile> {
  const data = await ensureDataFile();
  return data.profile;
}

export async function updateProfile(newProfile: Partial<SellerProfile>): Promise<SellerProfile> {
  const data = await ensureDataFile();
  data.profile = { ...data.profile, ...newProfile };
  await persistData(data);
  return data.profile;
}

export async function getBinders(): Promise<Binder[]> {
  const data = await ensureDataFile();
  return data.binders;
}

export async function getBinderById(id: string): Promise<Binder | null> {
  const data = await ensureDataFile();
  return data.binders.find((b) => b.id === id) || null;
}

export async function createBinder(binderInput: Omit<Binder, 'createdAt' | 'updatedAt' | 'slots'> & { slots?: Record<number, PokemonCard> }): Promise<Binder> {
  const data = await ensureDataFile();
  const now = new Date().toISOString();
  const newBinder: Binder = {
    ...binderInput,
    slots: binderInput.slots || {},
    createdAt: now,
    updatedAt: now,
  };
  data.binders.push(newBinder);
  await persistData(data);
  return newBinder;
}

export async function updateBinder(id: string, updates: Partial<Omit<Binder, 'id' | 'createdAt'>>): Promise<Binder | null> {
  const data = await ensureDataFile();
  const index = data.binders.findIndex((b) => b.id === id);
  if (index === -1) return null;

  data.binders[index] = {
    ...data.binders[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  await persistData(data);
  return data.binders[index];
}

export async function deleteBinder(id: string): Promise<boolean> {
  const data = await ensureDataFile();
  const initialLength = data.binders.length;
  data.binders = data.binders.filter((b) => b.id !== id);
  if (data.binders.length !== initialLength) {
    await persistData(data);
    return true;
  }
  return false;
}

export async function getSlotCard(binderId: string, slotNumber: number): Promise<{ binder: Binder; card: PokemonCard | null } | null> {
  const binder = await getBinderById(binderId);
  if (!binder) return null;
  const card = binder.slots[slotNumber] || null;
  return { binder, card };
}

export async function updateSlotCard(
  binderId: string,
  slotNumber: number,
  cardData: Partial<PokemonCard> & { name: string; price: number; condition: PokemonCard['condition'] }
): Promise<{ binder: Binder; card: PokemonCard } | null> {
  const data = await ensureDataFile();
  const binderIndex = data.binders.findIndex((b) => b.id === binderId);
  if (binderIndex === -1) return null;

  const now = new Date().toISOString();
  const existingCard = data.binders[binderIndex].slots[slotNumber];

  const updatedCard: PokemonCard = {
    id: existingCard?.id || `card-${Date.now()}-${slotNumber}`,
    name: cardData.name,
    setName: cardData.setName || 'Custom Set',
    cardNumber: cardData.cardNumber || '',
    rarity: cardData.rarity || 'Raw',
    condition: cardData.condition,
    price: Number(cardData.price) || 0,
    originalPrice: cardData.originalPrice ? Number(cardData.originalPrice) : undefined,
    status: cardData.status || 'AVAILABLE',
    imageUrl: cardData.imageUrl || 'https://images.pokemontcg.io/sv3pt5/199_hires.png',
    notes: cardData.notes || '',
    game: cardData.game || existingCard?.game || 'pokemon',
    updatedAt: now,
  };

  data.binders[binderIndex].slots[slotNumber] = updatedCard;
  data.binders[binderIndex].updatedAt = now;

  await persistData(data);
  return { binder: data.binders[binderIndex], card: updatedCard };
}

export async function removeCardFromSlot(binderId: string, slotNumber: number): Promise<boolean> {
  const data = await ensureDataFile();
  const binder = data.binders.find((b) => b.id === binderId);
  if (!binder || !binder.slots[slotNumber]) return false;

  delete binder.slots[slotNumber];
  binder.updatedAt = new Date().toISOString();
  await persistData(data);
  return true;
}

export async function quickToggleCardStatus(binderId: string, slotNumber: number, status: PokemonCard['status']): Promise<PokemonCard | null> {
  const data = await ensureDataFile();
  const binder = data.binders.find((b) => b.id === binderId);
  if (!binder || !binder.slots[slotNumber]) return null;

  binder.slots[slotNumber].status = status;
  binder.slots[slotNumber].updatedAt = new Date().toISOString();
  binder.updatedAt = new Date().toISOString();
  await persistData(data);
  return binder.slots[slotNumber];
}

export async function quickUpdatePrice(binderId: string, slotNumber: number, newPrice: number): Promise<PokemonCard | null> {
  const data = await ensureDataFile();
  const binder = data.binders.find((b) => b.id === binderId);
  if (!binder || !binder.slots[slotNumber]) return null;

  const currentPrice = binder.slots[slotNumber].price;
  binder.slots[slotNumber].originalPrice = currentPrice;
  binder.slots[slotNumber].price = newPrice;
  binder.slots[slotNumber].updatedAt = new Date().toISOString();
  binder.updatedAt = new Date().toISOString();
  await persistData(data);
  return binder.slots[slotNumber];
}

export async function bulkApplyDiscount(binderId: string, discountPercentage: number): Promise<number> {
  const data = await ensureDataFile();
  const binder = data.binders.find((b) => b.id === binderId);
  if (!binder) return 0;

  let count = 0;
  for (const slotKey in binder.slots) {
    const card = binder.slots[slotKey];
    if (card && card.status === 'AVAILABLE') {
      const orig = card.originalPrice || card.price;
      const factor = (100 - discountPercentage) / 100;
      card.originalPrice = orig;
      // Round to nearest 5000 if IDR, or round to 2 decimals
      const discounted = Math.max(1000, Math.round((orig * factor) / 5000) * 5000);
      card.price = discounted;
      card.updatedAt = new Date().toISOString();
      count++;
    }
  }

  binder.updatedAt = new Date().toISOString();
  await persistData(data);
  return count;
}

export async function resetToDefault(): Promise<AppData> {
  const defaultData: AppData = {
    profile: INITIAL_PROFILE,
    binders: SAMPLE_BINDERS,
  };
  await persistData(defaultData);
  return defaultData;
}
