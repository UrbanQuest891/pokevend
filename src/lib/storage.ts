import fs from 'fs/promises';
import path from 'path';
import { AppData, Binder, CardCondition, CardStatus, BinderLayout, PokemonCard, SellerProfile } from '@/types';
import prisma from './prisma';

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
    coverColor: '#DC2626',
    badge: '🏆 Top Tier Hits',
    currency: 'IDR',
    layoutType: '9-pocket',
    totalPages: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    slots: {},
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

function mapPrismaSlotToPokemonCard(slot: any): PokemonCard {
  return {
    id: slot.id,
    name: slot.name,
    setName: slot.setName || '',
    cardNumber: slot.cardNumber || '',
    rarity: slot.rarity || '',
    condition: (slot.condition as CardCondition) || 'Raw - NM',
    price: Number(slot.price) || 0,
    originalPrice: slot.originalPrice != null ? Number(slot.originalPrice) : undefined,
    status: (slot.status as CardStatus) || 'AVAILABLE',
    imageUrl: slot.imageUrl || '',
    notes: slot.notes || '',
    game: slot.game || 'pokemon',
    updatedAt: slot.updatedAt ? new Date(slot.updatedAt).toISOString() : new Date().toISOString(),
  };
}

function mapPrismaBinderToBinder(b: any): Binder {
  const slotsRecord: Record<number, PokemonCard> = {};
  if (b.slots && Array.isArray(b.slots)) {
    for (const s of b.slots) {
      slotsRecord[s.slotNumber] = mapPrismaSlotToPokemonCard(s);
    }
  }
  return {
    id: b.id,
    name: b.name,
    description: b.description || '',
    sellerName: b.sellerName || '',
    boothName: b.boothName || '',
    contactNumber: b.contactNumber || '',
    coverColor: b.coverColor || '#3B82F6',
    badge: b.badge || '',
    currency: (b.currency as 'IDR' | 'USD') || 'IDR',
    layoutType: (b.layoutType as BinderLayout) || '9-pocket',
    totalPages: b.totalPages || 3,
    slots: slotsRecord,
    createdAt: b.createdAt ? new Date(b.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: b.updatedAt ? new Date(b.updatedAt).toISOString() : new Date().toISOString(),
  };
}

export async function getAppData(): Promise<AppData> {
  const profile = await getProfile();
  const binders = await getBinders();
  return { profile, binders };
}

export async function getProfile(): Promise<SellerProfile> {
  try {
    const profile = await prisma.sellerProfile.findUnique({
      where: { id: 'default-profile' },
    });
    if (profile) {
      return {
        sellerName: profile.sellerName,
        boothName: profile.boothName,
        eventCity: profile.eventCity || undefined,
        contactNumber: profile.contactNumber,
        instagram: profile.instagram || undefined,
        currency: (profile.currency as 'IDR' | 'USD') || 'IDR',
        bannerNotice: profile.bannerNotice || undefined,
      };
    }
  } catch (err) {
    console.warn('Prisma getProfile fallback to file:', err);
  }
  const data = await ensureDataFile();
  return data.profile;
}

export async function updateProfile(newProfile: Partial<SellerProfile>): Promise<SellerProfile> {
  try {
    const updated = await prisma.sellerProfile.upsert({
      where: { id: 'default-profile' },
      update: {
        ...(newProfile.sellerName && { sellerName: newProfile.sellerName }),
        ...(newProfile.boothName && { boothName: newProfile.boothName }),
        ...(newProfile.eventCity !== undefined && { eventCity: newProfile.eventCity }),
        ...(newProfile.contactNumber && { contactNumber: newProfile.contactNumber }),
        ...(newProfile.instagram !== undefined && { instagram: newProfile.instagram }),
        ...(newProfile.currency && { currency: newProfile.currency }),
        ...(newProfile.bannerNotice !== undefined && { bannerNotice: newProfile.bannerNotice }),
      },
      create: {
        id: 'default-profile',
        sellerName: newProfile.sellerName || 'PokeVault Indonesia',
        boothName: newProfile.boothName || 'Table #A-14',
        eventCity: newProfile.eventCity || 'Jakarta',
        contactNumber: newProfile.contactNumber || '081234567890',
        instagram: newProfile.instagram || '@pokevault_id',
        currency: newProfile.currency || 'IDR',
        bannerNotice: newProfile.bannerNotice || '',
      },
    });

    const fileData = await ensureDataFile();
    fileData.profile = { ...fileData.profile, ...newProfile };
    await persistData(fileData);

    return {
      sellerName: updated.sellerName,
      boothName: updated.boothName,
      eventCity: updated.eventCity || undefined,
      contactNumber: updated.contactNumber,
      instagram: updated.instagram || undefined,
      currency: (updated.currency as 'IDR' | 'USD') || 'IDR',
      bannerNotice: updated.bannerNotice || undefined,
    };
  } catch (err) {
    console.warn('Prisma updateProfile fallback to file:', err);
    const data = await ensureDataFile();
    data.profile = { ...data.profile, ...newProfile };
    await persistData(data);
    return data.profile;
  }
}

export async function getBinders(): Promise<Binder[]> {
  try {
    const binders = await prisma.binder.findMany({
      include: { slots: true },
      orderBy: { createdAt: 'asc' },
    });
    if (binders && binders.length > 0) {
      return binders.map(mapPrismaBinderToBinder);
    }
  } catch (err) {
    console.warn('Prisma getBinders fallback to file:', err);
  }
  const data = await ensureDataFile();
  return data.binders;
}

export async function getBinderById(id: string): Promise<Binder | null> {
  try {
    const binder = await prisma.binder.findUnique({
      where: { id },
      include: { slots: true },
    });
    if (binder) {
      return mapPrismaBinderToBinder(binder);
    }
  } catch (err) {
    console.warn('Prisma getBinderById fallback to file:', err);
  }
  const data = await ensureDataFile();
  return data.binders.find((b) => b.id === id) || null;
}

export async function createBinder(
  binderInput: Omit<Binder, 'createdAt' | 'updatedAt' | 'slots'> & { slots?: Record<number, PokemonCard> }
): Promise<Binder> {
  try {
    const created = await prisma.binder.create({
      data: {
        id: binderInput.id,
        name: binderInput.name,
        description: binderInput.description || '',
        sellerName: binderInput.sellerName || '',
        boothName: binderInput.boothName || '',
        contactNumber: binderInput.contactNumber || '',
        coverColor: binderInput.coverColor || '#3B82F6',
        badge: binderInput.badge || '',
        currency: binderInput.currency || 'IDR',
        layoutType: binderInput.layoutType || '9-pocket',
        totalPages: binderInput.totalPages || 3,
      },
    });

    const fileData = await ensureDataFile();
    const newBinder: Binder = {
      ...binderInput,
      slots: binderInput.slots || {},
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };
    fileData.binders.push(newBinder);
    await persistData(fileData);

    return newBinder;
  } catch (err) {
    console.warn('Prisma createBinder fallback:', err);
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
}

export async function updateBinder(
  id: string,
  updates: Partial<Omit<Binder, 'id' | 'createdAt'>>
): Promise<Binder | null> {
  try {
    await prisma.binder.update({
      where: { id },
      data: {
        ...(updates.name && { name: updates.name }),
        ...(updates.description !== undefined && { description: updates.description }),
        ...(updates.sellerName !== undefined && { sellerName: updates.sellerName }),
        ...(updates.boothName !== undefined && { boothName: updates.boothName }),
        ...(updates.contactNumber !== undefined && { contactNumber: updates.contactNumber }),
        ...(updates.coverColor && { coverColor: updates.coverColor }),
        ...(updates.badge !== undefined && { badge: updates.badge }),
        ...(updates.currency && { currency: updates.currency }),
        ...(updates.layoutType && { layoutType: updates.layoutType }),
        ...(updates.totalPages !== undefined && { totalPages: updates.totalPages }),
      },
    });
  } catch (err) {
    console.warn('Prisma updateBinder error:', err);
  }

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
  try {
    await prisma.binder.delete({
      where: { id },
    });
  } catch (err) {
    console.warn('Prisma deleteBinder error:', err);
  }

  const data = await ensureDataFile();
  const initialLength = data.binders.length;
  data.binders = data.binders.filter((b) => b.id !== id);
  if (data.binders.length !== initialLength) {
    await persistData(data);
    return true;
  }
  return false;
}

export async function getSlotCard(
  binderId: string,
  slotNumber: number
): Promise<{ binder: Binder; card: PokemonCard | null } | null> {
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
  const now = new Date();
  try {
    await prisma.slot.upsert({
      where: {
        binderId_slotNumber: { binderId, slotNumber },
      },
      update: {
        name: cardData.name,
        setName: cardData.setName || '',
        cardNumber: cardData.cardNumber || '',
        rarity: cardData.rarity || '',
        condition: cardData.condition,
        price: Number(cardData.price) || 0,
        originalPrice: cardData.originalPrice != null ? Number(cardData.originalPrice) : null,
        status: cardData.status || 'AVAILABLE',
        imageUrl: cardData.imageUrl || '',
        notes: cardData.notes || '',
        game: cardData.game || 'pokemon',
        updatedAt: now,
      },
      create: {
        binderId,
        slotNumber,
        name: cardData.name,
        setName: cardData.setName || '',
        cardNumber: cardData.cardNumber || '',
        rarity: cardData.rarity || '',
        condition: cardData.condition,
        price: Number(cardData.price) || 0,
        originalPrice: cardData.originalPrice != null ? Number(cardData.originalPrice) : null,
        status: cardData.status || 'AVAILABLE',
        imageUrl: cardData.imageUrl || '',
        notes: cardData.notes || '',
        game: cardData.game || 'pokemon',
        updatedAt: now,
      },
    });

    await prisma.binder.update({
      where: { id: binderId },
      data: { updatedAt: now },
    });
  } catch (err) {
    console.warn('Prisma updateSlotCard fallback:', err);
  }

  // Also sync to local store.json
  const data = await ensureDataFile();
  const binderIndex = data.binders.findIndex((b) => b.id === binderId);
  if (binderIndex === -1) return null;

  const nowStr = now.toISOString();
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
    updatedAt: nowStr,
  };

  data.binders[binderIndex].slots[slotNumber] = updatedCard;
  data.binders[binderIndex].updatedAt = nowStr;

  await persistData(data);
  return { binder: data.binders[binderIndex], card: updatedCard };
}

export async function removeCardFromSlot(binderId: string, slotNumber: number): Promise<boolean> {
  try {
    await prisma.slot.deleteMany({
      where: { binderId, slotNumber },
    });
    await prisma.binder.update({
      where: { id: binderId },
      data: { updatedAt: new Date() },
    });
  } catch (err) {
    console.warn('Prisma removeCardFromSlot error:', err);
  }

  const data = await ensureDataFile();
  const binder = data.binders.find((b) => b.id === binderId);
  if (!binder || !binder.slots[slotNumber]) return false;

  delete binder.slots[slotNumber];
  binder.updatedAt = new Date().toISOString();
  await persistData(data);
  return true;
}

export async function quickToggleCardStatus(
  binderId: string,
  slotNumber: number,
  status: PokemonCard['status']
): Promise<PokemonCard | null> {
  try {
    await prisma.slot.updateMany({
      where: { binderId, slotNumber },
      data: { status, updatedAt: new Date() },
    });
  } catch (err) {
    console.warn('Prisma quickToggleCardStatus error:', err);
  }

  const data = await ensureDataFile();
  const binder = data.binders.find((b) => b.id === binderId);
  if (!binder || !binder.slots[slotNumber]) return null;

  binder.slots[slotNumber].status = status;
  binder.slots[slotNumber].updatedAt = new Date().toISOString();
  binder.updatedAt = new Date().toISOString();
  await persistData(data);
  return binder.slots[slotNumber];
}

export async function quickUpdatePrice(
  binderId: string,
  slotNumber: number,
  newPrice: number
): Promise<PokemonCard | null> {
  try {
    const slot = await prisma.slot.findUnique({
      where: { binderId_slotNumber: { binderId, slotNumber } },
    });
    if (slot) {
      await prisma.slot.update({
        where: { id: slot.id },
        data: {
          originalPrice: slot.price,
          price: newPrice,
          updatedAt: new Date(),
        },
      });
    }
  } catch (err) {
    console.warn('Prisma quickUpdatePrice error:', err);
  }

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
  try {
    const slots = await prisma.slot.findMany({
      where: { binderId, status: 'AVAILABLE' },
    });
    const factor = (100 - discountPercentage) / 100;
    for (const s of slots) {
      const orig = s.originalPrice || s.price;
      const discounted = Math.max(1000, Math.round((orig * factor) / 5000) * 5000);
      await prisma.slot.update({
        where: { id: s.id },
        data: {
          originalPrice: orig,
          price: discounted,
          updatedAt: new Date(),
        },
      });
    }
  } catch (err) {
    console.warn('Prisma bulkApplyDiscount error:', err);
  }

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
