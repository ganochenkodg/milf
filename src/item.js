'use strict';

Game.inventory = [];

const ITEM_STAT_KEYS = new Set(['str', 'agi', 'con', 'int', 'speed', 'vision']);
const FOOD_MESSAGES = {
  str: 'You feel stronger.',
  agi: 'You feel more agile.',
  int: 'You feel smarter.',
  con: 'You feel tougher.',
  speed: 'Your speed changes.',
  vision: 'Your vision improves.'
};
const PRIMARY_STATS = ['str', 'con', 'agi', 'int'];

class Item {
  constructor(properties = {}) {
    this.name = properties.name || '';
    this.maxLvl = properties.maxLvl || 1;
    this.minLvl = properties.minLvl || 1;
    this.options = properties.options || [];
    this.skills = properties.skills;
    this.symbol = properties.symbol || '';
    this.type = properties.type || 'other';
    this.level = properties.level || 1;
    this.color = properties.color || '#0000';
  }

  isEquipped() {
    const player = Game.entity[0];
    return (
      player.equipment.weapon === this ||
      player.equipment.armor === this ||
      (player.books && player.books.includes(this))
    );
  }
}

Game.pickupItem = function () {
  const player = Game.entity[0];
  const items = Game.map[player.depth].Tiles[player.x][player.y].items;
  if (!items[0]) return;

  if (Game.inventory.length >= 10) {
    Game.messageBox.sendMessage("Your inventory is full; you can't pick anything up.");
    return;
  }

  const pickitem = items.shift();
  Game.messageBox.sendMessage(`You pick up the ${pickitem.name}%c{}.`);
  Game.inventory.push(pickitem);
};

Game.chooseItem = function (num) {
  const item = Game.inventory[num];
  if (!item) {
    Game.messageBox.sendMessage(
      `You don't have any item in slot [${INVENTORY_LETTERS[num]}].`
    );
    Game.drawAll();
    window.removeEventListener('keydown', this);
    Game.engine.unlock();
    return;
  }

  Game.messageDisplay.clear();
  Game.drawBar();
  Game.messageDisplay.draw(
    (num + Game.screenWidth - 10) * 4 + 2,
    0,
    INVENTORY_LETTERS[num],
    '#0f0'
  );

  Game.messageDisplay.drawText(1, 2, `You see the ${item.name}`);
  let row = 2;
  for (const [key, value] of Object.entries(item.options)) {
    row++;
    Game.messageDisplay.drawText(1, row, `${key}: ${value}`);
  }
  if (item.skills) {
    row++;
    Game.messageDisplay.drawText(1, row, 'Skills:');
    for (const skill of item.skills) {
      row++;
      Game.messageDisplay.drawText(1, row, skill.name);
    }
  }

  Game.messageDisplay.drawText(1, row + 1, 'd) Drop');
  if (item.type === 'food') {
    Game.messageDisplay.drawText(1, row + 2, 'e) Eat');
  } else if (item.type === 'potion') {
    Game.messageDisplay.drawText(1, row + 2, 'e) Drink');
  } else if (item.type === 'weapon' || item.type === 'armor' || item.type === 'book') {
    Game.messageDisplay.drawText(1, row + 2, item.isEquipped() ? 'e) Unequip' : 'e) Equip');
  }
  Game.messageDisplay.drawText(1, row + 3, 's) Sacrifice');

  Game.entity[0].Draw();
  mode.mode = 'item';
  mode.chosenItem = num;
};

