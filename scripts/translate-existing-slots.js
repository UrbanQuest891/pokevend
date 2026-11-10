const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const translations = require('../src/lib/translationsData.json');

const prisma = new PrismaClient();

function hasNonLatin(text) {
  if (!text) return false;
  return /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/.test(text);
}

function translateCardName(rawName, cardNumber, game) {
  if (!rawName) return '';
  const cleanName = rawName.trim();
  const cleanCode = (cardNumber || '').split('/')[0].trim().toUpperCase();

  // 1. One Piece
  if (game === 'onepiece' || /^(OP|EB|ST|PRB|P)-/i.test(cleanCode)) {
    if (cleanCode && translations.opCodeToName[cleanCode]) {
      return translations.opCodeToName[cleanCode].replace(/\./g, ' ').replace(/\s+/g, ' ').trim();
    }
    for (const [jp, en] of Object.entries(translations.opJpNameToEn)) {
      if (cleanName.includes(jp)) {
        return cleanName.replace(jp, en).replace(/[・]/g, ' ').trim();
      }
    }
  }

  // 2. Pokemon
  const suffixMatch = cleanName.match(/\s*(ex|EX|VMAX|VSTAR|V-UNION|V|GX|TAG TEAM|LV\.X|BREAK|Star|Prime)$/i);
  const suffix = suffixMatch ? ' ' + suffixMatch[1] : '';
  const baseName = suffixMatch ? cleanName.replace(suffixMatch[0], '').trim() : cleanName;

  if (translations.pkmnJpToEn[baseName]) {
    return translations.pkmnJpToEn[baseName] + suffix;
  }
  if (translations.pkmnTrainerJpToEn[baseName]) {
    return translations.pkmnTrainerJpToEn[baseName];
  }
  if (translations.pkmnCnToEn[baseName]) {
    return translations.pkmnCnToEn[baseName] + suffix;
  }

  return cleanName;
}

function translateCardSet(rawSet, cardNumber, game) {
  if (!rawSet) return '';
  const cleanSet = rawSet.trim();
  const cleanCode = (cardNumber || '').split('/')[0].trim().toUpperCase();

  if (game === 'onepiece' || /^(OP|EB|ST|PRB|P)-/i.test(cleanCode)) {
    if (cleanCode && translations.opCodeToSet[cleanCode]) {
      return translations.opCodeToSet[cleanCode];
    }
    for (const [jp, en] of Object.entries(translations.opSetNames)) {
      if (cleanSet.includes(jp)) {
        return cleanSet.replace(jp, en);
      }
    }
  }

  for (const [jp, en] of Object.entries(translations.pkmnSetJpToEn)) {
    if (cleanSet.includes(jp)) {
      return cleanSet.replace(jp, en);
    }
  }

  return cleanSet;
}

async function run() {
  console.log('--- TRANSLATING EXISTING SLOTS TO ALPHABET ---');
  
  // 1. Update Supabase PostgreSQL
  const slots = await prisma.slot.findMany();
  console.log(`Checking ${slots.length} slots in database...`);

  for (const s of slots) {
    let updated = false;
    let newName = s.name;
    let newSet = s.setName || '';

    if (hasNonLatin(s.name)) {
      newName = translateCardName(s.name, s.cardNumber || '', s.game);
      if (newName !== s.name) updated = true;
    }
    if (s.setName && hasNonLatin(s.setName)) {
      newSet = translateCardSet(s.setName, s.cardNumber || '', s.game);
      if (newSet !== s.setName) updated = true;
    }

    if (updated) {
      console.log(`Translating Slot #${s.slotNumber}:`);
      console.log(`  Name: "${s.name}" -> "${newName}"`);
      console.log(`  Set:  "${s.setName}" -> "${newSet}"`);
      await prisma.slot.update({
        where: { id: s.id },
        data: {
          name: newName,
          setName: newSet,
          updatedAt: new Date(),
        },
      });
    }
  }

  // 2. Update local store.json
  const storePath = path.join(process.cwd(), 'data', 'store.json');
  if (fs.existsSync(storePath)) {
    const raw = fs.readFileSync(storePath, 'utf8');
    const store = JSON.parse(raw);
    let storeChanged = false;

    for (const b of store.binders || []) {
      for (const slotKey in b.slots || {}) {
        const card = b.slots[slotKey];
        if (!card) continue;
        if (hasNonLatin(card.name)) {
          const oldName = card.name;
          const newName = translateCardName(card.name, card.cardNumber || '', card.game);
          if (newName !== oldName) {
            card.name = newName;
            console.log(`store.json Binder "${b.name}" Slot #${slotKey}: "${oldName}" -> "${card.name}"`);
            storeChanged = true;
          }
        }
        if (card.setName && hasNonLatin(card.setName)) {
          const oldSet = card.setName;
          const newSet = translateCardSet(card.setName, card.cardNumber || '', card.game);
          if (newSet !== oldSet) {
            card.setName = newSet;
            storeChanged = true;
          }
        }
      }
    }

    if (storeChanged) {
      fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
      console.log('✅ Updated data/store.json with translated alphabet names!');
    }
  }

  console.log('🎉 Existing slot translation completed successfully!');
}

run()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
