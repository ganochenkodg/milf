Game.inventory = [];

Item = function (properties) {
  properties = properties || {};
  this.name = properties['name'] || '';
  this.options = properties['options'] || [];
  this.skills = properties['skills'] || [];
  this.symbol = properties['symbol'] || '';
  this.type = properties['type'] || 'other';
  this.level = properties['level'] || 1;
  this.price = properties['price'] || 1;
  this.color = properties['color'] || '#0000';
  this.timestamp = Math.random() * 1000 + Date.now();
};

Item.prototype.isEquipped = function () {
  if (typeof Game.entity[0].equipment.weapon !== 'undefined') {
    if (Game.entity[0].equipment.weapon == this) {
      return true;
    }
  }
  if (typeof Game.entity[0].equipment.armor !== 'undefined') {
    if (Game.entity[0].equipment.armor == this) {
      return true;
    }
  }
  if (typeof Game.entity[0].books !== 'undefined') {
    for (let i = 0; i < Game.entity[0].books.length; i++) {
      if (Game.entity[0].books[i] == this) {
        return true;
      }
    }
  }

  return false;
};

Game.pickupItem = function () {
  let level = Game.entity[0].depth;
  let x = Game.entity[0].x;
  let y = Game.entity[0].y;
  if (typeof Game.map[level].Tiles[x][y].items[0] !== 'undefined') {
    if (Game.inventory.length > 10) {
      Game.messageBox.sendMessage(
        "Your inventory is full, you can't pick anything."
      );
      return;
    }
    var pickitem = Game.map[level].Tiles[x][y].items.shift();
    Game.messageBox.sendMessage('You picked up ' + pickitem.name + '%c{}.');
    Game.inventory.push(pickitem);
  }
};