Game.doItem = function (action, num) {
  const player = Game.entity[0];
  const item = Game.inventory[num];
  const itemtype = item.type;

  if (action === 'equip') {
    if ((itemtype === 'weapon' || itemtype === 'armor') && player.equipment[itemtype]) {
      const prevIdx = Game.inventory.indexOf(player.equipment[itemtype]);
      if (prevIdx !== -1) Game.doItem('unequip', prevIdx);
    }
    if (itemtype === 'weapon' || itemtype === 'armor') {
      player.equipment[itemtype] = item;
    } else if (itemtype === 'book') {
      player.books.push(item);
    }
    Game.doItemOptions('apply', num);
    Game.messageBox.sendMessage(`You equip the ${item.name}.`);
    return;
  }

  if (action === 'unequip') {
    if (itemtype === 'weapon' || itemtype === 'armor') {
      delete player.equipment[itemtype];
    } else if (itemtype === 'book') {
      const idx = player.books.indexOf(item);
      if (idx !== -1) player.books.splice(idx, 1);
    }
    Game.doItemOptions('unapply', num);
    Game.messageBox.sendMessage(`You unequip the ${item.name}.`);
    return;
  }

  if (action === 'sacrifice') {
    if (item.isEquipped()) Game.doItem('unequip', num);
    Game.messageBox.sendMessage(`You sacrifice the ${item.name}.`);
    player.piety +=
      1 + roll(item.level) + Math.floor(Math.pow(1.6, item.level));
    Game.inventory.splice(num, 1);
    return;
  }

  if (action === 'drop') {
    if (item.isEquipped()) Game.doItem('unequip', num);
    Game.messageBox.sendMessage(`You drop the ${item.name}.`);
    Game.map[player.depth].Tiles[player.x][player.y].items.push(item);
    Game.inventory.splice(num, 1);
    return;
  }

  if (action === 'eat' || action === 'drink') {
    const verb = itemtype === 'food' ? 'eat' : 'drink';
    Game.messageBox.sendMessage(`You ${verb} the ${item.name}.`);
    Game.doFoodOptions(num);
    Game.inventory.splice(num, 1);
  }
};

Game.doItemOptions = function (action, num) {
  const player = Game.entity[0];
  const item = Game.inventory[num];

  if (item.skills !== undefined) {
    const bestBySymbol = new Map();
    const equipped = [
      player.equipment.weapon,
      player.equipment.armor,
      ...player.books
    ].filter(Boolean);

    for (const eq of equipped) {
      for (const skill of eq.skills || []) {
        const cur = bestBySymbol.get(skill.symbol);
        if (!cur || skill.level > cur.level) {
          bestBySymbol.set(skill.symbol, skill);
        }
      }
    }

    for (let i = 0; i < Game.skills.length; ) {
      const prev = Game.skills[i];
      const next = bestBySymbol.get(prev.symbol);
      if (next) {
        Game.skills[i] = next;
        if (action === 'apply' && next.level > prev.level) {
          Game.messageBox.sendMessage(`You can now use ${next.name}.`);
        }
        bestBySymbol.delete(prev.symbol);
        i++;
      } else {
        Game.skills.splice(i, 1);
      }
    }

    for (const skill of bestBySymbol.values()) {
      if (Game.skills.length >= 10) {
        Game.messageBox.sendMessage('You have learned the maximum number of skills.');
        break;
      }
      Game.skills.push(skill);
      Game.messageBox.sendMessage(`You can now use ${skill.name}.`);
    }
  }

  if (item.type === 'weapon' || item.type === 'armor') {
    const sign = action === 'apply' ? 1 : -1;
    for (const [key, value] of Object.entries(item.options)) {
      if (ITEM_STAT_KEYS.has(key)) {
        player[key] += sign * value;
      }
    }
  }
  player.applyStats();
};

Game.doFoodOptions = function (num) {
  const player = Game.entity[0];
  const item = Game.inventory[num];

  for (const [key, value] of Object.entries(item.options)) {
    if (key === 'hp') {
      player.hp += value;
      Game.messageBox.sendMessage(`You restore %c{red}${value} HP%c{}.`);
    } else if (key === 'mana') {
      player.mana += value;
      Game.messageBox.sendMessage(`You restore %c{blue}${value} MP%c{}.`);
    } else if (key in FOOD_MESSAGES) {
      player[key] += value;
      Game.messageBox.sendMessage(FOOD_MESSAGES[key]);
    }
  }

  if (item.symbol === 'heartoffleshlord') {
    player.mutate();
  }
  player.applyStats();
};

Game.ItemRepository = new Game.Repository('items', Item);
Game.FoodRepository = new Game.Repository('items', Item);

function registerGear(type, spritePrefix, defs) {
  for (const [key, label, minLvl, maxLvl, color, count, offset, optionsFn, rare] of defs) {
    Game.ItemRepository.define(key, function (level) {
      this.name = `${label} (${level})`;
      this.minLvl = minLvl;
      this.maxLvl = maxLvl;
      this.type = type;
      this.level = level;
      this.color = color;
      this.symbol = `${spritePrefix}${roll(count) + offset}`;
      this.options = optionsFn(level);
      if (rare && Math.random() < rareItemChance) {
        this.name = `%c{lightsalmon}rare ${this.name}%c{}`;
        if (rare.level) this.level += rare.level;
        if (rare.color) this.color = rare.color;
        for (const [stat, bonus] of Object.entries(rare.options || {})) {
          this.options[stat] = (this.options[stat] || 0) + bonus;
        }
      }
    });
  }
}

