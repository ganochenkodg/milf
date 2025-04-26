Game.inventory = [];

Item = function (properties) {
  properties = properties || {};
  this.name = properties['name'] || '';
  this.maxLvl = properties['maxLvl'] || 1;
  this.minLvl = properties['minLvl'] || 1;
  this.options = properties['options'] || [];
  this.skills = properties['skills'] || [];
  this.symbol = properties['symbol'] || '';
  this.type = properties['type'] || 'other';
  this.level = properties['level'] || 1;
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
        if (Game.inventory[i] == Game.entity[0].equipment.armor) {
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
    Game.entity[0].piety +=
      1 +
      Math.floor(Math.random() * Game.inventory[num].level) +
      Math.floor(Math.pow(1.6, Game.inventory[num].level));

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
Game.FoodRepository = new Game.Repository('items', Item);

Game.ItemRepository.define('rustedblade', function (level) {
  this.name = 'rusted blade (' + level + ')';
  this.minLvl = 1;
  this.maxLvl = 5;
  this.type = 'weapon';
  this.level = level;
  this.color = '#0000';
  this.symbol = 'sword' + (Math.floor(Math.random() * 3) + 1);
  this.options = {
    minatk: 1,
    maxatk: 4 + Math.floor(Math.random() * level),
    str: 1 + Math.floor(Math.random() * level)
  };
  if (Math.random() < rareItemChance) {
    this.name = '%c{lightsalmon}rare ' + this.name + '%c{}';
    this.level += 3;
    this.options.maxatk += 4;
    this.options.str += 1;
    this.color = '#00f4';
  }
});

Game.ItemRepository.define('ironsword', function (level) {
  this.name = 'iron sword (' + level + ')';
  this.minLvl = 1;
  this.maxLvl = 10;
  this.type = 'weapon';
  this.level = level;
  this.color = '#7733';
  this.symbol = 'sword' + (Math.floor(Math.random() * 5) + 1);
  this.options = {
    minatk: 2,
    maxatk: 6 + Math.floor(Math.random() * level),
    str: 1 + Math.floor(Math.random() * level),
    con: 1 + Math.floor(Math.random() * level)
  };
  if (Math.random() < rareItemChance) {
    this.name = '%c{lightsalmon}rare ' + this.name + '%c{}';
    this.level += 3;
    this.options.maxatk += 5;
    this.options.str += 1;
    this.color = '#7735';
  }
});

Game.ItemRepository.define('soldierscutter', function (level) {
  this.name = "soldier's cutter (" + level + ')';
  this.minLvl = 5;
  this.maxLvl = 15;
  this.type = 'weapon';
  this.level = level;
  this.color = '#3933';
  this.symbol = 'sword' + (Math.floor(Math.random() * 5) + 4);
  this.options = {
    minatk: 5,
    maxatk: 6 + Math.floor(level / 3) + Math.floor(Math.random() * level),
    str: 4 + Math.floor(Math.random() * level),
    con: 2 + Math.floor(Math.random() * level)
  };
  if (Math.random() < rareItemChance) {
    this.name = '%c{lightsalmon}rare ' + this.name + '%c{}';
    this.level += 3;
    this.options.maxatk += 5;
    this.options.str += 3;
    this.color = '#3935';
  }
});

Game.ItemRepository.define('steelblade', function (level) {
  this.name = 'steel blade (' + level + ')';
  this.minLvl = 10;
  this.maxLvl = 20;
  this.type = 'weapon';
  this.level = level;
  this.color = '#ccc3';
  this.symbol = 'sword' + (Math.floor(Math.random() * 6) + 3);
  this.options = {
    minatk: 4,
    maxatk: 7 + Math.floor(level / 3) + Math.floor(Math.random() * level),
    str: 2 + Math.floor(Math.random() * level),
    con: 5 + Math.floor(Math.random() * level)
  };
  if (Math.random() < rareItemChance) {
    this.name = '%c{lightsalmon}rare ' + this.name + '%c{}';
    this.level += 2;
    this.options.maxatk += 4;
    this.options.con += 2;
    this.color = '#ccc5';
  }
});

Game.ItemRepository.define('ironshortsword', function (level) {
  this.name = 'iron shortsword (' + level + ')';
  this.minLvl = 5;
  this.maxLvl = 15;
  this.type = 'weapon';
  this.level = level;
  this.color = '#8883';
  this.symbol = 'sword' + (Math.floor(Math.random() * 2) + 1);
  this.options = {
    minatk: 2,
    maxatk: 4 + Math.floor(Math.random() * level),
    str: 1 + Math.floor(Math.random() * level),
    con: 3 + Math.floor(Math.random() * (level / 2))
  };
  if (Math.random() < rareItemChance) {
    this.name = '%c{lightsalmon}rare ' + this.name + '%c{}';
    this.level += 2;
    this.options.maxatk += 3;
    this.options.str += 1;
    this.color = '#8885';
  }
});

Game.ItemRepository.define('coalfang', function (level) {
  this.name = 'coal fang (' + level + ')';
  this.minLvl = 12;
  this.maxLvl = 22;
  this.type = 'weapon';
  this.level = level;
  this.color = '#4443';
  this.symbol = 'sword' + (Math.floor(Math.random() * 3) + 3);
  this.options = {
    minatk: 4,
    maxatk: 7 + Math.floor(level / 3) + Math.floor(Math.random() * level),
    str: 4 + Math.floor(Math.random() * level),
    con: 1 + Math.floor(Math.random() * (level / 2))
  };
  if (Math.random() < rareItemChance) {
    this.name = '%c{lightsalmon}rare ' + this.name + '%c{}';
    this.level += 2;
    this.options.maxatk += 4;
    this.options.str += 3;
    this.color = '#4445';
  }
});

Game.ItemRepository.define('tigerslash', function (level) {
  this.name = 'tiger slash (' + level + ')';
  this.minLvl = 15;
  this.maxLvl = 28;
  this.type = 'weapon';
  this.level = level;
  this.color = '#fa33';
  this.symbol = 'sword' + (Math.floor(Math.random() * 3) + 6);
  this.options = {
    minatk: 5,
    maxatk: 8 + Math.floor(level / 2) + Math.floor(Math.random() * level),
    str: 4 + Math.floor(Math.random() * level),
    con: 4 + Math.floor(Math.random() * level)
  };
  if (Math.random() < rareItemChance) {
    this.name = '%c{lightsalmon}rare ' + this.name + '%c{}';
    this.level += 2;
    this.options.maxatk += 5;
    this.options.str += 4;
    this.color = '#fa55';
  }
});

Game.ItemRepository.define('azureblade', function (level) {
  this.name = 'azure blade (' + level + ')';
  this.minLvl = 22;
  this.maxLvl = 35;
  this.type = 'weapon';
  this.level = level;
  this.color = '#59f3';
  this.symbol = 'sword' + (Math.floor(Math.random() * 3) + 8);
  this.options = {
    minatk: 6,
    maxatk: 8 + Math.floor(level / 2) + Math.floor(Math.random() * level),
    str: 6 + Math.floor(Math.random() * level),
    con: 6 + Math.floor(Math.random() * level)
  };
  if (Math.random() < rareItemChance) {
    this.name = '%c{lightsalmon}rare ' + this.name + '%c{}';
    this.level += 3;
    this.options.maxatk += 7;
    this.options.str += 5;
    this.color = '#59f5';
  }
});

Game.ItemRepository.define('carversoul', function (level) {
  this.name = 'carver soul (' + level + ')';
  this.minLvl = 25;
  this.maxLvl = 38;
  this.type = 'weapon';
  this.level = level;
  this.color = '#b93a';
  this.symbol = 'sword' + (Math.floor(Math.random() * 5) + 6);
  this.options = {
    minatk: 7,
    maxatk: 11 + Math.floor(level / 2) + Math.floor(Math.random() * level),
    str: 5 + Math.floor(Math.random() * level),
    con: 3 + Math.floor(Math.random() * level)
  };
  if (Math.random() < rareItemChance) {
    this.name = '%c{lightsalmon}rare ' + this.name + '%c{}';
    this.level += 3;
    this.options.maxatk += 6;
    this.options.str += 5;
    this.color = '#b95c';
  }
});

Game.ItemRepository.define('drakeslicer', function (level) {
  this.name = 'drake slicer (' + level + ')';
  this.minLvl = 30;
  this.maxLvl = 45;
  this.type = 'weapon';
  this.level = level;
  this.color = '#f90a';
  this.symbol = 'sword' + (Math.floor(Math.random() * 4) + 3);
  this.options = {
    minatk: 10,
    maxatk: 8 + level + Math.floor(Math.random() * level),
    str: 6 + Math.floor(level / 3) + Math.floor(Math.random() * level),
    con: 8 + Math.floor(Math.random() * level)
  };
  if (Math.random() < rareItemChance) {
    this.name = '%c{lightsalmon}rare ' + this.name + '%c{}';
    this.level += 3;
    this.options.maxatk += 10;
    this.options.str += 6;
    this.color = '#f92c';
  }
});

Game.ItemRepository.define('lightfang', function (level) {
  this.name = 'light fang (' + level + ')';
  this.minLvl = 40;
  this.maxLvl = 50;
  this.type = 'weapon';
  this.level = level;
  this.color = '#fff3';
  this.symbol = 'sword' + (Math.floor(Math.random() * 3) + 5);
  this.options = {
    minatk: 12,
    maxatk: 13 + level + Math.floor(Math.random() * level),
    str: 10 + level + Math.floor(Math.random() * level),
    con: 10 + Math.floor(Math.random() * level)
  };
  if (Math.random() < rareItemChance) {
    this.name = '%c{lightsalmon}rare ' + this.name + '%c{}';
    this.level += 3;
    this.options.maxatk += 12;
    this.options.str += 8;
    this.color = '#ffff';
  }
});

Game.ItemRepository.define('soulcleaver', function (level) {
  this.name = 'soul cleaver (' + level + ')';
  this.minLvl = 45;
  this.maxLvl = 100;
  this.type = 'weapon';
  this.level = level;
  this.color = '#f03b';
  this.symbol = 'sword' + (Math.floor(Math.random() * 4) + 2);
  this.options = {
    minatk: 16,
    maxatk: 20 + level + Math.floor(Math.random() * level),
    str: 15 + level + Math.floor(Math.random() * level),
    con: 10 + Math.floor(level / 2) + Math.floor(Math.random() * level)
  };
  if (Math.random() < rareItemChance) {
    this.name = '%c{lightsalmon}rare ' + this.name + '%c{}';
    this.level += 4;
    this.options.maxatk += 15;
    this.options.str += 10;
    this.color = '#f05d';
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
  this.options = {
    minatk: 1,
    maxatk: 4 + Math.floor(Math.random() * level),
    int: 1 + Math.floor(Math.random() * level)
  };
  if (Math.random() < rareItemChance) {
    this.name = '%c{lightsalmon}rare ' + this.name + '%c{}';
    this.level += 3;
    this.options.maxatk += 2;
    this.options.int += 1;
    this.color = '#00f4';
  }
});

Game.ItemRepository.define('sparkwand', function (level) {
  this.name = 'spark wand (' + level + ')';
  this.minLvl = 1;
  this.maxLvl = 10;
  this.type = 'weapon';
  this.level = level;
  this.color = '#fa03';
  this.symbol = 'staff' + (Math.floor(Math.random() * 7) + 1);
  this.options = {
    minatk: 2,
    maxatk: 4 + Math.floor(level / 3),
    int: 2 + Math.floor(Math.random() * level),
    agi: 1 + Math.floor(Math.random() * level)
  };
  if (Math.random() < rareItemChance) {
    this.name = '%c{lightsalmon}rare ' + this.name + '%c{}';
    this.level += 3;
    this.options.maxatk += 4;
    this.options.int += 1;
    this.color = '#fa05';
  }
});

Game.ItemRepository.define('apprenticestaff', function (level) {
  this.name = 'apprenticestaff (' + level + ')';
  this.minLvl = 5;
  this.maxLvl = 15;
  this.type = 'weapon';
  this.level = level;
  this.color = '#33f3';
  this.symbol = 'staff' + (Math.floor(Math.random() * 5) + 4);
  this.options = {
    minatk: 3,
    maxatk: 5 + Math.floor(level / 3),
    int: 4 + Math.floor(Math.random() * level),
    agi: 2 + Math.floor(Math.random() * level)
  };
  if (Math.random() < rareItemChance) {
    this.name = '%c{lightsalmon}rare ' + this.name + '%c{}';
    this.level += 3;
    this.options.maxatk += 4;
    this.options.con = 3;
    this.color = '#33f5';
  }
});

Game.ItemRepository.define('arcanebranch', function (level) {
  this.name = 'arcane branch (' + level + ')';
  this.minLvl = 7;
  this.maxLvl = 17;
  this.type = 'weapon';
  this.level = level;
  this.color = '#a8f3';
  this.symbol = 'staff' + (Math.floor(Math.random() * 5) + 2);
  this.options = {
    minatk: 3,
    maxatk: 6 + Math.floor(level / 3),
    int: 4 + Math.floor(Math.random() * level),
    con: 2 + Math.floor(Math.random() * level)
  };
  if (Math.random() < rareItemChance) {
    this.name = '%c{lightsalmon}rare ' + this.name + '%c{}';
    this.level += 2;
    this.options.maxatk += 4;
    this.options.int += 2;
    this.color = '#a8f5';
  }
});

Game.ItemRepository.define('glowbranch', function (level) {
  this.name = 'glow branch (' + level + ')';
  this.minLvl = 10;
  this.maxLvl = 20;
  this.type = 'weapon';
  this.level = level;
  this.color = '#6f63';
  this.symbol = 'staff' + (Math.floor(Math.random() * 7) + 1);
  this.options = {
    minatk: 4,
    maxatk: 8 + Math.floor(level / 3),
    int: 5 + Math.floor(Math.random() * level),
    agi: 4 + Math.floor(Math.random() * level)
  };
  if (Math.random() < rareItemChance) {
    this.name = '%c{lightsalmon}rare ' + this.name + '%c{}';
    this.level += 2;
    this.options.maxatk += 4;
    this.options.int += 3;
    this.color = '#6f65';
  }
});

Game.ItemRepository.define('igneousrod', function (level) {
  this.name = 'igneous rod (' + level + ')';
  this.minLvl = 12;
  this.maxLvl = 22;
  this.type = 'weapon';
  this.level = level;
  this.color = '#f934';
  this.symbol = 'staff' + (Math.floor(Math.random() * 6) + 3);
  this.options = {
    minatk: 4,
    maxatk: 7 + Math.floor(Math.random() * level),
    int: 4 + Math.floor(level / 3) + Math.floor(Math.random() * level),
    con: 5 + Math.floor(Math.random() * level)
  };
  if (Math.random() < rareItemChance) {
    this.name = '%c{lightsalmon}rare ' + this.name + '%c{}';
    this.level += 2;
    this.options.maxatk += 6;
    this.options.int += 5;
    this.color = '#f956';
  }
});

Game.ItemRepository.define('crystalwand', function (level) {
  this.name = 'crystal wand (' + level + ')';
  this.minLvl = 18;
  this.maxLvl = 28;
  this.type = 'weapon';
  this.level = level;
  this.color = '#ccf5';
  this.symbol = 'staff' + (Math.floor(Math.random() * 7) + 1);
  this.options = {
    minatk: 6,
    maxatk: 9 + Math.floor(level / 3) + Math.floor(Math.random() * level),
    int: 6 + Math.floor(Math.random() * level),
    agi: 6 + Math.floor(Math.random() * level)
  };
  if (Math.random() < rareItemChance) {
    this.name = '%c{lightsalmon}rare ' + this.name + '%c{}';
    this.level += 3;
    this.options.maxatk += 7;
    this.options.int += 8;
    this.color = '#ccf7';
  }
});

Game.ItemRepository.define('manaoak', function (level) {
  this.name = 'mana oak (' + level + ')';
  this.minLvl = 15;
  this.maxLvl = 25;
  this.type = 'weapon';
  this.level = level;
  this.color = '#0cf3';
  this.symbol = 'staff' + (Math.floor(Math.random() * 6) + 1);
  this.options = {
    minatk: 5,
    maxatk: 8 + Math.floor(level / 3) + Math.floor(Math.random() * level),
    int: 8 + Math.floor(Math.random() * level),
    con: 6 + Math.floor(Math.random() * (level / 2))
  };
  if (Math.random() < rareItemChance) {
    this.name = '%c{lightsalmon}rare ' + this.name + '%c{}';
    this.level += 3;
    this.options.maxatk += 8;
    this.options.int += 8;
    this.color = '#0cf5';
  }
});

Game.ItemRepository.define('stormspire', function (level) {
  this.name = 'storm spire (' + level + ')';
  this.minLvl = 20;
  this.maxLvl = 32;
  this.type = 'weapon';
  this.level = level;
  this.color = '#09f4';
  this.symbol = 'staff' + (Math.floor(Math.random() * 7) + 1);
  this.options = {
    minatk: 8,
    maxatk: 8 + Math.floor(level / 2) + Math.floor(Math.random() * level),
    int: 10 + Math.floor(Math.random() * level),
    con: 10 + Math.floor(Math.random() * level)
  };
  if (Math.random() < rareItemChance) {
    this.name = '%c{lightsalmon}rare ' + this.name + '%c{}';
    this.level += 3;
    this.options.maxatk += 5;
    this.options.int += 10;
    this.color = '#09f6';
  }
});

Game.ItemRepository.define('emberrod', function (level) {
  this.name = 'ember rod (' + level + ')';
  this.minLvl = 25;
  this.maxLvl = 38;
  this.type = 'weapon';
  this.level = level;
  this.color = '#f52a';
  this.symbol = 'staff' + (Math.floor(Math.random() * 6) + 2);
  this.options = {
    minatk: 10,
    maxatk: 10 + Math.floor(level / 2) + Math.floor(Math.random() * level),
    int: 12 + Math.floor(Math.random() * level),
    agi: 12 + Math.floor(Math.random() * level)
  };
  if (Math.random() < rareItemChance) {
    this.name = '%c{lightsalmon}rare ' + this.name + '%c{}';
    this.level += 3;
    this.options.maxatk += 10;
    this.options.int += 10;
    this.color = '#f54c';
  }
});

Game.ItemRepository.define('mindspike', function (level) {
  this.name = 'mind spike (' + level + ')';
  this.minLvl = 30;
  this.maxLvl = 45;
  this.type = 'weapon';
  this.level = level;
  this.color = '#b3f5';
  this.symbol = 'staff' + (Math.floor(Math.random() * 5) + 6);
  this.options = {
    minatk: 6,
    maxatk: 12 + Math.floor(level / 2) + Math.floor(Math.random() * level),
    int: 16 + Math.floor(Math.random() * level),
    agi: 6 + Math.floor(Math.random() * level)
  };
  if (Math.random() < rareItemChance) {
    this.name = '%c{lightsalmon}rare ' + this.name + '%c{}';
    this.level += 3;
    this.options.maxatk += 10;
    this.options.int += 11;
    this.color = '#b3f7';
  }
});

Game.ItemRepository.define('voidstaff', function (level) {
  this.name = 'void staff (' + level + ')';
  this.minLvl = 40;
  this.maxLvl = 100;
  this.type = 'weapon';
  this.level = level;
  this.color = '#8035';
  this.symbol = 'staff' + (Math.floor(Math.random() * 6) + 2);
  this.options = {
    minatk: 7,
    maxatk: 14 + Math.floor(level / 2) + Math.floor(Math.random() * level),
    int: 20 + Math.floor(Math.random() * level),
    con: 16 + Math.floor(Math.random() * level)
  };
  if (Math.random() < rareItemChance) {
    this.name = '%c{lightsalmon}rare ' + this.name + '%c{}';
    this.level += 4;
    this.options.maxatk += 15;
    this.options.int += 20;
    this.color = '#8057';
  }
});

Game.FoodRepository.define('healingherb', function (level) {
  this.name = 'healing herb';
  this.minLvl = 1;
  this.maxLvl = 50;
  this.type = 'food';
  this.level = 2;
  this.color = '#0000';
  this.symbol = 'herb' + (Math.floor(Math.random() * 12) + 1);
  this.options = {
    hp: 7 + Math.floor(Math.random() * level * 3)
  };
});

Game.FoodRepository.define('magicalherb', function (level) {
  this.name = 'magical herb';
  this.minLvl = 1;
  this.level = 2;
  this.maxLvl = 50;
  this.type = 'food';
  this.color = '#0000';
  this.symbol = 'herb' + (Math.floor(Math.random() * 12) + 1);
  this.options = {
    mana: 7 + Math.floor(Math.random() * level * 3)
  };
});

Game.FoodRepository.define('ancientherb', function (level) {
  this.name = 'ancient herb';
  this.minLvl = 1;
  this.maxLvl = 50;
  this.type = 'food';
  this.level = 2;
  this.color = '#0000';
  this.symbol = 'herb' + (Math.floor(Math.random() * 12) + 1);
  this.options = {
    hp: 5 + Math.floor(Math.random() * level * 3),
    mana: 5 + Math.floor(Math.random() * level * 3)
  };
});

Game.FoodRepository.define('mysticalmushroom', function (level) {
  this.name = 'mystical mushroom';
  this.minLvl = 1;
  this.maxLvl = 50;
  this.type = 'food';
  this.level = 2;
  this.color = '#0000';
  this.symbol = 'mushroom' + (Math.floor(Math.random()) + 1);
  this.options = {};
  switch (ROT.RNG.getItem(['str', 'con', 'agi', 'int'])) {
    case 'str':
      this.options.str = 1;
      break;
    case 'int':
      this.options.int = 1;
      break;
    case 'con':
      this.options.con = 1;
      break;
    case 'agi':
      this.options.agi = 1;
      break;
  }
  if (Math.random() < rareItemChance) {
    this.name = '%c{lightsalmon}rare ' + this.name + '%c{}';
    this.options.vision = 1;
    this.color = '#0f04';
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
  this.options = {
    hp: 10 + Math.floor(Math.random() * level * 3),
    mana: 10 + Math.floor(Math.random() * level * 3)
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
  this.options = {};
  switch (ROT.RNG.getItem(['str', 'con', 'agi', 'int'])) {
    case 'str':
      this.options.str = 1 + Math.floor(Math.random() * 2);
      break;
    case 'int':
      this.options.int = 1 + Math.floor(Math.random() * 2);
      break;
    case 'con':
      this.options.con = 1 + Math.floor(Math.random() * 2);
      break;
    case 'agi':
      this.options.agi = 1 + Math.floor(Math.random() * 2);
      break;
  }
});

Game.ItemRepository.define('mediumhealingpotion', function (level) {
  this.name = 'medium healing potion (' + level + ')';
  this.minLvl = 10;
  this.maxLvl = 25;
  this.type = 'potion';
  this.level = level;
  this.color = '#0000';
  this.symbol = 'potion' + (Math.floor(Math.random() * 9) + 1);
  this.options = {
    hp: 30 + Math.floor(Math.random() * level * 3),
    mana: 30 + Math.floor(Math.random() * level * 3)
  };
  if (Math.random() < rareItemChance) {
    this.name = '%c{lightsalmon}rare ' + this.name + '%c{}';
    this.price = this.price * 2;
    this.options.hp += 30;
    this.options.mana += 30;
    this.color = '#0f04';
  }
});

Game.ItemRepository.define('mediumgrowthpotion', function (level) {
  this.name = 'medium growth potion (' + level + ')';
  this.minLvl = 12;
  this.maxLvl = 27;
  this.type = 'potion';
  this.level = level;
  this.color = '#0000';
  this.symbol = 'potion' + (Math.floor(Math.random() * 9) + 1);
  this.options = {};
  switch (ROT.RNG.getItem(['str', 'con', 'agi', 'int'])) {
    case 'str':
      this.options.str = Math.floor(level / 3) + Math.floor(Math.random() * 2);
      break;
    case 'int':
      this.options.int = Math.floor(level / 3) + Math.floor(Math.random() * 2);
      break;
    case 'con':
      this.options.con = Math.floor(level / 3) + Math.floor(Math.random() * 2);
      break;
    case 'agi':
      this.options.agi = Math.floor(level / 3) + Math.floor(Math.random() * 2);
      break;
  }
});

Game.ItemRepository.define('largehealingpotion', function (level) {
  this.name = 'large healing potion (' + level + ')';
  this.minLvl = 20;
  this.maxLvl = 40;
  this.type = 'potion';
  this.level = level;
  this.color = '#0000';
  this.symbol = 'potion' + (Math.floor(Math.random() * 9) + 1);
  this.options = {
    hp: 60 + Math.floor(Math.random() * level * 3),
    mana: 60 + Math.floor(Math.random() * level * 3)
  };
  if (Math.random() < rareItemChance) {
    this.name = '%c{lightsalmon}rare ' + this.name + '%c{}';
    this.price = this.price * 2;
    this.options.hp += 30;
    this.options.mana += 30;
    this.color = '#0f04';
  }
});

Game.ItemRepository.define('largegrowthpotion', function (level) {
  this.name = 'large growth potion (' + level + ')';
  this.minLvl = 20;
  this.maxLvl = 50;
  this.type = 'potion';
  this.level = level;
  this.color = '#0000';
  this.symbol = 'potion' + (Math.floor(Math.random() * 9) + 1);
  this.options = {};
  switch (ROT.RNG.getItem(['str', 'con', 'agi', 'int'])) {
    case 'str':
      this.options.str = Math.floor(level / 3) + Math.floor(Math.random() * 3);
      break;
    case 'int':
      this.options.int = Math.floor(level / 3) + Math.floor(Math.random() * 3);
      break;
    case 'con':
      this.options.con = Math.floor(level / 3) + Math.floor(Math.random() * 3);
      break;
    case 'agi':
      this.options.agi = Math.floor(level / 3) + Math.floor(Math.random() * 3);
      break;
  }
});

Game.ItemRepository.define('wornarmor', function (level) {
  this.name = 'worn armor (' + level + ')';
  this.minLvl = 1;
  this.maxLvl = 5;
  this.type = 'armor';
  this.level = level;
  this.color = '#0000';
  this.symbol = 'armor' + (Math.floor(Math.random() * 3) + 1);
  this.options = {
    defense: 1 + Math.floor(Math.random() * level),
    str: 1 + Math.floor(Math.random() * level),
    con: 1 + Math.floor(Math.random() * level)
  };
  if (Math.random() < rareItemChance) {
    this.name = '%c{lightsalmon}rare ' + this.name + '%c{}';
    this.level += 3;
    this.options.defense += 2;
    this.options.str += 1;
    this.color = '#00f4';
  }
});

Game.ItemRepository.define('tatteredrobe', function (level) {
  this.name = 'tattered robe (' + level + ')';
  this.minLvl = 1;
  this.maxLvl = 5;
  this.type = 'armor';
  this.level = level;
  this.color = '#0000';
  this.symbol = ROT.RNG.getItem(['armor3', 'armor4']);
  this.options = {
    defense: 1 + Math.floor(Math.random() * level),
    int: 1 + Math.floor(Math.random() * level),
    agi: 1 + Math.floor(Math.random() * level)
  };
  if (Math.random() < rareItemChance) {
    this.name = '%c{lightsalmon}rare ' + this.name + '%c{}';
    this.level += 3;
    this.options.defense += 2;
    this.options.agi += 1;
    this.color = '#00f4';
  }
});

Game.ItemRepository.define('paddedvest', function (level) {
  this.name = 'padded vest (' + level + ')';
  this.minLvl = 3;
  this.maxLvl = 7;
  this.type = 'armor';
  this.level = level;
  this.color = '#0000';
  this.symbol = 'armor' + (Math.floor(Math.random()) + 5);
  this.options = {
    defense: 3 + Math.floor(Math.random() * level),
    str: 1 + Math.floor(Math.random() * level),
    con: 3 + Math.floor(Math.random() * level)
  };
  if (Math.random() < rareItemChance) {
    this.name = '%c{lightsalmon}rare ' + this.name + '%c{}';
    this.level += 3;
    this.options.defense += 3;
    this.options.str += 1;
    this.color = '#00f4';
  }
});

Game.ItemRepository.define('leathercuirass', function (level) {
  this.name = 'leather cuirass (' + level + ')';
  this.minLvl = 5;
  this.maxLvl = 10;
  this.type = 'armor';
  this.level = level;
  this.color = '#9643';
  this.symbol = 'armor' + (Math.floor(Math.random()) * 4 + 5);
  this.options = {
    defense: 2 + level + Math.floor(Math.random() * level),
    str: 2 + Math.floor(level / 2) + Math.floor(Math.random() * level),
    con: 2 + Math.floor(level / 2) + Math.floor(Math.random() * level)
  };
  if (Math.random() < rareItemChance) {
    this.name = '%c{lightsalmon}rare ' + this.name + '%c{}';
    this.level += 3;
    this.options.defense += 3;
    this.options.str += 3;
    this.color = '#9645';
  }
});

Game.ItemRepository.define('apprenticerobe', function (level) {
  this.name = 'apprentice robe (' + level + ')';
  this.minLvl = 5;
  this.maxLvl = 10;
  this.type = 'armor';
  this.level = level;
  this.color = '#6033';
  this.symbol = 'armor' + (Math.floor(Math.random()) + 5);
  this.options = {
    defense: 2 + level + Math.floor(Math.random() * level),
    int: 2 + Math.floor(level / 2) + Math.floor(Math.random() * level),
    con: 2 + Math.floor(level / 2) + Math.floor(Math.random() * level)
  };
  if (Math.random() < rareItemChance) {
    this.name = '%c{lightsalmon}rare ' + this.name + '%c{}';
    this.level += 3;
    this.options.defense += 3;
    this.options.int += 3;
    this.color = '#6035';
  }
});

Game.ItemRepository.define('chainvest', function (level) {
  this.name = 'chain vest (' + level + ')';
  this.minLvl = 10;
  this.maxLvl = 20;
  this.type = 'armor';
  this.level = level;
  this.color = '#9994';
  this.symbol = 'armor' + (Math.floor(Math.random() * 2) + 4);
  this.options = {
    defense: 4 + level + Math.floor(Math.random() * level),
    con: 3 + Math.floor(level / 2) + Math.floor(Math.random() * level),
    str: 1 + Math.floor(level / 2) + Math.floor(Math.random() * level)
  };
  if (Math.random() < rareItemChance) {
    this.name = '%c{lightsalmon}rare ' + this.name + '%c{}';
    this.options.defense += 3;
    this.options.con += 2;
    this.color = '#9996';
  }
});

Game.ItemRepository.define('battleplate', function (level) {
  this.name = 'battle plate (' + level + ')';
  this.minLvl = 18;
  this.maxLvl = 30;
  this.type = 'armor';
  this.level = level;
  this.color = '#caa4';
  this.symbol = 'armor' + (Math.floor(Math.random() * 2) + 10);
  this.options = {
    defense: 8 + level + Math.floor(Math.random() * level),
    con: 4 + level + Math.floor(Math.random() * level),
    str: 2 + level + Math.floor(Math.random() * level)
  };
  if (Math.random() < rareItemChance) {
    this.name = '%c{lightsalmon}rare ' + this.name + '%c{}';
    this.options.defense += 6;
    this.options.con += 5;
    this.color = '#cac6';
  }
});

Game.ItemRepository.define('runecoat', function (level) {
  this.name = 'rune coat (' + level + ')';
  this.minLvl = 25;
  this.maxLvl = 38;
  this.type = 'armor';
  this.level = level;
  this.color = '#66f4';
  this.symbol = 'armor' + (Math.floor(Math.random() * 3) + 7);
  this.options = {
    defense: 6 + level + Math.floor(Math.random() * level),
    int: 5 + level + Math.floor(Math.random() * level),
    con: 2 + level + Math.floor(Math.random() * level)
  };
  if (Math.random() < rareItemChance) {
    this.name = '%c{lightsalmon}rare ' + this.name + '%c{}';
    this.options.defense += 3;
    this.options.int += 5;
    this.color = '#66f6';
  }
});

Game.ItemRepository.define('dragonarmor', function (level) {
  this.name = 'dragon armor (' + level + ')';
  this.minLvl = 40;
  this.maxLvl = 50;
  this.type = 'armor';
  this.level = level;
  this.color = '#e22f';
  this.symbol = 'armor' + (Math.floor(Math.random() * 6) + 1);
  this.options = {
    defense: 6 + Math.floor(Math.random() * level),
    con: 10 + level + Math.floor(Math.random() * level),
    agi: 10 + level + Math.floor(Math.random() * level)
  };
  if (Math.random() < rareItemChance) {
    this.name = '%c{lightsalmon}rare ' + this.name + '%c{}';
    this.options.defense += 5;
    this.options.con += 6;
    this.color = '#e25f';
  }
});

Game.ItemRepository.define('shadowcloak', function (level) {
  this.name = 'shadow cloak (' + level + ')';
  this.minLvl = 6;
  this.maxLvl = 14;
  this.type = 'armor';
  this.level = level;
  this.color = '#222f';
  this.symbol = 'armor' + (Math.floor(Math.random() * 4) + 1);
  this.options = {
    defense: 2 + level + Math.floor(Math.random() * level),
    str: 2 + Math.floor(level / 2) + Math.floor(Math.random() * level),
    agi: 2 + Math.floor(level / 2) + Math.floor(Math.random() * level)
  };
  if (Math.random() < rareItemChance) {
    this.name = '%c{lightsalmon}rare ' + this.name + '%c{}';
    this.level += 3;
    this.options.defense += 3;
    this.options.str += 3;
    this.color = '#9645';
  }
});

Game.ItemRepository.define('splintmail', function (level) {
  this.name = 'splint mail (' + level + ')';
  this.minLvl = 12;
  this.maxLvl = 22;
  this.type = 'armor';
  this.level = level;
  this.color = '#aaa6';
  this.symbol = 'armor' + (Math.floor(Math.random() * 3) + 2);
  this.options = {
    defense: 3 + level + Math.floor(Math.random() * level),
    con: 3 + Math.floor(level / 2) + Math.floor(Math.random() * level),
    agi: 1 + Math.floor(level / 2) + Math.floor(Math.random() * level)
  };
  if (Math.random() < rareItemChance) {
    this.name = '%c{lightsalmon}rare ' + this.name + '%c{}';
    this.options.defense += 3;
    this.options.con += 2;
    this.color = '#9996';
  }
});

Game.ItemRepository.define('witchrobe', function (level) {
  this.name = 'witch robe (' + level + ')';
  this.minLvl = 16;
  this.maxLvl = 26;
  this.type = 'armor';
  this.level = level;
  this.color = '#6a4f';
  this.symbol = 'armor' + (Math.floor(Math.random() * 4) + 1);
  this.options = {
    defense: 6 + level + Math.floor(Math.random() * level),
    con: 4 + level + Math.floor(Math.random() * level),
    int: 2 + level + Math.floor(Math.random() * level)
  };
  if (Math.random() < rareItemChance) {
    this.name = '%c{lightsalmon}rare ' + this.name + '%c{}';
    this.options.defense += 5;
    this.options.con += 4;
    this.color = '#cac6';
  }
});

Game.ItemRepository.define('spectralguard', function (level) {
  this.name = 'spectral guard (' + level + ')';
  this.minLvl = 30;
  this.maxLvl = 44;
  this.type = 'armor';
  this.level = level;
  this.color = '#77e4';
  this.symbol = 'armor' + (Math.floor(Math.random() * 5) + 2);
  this.options = {
    def: 10 + level + Math.floor(Math.random() * level),
    str: 5 + level + Math.floor(Math.random() * level),
    con: 3 + level + Math.floor(Math.random() * level)
  };
  if (Math.random() < rareItemChance) {
    this.name = '%c{lightsalmon}rare ' + this.name + '%c{}';
    this.options.defense += 6;
    this.options.str += 5;
    this.color = '#66f6';
  }
});

Game.ItemRepository.define('phoenixplate', function (level) {
  this.name = 'phoenix plate (' + level + ')';
  this.minLvl = 45;
  this.maxLvl = 100;
  this.type = 'armor';
  this.level = level;
  this.color = '#f405';
  this.symbol = 'armor' + (Math.floor(Math.random() * 6) + 4);
  this.options = {
    defense: 10 + Math.floor(Math.random() * level),
    con: 10 + level + Math.floor(Math.random() * level),
    str: 10 + level + Math.floor(Math.random() * level)
  };
  if (Math.random() < rareItemChance) {
    this.name = '%c{lightsalmon}rare ' + this.name + '%c{}';
    this.options.defense += 5;
    this.options.con += 6;
    this.color = '#e25f';
  }
});

Game.ItemRepository.define('bookofarrows', function (level) {
  this.name = 'book of arrows (' + level + ')';
  this.minLvl = 1;
  this.maxLvl = 10;
  this.type = 'book';
  this.symbol = 'book' + (Math.floor(Math.random() * 5) + 1);
  this.symbol = 'book' + (Math.floor(Math.random() * 2) + 1);

  this.skills = [];
  skillType = ROT.RNG.getItem([
    'firearrow',
    'icearrow',
    'poisonarrow',
    'stonearrow'
  ]);
  this.skills.push(Game.SkillRepository.create(skillType, level));
  if (Math.random() < rareItemChance) {
    this.name = '%c{lightsalmon}rare ' + this.name + '%c{}';
    this.level += 3;
    this.skills.push(Game.SkillRepository.createRandom(level, level + 2));
    this.color = '#00f4';
  }
});

Game.ItemRepository.define('bookofyoungwarrior', function (level) {
  this.name = 'book of young warriors (' + level + ')';
  this.minLvl = 1;
  this.maxLvl = 10;
  this.type = 'book';
  this.symbol = 'book' + (Math.floor(Math.random() * 5) + 1);
  this.symbol = 'book' + (Math.floor(Math.random() * 2) + 1);
  this.skills = [];
  skillType = ROT.RNG.getItem(['poisonslash', 'rapidcut']);
  this.skills.push(Game.SkillRepository.create(skillType, level));
  if (Math.random() < rareItemChance) {
    this.name = '%c{lightsalmon}rare ' + this.name + '%c{}';
    this.level += 3;
    this.skills.push(Game.SkillRepository.createRandom(level, level + 2));
    this.color = '#00f4';
  }
});

Game.ItemRepository.define('bookoffirstchants', function (level) {
  this.name = 'book of first chants (' + level + ')';
  this.minLvl = 1;
  this.maxLvl = 10;
  this.type = 'book';
  this.symbol = 'book' + (Math.floor(Math.random() * 5) + 1);
  this.symbol = 'book' + (Math.floor(Math.random() * 2) + 1);
  this.skills = [];
  skillType = ROT.RNG.getItem(['iceshield', 'strengthofstone']);
  this.skills.push(Game.SkillRepository.create(skillType, level));
  if (Math.random() < rareItemChance) {
    this.name = '%c{lightsalmon}rare ' + this.name + '%c{}';
    this.level += 3;
    this.skills.push(Game.SkillRepository.createRandom(level, level + 2));
    this.color = '#00f4';
  }
});

Game.ItemRepository.define('bookofunknownmagic', function (level) {
  this.name = 'book of unknown magic (' + level + ')';
  this.minLvl = 2;
  this.maxLvl = 10;
  this.type = 'book';
  this.symbol = 'book' + (Math.floor(Math.random() * 5) + 1);
  this.symbol = 'book' + (Math.floor(Math.random() * 2) + 1);
  this.color = '#fd04';
  this.skills = [Game.SkillRepository.createRandom(2, level)];
  if (Math.random() < rareItemChance) {
    this.name = '%c{lightsalmon}rare ' + this.name + '%c{}';
    this.level += 3;
    this.skills.push(Game.SkillRepository.createRandom(level, level + 2));
    this.color = '#fd05';
  }
});

Game.ItemRepository.define('bookofancientmagic', function (level) {
  this.name = 'book of ancient magic (' + level + ')';
  this.minLvl = 6;
  this.maxLvl = 15;
  this.type = 'book';
  this.symbol = 'book' + (Math.floor(Math.random() * 5) + 1);
  this.symbol = 'book' + (Math.floor(Math.random() * 2) + 1);
  this.color = '#fc04';
  this.skills = [
    Game.SkillRepository.createRandom(6, level),
    Game.SkillRepository.createRandom(4, level)
  ];
  if (Math.random() < rareItemChance) {
    this.name = '%c{lightsalmon}rare ' + this.name + '%c{}';
    this.level += 3;
    this.skills.push(Game.SkillRepository.createRandom(level, level + 2));
    this.color = '#fc05';
  }
});

Game.ItemRepository.define('bookofmassdestruction', function (level) {
  this.name = 'book of mass destruction (' + level + ')';
  this.minLvl = 5;
  this.maxLvl = 20;
  this.type = 'book';
  this.symbol = 'book' + (Math.floor(Math.random() * 5) + 1);
  this.symbol = 'book' + (Math.floor(Math.random() * 2) + 1);
  this.color = '#f003';
  this.skills = [];
  skillType = ROT.RNG.getItem([
    'fireball',
    'acidcloud',
    'tsunami',
    'crackedearth'
  ]);
  this.skills.push(Game.SkillRepository.create(skillType, level));
  if (Math.random() < rareItemChance) {
    this.name = '%c{lightsalmon}rare ' + this.name + '%c{}';
    this.level += 3;
    this.skills.push(Game.SkillRepository.createRandom(level, level + 2));
    this.color = '#f005';
  }
});

Game.ItemRepository.define('bookoflostfreedom', function (level) {
  this.name = 'book of lost freedom (' + level + ')';
  this.minLvl = 7;
  this.maxLvl = 20;
  this.type = 'book';
  this.symbol = 'book' + (Math.floor(Math.random() * 5) + 1);
  this.symbol = 'book' + (Math.floor(Math.random() * 2) + 1);
  this.color = '#acc3';
  this.skills = [];
  skillType = ROT.RNG.getItem(['flamechains', 'calltheshadows']);
  this.skills.push(Game.SkillRepository.create(skillType, level));
  if (Math.random() < rareItemChance) {
    this.name = '%c{lightsalmon}rare ' + this.name + '%c{}';
    this.level += 3;
    this.skills.push(Game.SkillRepository.createRandom(level, level + 2));
    this.color = '#acc5';
  }
});

Game.ItemRepository.define('bookofmysticarts', function (level) {
  this.name = 'book of mystic arts (' + level + ')';
  this.minLvl = 10;
  this.maxLvl = 25;
  this.type = 'book';
  this.symbol = 'book' + (Math.floor(Math.random() * 5) + 1);
  this.symbol = 'book' + (Math.floor(Math.random() * 2) + 1);
  this.color = '#9cf3';
  this.skills = [
    Game.SkillRepository.createRandom(10, level),
    Game.SkillRepository.createRandom(10, level)
  ];
  if (Math.random() < rareItemChance) {
    this.name = '%c{lightsalmon}rare ' + this.name + '%c{}';
    this.level += 3;
    this.skills.push(Game.SkillRepository.createRandom(level, level + 2));
    this.color = '#9cf5';
  }
});

Game.ItemRepository.define('bookoflostknowledge', function (level) {
  this.name = 'book of lost knowledge (' + level + ')';
  this.minLvl = 15;
  this.maxLvl = 30;
  this.type = 'book';
  this.symbol = 'book' + (Math.floor(Math.random() * 5) + 1);
  this.symbol = 'book' + (Math.floor(Math.random() * 2) + 1);
  this.color = '#a8c3';
  this.skills = [
    Game.SkillRepository.createRandom(15, level),
    Game.SkillRepository.createRandom(12, level)
  ];
  if (Math.random() < rareItemChance) {
    this.name = '%c{lightsalmon}rare ' + this.name + '%c{}';
    this.level += 3;
    this.skills.push(Game.SkillRepository.createRandom(level, level + 3));
    this.color = '#a8c5';
  }
});

Game.ItemRepository.define('bookofeldritchpower', function (level) {
  this.name = 'book of eldritch power (' + level + ')';
  this.minLvl = 20;
  this.maxLvl = 40;
  this.type = 'book';
  this.symbol = 'book' + (Math.floor(Math.random() * 5) + 1);
  this.symbol = 'book' + (Math.floor(Math.random() * 2) + 1);
  this.color = '#8f83';
  this.skills = [
    Game.SkillRepository.createRandom(18, level),
    Game.SkillRepository.createRandom(20, level),
    Game.SkillRepository.createRandom(15, level)
  ];
  if (Math.random() < rareItemChance) {
    this.name = '%c{lightsalmon}rare ' + this.name + '%c{}';
    this.level += 3;
    this.skills.push(Game.SkillRepository.createRandom(level, level + 3));
    this.color = '#8f85';
  }
});

Game.ItemRepository.define('bookofarcanelegacy', function (level) {
  this.name = 'book of arcane legacy (' + level + ')';
  this.minLvl = 25;
  this.maxLvl = 50;
  this.type = 'book';
  this.symbol = 'book' + (Math.floor(Math.random() * 5) + 1);
  this.symbol = 'book' + (Math.floor(Math.random() * 2) + 1);
  this.color = '#fcf3';
  this.skills = [
    Game.SkillRepository.createRandom(25, level),
    Game.SkillRepository.createRandom(20, level),
    Game.SkillRepository.createRandom(15, level)
  ];
  if (Math.random() < rareItemChance) {
    this.name = '%c{lightsalmon}rare ' + this.name + '%c{}';
    this.level += 3;
    this.skills.push(Game.SkillRepository.createRandom(level, level + 3));
    this.color = '#fcf5';
  }
});

Game.ItemRepository.define('bookofflames', function (level) {
  this.name = 'book of flames (' + level + ')';
  this.minLvl = 10;
  this.maxLvl = 30;
  this.type = 'book';
  this.symbol = 'book' + (Math.floor(Math.random() * 5) + 1);
  this.symbol = 'book' + (Math.floor(Math.random() * 2) + 1);
  this.color = '#f603';
  this.skills = [];

  let skillType = ROT.RNG.getItem(['fireball', 'fireshield', 'flamechains']);
  this.skills.push(Game.SkillRepository.create(skillType, level));

  if (Math.random() < rareItemChance) {
    this.name = '%c{lightsalmon}rare ' + this.name + '%c{}';
    this.level += 3;
    this.skills.push(Game.SkillRepository.createRandom(level, level + 2));
    this.color = '#f605';
  }
});

Game.ItemRepository.define('bookofstorms', function (level) {
  this.name = 'book of storms (' + level + ')';
  this.minLvl = 15;
  this.maxLvl = 35;
  this.type = 'book';
  this.symbol = 'book' + (Math.floor(Math.random() * 5) + 1);
  this.symbol = 'book' + (Math.floor(Math.random() * 2) + 1);
  this.color = '#acf3';
  this.skills = [];

  let skillType = ROT.RNG.getItem([
    'lightningbolt',
    'lightningstrike',
    'supernova'
  ]);
  this.skills.push(Game.SkillRepository.create(skillType, level));

  if (Math.random() < rareItemChance) {
    this.name = '%c{lightsalmon}rare ' + this.name + '%c{}';
    this.level += 3;
    this.skills.push(Game.SkillRepository.createRandom(level, level + 2));
    this.color = '#acf5';
  }
});

Game.ItemRepository.define('bookofpoison', function (level) {
  this.name = 'book of poison (' + level + ')';
  this.minLvl = 10;
  this.maxLvl = 30;
  this.type = 'book';
  this.symbol = 'book' + (Math.floor(Math.random() * 5) + 1);
  this.symbol = 'book' + (Math.floor(Math.random() * 2) + 1);
  this.color = '#6c33';
  this.skills = [];

  let skillType = ROT.RNG.getItem(['poisonarrow', 'plague', 'acidcloud']);
  this.skills.push(Game.SkillRepository.create(skillType, level));

  if (Math.random() < rareItemChance) {
    this.name = '%c{lightsalmon}rare ' + this.name + '%c{}';
    this.level += 3;
    this.skills.push(Game.SkillRepository.createRandom(level, level + 2));
    this.color = '#6c35';
  }
});

Game.ItemRepository.define('bookoffrost', function (level) {
  this.name = 'book of frost (' + level + ')';
  this.minLvl = 10;
  this.maxLvl = 30;
  this.type = 'book';
  this.symbol = 'book' + (Math.floor(Math.random() * 5) + 1);
  this.symbol = 'book' + (Math.floor(Math.random() * 2) + 1);
  this.color = '#9cf3';
  this.skills = [];

  let skillType = ROT.RNG.getItem(['icearrow', 'iceshield', 'frozentomb']);
  this.skills.push(Game.SkillRepository.create(skillType, level));

  if (Math.random() < rareItemChance) {
    this.name = '%c{lightsalmon}rare ' + this.name + '%c{}';
    this.level += 3;
    this.skills.push(Game.SkillRepository.createRandom(level, level + 2));
    this.color = '#9cf5';
  }
});

Game.ItemRepository.define('bookofshadows', function (level) {
  this.name = 'book of shadows (' + level + ')';
  this.minLvl = 20;
  this.maxLvl = 40;
  this.type = 'book';
  this.symbol = 'book' + (Math.floor(Math.random() * 5) + 1);
  this.symbol = 'book' + (Math.floor(Math.random() * 2) + 1);
  this.color = '#4443';
  this.skills = [];

  let skillType = ROT.RNG.getItem(['calltheshadows', 'darkness', 'auraoffear']);
  this.skills.push(Game.SkillRepository.create(skillType, level));

  if (Math.random() < rareItemChance) {
    this.name = '%c{lightsalmon}rare ' + this.name + '%c{}';
    this.level += 3;
    this.skills.push(Game.SkillRepository.createRandom(level, level + 2));
    this.color = '#4445';
  }
});

Game.ItemRepository.define('bookoftheearth', function (level) {
  this.name = 'book of the earth (' + level + ')';
  this.minLvl = 15;
  this.maxLvl = 35;
  this.type = 'book';
  this.symbol = 'book' + (Math.floor(Math.random() * 5) + 1);
  this.symbol = 'book' + (Math.floor(Math.random() * 2) + 1);
  this.color = '#7b53';
  this.skills = [];

  let skillType = ROT.RNG.getItem([
    'iceshield',
    'strengthofstone',
    'crackedearth'
  ]);
  this.skills.push(Game.SkillRepository.create(skillType, level));

  if (Math.random() < rareItemChance) {
    this.name = '%c{lightsalmon}rare ' + this.name + '%c{}';
    this.level += 3;
    this.skills.push(Game.SkillRepository.createRandom(level, level + 2));
    this.color = '#7b5255';
  }
});

Game.ItemRepository.define('bookofwarriors', function (level) {
  this.name = 'book of warriors (' + level + ')';
  this.minLvl = 10;
  this.maxLvl = 30;
  this.type = 'book';
  this.symbol = 'book' + (Math.floor(Math.random() * 5) + 1);
  this.symbol = 'book' + (Math.floor(Math.random() * 2) + 1);
  this.color = '#b943';
  this.skills = [];

  let skillType = ROT.RNG.getItem([
    'twistingslash',
    'rapidcut',
    'rainofblades'
  ]);
  this.skills.push(Game.SkillRepository.create(skillType, level));

  if (Math.random() < rareItemChance) {
    this.name = '%c{lightsalmon}rare ' + this.name + '%c{}';
    this.level += 3;
    this.skills.push(Game.SkillRepository.createRandom(level, level + 2));
    this.color = '#b945';
  }
});

Game.ItemRepository.define('bookofthetide', function (level) {
  this.name = 'book of the tide (' + level + ')';
  this.minLvl = 15;
  this.maxLvl = 35;
  this.type = 'book';
  this.symbol = 'book' + (Math.floor(Math.random() * 5) + 1);
  this.symbol = 'book' + (Math.floor(Math.random() * 2) + 1);
  this.color = '#00с3';
  this.skills = [];

  let skillType = ROT.RNG.getItem(['tsunami', 'auraofwinter', 'icefall']);
  this.skills.push(Game.SkillRepository.create(skillType, level));

  if (Math.random() < rareItemChance) {
    this.name = '%c{lightsalmon}rare ' + this.name + '%c{}';
    this.level += 3;
    this.skills.push(Game.SkillRepository.createRandom(level, level + 2));
    this.color = '#00c5';
  }
});

Game.ItemRepository.define('bookofspeed', function (level) {
  this.name = 'book of speed (' + level + ')';
  this.minLvl = 15;
  this.maxLvl = 35;
  this.type = 'book';
  this.symbol = 'book' + (Math.floor(Math.random() * 5) + 1);
  this.symbol = 'book' + (Math.floor(Math.random() * 2) + 1);
  this.color = '#fe03';
  this.skills = [];

  let skillType = ROT.RNG.getItem(['speedoflight', 'rapidcut', 'honor']);
  this.skills.push(Game.SkillRepository.create(skillType, level));

  if (Math.random() < rareItemChance) {
    this.name = '%c{lightsalmon}rare ' + this.name + '%c{}';
    this.level += 3;
    this.skills.push(Game.SkillRepository.createRandom(level, level + 2));
    this.color = '#fe05';
  }
});

Game.ItemRepository.define('bookofshields', function (level) {
  this.name = 'book of shields (' + level + ')';
  this.minLvl = 10;
  this.maxLvl = 30;
  this.type = 'book';
  this.symbol = 'book' + (Math.floor(Math.random() * 5) + 1);
  this.symbol = 'book' + (Math.floor(Math.random() * 2) + 1);
  this.color = '#77bbaaaa';
  this.skills = [];

  let skillType = ROT.RNG.getItem([
    'iceshield',
    'arcaneshield',
    'fireshield',
    'reflectionshield'
  ]);
  this.skills.push(Game.SkillRepository.create(skillType, level));

  if (Math.random() < rareItemChance) {
    this.name = '%c{lightsalmon}rare ' + this.name + '%c{}';
    this.level += 3;
    this.skills.push(Game.SkillRepository.createRandom(level, level + 2));
    this.color = '#77bbcccc';
  }
});

Game.ItemRepository.define('bookofchaos', function (level) {
  this.name = 'book of chaos (' + level + ')';
  this.minLvl = 20;
  this.maxLvl = 40;
  this.type = 'book';
  this.symbol = 'book' + (Math.floor(Math.random() * 5) + 1);
  this.symbol = 'book' + (Math.floor(Math.random() * 2) + 1);
  this.color = '#f393';
  this.skills = [];

  let skillType = ROT.RNG.getItem(['fireball', 'acidcloud', 'supernova']);
  this.skills.push(Game.SkillRepository.create(skillType, level));

  if (Math.random() < rareItemChance) {
    this.name = '%c{lightsalmon}rare ' + this.name + '%c{}';
    this.level += 3;
    this.skills.push(Game.SkillRepository.createRandom(level, level + 2));
    this.color = '#f395';
  }
});

Game.ItemRepository.define('bookoflight', function (level) {
  this.name = 'book of light (' + level + ')';
  this.minLvl = 20;
  this.maxLvl = 40;
  this.type = 'book';
  this.symbol = 'book' + (Math.floor(Math.random() * 5) + 1);
  this.symbol = 'book' + (Math.floor(Math.random() * 2) + 1);
  this.color = '#f883';
  this.skills = [];

  let skillType = ROT.RNG.getItem(['solareclipse', 'speedoflight', 'honor']);
  this.skills.push(Game.SkillRepository.create(skillType, level));

  if (Math.random() < rareItemChance) {
    this.name = '%c{lightsalmon}rare ' + this.name + '%c{}';
    this.level += 3;
    this.skills.push(Game.SkillRepository.createRandom(level, level + 2));
    this.color = '#f885';
  }
});

Game.ItemRepository.define('bookofillusions', function (level) {
  this.name = 'book of illusions (' + level + ')';
  this.minLvl = 15;
  this.maxLvl = 35;
  this.type = 'book';
  this.symbol = 'book' + (Math.floor(Math.random() * 5) + 1);
  this.symbol = 'book' + (Math.floor(Math.random() * 2) + 1);
  this.color = '#9373';
  this.skills = [];

  let skillType = ROT.RNG.getItem(['magiceye', 'darkness', 'auraoffear']);
  this.skills.push(Game.SkillRepository.create(skillType, level));

  if (Math.random() < rareItemChance) {
    this.name = '%c{lightsalmon}rare ' + this.name + '%c{}';
    this.level += 3;
    this.skills.push(Game.SkillRepository.createRandom(level, level + 2));
    this.color = '#9375';
  }
});

Game.ItemRepository.define('bookoftravel', function (level) {
  this.name = 'book of travel (' + level + ')';
  this.minLvl = 10;
  this.maxLvl = 30;
  this.type = 'book';
  this.symbol = 'book' + (Math.floor(Math.random() * 5) + 1);
  this.symbol = 'book' + (Math.floor(Math.random() * 2) + 1);
  this.color = '#87c3';
  this.skills = [];

  let skillType = ROT.RNG.getItem(['teleport', 'speedoflight', 'heal']);
  this.skills.push(Game.SkillRepository.create(skillType, level));

  if (Math.random() < rareItemChance) {
    this.name = '%c{lightsalmon}rare ' + this.name + '%c{}';
    this.level += 3;
    this.skills.push(Game.SkillRepository.createRandom(level, level + 2));
    this.color = '#87c5';
  }
});

Game.ItemRepository.define('bookofassault', function (level) {
  this.name = 'book of assault (' + level + ')';
  this.minLvl = 15;
  this.maxLvl = 35;
  this.type = 'book';
  this.symbol = 'book' + (Math.floor(Math.random() * 5) + 1);
  this.symbol = 'book' + (Math.floor(Math.random() * 2) + 1);
  this.color = '#ff63';
  this.skills = [];

  let skillType = ROT.RNG.getItem([
    'twistingslash',
    'rainofblades',
    'supernova'
  ]);
  this.skills.push(Game.SkillRepository.create(skillType, level));

  if (Math.random() < rareItemChance) {
    this.name = '%c{lightsalmon}rare ' + this.name + '%c{}';
    this.level += 3;
    this.skills.push(Game.SkillRepository.createRandom(level, level + 2));
    this.color = '#ff65';
  }
});

Game.ItemRepository.define('elementalstaff', function (level) {
  const elements = ['fire', 'ice', 'poison', 'earth', 'light', 'darkness'];
  const colors = {
    fire: 'indianred',
    ice: 'lightblue',
    poison: 'darkseagreen',
    earth: 'tan',
    light: 'ivory',
    darkness: 'silver'
  };

  let element1 = ROT.RNG.getItem(elements);
  let element2 = ROT.RNG.getItem(elements.filter((e) => e !== element1));

  this.name =
    'staff of %c{' +
    colors[element1] +
    '}' +
    element1 +
    '%c{} and %c{' +
    colors[element2] +
    '}' +
    element2 +
    '%c{} (' +
    level +
    ')';

  this.minLvl = 7;
  this.maxLvl = 50;
  this.type = 'weapon';
  this.level = level;
  this.color = '#fd05';
  this.symbol = 'elementalstaff' + (Math.floor(Math.random()) + 1);
  this.skills = [];

  const skillMap = {
    fire: ['fireball', 'flamechains', 'fireshield'],
    ice: ['iceshield', 'frozentomb', 'icearrow', 'icefall'],
    poison: ['plague', 'acidcloud', 'poisonarrow'],
    earth: ['strengthofstone', 'crackedearth'],
    light: ['honor', 'solareclipse', 'supernova', 'heal'],
    darkness: ['darkness', 'calltheshadows', 'auraoffear']
  };

  let skill1 = ROT.RNG.getItem(skillMap[element1]);
  let skill2 = ROT.RNG.getItem(skillMap[element2]);
  this.skills.push(Game.SkillRepository.create(skill1, level));
  this.skills.push(Game.SkillRepository.create(skill2, level));

  this.options = {
    minatk: 2 + Math.floor(level / 3),
    maxatk: 4 + Math.floor(level / 2) + Math.floor(Math.random() * level),
    int: 3 + Math.floor(level / 4),
    con: 3 + Math.floor(level / 6)
  };
});

Game.ItemRepository.define('elementalsword', function (level) {
  const elements = ['fire', 'ice', 'poison', 'earth', 'light', 'darkness'];
  const colors = {
    fire: 'indianred',
    ice: 'lightblue',
    poison: 'darkseagreen',
    earth: 'tan',
    light: 'ivory',
    darkness: 'silver'
  };

  let element1 = ROT.RNG.getItem(elements);
  let element2 = ROT.RNG.getItem(elements.filter((e) => e !== element1));

  this.name =
    'sword of %c{' +
    colors[element1] +
    '}' +
    element1 +
    '%c{} and %c{' +
    colors[element2] +
    '}' +
    element2 +
    '%c{} (' +
    level +
    ')';

  this.minLvl = 7;
  this.maxLvl = 50;
  this.type = 'weapon';
  this.level = level;
  this.color = '#fd05';
  this.symbol = 'elementalsword' + (Math.floor(Math.random()) + 1);
  this.skills = [];

  const skillMap = {
    fire: ['fireshield', 'rapidcut', 'lightningbolt'],
    ice: ['rainofblades', 'iceshield', 'tsunami'],
    poison: ['poisonslash', 'poisonarrow'],
    earth: ['strengthofstone', 'twistingslash'],
    light: ['honor', 'lightningstrike', 'supernova', 'heal'],
    darkness: ['darkness', 'calltheshadows', 'auraoffear']
  };

  let skill1 = ROT.RNG.getItem(skillMap[element1]);
  let skill2 = ROT.RNG.getItem(skillMap[element2]);
  this.skills.push(Game.SkillRepository.create(skill1, level));
  this.skills.push(Game.SkillRepository.create(skill2, level));

  this.options = {
    minatk: 3 + Math.floor(level / 2),
    maxatk: 8 + Math.floor(level / 1.5) + Math.floor(Math.random() * level),
    str: 3 + Math.floor(level / 3),
    con: 3 + Math.floor(level / 4)
  };
});
