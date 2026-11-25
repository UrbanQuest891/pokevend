export type CardCondition =
  | 'Raw - Mint'
  | 'Raw - NM'
  | 'Raw - LP'
  | 'Raw - MP'
  | 'Raw - HP'
  | 'Raw - Damaged'
  | 'Graded - PSA 10'
  | 'Graded - PSA 9'
  | 'Graded - PSA 8'
  | 'Graded - BGS 10 Black Label'
  | 'Graded - BGS 10 Gold Label'
  | 'Graded - BGS 9.5'
  | 'Graded - BGS 9'
  | 'Graded - CGC 10'
  | 'Graded - ARS 10+'
  | 'Graded - ARS 10'
  | 'Graded - ARS 9'
  | 'Graded - ARS 8 or below'
  | 'Graded - Other';

export type CardStatus = 'AVAILABLE' | 'RESERVED' | 'SOLD';

export interface PokemonCard {
  id: string;
  name: string;
  setName: string;
  cardNumber?: string;
  rarity?: string;
  condition: CardCondition;
  price: number;
  originalPrice?: number; // for showing discount
  status: CardStatus;
  imageUrl: string;
  notes?: string;
  game?: 'pokemon' | 'riftbound' | 'onepiece' | string;
  updatedAt: string;
}

export type BinderLayout = '4-pocket' | '9-pocket' | '12-pocket';

export interface BinderSlot {
  slotNumber: number; // 1-indexed
  pageNumber: number; // 1-indexed
  slotInPage: number; // 1..pocketsPerPage
  card?: PokemonCard | null;
}

export interface Binder {
  id: string;
  name: string;
  description: string;
  sellerName: string;
  boothName?: string;
  contactNumber?: string; // WhatsApp / Phone for card show communication
  coverColor: string; // hex or tailwind class
  badge?: string; // e.g. "Grail Binder", "Hits under 100k", "Slabs"
  currency: 'IDR' | 'USD';
  layoutType: BinderLayout;
  totalPages: number;
  slots: Record<number, PokemonCard>; // slotNumber -> PokemonCard
  createdAt: string;
  updatedAt: string;
}

export interface SellerProfile {
  sellerName: string;
  boothName: string;
  eventCity?: string;
  contactNumber: string;
  instagram?: string;
  currency: 'IDR' | 'USD';
  bannerNotice?: string;
}

export interface SaleRecord {
  id: string;
  userId?: string;
  binderId: string;
  binderName: string;
  slotNumber: number;
  cardName: string;
  setName?: string;
  cardNumber?: string;
  rarity?: string;
  condition: string;
  game: string;
  imageUrl?: string;
  soldPrice: number;
  costPrice?: number;
  currency: string;
  notes?: string;
  soldAt: string;
}

export interface AppData {
  profile: SellerProfile;
  binders: Binder[];
  sales?: SaleRecord[];
}
