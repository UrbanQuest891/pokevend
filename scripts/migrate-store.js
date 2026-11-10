const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateStore() {
  const storePath = path.join(process.cwd(), 'data', 'store.json');
  if (!fs.existsSync(storePath)) {
    console.error('store.json not found at:', storePath);
    return;
  }

  const raw = fs.readFileSync(storePath, 'utf-8');
  const data = JSON.parse(raw);

  console.log('Migrating Seller Profile...');
  if (data.profile) {
    await prisma.sellerProfile.upsert({
      where: { id: 'default-profile' },
      update: {
        sellerName: data.profile.sellerName || 'PokeVault Indonesia',
        boothName: data.profile.boothName || 'Table #A-14',
        eventCity: data.profile.eventCity || 'Jakarta',
        contactNumber: data.profile.contactNumber || '081234567890',
        instagram: data.profile.instagram || '@pokevault_id',
        currency: data.profile.currency || 'IDR',
        bannerNotice: data.profile.bannerNotice || '',
      },
      create: {
        id: 'default-profile',
        sellerName: data.profile.sellerName || 'PokeVault Indonesia',
        boothName: data.profile.boothName || 'Table #A-14',
        eventCity: data.profile.eventCity || 'Jakarta',
        contactNumber: data.profile.contactNumber || '081234567890',
        instagram: data.profile.instagram || '@pokevault_id',
        currency: data.profile.currency || 'IDR',
        bannerNotice: data.profile.bannerNotice || '',
      },
    });
    console.log('✅ Seller Profile migrated!');
  }

  console.log(`Migrating ${data.binders ? data.binders.length : 0} Binders...`);
  if (data.binders && Array.isArray(data.binders)) {
    for (const b of data.binders) {
      await prisma.binder.upsert({
        where: { id: b.id },
        update: {
          name: b.name,
          description: b.description || '',
          sellerName: b.sellerName || '',
          boothName: b.boothName || '',
          contactNumber: b.contactNumber || '',
          coverColor: b.coverColor || '#3B82F6',
          badge: b.badge || '',
          currency: b.currency || 'IDR',
          layoutType: b.layoutType || '9-pocket',
          totalPages: b.totalPages || 3,
        },
        create: {
          id: b.id,
          name: b.name,
          description: b.description || '',
          sellerName: b.sellerName || '',
          boothName: b.boothName || '',
          contactNumber: b.contactNumber || '',
          coverColor: b.coverColor || '#3B82F6',
          badge: b.badge || '',
          currency: b.currency || 'IDR',
          layoutType: b.layoutType || '9-pocket',
          totalPages: b.totalPages || 3,
        },
      });

      // Migrate slots
      if (b.slots && typeof b.slots === 'object') {
        const slotKeys = Object.keys(b.slots);
        console.log(`  -> Migrating ${slotKeys.length} slots for binder "${b.name}"...`);
        for (const key of slotKeys) {
          const slotNum = parseInt(key, 10);
          const card = b.slots[key];
          if (!card) continue;

          await prisma.slot.upsert({
            where: {
              binderId_slotNumber: {
                binderId: b.id,
                slotNumber: slotNum,
              },
            },
            update: {
              name: card.name || 'Unknown Card',
              setName: card.setName || '',
              cardNumber: card.cardNumber || '',
              rarity: card.rarity || '',
              condition: card.condition || 'Raw - NM',
              price: Number(card.price) || 0,
              originalPrice: card.originalPrice ? Number(card.originalPrice) : null,
              status: card.status || 'AVAILABLE',
              imageUrl: card.imageUrl || '',
              notes: card.notes || '',
              game: card.game || 'pokemon',
            },
            create: {
              binderId: b.id,
              slotNumber: slotNum,
              name: card.name || 'Unknown Card',
              setName: card.setName || '',
              cardNumber: card.cardNumber || '',
              rarity: card.rarity || '',
              condition: card.condition || 'Raw - NM',
              price: Number(card.price) || 0,
              originalPrice: card.originalPrice ? Number(card.originalPrice) : null,
              status: card.status || 'AVAILABLE',
              imageUrl: card.imageUrl || '',
              notes: card.notes || '',
              game: card.game || 'pokemon',
            },
          });
        }
      }
    }
  }

  console.log('🎉 Store migration completed successfully!');
}

migrateStore()
  .catch((err) => {
    console.error('Migration error:', err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
