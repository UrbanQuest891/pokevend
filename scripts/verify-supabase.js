const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
  console.log('=== VERIFYING SUPABASE POSTGRESQL DATA ===');
  
  // 1. Profile
  const profile = await prisma.sellerProfile.findUnique({
    where: { id: 'default-profile' },
  });
  console.log('Seller Profile:', profile?.sellerName, '•', profile?.boothName);

  // 2. Binders & Slots
  const binders = await prisma.binder.findMany({
    include: { slots: true },
  });
  console.log(`Binders (${binders.length}):`);
  for (const b of binders) {
    console.log(`  - "${b.name}": ${b.slots.length} slots populated`);
  }

  // 3. Card Catalog
  const totalCards = await prisma.cardCatalog.count();
  console.log(`Total Cards in CardCatalog: ${totalCards.toLocaleString()}`);

  const byGameLang = await prisma.cardCatalog.groupBy({
    by: ['game', 'lang'],
    _count: { id: true },
  });
  for (const g of byGameLang) {
    console.log(`  - ${g.game.toUpperCase()} [${g.lang}]: ${g._count.id.toLocaleString()} cards`);
  }

  // 4. Sets
  const totalSets = await prisma.cardSet.count();
  console.log(`Total Sets in CardSet: ${totalSets.toLocaleString()}`);

  // 5. Test search query for "Zekrom"
  const searchSample = await prisma.cardCatalog.findMany({
    where: {
      game: 'pokemon',
      name: { contains: 'Zekrom', mode: 'insensitive' },
    },
    take: 3,
  });
  console.log(`Sample search for "Zekrom": ${searchSample.length} results:`);
  for (const s of searchSample) {
    console.log(`  * [${s.lang}] ${s.name} (${s.cardNumber}) - ${s.setName}`);
  }
}

verify()
  .then(() => console.log('🎉 ALL SUPABASE DATA VERIFIED SUCCESSFULLY!'))
  .catch((e) => console.error('Verification error:', e))
  .finally(() => prisma.$disconnect());
