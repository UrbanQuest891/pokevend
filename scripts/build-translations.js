const fs = require('fs');
const path = require('path');

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

function build() {
  const dataDir = path.join(process.cwd(), 'data');

  // --- 1. ONE PIECE EN MAPPINGS ---
  const opCodeToName = {};
  const opCodeToSet = {};
  const opJpNameToEn = {
    'モンキー・D・ルフィ': 'Monkey D. Luffy',
    'ロロノア・ゾロ': 'Roronoa Zoro',
    'ナミ': 'Nami',
    'ウソップ': 'Usopp',
    'サンジ': 'Sanji',
    'トニートニー・チョッパー': 'Tony Tony Chopper',
    'ニコ・ロビン': 'Nico Robin',
    'フランキー': 'Franky',
    'ブルック': 'Brook',
    'ジンベエ': 'Jinbe',
    'ポートガス・D・エース': 'Portgas D. Ace',
    'サボ': 'Sabo',
    'シャンクス': 'Shanks',
    'トラファルガー・ロー': 'Trafalgar Law',
    'ユースタス・キッド': 'Eustass "Captain" Kid',
    'ボア・ハンコック': 'Boa Hancock',
    'ドンキホーテ・ドフラミンゴ': 'Donquixote Doflamingo',
    'エドワード・ニューゲート': 'Edward Newgate',
    '白ひげ': 'Whitebeard',
    'シャーロット・カタクリ': 'Charlotte Katakuri',
    'シャーロット・リンリン': 'Charlotte Linlin',
    'ビッグ・マム': 'Big Mom',
    'カイドウ': 'Kaido',
    'ヤマト': 'Yamato',
    'ジュラキュール・ミホーク': 'Dracule Mihawk',
    'クロコダイル': 'Crocodile',
    '光月おでん': 'Kozuki Oden',
    '光月モモの助': 'Kozuki Momonosuke',
    '光月日和': 'Kozuki Hiyori',
    'バギー': 'Buggy',
    'スモーカー': 'Smoker',
    'たしぎ': 'Tashigi',
    'クザン': 'Kuzan',
    '青キジ': 'Aokiji',
    'サカズキ': 'Sakazuki',
    '赤犬': 'Akainu',
    'ボルサリーノ': 'Borsalino',
    '黄猿': 'Kizaru',
    'イッショウ': 'Issho',
    '藤虎': 'Fujitora',
    'シルバーズ・レイリー': 'Silvers Rayleigh',
    'ゴール・D・ロジャー': 'Gol D. Roger',
    'マーシャル・D・ティーチ': 'Marshall D. Teach',
    '黒ひげ': 'Blackbeard',
    'キャベンディッシュ': 'Cavendish',
    'レベッカ': 'Rebecca',
    'ペローナ': 'Perona',
    'ゲッコー・モリア': 'Gecko Moria',
    'ロブ・ルッチ': 'Rob Lucci',
    'カク': 'Kaku',
    'ネフェルタリ・ビビ': 'Nefeltari Vivi',
    'ジュエリー・ボニー': 'Jewelry Bonney',
    'キラー': 'Killer',
    'ベポ': 'Bepo',
    'マルコ': 'Marco',
    'キング': 'King',
    'クイーン': 'Queen',
    'ジャック': 'Jack',
    'うるティ': 'Ulti',
    'ページワン': 'Page One',
    'ブラックマリア': 'Black Maria',
    'ササキ': 'Sasaki',
    'フーズ・フー': "Who's-Who",
    'うた': 'Uta',
  };

  const opSetNames = {
    '受け継がれる意志': 'Carrying on His Will [OP-13]',
    '新時代の主役': 'Awakening of the New Era [OP-05]',
    'ROMANCE DAWN': 'Romance Dawn [OP-01]',
    '頂上決戦': 'Paramount War [OP-02]',
    '強大な敵': 'Pillars of Strength [OP-03]',
    '謀略の王国': 'Kingdoms of Intrigue [OP-04]',
    '双璧の覇者': 'Wings of the Captain [OP-06]',
    '500年後の未来': '500 Years in the Future [OP-07]',
    '二つの伝説': 'Two Legends [OP-08]',
    '新たなる皇帝': 'The New Four Emperors [OP-09]',
    '王族の血統': 'Royal Bloodlines [OP-10]',
    '神の天秤': 'Scales of Divinity [OP-11]',
    '師弟の絆': 'Bonds of Master and Disciple [OP-12]',
    'メモリアルコレクション': 'Memorial Collection [EB-01]',
    'プレミアムブースター': 'Premium Booster',
    'ONE PIECE CARD THE BEST': 'One Piece Card The Best',
    'ONE PIECE CARD THE BEST vol.2': 'One Piece Card The Best vol.2',
    '週刊少年ジャンプ付録': 'Weekly Shonen Jump Promo',
    'Vジャンプ付録': 'V-Jump Promo',
    '最強ジャンプ付録': 'Saikyo Jump Promo',
  };

  const opEnPath = path.join(dataDir, 'one_piece_cards_en.csv');
  if (fs.existsSync(opEnPath)) {
    const raw = fs.readFileSync(opEnPath, 'utf8');
    const rows = parseCSV(raw);
    const headers = rows[0];
    const codeIdx = headers.indexOf('cardNumber');
    const nameIdx = headers.indexOf('name');
    const setIdx = headers.indexOf('cardSet');
    for (let i = 1; i < rows.length; i++) {
      const code = rows[i][codeIdx];
      const name = rows[i][nameIdx];
      const set = rows[i][setIdx];
      if (code && name && !opCodeToName[code]) {
        opCodeToName[code] = name;
        if (set) opCodeToSet[code] = set;
      }
    }
  }

  // --- 2. POKEMON JP -> EN SPECIES MAPPINGS ---
  const enNameByDex = {};
  const pokeEnPath = path.join(dataDir, 'pokemon_cards_en.csv');
  if (fs.existsSync(pokeEnPath)) {
    const raw = fs.readFileSync(pokeEnPath, 'utf8');
    const rows = parseCSV(raw);
    const headers = rows[0];
    const nameIdx = headers.indexOf('name');
    const dexIdx = headers.indexOf('nationalPokedexNumbers');
    for (let i = 1; i < rows.length; i++) {
      const name = rows[i][nameIdx];
      const dex = rows[i][dexIdx];
      if (dex) {
        const dNum = parseInt(dex.replace(/[^0-9]/g, ''), 10);
        if (!isNaN(dNum) && !enNameByDex[dNum]) {
          const clean = name.replace(/\s+(ex|EX|VMAX|VSTAR|V|GX|Tag Team|Prime|Star|BREAK|LV\.X|ex-.*)$/i, '').trim();
          enNameByDex[dNum] = clean;
        }
      }
    }
  }

  const pkmnJpToEn = {
    // Famous Japanese species
    'クワッス': 'Quaxly',
    'ニャオハ': 'Sprigatito',
    'ホゲータ': 'Fuecoco',
    'ピカチュウ': 'Pikachu',
    'リザードン': 'Charizard',
    'ミュウツー': 'Mewtwo',
    'ミュウ': 'Mew',
    'ゲンガー': 'Gengar',
    'ブラッキー': 'Umbreon',
    'ニンフィア': 'Sylveon',
    'エーフィ': 'Espeon',
    'グレイシア': 'Glaceon',
    'リーフィア': 'Leafeon',
    'サンダース': 'Jolteon',
    'シャワーズ': 'Vaporeon',
    'ブースター': 'Flareon',
    'イーブイ': 'Eevee',
    'レックウザ': 'Rayquaza',
    'ギラティナ': 'Giratina',
    'ディアルガ': 'Dialga',
    'パルキア': 'Palkia',
    'アルセウス': 'Arceus',
    'ルギア': 'Lugia',
    'ホウオウ': 'Ho-Oh',
    'フシギダネ': 'Bulbasaur',
    'フシギソウ': 'Ivysaur',
    'フシギバナ': 'Venusaur',
    'ヒトカゲ': 'Charmander',
    'リザード': 'Charmeleon',
    'ゼニガメ': 'Squirtle',
    'カメール': 'Wartortle',
    'カメックス': 'Blastoise',
    'ミミッキュ': 'Mimikyu',
    'サーナイト': 'Gardevoir',
    'ルカリオ': 'Lucario',
    'ゲッコウガ': 'Greninja',
    'カビゴン': 'Snorlax',
    'メタモン': 'Ditto',
    'ヤドン': 'Slowpoke',
    'コダック': 'Psyduck',
    'ガブリアス': 'Garchomp',
    'ボーマンダ': 'Salamence',
    'カイリュー': 'Dragonite',
    'バンギラス': 'Tyranitar',
    'メタグロス': 'Metagross',
    'ゼクロム': 'Zekrom',
    'レシラム': 'Reshiram',
    'キュレム': 'Kyurem',
    'ダークライ': 'Darkrai',
    'クレセリア': 'Cresselia',
    'ポッチャマ': 'Piplup',
    'ヒコザル': 'Chimchar',
    'ナエトル': 'Turtwig',
    'モクロー': 'Rowlet',
    'ニャビー': 'Litten',
    'アシマリ': 'Popplio',
    'サルノリ': 'Grookey',
    'ヒバニー': 'Scorbunny',
    'メッソン': 'Sobble',
    'コライドン': 'Koraidon',
    'ミライドン': 'Miraidon',
    'オーガポン': 'Ogerpon',
    'テラパゴス': 'Terapagos',
  };

  const pokeJpPath = path.join(dataDir, 'pokemon_cards_jp.csv');
  if (fs.existsSync(pokeJpPath)) {
    const raw = fs.readFileSync(pokeJpPath, 'utf8');
    const rows = parseCSV(raw);
    const headers = rows[0];
    const nameIdx = headers.indexOf('name');
    const dexIdx = headers.indexOf('pokedexNumber');
    for (let i = 1; i < rows.length; i++) {
      const jpName = rows[i][nameIdx];
      const jpDex = rows[i][dexIdx];
      if (jpName && jpDex) {
        const dNum = parseInt(jpDex.replace(/[^0-9]/g, ''), 10);
        if (!isNaN(dNum) && enNameByDex[dNum]) {
          const enBase = enNameByDex[dNum];
          const cleanJp = jpName.replace(/\s*(ex|EX|VMAX|VSTAR|V|GX|かがやく|わるい|ひかる|R団の).*$/i, '').trim();
          if (cleanJp && !pkmnJpToEn[cleanJp]) {
            pkmnJpToEn[cleanJp] = enBase;
          }
        }
      }
    }
  }

  // --- 3. POKEMON JP TRAINERS & ITEMS ---
  const pkmnTrainerJpToEn = {
    'ナンジャモ': 'Iono',
    'ボスの指令': "Boss's Orders",
    '博士の研究': "Professor's Research",
    'セレナ': 'Serena',
    'リーリエ': 'Lillie',
    'マリィ': 'Marnie',
    'アクロマの実験': "Colress's Experiment",
    'ミモザ': 'Miriam',
    'カイ': 'Irida',
    'シロナ': 'Cynthia',
    'シロナの覇気': "Cynthia's Ambition",
    'カミツレのきらめき': "Elesa's Sparkle",
    'スグリ': 'Kieran',
    'ゼイユ': 'Carmine',
    'エリカのおもてなし': "Erika's Hospitality",
    'エリカの招待': "Erika's Invitation",
    'ボタン': 'Penny',
    'ペパー': 'Arven',
    'グルーシャ': 'Grusha',
    'クラベル': 'Clavell',
    'フトゥー博士のシナリオ': "Professor Turo's Scenario",
    'オーリム博士の気迫': "Professor Sada's Vitality",
    'ネストボール': 'Nest Ball',
    'ハイパーボール': 'Ultra Ball',
    'キャプチャーアロマ': 'Capturing Aroma',
    'すごいつりざお': 'Super Rod',
    'ふしぎなアメ': 'Rare Candy',
    '大地の器': 'Earthen Vessel',
    'なかよしポフィン': 'Buddy-Buddy Poffin',
    'プライムキャッチャー': 'Prime Catcher',
    'アンフェアスタンプ': 'Unfair Stamp',
    'カウンターキャッチャー': 'Counter Catcher',
    'ロストスイーパー': 'Lost Vacuum',
    'ともだちてちょう': 'Pal Pad',
    '勇気のおまもり': 'Bravery Charm',
    '緊急ボード': 'Emergency Board',
    '森の封印石': 'Forest Seal Stone',
    'ボウルタウン': 'Mesagoza / Town',
    '頂への雪道': 'Path to the Peak',
    'ポケストップ': 'PokéStop',
  };

  // --- 4. POKEMON JP SETS ---
  const pkmnSetJpToEn = {
    '黒炎の支配者': 'Ruler of the Black Flame',
    'ポケモンカード151': 'Pokemon Card 151',
    'クレイバースト': 'Clay Burst',
    'スノーハザード': 'Snow Hazard',
    '古代の咆哮': 'Ancient Roar',
    '未来の一閃': 'Future Flash',
    'シャイニートレジャーex': 'Shiny Treasure ex',
    'ワイルドフォース': 'Wild Force',
    'サイバージャッジ': 'Cyber Judge',
    'クリムゾンヘイズ': 'Crimson Haze',
    '変幻の仮面': 'Mask of Change',
    'ナイトワンダラー': 'Night Wanderer',
    'ステラミラクル': 'Stellar Miracle',
    '楽園ドラゴーナ': 'Paradise Dragona',
    '超電ブレイカー': 'Supercharged Breaker',
    'テラスタルフェスex': 'Terastal Festival ex',
    'バトルパートナーズ': 'Battle Partners',
    '熱風のアリーナ': 'Hot Air Arena',
    'VSTARユニバース': 'VSTAR Universe',
    'VMAXクライマックス': 'VMAX Climax',
    'イーブイヒーローズ': 'Eevee Heroes',
    '蒼空ストリーム': 'Blue Sky Stream',
    '摩天パーフェクト': 'Skystream / Skyscraping Perfect',
    'パラダイムトリガー': 'Paradigm Trigger',
    '白熱のアルカナ': 'Incandescent Arcana',
    'ロストアビス': 'Lost Abyss',
    'スペースジャグラー': 'Space Juggler',
    'タイムゲイザー': 'Time Gazer',
    'スターバース': 'Star Birth',
    '25th ANNIVERSARY COLLECTION': '25th Anniversary Collection',
  };

  // --- 5. CHINESE (MANDARIN) POKEMON NAMES ---
  const pkmnCnToEn = {
    '皮卡丘': 'Pikachu',
    '小火龙': 'Charmander',
    '火恐龙': 'Charmeleon',
    '喷火龙': 'Charizard',
    '妙蛙种子': 'Bulbasaur',
    '妙蛙草': 'Ivysaur',
    '妙蛙花': 'Venusaur',
    '杰尼龟': 'Squirtle',
    '卡咪龟': 'Wartortle',
    '水箭龟': 'Blastoise',
    '超梦': 'Mewtwo',
    '梦幻': 'Mew',
    '捷克罗姆': 'Zekrom',
    '雷希拉姆': 'Reshiram',
    '酋雷姆': 'Kyurem',
    '伊布': 'Eevee',
    '月亮伊布': 'Umbreon',
    '太阳伊布': 'Espeon',
    '仙子伊布': 'Sylveon',
    '冰伊布': 'Glaceon',
    '叶伊布': 'Leafeon',
    '雷伊布': 'Jolteon',
    '水伊布': 'Vaporeon',
    '火伊布': 'Flareon',
    '耿鬼': 'Gengar',
    '烈空坐': 'Rayquaza',
    '骑拉帝纳': 'Giratina',
    '帝牙卢卡': 'Dialga',
    '帕路奇亚': 'Palkia',
    '阿尔宙斯': 'Arceus',
    '洛奇亚': 'Lugia',
    '凤王': 'Ho-Oh',
    '甲贺忍蛙': 'Greninja',
    '路卡利欧': 'Lucario',
    '沙奈朵': 'Gardevoir',
    '烈咬陆鲨': 'Garchomp',
    '快龙': 'Dragonite',
    '班基拉斯': 'Tyranitar',
    '卡比兽': 'Snorlax',
    '百变怪': 'Ditto',
    '可达鸭': 'Psyduck',
    '呆呆兽': 'Slowpoke',
    '密勒顿': 'Miraidon',
    '故勒顿': 'Koraidon',
  };

  const output = {
    opCodeToName,
    opCodeToSet,
    opJpNameToEn,
    opSetNames,
    pkmnJpToEn,
    pkmnTrainerJpToEn,
    pkmnSetJpToEn,
    pkmnCnToEn,
  };

  const outPath = path.join(process.cwd(), 'src', 'lib', 'translationsData.json');
  fs.writeFileSync(outPath, JSON.stringify(output), 'utf8');

  console.log('✅ Generated translationsData.json successfully!');
  console.log('- One Piece Code to Name:', Object.keys(opCodeToName).length);
  console.log('- One Piece Code to Set:', Object.keys(opCodeToSet).length);
  console.log('- One Piece JP Name dictionary:', Object.keys(opJpNameToEn).length);
  console.log('- Pokemon JP Species dictionary:', Object.keys(pkmnJpToEn).length);
  console.log('- Pokemon JP Trainer dictionary:', Object.keys(pkmnTrainerJpToEn).length);
  console.log('- Pokemon JP Set dictionary:', Object.keys(pkmnSetJpToEn).length);
  console.log('- Pokemon CN dictionary:', Object.keys(pkmnCnToEn).length);
}

build();