const SWORD_DEFS = [
  ['rustedblade', 'rusted blade', 1, 5, '#0000', 3, 1,
    (l) => ({ minatk: 1, maxatk: 4 + roll(l), str: 1 + roll(l) }),
    { level: 3, color: '#00f4', options: { maxatk: 4, str: 1 } }],
  ['ironsword', 'iron sword', 1, 10, '#7733', 5, 1,
    (l) => ({ minatk: 2, maxatk: 6 + roll(l), str: 1 + roll(l), con: 1 + roll(l) }),
    { level: 3, color: '#7735', options: { maxatk: 5, str: 1 } }],
  ['soldierscutter', "soldier's cutter", 5, 15, '#3933', 5, 4,
    (l) => ({ minatk: 5, maxatk: 6 + Math.floor(l / 3) + roll(l), str: 4 + roll(l), con: 2 + roll(l) }),
    { level: 3, color: '#3935', options: { maxatk: 5, str: 3 } }],
  ['steelblade', 'steel blade', 10, 20, '#ccc3', 6, 3,
    (l) => ({ minatk: 4, maxatk: 7 + Math.floor(l / 3) + roll(l), str: 2 + roll(l), con: 5 + roll(l) }),
    { level: 2, color: '#ccc5', options: { maxatk: 4, con: 2 } }],
  ['ironshortsword', 'iron shortsword', 5, 15, '#8883', 2, 1,
    (l) => ({ minatk: 2, maxatk: 4 + roll(l), str: 1 + roll(l), con: 3 + roll(l / 2) }),
    { level: 2, color: '#8885', options: { maxatk: 3, str: 1 } }],
  ['coalfang', 'coal fang', 12, 22, '#4443', 3, 3,
    (l) => ({ minatk: 4, maxatk: 7 + Math.floor(l / 3) + roll(l), str: 4 + roll(l), con: 1 + roll(l / 2) }),
    { level: 2, color: '#4445', options: { maxatk: 4, str: 3 } }],
  ['tigerslash', 'tiger slash', 15, 28, '#fa33', 3, 6,
    (l) => ({ minatk: 5, maxatk: 8 + Math.floor(l / 2) + roll(l), str: 4 + roll(l), con: 4 + roll(l) }),
    { level: 2, color: '#fa55', options: { maxatk: 5, str: 4 } }],
  ['azureblade', 'azure blade', 22, 35, '#59f3', 3, 8,
    (l) => ({ minatk: 6, maxatk: 8 + Math.floor(l / 2) + roll(l), str: 6 + roll(l), con: 6 + roll(l) }),
    { level: 3, color: '#59f5', options: { maxatk: 7, str: 5 } }],
  ['carversoul', 'carver soul', 25, 38, '#b93a', 5, 6,
    (l) => ({ minatk: 7, maxatk: 11 + Math.floor(l / 2) + roll(l), str: 5 + roll(l), con: 3 + roll(l) }),
    { level: 3, color: '#b95c', options: { maxatk: 6, str: 5 } }],
  ['drakeslicer', 'drake slicer', 30, 45, '#f90a', 4, 3,
    (l) => ({ minatk: 10, maxatk: 8 + l + roll(l), str: 6 + Math.floor(l / 3) + roll(l), con: 8 + roll(l) }),
    { level: 3, color: '#f92c', options: { maxatk: 10, str: 6 } }],
  ['lightfang', 'light fang', 40, 50, '#fff3', 3, 5,
    (l) => ({ minatk: 12, maxatk: 13 + l + roll(l), str: 10 + l + roll(l), con: 10 + roll(l) }),
    { level: 3, color: '#ffff', options: { maxatk: 12, str: 8 } }],
  ['soulcleaver', 'soul cleaver', 45, 100, '#f03b', 4, 2,
    (l) => ({ minatk: 16, maxatk: 20 + l + roll(l), str: 15 + l + roll(l), con: 10 + Math.floor(l / 2) + roll(l) }),
    { level: 4, color: '#f05d', options: { maxatk: 15, str: 10 } }]
];

