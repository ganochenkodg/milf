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

Game.chooseItem = function (num) {
  const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
  if (typeof Game.inventory[num] === 'undefined') {
    Game.messagebox.sendMessage(
      "You don't have any item in the slot [" + letters[num] + '].'
    );
    Game.drawAll();
    window.removeEventListener('keydown', this);
    Game.engine.unlock();
    return;
  }
  Game.messages.clear();
  Game.messageDisplay.draw(
    (num + Game.screenWidth - 10) * 4 + 2,
    0,
    letters[num],
    '#0f0'
  );

  Game.messages.drawText(1, 4, 'You see the ' + Game.inventory[num].name + ':');
  var iterator = 4;
  for (let [key, value] of Object.entries(Game.inventory[num].options)) {
    iterator++;
    Game.messages.drawText(1, iterator, `${key}: ${value}`);
  }
  if (typeof Game.inventory[num].skills !== 'undefined') {
    for (let [key, value] of Object.entries(Game.inventory[num].skills)) {
      iterator++;
      Game.messages.drawText(1, iterator, `${key}: (${value})`);
    }
  }
  Game.messages.drawText(1, iterator + 1, 'd) Drop');
  var itemtype = Game.inventory[num].type;
  if (itemtype == 'food') {
    Game.messages.drawText(1, iterator + 2, 'e) Eat');
  }
  if (itemtype == 'potion') {
    Game.messages.drawText(1, iterator + 2, 'e) Drink');
  }
  if (
    itemtype == 'weapon' ||
    itemtype == 'armor' ||
    itemtype == 'amulet' ||
    itemtype == 'book'
  ) {
    if (Game.inventory[num].isEquipped()) {
      Game.messages.drawText(1, iterator + 2, 'e) Unquip');
    } else {
      Game.messages.drawText(1, iterator + 2, 'e) Equip');
    }
  }
  Game.messages.drawText(1, iterator + 3, 's) Sacrifice');
  Game.entity[0].Draw();
  mode.mode = 'item';
  mode.chosenitem = num;
};

Game.ItemRepository = new Game.Repository('items', Item);

Game.ItemRepository.define('novicesword', function (level) {
  this.name = 'novice sword (' + level + ')';
  this.minLvl = 1;
  this.maxLvl = 5;
  this.level = level;
  this.color = '#0000';
  this.symbol = 'sword' + (Math.floor(Math.random() * 11) + 1);
  this.price = level + Math.floor(Math.random() * level);
  this.options = {
    minatk: 1,
    maxatk: 6 + Math.floor(Math.random() * level),
    str: 1 + Math.floor(Math.random() * level),
    con: Math.floor(Math.random() * level)
  };
  if (Math.random() < rareItemChance) {
    this.name = '%c{lightsalmon}rare ' + this.name + '%c{}';
    this.price = this.price * 2;
    this.options.maxatk = this.options.maxatk * 2;
    this.options.str += 1;
    this.color = '#00f4';
  }
});
