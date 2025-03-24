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
  return false;
};

Game.pickupItem = function () {
  let level = Game.entity[0].depth;
  let x = Game.entity[0].x;
  let y = Game.entity[0].y;
  if (typeof Game.map[level].Tiles[x][y].items[0] !== 'undefined') {
    if (Game.inventory.length > 9) {
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
    for (let [key, value] of Object.entries(Game.inventory[num].skills)) {
      iterator++;
      Game.messageDisplay.drawText(1, iterator, `${key}: (${value})`);
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
      Game.messageDisplay.drawText(1, iterator + 2, 'e) Unquip');
    } else {
      Game.messageDisplay.drawText(1, iterator + 2, 'e) Equip');
    }
  }
  Game.messageDisplay.drawText(1, iterator + 3, 's) Sacrifice');
  Game.entity[0].Draw();
  mode.mode = 'item';
  mode.chosenItem = num;
};

Game.doItem = function (action) {
  var num = mode.chosenItem;
  var itemtype = Game.inventory[num].type;
  /*
  if (action == 'wield') {
    if (
      itemtype != 'weapon' &&
      itemtype != 'armor' &&
      itemtype != 'amulet' &&
      itemtype != 'book'
    ) {
      Game.messagebox.sendMessage('You cant do this.');
      return;
    }
    if (Game.inventory[num].isWielded() == 0 && itemtype == 'weapon') {
      if (Game.inventory[num].options.size == 'twohand') {
        if (
          typeof Game.entity[0].equipment.righthand !== 'undefined' ||
          typeof Game.entity[0].equipment.righthand !== 'undefined'
        ) {
          Game.messagebox.sendMessage('You hands are busy.');
          return;
        } else {
          Game.entity[0].equipment.righthand = Game.inventory[num];
        }
      } else {
        if (typeof Game.entity[0].equipment.righthand === 'undefined') {
          Game.entity[0].equipment.righthand = Game.inventory[num];
        } else if (
          typeof Game.entity[0].equipment.lefthand === 'undefined' &&
          Game.entity[0].equipment.righthand.options.size != 'twohand'
        ) {
          Game.entity[0].equipment.lefthand = Game.inventory[num];
        } else {
          Game.messagebox.sendMessage('You hands are busy.');
          return;
        }
      }
      Game.doItemOptions();
      Game.messagebox.sendMessage(
        'You wielded the ' + Game.inventory[num].name + '.'
      );
    } else if (Game.inventory[num].isWielded() == 0 && itemtype == 'armor') {
      if (typeof Game.entity[0].equipment.body === 'undefined') {
        Game.entity[0].equipment.body = Game.inventory[num];
        Game.doItemOptions();
        Game.messagebox.sendMessage(
          'You wielded the ' + Game.inventory[num].name + '.'
        );
      } else {
        Game.messagebox.sendMessage('You already have armor.');
        return;
      }
    } else if (Game.inventory[num].isWielded() == 0 && itemtype == 'amulet') {
      if (typeof Game.entity[0].equipment.neck === 'undefined') {
        Game.entity[0].equipment.neck = Game.inventory[num];
        Game.doItemOptions();
        Game.messagebox.sendMessage(
          'You wielded the ' + Game.inventory[num].name + '.'
        );
      } else {
        Game.messagebox.sendMessage('You already have amulet.');
        return;
      }
    } else if (Game.inventory[num].isWielded() == 0 && itemtype == 'book') {
      Game.entity[0].books.push(Game.inventory[num]);
      Game.doItemOptions();
      Game.messagebox.sendMessage(
        'You wielded the ' + Game.inventory[num].name + '.'
      );
    } else {
      if (Game.entity[0].equipment.righthand == Game.inventory[num]) {
        delete Game.entity[0].equipment.righthand;
      } else if (Game.entity[0].equipment.lefthand == Game.inventory[num]) {
        delete Game.entity[0].equipment.lefthand;
      } else if (Game.entity[0].equipment.body == Game.inventory[num]) {
        delete Game.entity[0].equipment.body;
      } else if (Game.entity[0].equipment.neck == Game.inventory[num]) {
        delete Game.entity[0].equipment.neck;
      }
      if (typeof Game.entity[0].books !== 'undefined') {
        for (let i = 0; i < Game.entity[0].books.length; i++) {
          if (Game.entity[0].books[i] == Game.inventory[num]) {
            Game.entity[0].books.splice(i, 1);
          }
        }
      }
      Game.doItemOptions();
      Game.messagebox.sendMessage(
        'You unwielded the ' + Game.inventory[num].name + '.'
      );
    }
  }
  */
  if (action == 'sacrifice') {
    if (itemtype == 'weapon' || itemtype == 'armor' || itemtype == 'book') {
      if (Game.inventory[num].isEquipped()) {
        Game.doItem('unequip');
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
        Game.doItem('unequip');
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
  /*
  if (action == 'eat') {
    if (itemtype != 'food' && itemtype != 'potion') {
      Game.messagebox.sendMessage('You cant do this.');
      return;
    }
    if (itemtype == 'food') {
      Game.messagebox.sendMessage(
        'You eat the ' + Game.inventory[num].name + '.'
      );
    }
    if (itemtype == 'potion') {
      Game.messagebox.sendMessage(
        'You drink the ' + Game.inventory[num].name + '.'
      );
    }
    Game.doFoodOptions();
    Game.inventory.splice(num, 1);
  }
  */
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

Game.ItemRepository.define('novicepotion', function (level) {
  this.name = 'novice potion (' + level + ')';
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
