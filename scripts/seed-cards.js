const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function parseCSV(text) {
  const rows = [];
  let row = [];
  let inQuotes = false;
  let current = '';

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      row.push(current.trim());
      current = '';
    } else if ((ch === '\r' || ch === '\n') && !inQuotes) {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(current.trim());
      if (row.length > 1 || (row.length === 1 && row[0] !== '')) {
        rows.push(row);
      }
      row = [];
      current = '';
    } else {
      current += ch;
    }
  }
  if (current || row.length > 0) {
    row.push(current.trim());
    if (row.some((c) => c.length > 0)) {
      rows.push(row);
    }
  }
  return rows;
}

function csvToObjects(csvText) {
  const rows = parseCSV(csvText);
  if (rows.length === 0) return [];
  const headers = rows[0].map((h) => h.replace(/^["']|["']$/g, '').trim());
  const results = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = row[j] || '';
    }
    results.push(obj);
  }
  return results;
}

async function insertInBatches(model, records, batchSize = 1000, label = 'records') {
  const total = records.length;
  console.log(`Starting insertion of ${total} ${label}...`);
  for (let i = 0; i < total; i += batchSize) {
    const chunk = records.slice(i, i + batchSize);
    await model.createMany({
      data: chunk,
      skipDuplicates: true,
    });
    const progress = Math.min(i + batchSize, total);
    const pct = ((progress / total) * 100).toFixed(1);
    process.stdout.write(`  [${label}] ${progress}/${total} (${pct}%)\r`);
  }
  console.log(`\n✅ Completed ${total} ${label}!`);
}

async function main() {
  const dataDir = path.join(process.cwd(), 'data');

  // 1. RIFTBOUND CARDS
  console.log('\n--- 1. RIFTBOUND ---');
  const riftCsvPath = path.join(dataDir, 'riftbound_cards.csv');
  if (fs.existsSync(riftCsvPath)) {
    const raw = fs.readFileSync(riftCsvPath, 'utf8');
    const rows = csvToObjects(raw);
    const catalog = rows.map((r, idx) => ({
      id: `rb-${r.id || idx}`,
      game: 'riftbound',
      lang: 'EN',
      name: r.name || 'Unknown',
      cardNumber: r.publicCode || r.collectorNumber || '',
      rarity: r.rarity || '',
      setName: r.setName || 'Riftbound Origins',
      setId: r.setCode || 'OGN',
      imageUrl: r.imageUrl || '',
      category: r.cardType || '',
      color: r.domain || '',
      costLife: r.energyCost || '',
      power: r.might || r.power || '',
      effect: r.rulesText || '',
    }));
    await insertInBatches(prisma.cardCatalog, catalog, 1000, 'Riftbound Cards');
  }

  // 2. ONE PIECE EN
  console.log('\n--- 2. ONE PIECE EN ---');
  const opEnPath = path.join(dataDir, 'one_piece_cards_en.csv');
  if (fs.existsSync(opEnPath)) {
    const raw = fs.readFileSync(opEnPath, 'utf8');
    const rows = csvToObjects(raw);
    const catalog = rows.map((r, idx) => ({
      id: `op-en-${r.cardNumber}-${r.seriesId || ''}-${idx}`,
      game: 'onepiece',
      lang: 'EN',
      name: r.name || 'Unknown',
      cardNumber: r.cardNumber || '',
      rarity: r.rarity || '',
      setName: r.cardSet || r.seriesName || '',
      setId: r.seriesId || '',
      imageUrl: r.imageUrl || '',
      category: r.category || '',
      color: r.color || '',
      attribute: r.attribute || '',
      type: r.type || '',
      costLife: r.costLife || '',
      power: r.power || '',
      counter: r.counter || '',
      effect: r.effect || '',
    }));
    await insertInBatches(prisma.cardCatalog, catalog, 1000, 'One Piece EN Cards');
  }

  // 3. ONE PIECE JP
  console.log('\n--- 3. ONE PIECE JP ---');
  const opJpPath = path.join(dataDir, 'one_piece_cards_jp.csv');
  if (fs.existsSync(opJpPath)) {
    const raw = fs.readFileSync(opJpPath, 'utf8');
    const rows = csvToObjects(raw);
    const catalog = rows.map((r, idx) => ({
      id: `op-jp-${r.cardNumber}-${r.seriesId || ''}-${idx}`,
      game: 'onepiece',
      lang: 'JP',
      name: r.name || 'Unknown',
      cardNumber: r.cardNumber || '',
      rarity: r.rarity || '',
      setName: r.cardSet || r.seriesName || '',
      setId: r.seriesId || '',
      imageUrl: r.imageUrl || '',
      category: r.category || '',
      color: r.color || '',
      attribute: r.attribute || '',
      type: r.type || '',
      costLife: r.costLife || '',
      power: r.power || '',
      counter: r.counter || '',
      effect: r.effect || '',
    }));
    await insertInBatches(prisma.cardCatalog, catalog, 1000, 'One Piece JP Cards');
  }

  // 4. POKEMON ID
  console.log('\n--- 4. POKEMON INDONESIA ---');
  const pokeIdPath = path.join(dataDir, 'pokemon_cards_id.csv');
  if (fs.existsSync(pokeIdPath)) {
    const raw = fs.readFileSync(pokeIdPath, 'utf8');
    const rows = csvToObjects(raw);
    const catalog = rows.map((r, idx) => ({
      id: `pkmn-id-${r.id || idx}`,
      game: 'pokemon',
      lang: 'ID',
      name: r.name || 'Unknown',
      cardNumber: r.collectorNumber || '',
      rarity: r.subCategory || '',
      setName: r.productName || '',
      setId: r.expansionCode || '',
      imageUrl: r.imageUrl || '',
      category: r.category || '',
      type: r.type || '',
      power: r.hp ? `HP ${r.hp}` : '',
      detailUrl: r.detailUrl || '',
    }));
    await insertInBatches(prisma.cardCatalog, catalog, 1000, 'Pokemon ID Cards');
  }

  // 5. POKEMON CN
  console.log('\n--- 5. POKEMON CHINA ---');
  const pokeCnPath = path.join(dataDir, 'pokemon_cards_cn.json');
  if (fs.existsSync(pokeCnPath)) {
    const raw = fs.readFileSync(pokeCnPath, 'utf8');
    const items = JSON.parse(raw);
    const catalog = items.map((item, idx) => ({
      id: `pkmn-cn-${item.id || idx}`,
      game: 'pokemon',
      lang: 'CN',
      name: item.name || 'Unknown',
      fullName: item.fullName || '',
      cardNumber: item.number || '',
      rarity: item.rarity || '',
      setName: item.setName || '',
      setId: item.setId || '',
      imageUrl: item.imageUrl || '',
      detailUrl: item.detailUrl || '',
    }));
    await insertInBatches(prisma.cardCatalog, catalog, 1000, 'Pokemon CN Cards');
  }

  // 6. POKEMON EN
  console.log('\n--- 6. POKEMON ENGLISH ---');
  const pokeEnPath = path.join(dataDir, 'pokemon_cards_en.csv');
  if (fs.existsSync(pokeEnPath)) {
    const raw = fs.readFileSync(pokeEnPath, 'utf8');
    const rows = csvToObjects(raw);
    const catalog = rows.map((r, idx) => ({
      id: `pkmn-en-${r.id || idx}`,
      game: 'pokemon',
      lang: 'EN',
      name: r.name || 'Unknown',
      cardNumber: r.number || '',
      rarity: r.rarity || '',
      setName: r.setName || '',
      setId: r.setId || '',
      imageUrl: r.imageUrl || '',
      category: r.supertype || '',
      type: r.types || '',
      power: r.hp ? `HP ${r.hp}` : '',
    }));
    await insertInBatches(prisma.cardCatalog, catalog, 1000, 'Pokemon EN Cards');
  }

  // 7. POKEMON JP
  console.log('\n--- 7. POKEMON JAPANESE ---');
  const pokeJpPath = path.join(dataDir, 'pokemon_cards_jp.csv');
  if (fs.existsSync(pokeJpPath)) {
    const raw = fs.readFileSync(pokeJpPath, 'utf8');
    const rows = csvToObjects(raw);
    const catalog = rows.map((r, idx) => ({
      id: `pkmn-jp-${r.id || idx}`,
      game: 'pokemon',
      lang: 'JP',
      name: r.name || 'Unknown',
      cardNumber: r.collectorNumber || '',
      rarity: r.subCategory || '',
      setName: r.expansion || '',
      imageUrl: r.imageUrl || '',
      category: r.category || '',
      type: r.type || '',
      power: r.hp ? `HP ${r.hp}` : '',
      detailUrl: r.detailUrl || '',
    }));
    await insertInBatches(prisma.cardCatalog, catalog, 1000, 'Pokemon JP Cards');
  }

  // Count total cards in DB
  const totalInDb = await prisma.cardCatalog.count();
  console.log(`\n🎉 TOTAL CARDS IN SUPABASE POSTGRESQL: ${totalInDb.toLocaleString()} cards!`);
}

main()
  .catch((err) => {
    console.error('Fatal seeding error:', err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