Game.chooseItem = function (num) {
  const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
  if (typeof Game.inventory[num] === 'undefined') {
    Game.messageBox.sendMessage(
      "You don't have any item in the slot [" + letters[num] + '].'
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
    letters[num],
    '#0f0'
  );

  Game.messageDisplay.drawText(1, 2, 'You see the ' + Game.inventory[num].name);
  var iterator = 2;
  for (let [key, value] of Object.entries(Game.inventory[num].options)) {
    iterator++;
    Game.messageDisplay.drawText(1, iterator, `${key}: ${value}`);
  }
  if (typeof Game.inventory[num].skills !== 'undefined') {
    iterator++;
    Game.messageDisplay.drawText(1, iterator, 'Skills:');
    for (let i = 0; i < Game.inventory[num].skills.length; i++) {
      iterator++;
      Game.messageDisplay.drawText(
        1,
        iterator,
        Game.inventory[num].skills[i].name
      );
    }
  }
  Game.messageDisplay.drawText(1, iterator + 1, 'd) Drop');
  var itemtype = Game.inventory[num].type;
  if (itemtype == 'food') {
    Game.messageDisplay.drawText(1, iterator + 2, 'e) Eat');
  }
  if (itemtype == 'potion') {
    Game.messageDisplay.drawText(1, iterator + 2, 'e) Drink');
  }
  if (itemtype == 'weapon' || itemtype == 'armor' || itemtype == 'book') {
    if (Game.inventory[num].isEquipped()) {
      Game.messageDisplay.drawText(1, iterator + 2, 'e) Unequip');
    } else {
      Game.messageDisplay.drawText(1, iterator + 2, 'e) Equip');
    }
  }
  Game.messageDisplay.drawText(1, iterator + 3, 's) Sacrifice');
  Game.entity[0].Draw();
  mode.mode = 'item';
  mode.chosenItem = num;
};

Game.doItem = function (action, num) {
  var itemtype = Game.inventory[num].type;

  if (action == 'equip') {
    if (
      itemtype == 'weapon' &&
      typeof Game.entity[0].equipment.weapon !== 'undefined'
    ) {
      for (let i = 0; i < Game.inventory.length; i++) {
        if (Game.inventory[i] == Game.entity[0].equipment.weapon) {
          Game.doItem('unequip', i);
          break;
        }
      }
    }
    if (
      itemtype == 'armor' &&
      typeof Game.entity[0].equipment.armor !== 'undefined'
    ) {
      for (let i = 0; i < Game.inventory.length; i++) {
        if (Game.inventory[i] == Game.entity[0].equipment.weapon) {
          Game.doItem('unequip', i);
          break;
        }
      }
    }
    if (itemtype == 'weapon') {
      Game.entity[0].equipment.weapon = Game.inventory[num];
    }
    if (itemtype == 'armor') {
      Game.entity[0].equipment.armor = Game.inventory[num];
    }
    if (itemtype == 'book') {
      Game.entity[0].books.push(Game.inventory[num]);
    }
    Game.doItemOptions('apply', num);
    Game.messageBox.sendMessage(
      'You equipped the ' + Game.inventory[num].name + '.'
    );
  }
  if (action == 'unequip') {
    if (itemtype == 'weapon') {
      delete Game.entity[0].equipment.weapon;
    }
    if (itemtype == 'armor') {
      delete Game.entity[0].equipment.armor;
    }
    if (itemtype == 'book') {
      for (let i = 0; i < Game.entity[0].books.length; i++) {
        if (Game.entity[0].books[i] == Game.inventory[num]) {
          Game.entity[0].books.splice(i, 1);
          break;
        }
      }
    }
    Game.doItemOptions('unapply', num);
    Game.messageBox.sendMessage(
      'You unequipped the ' + Game.inventory[num].name + '.'
    );
  }

  if (action == 'sacrifice') {
    if (itemtype == 'weapon' || itemtype == 'armor' || itemtype == 'book') {
      if (Game.inventory[num].isEquipped()) {
        Game.doItem('unequip', num);
      }
    }
    Game.messageBox.sendMessage(
      'You sacrificed the ' + Game.inventory[num].name + '.'
    );
    Game.entity[0].piety += Game.inventory[num].price;
    Game.inventory.splice(num, 1);
  }
  if (action == 'drop') {
    if (itemtype == 'weapon' || itemtype == 'armor' || itemtype == 'book') {
      if (Game.inventory[num].isEquipped()) {
        //unequip item
        Game.doItem('unequip', num);
      }
    }
    Game.messageBox.sendMessage(
      'You dropped the ' + Game.inventory[num].name + '.'
    );
    Game.map[Game.entity[0].depth].Tiles[Game.entity[0].x][
      Game.entity[0].y
    ].items.push(Game.inventory[num]);
    Game.inventory.splice(num, 1);
  }

  if (action == 'eat' || action == 'drink') {
    if (itemtype == 'food') {
      Game.messageBox.sendMessage(
        'You ate the ' + Game.inventory[num].name + '.'
      );
    }
    if (itemtype == 'potion') {
      Game.messageBox.sendMessage(
        'You drank the ' + Game.inventory[num].name + '.'
      );
    }
    Game.doFoodOptions(num);
    Game.inventory.splice(num, 1);
  }
};

Game.doItemOptions = function (action, num) {
  var itemtype = Game.inventory[num].type;
  if (typeof Game.inventory[num].skills !== 'undefined') {
    if (action == 'apply') {
      for (let i = 0; i < Game.inventory[num].skills.length; i++) {
        if (Game.skills.length > 9) {
          Game.messageBox.sendMessage(
            'You have learned maximum number of skills.'
          );
        }
        Game.skills.push(Game.inventory[num].skills[i]);
        Game.messageBox.sendMessage(
          'Now you can use ' + Game.inventory[num].skills[i].name + '.'
        );
      }
    } else {
      for (let j = 0; j < Game.skills.length; j++) {
        for (let i = 0; i < Game.inventory[num].skills.length; i++) {
          if (Game.skills[j] == Game.inventory[num].skills[i]) {
            Game.skills.splice(j, 1);
            break;
          }
        }
      }
    }
  }
  if (itemtype == 'weapon' || itemtype == 'armor') {
    for (let [key, value] of Object.entries(Game.inventory[num].options)) {
      if (action == 'apply') {
        var valueMod = value;
      } else {
        var valueMod = -value;
      }
      if (key == 'str') Game.entity[0].str += valueMod;
      if (key == 'agi') Game.entity[0].agi += valueMod;
      if (key == 'con') Game.entity[0].con += valueMod;
      if (key == 'int') Game.entity[0].int += valueMod;
      if (key == 'speed') Game.entity[0].speed += valueMod;
      if (key == 'vision') Game.entity[0].vision += valueMod;
    }
  }
  Game.entity[0].applyStats();
};

Game.doFoodOptions = function (num) {
  var itemtype = Game.inventory[num].type;
  for (let [key, value] of Object.entries(Game.inventory[num].options)) {
    if (key == 'hp') {
      Game.entity[0].hp += value;
      Game.messageBox.sendMessage('You restored %c{red}' + value + ' HP%c{}.');
    }
    if (key == 'mana') {
      Game.entity[0].Mana += value;
      Game.messageBox.sendMessage('You restored %c{blue}' + value + ' MP%c{}.');
    }
    if (key == 'str') {
      Game.entity[0].str += value;
      Game.messageBox.sendMessage('You feel stronger.');
    }
    if (key == 'agi') {
      Game.entity[0].agi += value;
      Game.messageBox.sendMessage('You feel more agile.');
    }
    if (key == 'int') {
      Game.entity[0].int += value;
      Game.messageBox.sendMessage('You feel smarter.');
    }
    if (key == 'con') {
      Game.entity[0].con += value;
      Game.messageBox.sendMessage('You feel tighter.');
    }
  }
  Game.entity[0].applyStats();
};

Game.ItemRepository = new Game.Repository('items', Item);

Game.ItemRepository.define('novicesword', function (level) {
  this.name = 'novice sword (' + level + ')';
  this.minLvl = 1;
  this.maxLvl = 5;
  this.type = 'weapon';
  this.level = level;
  this.color = '#0000';
  this.symbol = 'sword' + (Math.floor(Math.random() * 3) + 1);
  this.price = level + Math.floor(Math.random() * level);
  this.options = {
    minatk: 1,
    maxatk: 6 + Math.floor(Math.random() * level),
    str: 1 + Math.floor(Math.random() * level),
    con: 1 + Math.floor(Math.random() * level)
  };
  if (Math.random() < rareItemChance) {
    this.name = '%c{lightsalmon}rare ' + this.name + '%c{}';
    this.price = this.price * 2;
    this.options.maxatk = this.options.maxatk * 2;
    this.options.str += 1;
    this.color = '#00f4';
  }
});

Game.ItemRepository.define('novicestaff', function (level) {
  this.name = 'novice staff (' + level + ')';
  this.minLvl = 1;
  this.maxLvl = 5;
  this.type = 'weapon';
  this.level = level;
  this.color = '#0000';
  this.symbol = 'staff' + (Math.floor(Math.random() * 4) + 4);
  this.price = level + Math.floor(Math.random() * level);
  this.options = {
    minatk: 1,
    maxatk: 4 + Math.floor(Math.random() * level),
    int: 1 + Math.floor(Math.random() * level),
    agi: 1 + Math.floor(Math.random() * level)
  };
  if (Math.random() < rareItemChance) {
    this.name = '%c{lightsalmon}rare ' + this.name + '%c{}';
    this.price = this.price * 2;
    this.options.maxatk = this.options.maxatk * 2;
    this.options.int += 1;
    this.color = '#00f4';
  }
});

Game.ItemRepository.define('smallhealingpotion', function (level) {
  this.name = 'small healing potion (' + level + ')';
  this.minLvl = 1;
  this.maxLvl = 5;
  this.type = 'potion';
  this.level = level;
  this.color = '#0000';
  this.symbol = 'potion' + (Math.floor(Math.random() * 9) + 1);
  this.price = level + Math.floor(Math.random() * level);
  this.options = {
    hp: 3 + Math.floor(Math.random() * level * 3),
    mana: 3 + Math.floor(Math.random() * level * 3)
  };
  if (Math.random() < rareItemChance) {
    this.name = '%c{lightsalmon}rare ' + this.name + '%c{}';
    this.price = this.price * 2;
    this.options.hp += 10;
    this.options.mana += 10;
    this.color = '#0f04';
  }
});

Game.ItemRepository.define('smallgrowthpotion', function (level) {
  this.name = 'small growth potion (' + level + ')';
  this.minLvl = 3;
  this.maxLvl = 7;
  this.type = 'potion';
  this.level = level;
  this.color = '#0000';
  this.symbol = 'potion' + (Math.floor(Math.random() * 9) + 1);
  this.price = 1 + level + Math.floor(Math.random() * level);
  this.options = {};
  switch (ROT.RNG.getItem(['str', 'con', 'agi', 'int'])) {
    case 'str':
      this.options.str = level + Math.floor(Math.random() * 2);
      break;
    case 'int':
      this.options.int = level + Math.floor(Math.random() * 2);
      break;
    case 'con':
      this.options.con = level + Math.floor(Math.random() * 2);
      break;
    case 'agi':
      this.options.agi = level + Math.floor(Math.random() * 2);
      break;
  }
});

Game.ItemRepository.define('novicearmor', function (level) {
  this.name = 'novice armor (' + level + ')';
  this.minLvl = 1;
  this.maxLvl = 5;
  this.type = 'armor';
  this.level = level;
  this.color = '#0000';
  this.symbol = 'armor' + (Math.floor(Math.random() * 3) + 1);
  this.price = level + Math.floor(Math.random() * level);
  this.options = {
    defense: 1 + Math.floor(Math.random() * level),
    str: 1 + Math.floor(Math.random() * level),
    agi: 1 + Math.floor(Math.random() * level)
  };
  if (Math.random() < rareItemChance) {
    this.name = '%c{lightsalmon}rare ' + this.name + '%c{}';
    this.price = this.price * 2;
    this.options.defense = this.options.defense * 2;
    this.options.agi += 1;
    this.color = '#00f4';
  }
});

Game.ItemRepository.define('noviceheavyarmor', function (level) {
  this.name = 'novice heavy armor (' + level + ')';
  this.minLvl = 3;
  this.maxLvl = 7;
  this.type = 'armor';
  this.level = level;
  this.color = '#0000';
  this.symbol = 'armor' + (Math.floor(Math.random()) + 5);
  this.price = level + Math.floor(Math.random() * level);
  this.options = {
    defense: 3 + Math.floor(Math.random() * level),
    str: 1 + Math.floor(Math.random() * level),
    con: 3 + Math.floor(Math.random() * level)
  };
  if (Math.random() < rareItemChance) {
    this.name = '%c{lightsalmon}rare ' + this.name + '%c{}';
    this.price = this.price * 2;
    this.options.defense = this.options.defense * 2;
    this.options.str += 1;
    this.color = '#00f4';
  }
});

Game.ItemRepository.define('bookofarrows', function (level) {
  this.name = 'book of arrows (' + level + ')';
  this.minLvl = 1;
  this.maxLvl = 10;
  this.type = 'book';
  this.symbol = 'book' + (Math.floor(Math.random() * 2) + 1);

  this.skills = [];
  arrowType = ROT.RNG.getItem([
    'firearrow',
    'icearrow',
    'poisonarrow',
    'stonearrow'
  ]);
  this.skills.push(Game.SkillRepository.create(arrowType, level));
});