const STAFF_DEFS = [
  ['novicestaff', 'novice staff', 1, 5, '#0000', 4, 4,
    (l) => ({ minatk: 1, maxatk: 4 + roll(l), int: 1 + roll(l) }),
    { level: 3, color: '#00f4', options: { maxatk: 2, int: 1 } }],
  ['sparkwand', 'spark wand', 1, 10, '#fa03', 7, 1,
    (l) => ({ minatk: 2, maxatk: 4 + Math.floor(l / 3), int: 2 + roll(l), agi: 1 + roll(l) }),
    { level: 3, color: '#fa05', options: { maxatk: 4, int: 1 } }],
  ['apprenticestaff', 'apprentice staff', 5, 15, '#33f3', 5, 4,
    (l) => ({ minatk: 3, maxatk: 5 + Math.floor(l / 3), int: 4 + roll(l), agi: 2 + roll(l) }),
    { level: 3, color: '#33f5', options: { maxatk: 4, con: 3 } }],
  ['arcanebranch', 'arcane branch', 7, 17, '#a8f3', 5, 2,
    (l) => ({ minatk: 3, maxatk: 6 + Math.floor(l / 3), int: 4 + roll(l), con: 2 + roll(l) }),
    { level: 2, color: '#a8f5', options: { maxatk: 4, int: 2 } }],
  ['glowbranch', 'glow branch', 10, 20, '#6f63', 7, 1,
    (l) => ({ minatk: 4, maxatk: 8 + Math.floor(l / 3), int: 5 + roll(l), agi: 4 + roll(l) }),
    { level: 2, color: '#6f65', options: { maxatk: 4, int: 3 } }],
  ['igneousrod', 'igneous rod', 12, 22, '#f934', 6, 3,
    (l) => ({ minatk: 4, maxatk: 7 + roll(l), int: 4 + Math.floor(l / 3) + roll(l), con: 5 + roll(l) }),
    { level: 2, color: '#f956', options: { maxatk: 6, int: 5 } }],
  ['crystalwand', 'crystal wand', 18, 28, '#ccf5', 7, 1,
    (l) => ({ minatk: 6, maxatk: 9 + Math.floor(l / 3) + roll(l), int: 6 + roll(l), agi: 6 + roll(l) }),
    { level: 3, color: '#ccf7', options: { maxatk: 7, int: 8 } }],
  ['manaoak', 'mana oak', 15, 25, '#0cf3', 6, 1,
    (l) => ({ minatk: 5, maxatk: 8 + Math.floor(l / 3) + roll(l), int: 8 + roll(l), con: 6 + roll(l / 2) }),
    { level: 3, color: '#0cf5', options: { maxatk: 8, int: 8 } }],
  ['stormspire', 'storm spire', 20, 32, '#09f4', 7, 1,
    (l) => ({ minatk: 8, maxatk: 8 + Math.floor(l / 2) + roll(l), int: 10 + roll(l), con: 10 + roll(l) }),
    { level: 3, color: '#09f6', options: { maxatk: 5, int: 10 } }],
  ['emberrod', 'ember rod', 25, 38, '#f52a', 6, 2,
    (l) => ({ minatk: 10, maxatk: 10 + Math.floor(l / 2) + roll(l), int: 10 + Math.floor(l / 2) + roll(l), agi: 10 + Math.floor(l / 2) + roll(l) }),
    { level: 3, color: '#f54c', options: { maxatk: 10, int: 10 } }],
  ['mindspike', 'mind spike', 30, 45, '#b3f5', 5, 6,
    (l) => ({ minatk: 6, maxatk: 12 + Math.floor(l / 2) + roll(l), int: 12 + l + roll(l), agi: 8 + Math.floor(l / 2) + roll(l) }),
    { level: 3, color: '#b3f7', options: { maxatk: 10, int: 11 } }],
  ['voidstaff', 'void staff', 40, 100, '#8035', 6, 2,
    (l) => ({ minatk: 7, maxatk: 14 + Math.floor(l / 2) + roll(l), int: 15 + l + roll(l), con: 12 + Math.floor(l / 2) + roll(l) }),
    { level: 4, color: '#8057', options: { maxatk: 15, int: 20 } }]
];

