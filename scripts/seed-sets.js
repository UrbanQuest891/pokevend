const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedSets() {
  const dataDir = path.join(process.cwd(), 'data');
  const setsToInsert = [];

  // 1. Pokemon EN Sets
  const enSetsPath = path.join(dataDir, 'pokemon_sets_en.json');
  if (fs.existsSync(enSetsPath)) {
    const enSets = JSON.parse(fs.readFileSync(enSetsPath, 'utf8'));
    for (const s of enSets) {
      setsToInsert.push({
        id: `pkmn-en-${s.id}`,
        game: 'pokemon',
        lang: 'EN',
        code: s.id,
        name: s.name,
        symbolUrl: s.symbolUrl || s.logoUrl || null,
        count: s.total || s.printedTotal || 0,
      });
    }
  }

  // 2. Pokemon CN Sets
  const cnSetsPath = path.join(dataDir, 'pokemon_sets_cn.json');
  if (fs.existsSync(cnSetsPath)) {
    const cnSets = JSON.parse(fs.readFileSync(cnSetsPath, 'utf8'));
    for (const s of cnSets) {
      setsToInsert.push({
        id: `pkmn-cn-${s.id}`,
        game: 'pokemon',
        lang: 'CN',
        code: String(s.id),
        name: s.name,
        symbolUrl: s.symbolUrl || null,
        count: s.cardCount || 0,
      });
    }
  }

  // 3. Extract Sets from CardCatalog for ID, JP, One Piece, Riftbound
  console.log('Extracting distinct sets from CardCatalog in DB...');
  const distinctSets = await prisma.cardCatalog.groupBy({
    by: ['game', 'lang', 'setName', 'setId'],
    _count: { id: true },
  });

  for (const group of distinctSets) {
    if (!group.setName) continue;
    const setIdCode = group.setId || group.setName.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30);
    const uniqueId = `set-${group.game}-${group.lang}-${setIdCode}`;
    if (!setsToInsert.some((s) => s.id === uniqueId)) {
      setsToInsert.push({
        id: uniqueId,
        game: group.game,
        lang: group.lang,
        code: setIdCode,
        name: group.setName,
        symbolUrl: null,
        count: group._count.id,
      });
    }
  }

  console.log(`Inserting ${setsToInsert.length} CardSets into Supabase PostgreSQL...`);
  await prisma.cardSet.createMany({
    data: setsToInsert,
    skipDuplicates: true,
  });
  console.log('✅ CardSets inserted successfully!');
}

seedSets()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