const ARMOR_DEFS = [
  ['wornarmor', 'worn armor', 1, 5, '#0000', 3, 1,
    (l) => ({ defense: 1 + roll(l), str: 1 + roll(l), con: 1 + roll(l) }),
    { level: 3, color: '#00f4', options: { defense: 2, str: 1 } }],
  ['tatteredrobe', 'tattered robe', 1, 5, '#0000', 2, 3,
    (l) => ({ defense: 1 + roll(l), int: 1 + roll(l), agi: 1 + roll(l) }),
    { level: 3, color: '#00f4', options: { defense: 2, agi: 1 } }],
  ['paddedvest', 'padded vest', 3, 7, '#0000', 2, 5,
    (l) => ({ defense: 3 + roll(l), str: 1 + roll(l), con: 3 + roll(l) }),
    { level: 3, color: '#00f4', options: { defense: 3, str: 1 } }],
  ['leathercuirass', 'leather cuirass', 5, 10, '#9643', 4, 5,
    (l) => ({ defense: 2 + l + roll(l), str: 2 + Math.floor(l / 2) + roll(l), con: 2 + Math.floor(l / 2) + roll(l) }),
    { level: 3, color: '#9645', options: { defense: 3, str: 3 } }],
  ['apprenticerobe', 'apprentice robe', 5, 10, '#6033', 2, 5,
    (l) => ({ defense: 2 + l + roll(l), int: 2 + Math.floor(l / 2) + roll(l), con: 2 + Math.floor(l / 2) + roll(l) }),
    { level: 3, color: '#6035', options: { defense: 3, int: 3 } }],
  ['chainvest', 'chain vest', 10, 20, '#9994', 2, 4,
    (l) => ({ defense: 4 + l + roll(l), con: 3 + Math.floor(l / 2) + roll(l), str: 1 + Math.floor(l / 2) + roll(l) }),
    { color: '#9996', options: { defense: 3, con: 2 } }],
  ['battleplate', 'battle plate', 18, 30, '#caa4', 2, 10,
    (l) => ({ defense: 8 + l + roll(l), con: 4 + l + roll(l), str: 2 + l + roll(l) }),
    { color: '#cac6', options: { defense: 6, con: 5 } }],
  ['runecoat', 'rune coat', 25, 38, '#66f4', 3, 7,
    (l) => ({ defense: 6 + l + roll(l), int: 5 + l + roll(l), con: 2 + l + roll(l) }),
    { color: '#66f6', options: { defense: 3, int: 5 } }],
  ['dragonarmor', 'dragon armor', 40, 50, '#e22f', 6, 1,
    (l) => ({ defense: 12 + l + roll(l), con: 10 + l + roll(l), agi: 10 + l + roll(l) }),
    { color: '#e25f', options: { defense: 5, con: 6 } }],
  ['shadowcloak', 'shadow cloak', 6, 14, '#222f', 4, 1,
    (l) => ({ defense: 2 + l + roll(l), str: 2 + Math.floor(l / 2) + roll(l), agi: 2 + Math.floor(l / 2) + roll(l) }),
    { level: 3, color: '#9645', options: { defense: 3, str: 3 } }],
  ['splintmail', 'splint mail', 12, 22, '#aaa6', 3, 2,
    (l) => ({ defense: 3 + l + roll(l), con: 3 + Math.floor(l / 2) + roll(l), agi: 1 + Math.floor(l / 2) + roll(l) }),
    { color: '#9996', options: { defense: 3, con: 2 } }],
  ['witchrobe', 'witch robe', 16, 26, '#6a4f', 4, 1,
    (l) => ({ defense: 6 + l + roll(l), con: 4 + l + roll(l), int: 2 + l + roll(l) }),
    { color: '#cac6', options: { defense: 5, con: 4 } }],
  ['spectralguard', 'spectral guard', 30, 44, '#77e4', 5, 2,
    (l) => ({ defense: 10 + l + roll(l), str: 5 + l + roll(l), con: 3 + l + roll(l) }),
    { color: '#66f6', options: { defense: 6, str: 5 } }],
  ['phoenixplate', 'phoenix plate', 45, 100, '#f405', 6, 4,
    (l) => ({ defense: 15 + l + roll(l), con: 10 + l + roll(l), str: 10 + l + roll(l) }),
    { color: '#e25f', options: { defense: 5, con: 6 } }]
];

registerGear('weapon', 'sword', SWORD_DEFS);
registerGear('weapon', 'staff', STAFF_DEFS);
registerGear('armor', 'armor', ARMOR_DEFS);

const HERB_DEFS = [
  ['healingherb', 'healing herb', (l) => ({ hp: (7 + roll(l * 3)) * healingFactor })],
  ['magicalherb', 'magical herb', (l) => ({ mana: (7 + roll(l * 3)) * healingFactor })],
  ['ancientherb', 'ancient herb', (l) => ({
    hp: (5 + roll(l * 3)) * healingFactor,
    mana: (5 + roll(l * 3)) * healingFactor
  })]
];

for (const [key, name, optionsFn] of HERB_DEFS) {
  Game.FoodRepository.define(key, function (level) {
    this.name = name;
    this.minLvl = 1;
    this.maxLvl = 50;
    this.type = 'food';
    this.level = 2;
    this.color = '#0000';
    this.symbol = `herb${roll(12) + 1}`;
    this.options = optionsFn(level);
  });
}

Game.FoodRepository.define('mysticalmushroom', function () {
  this.name = 'mystical mushroom';
  this.minLvl = 1;
  this.maxLvl = 50;
  this.type = 'food';
  this.level = 2;
  this.color = '#0000';
  this.symbol = `mushroom${roll(2) + 1}`;
  this.options = { [ROT.RNG.getItem(PRIMARY_STATS)]: 1 };
  if (Math.random() < rareItemChance * 0.3) {
    this.name = `%c{lightsalmon}rare ${this.name}%c{}`;
    this.options.vision = 1;
    this.color = '#0f04';
  }
});

Game.FoodRepository.define('heartoffleshlord', function (level) {
  this.name = 'heart of fleshlord';
  this.minLvl = -100;
  this.maxLvl = -50;
  this.type = 'food';
  this.level = level;
  this.color = '#0000';
  this.symbol = 'heartoffleshlord';
  this.options = { str: 5, int: 5, con: 20, speed: -10 };
});

const HEALING_POTION_DEFS = [
  ['smallhealingpotion', 'small healing potion', 1, 5, 10, 10],
  ['mediumhealingpotion', 'medium healing potion', 10, 25, 30, 30],
  ['largehealingpotion', 'large healing potion', 20, 40, 60, 30]
];

for (const [key, label, minLvl, maxLvl, baseHeal, rareBonus] of HEALING_POTION_DEFS) {
  Game.ItemRepository.define(key, function (level) {
    this.name = `${label} (${level})`;
    this.minLvl = minLvl;
    this.maxLvl = maxLvl;
    this.type = 'potion';
    this.level = level;
    this.color = '#0000';
    this.symbol = `potion${roll(9) + 1}`;
    this.options = {
      hp: (baseHeal + roll(level * 3)) * healingFactor,
      mana: (baseHeal + roll(level * 3)) * healingFactor
    };
    if (Math.random() < rareItemChance) {
      this.name = `%c{lightsalmon}rare ${this.name}%c{}`;
      this.options.hp += rareBonus;
      this.options.mana += rareBonus;
      this.color = '#0f04';
    }
  });
}

const GROWTH_POTION_DEFS = [
  ['smallgrowthpotion', 'small growth potion', 3, 7, () => 1 + roll(2)],
  ['mediumgrowthpotion', 'medium growth potion', 12, 27, (l) => Math.floor(l / 3) + roll(2)],
  ['largegrowthpotion', 'large growth potion', 20, 50, (l) => Math.floor(l / 3) + roll(3)]
];

for (const [key, label, minLvl, maxLvl, amountFn] of GROWTH_POTION_DEFS) {
  Game.ItemRepository.define(key, function (level) {
    this.name = `${label} (${level})`;
    this.minLvl = minLvl;
    this.maxLvl = maxLvl;
    this.type = 'potion';
    this.level = level;
    this.color = '#0000';
    this.symbol = `potion${roll(9) + 1}`;
    this.options = { [ROT.RNG.getItem(PRIMARY_STATS)]: amountFn(level) };
  });
}

const BOOK_DEFS = [
  ['bookofarrows', 'book of arrows', 1, 10, '#0000', '#00f4', 2,
    (l) => [Game.SkillRepository.create(ROT.RNG.getItem(['firearrow', 'icearrow', 'poisonarrow', 'stonearrow']), l)]],
  ['bookofyoungwarrior', 'book of young warriors', 1, 10, '#0000', '#00f4', 2,
    (l) => [Game.SkillRepository.create(ROT.RNG.getItem(['poisonslash', 'rapidcut']), l)]],
  ['bookoffirstchants', 'book of first chants', 1, 10, '#0000', '#00f4', 2,
    (l) => [Game.SkillRepository.create(ROT.RNG.getItem(['iceshield', 'strengthofstone']), l)]],
  ['bookofunknownmagic', 'book of unknown magic', 2, 10, '#fd04', '#fd05', 2,
    (l) => [Game.SkillRepository.createRandom(2, l)]],
  ['bookofancientmagic', 'book of ancient magic', 6, 15, '#fc04', '#fc05', 2,
    (l) => [Game.SkillRepository.createRandom(6, l), Game.SkillRepository.createRandom(4, l)]],
  ['bookofmassdestruction', 'book of mass destruction', 5, 20, '#f003', '#f005', 2,
    (l) => [Game.SkillRepository.create(ROT.RNG.getItem(['fireball', 'acidcloud', 'tsunami', 'crackedearth']), l)]],
  ['bookoflostfreedom', 'book of lost freedom', 7, 20, '#acc3', '#acc5', 2,
    (l) => [Game.SkillRepository.create(ROT.RNG.getItem(['flamechains', 'calltheshadows']), l)]],
  ['bookofmysticarts', 'book of mystic arts', 10, 25, '#9cf3', '#9cf5', 2,
    (l) => [Game.SkillRepository.createRandom(10, l), Game.SkillRepository.createRandom(10, l)]],
  ['bookoflostknowledge', 'book of lost knowledge', 15, 30, '#a8c3', '#a8c5', 3,
    (l) => [Game.SkillRepository.createRandom(15, l), Game.SkillRepository.createRandom(12, l)]],
  ['bookofeldritchpower', 'book of eldritch power', 20, 40, '#8f83', '#8f85', 3,
    (l) => [
      Game.SkillRepository.createRandom(18, l),
      Game.SkillRepository.createRandom(20, l),
      Game.SkillRepository.createRandom(15, l)
    ]],
  ['bookofarcanelegacy', 'book of arcane legacy', 25, 50, '#fcf3', '#fcf5', 3,
    (l) => [
      Game.SkillRepository.createRandom(25, l),
      Game.SkillRepository.createRandom(20, l),
      Game.SkillRepository.createRandom(15, l)
    ]],
  ['bookofflames', 'book of flames', 10, 30, '#f603', '#f605', 2,
    (l) => [Game.SkillRepository.create(ROT.RNG.getItem(['fireball', 'fireshield', 'flamechains']), l)]],
  ['bookofstorms', 'book of storms', 15, 35, '#acf3', '#acf5', 2,
    (l) => [Game.SkillRepository.create(ROT.RNG.getItem(['lightningbolt', 'lightningstrike', 'supernova']), l)]],
  ['bookofpoison', 'book of poison', 10, 30, '#6c33', '#6c35', 2,
    (l) => [Game.SkillRepository.create(ROT.RNG.getItem(['poisonarrow', 'plague', 'acidcloud']), l)]],
  ['bookoffrost', 'book of frost', 10, 30, '#9cf3', '#9cf5', 2,
    (l) => [Game.SkillRepository.create(ROT.RNG.getItem(['icearrow', 'iceshield', 'frozentomb']), l)]],
  ['bookofshadows', 'book of shadows', 20, 40, '#4443', '#4445', 2,
    (l) => [Game.SkillRepository.create(ROT.RNG.getItem(['calltheshadows', 'darkness', 'auraoffear']), l)]],
  ['bookoftheearth', 'book of the earth', 15, 35, '#7b53', '#7b5255', 2,
    (l) => [Game.SkillRepository.create(ROT.RNG.getItem(['iceshield', 'strengthofstone', 'crackedearth']), l)]],
  ['bookofwarriors', 'book of warriors', 10, 30, '#b943', '#b945', 2,
    (l) => [Game.SkillRepository.create(ROT.RNG.getItem(['twistingslash', 'rapidcut', 'rainofblades']), l)]],
  ['bookofthetide', 'book of the tide', 15, 35, '#00c3', '#00c5', 2,
    (l) => [Game.SkillRepository.create(ROT.RNG.getItem(['tsunami', 'auraofwinter', 'icefall']), l)]],
  ['bookofspeed', 'book of speed', 15, 35, '#fe03', '#fe05', 2,
    (l) => [Game.SkillRepository.create(ROT.RNG.getItem(['speedoflight', 'rapidcut', 'honor']), l)]],
  ['bookofshields', 'book of shields', 10, 30, '#77bbaaaa', '#77bbcccc', 2,
    (l) => [Game.SkillRepository.create(ROT.RNG.getItem(['iceshield', 'arcaneshield', 'fireshield', 'reflectionshield']), l)]],
  ['bookofchaos', 'book of chaos', 20, 40, '#f393', '#f395', 2,
    (l) => [Game.SkillRepository.create(ROT.RNG.getItem(['fireball', 'acidcloud', 'supernova']), l)]],
  ['bookoflight', 'book of light', 20, 40, '#f883', '#f885', 2,
    (l) => [Game.SkillRepository.create(ROT.RNG.getItem(['solareclipse', 'speedoflight', 'honor']), l)]],
  ['bookofillusions', 'book of illusions', 15, 35, '#9373', '#9375', 2,
    (l) => [Game.SkillRepository.create(ROT.RNG.getItem(['magiceye', 'darkness', 'auraoffear']), l)]],
  ['bookoftravel', 'book of travel', 10, 30, '#87c3', '#87c5', 2,
    (l) => [Game.SkillRepository.create(ROT.RNG.getItem(['teleport', 'speedoflight', 'heal']), l)]],
  ['bookofassault', 'book of assault', 15, 35, '#ff63', '#ff65', 2,
    (l) => [Game.SkillRepository.create(ROT.RNG.getItem(['twistingslash', 'rainofblades', 'supernova']), l)]]
];

for (const [key, label, minLvl, maxLvl, color, rareColor, rareSpan, skillsFn] of BOOK_DEFS) {
  Game.ItemRepository.define(key, function (level) {
    this.name = `${label} (${level})`;
    this.minLvl = minLvl;
    this.maxLvl = maxLvl;
    this.type = 'book';
    this.level = level;
    this.color = color;
    this.symbol = `book${roll(6) + 1}`;
    this.skills = skillsFn(level);
    if (Math.random() < rareItemChance) {
      this.name = `%c{lightsalmon}rare ${this.name}%c{}`;
      this.level += 3;
      this.skills.push(Game.SkillRepository.createRandom(level, level + rareSpan));
      this.color = rareColor;
    }
  });
}

const ELEMENT_COLORS = {
  fire: 'indianred',
  ice: 'lightblue',
  poison: 'darkseagreen',
  earth: 'tan',
  light: 'ivory',
  darkness: 'silver'
};
const ELEMENTS = Object.keys(ELEMENT_COLORS);

function registerElementalWeapon(key, label, primaryStat, skillMap) {
  Game.ItemRepository.define(key, function (level) {
    const el1 = ROT.RNG.getItem(ELEMENTS);
    const el2 = ROT.RNG.getItem(ELEMENTS.filter((e) => e !== el1));

    this.name =
      `${label} of %c{${ELEMENT_COLORS[el1]}}${el1}%c{} and %c{${ELEMENT_COLORS[el2]}}${el2}%c{} (${level})`;
    this.minLvl = 7;
    this.maxLvl = 50;
    this.type = 'weapon';
    this.level = level;
    this.color = '#fd05';
    this.symbol = `${key}${roll(2) + 1}`;

    const skill1 = ROT.RNG.getItem(skillMap[el1]);
    const skill2 =
      ROT.RNG.getItem(skillMap[el2].filter((s) => s !== skill1)) ||
      ROT.RNG.getItem(skillMap[el2]);
    this.skills = [
      Game.SkillRepository.create(skill1, level),
      Game.SkillRepository.create(skill2, level)
    ];

    this.options = {
      minatk: 2 + Math.floor(level / 3),
      maxatk: 5 + Math.floor(level / 2) + roll(level),
      [primaryStat]: 3 + Math.floor(level / 2) + roll(level),
      con: 3 + Math.floor(level / 3) + roll(Math.ceil(level / 2))
    };
  });
}

registerElementalWeapon('elementalstaff', 'staff', 'int', {
  fire: ['fireball', 'flamechains', 'fireshield'],
  ice: ['iceshield', 'frozentomb', 'icearrow', 'icefall'],
  poison: ['plague', 'acidcloud', 'poisonarrow'],
  earth: ['strengthofstone', 'crackedearth'],
  light: ['honor', 'solareclipse', 'supernova', 'heal'],
  darkness: ['darkness', 'calltheshadows', 'auraoffear']
});

registerElementalWeapon('elementalsword', 'sword', 'str', {
  fire: ['twistingslash', 'rainofblades'],
  ice: ['twistingslash', 'rainofblades'],
  poison: ['poisonslash', 'twistingslash'],
  earth: ['rapidcut', 'twistingslash'],
  light: ['rapidcut', 'twistingslash', 'rainofblades'],
  darkness: ['poisonslash', 'twistingslash']
});
