var scheduler = new ROT.Scheduler.Speed();
var mode = {
  mode: 'play',
  chosenItem: -1,
  chosenSkill: -1,
  skillMap: null,
  skillx: -1,
  skilly: -1,
  blinkmap: null
};

var Game = {
  mainDisplay: null,
  messageDisplay: null,
  messageBox: null,
  engine: null,
  checkAffects: null,
  inventory: [],
  skills: [],
  screenWidth: 25,
  screenHeight: 10,
  init: function () {
    this.screenWidth = Math.floor((window.innerWidth - 300) / 32);
    this.screenHeight = Math.floor((window.innerHeight - 360) / 32);
    if (this.screenWidth < 20) {
      this.screenWidth = 20;
    }
    if (this.screenHeight < 11) {
      this.screenHeight = 11;
    }
    this.mainDisplay = new ROT.Display({
      width: this.screenWidth,
      height: this.screenHeight + 1,
      layout: 'tile',
      tileColorize: true,
      fg: 'transparent',
      bg: 'black',
      tileWidth: 32,
      tileHeight: 32,
      tileSet: tileSet,
      tileMap: gameTilemap
    });

    this.messageDisplay = new ROT.Display({
      width: this.screenWidth * 4,
      height: 16,
      fontSize: 13
    });
    document.body.appendChild(this.mainDisplay.getContainer());
    document.body.appendChild(this.messageDisplay.getContainer());
    this.generateMap(1);
    this.messageBox = new Game.MessageBox(Game.screenWidth * 4 - 30, 13);
    if (gameMode == 'easy') {
      rareMobChance = 0.05;
      rareItemChance = 0.15;
      playerStatsMod = 8;
      healingFactor = 5;
      for (let k = 0; k < 3; k++) {
        newItem = Game.ItemRepository.createRandom(1, 5);
        Game.inventory.push(newItem);
      }
    }
    if (gameMode == 'normal') {
      rareMobChance = 0.05;
      rareItemChance = 0.1;
      playerStatsMod = 6;
      healingFactor = 2;
      newItem = Game.ItemRepository.createRandom(1, 3);
      Game.inventory.push(newItem);
    }

    if (gameMode == 'hard') {
      rareMobChance = 0.15;
      rareItemChance = 0.15;
      playerStatsMod = 4;
      healingFactor = 1;
    }

    var freeplace = this.returnFree(Game.map[1]);
    let _player = new Player({
      x: freeplace[0],
      y: freeplace[1]
    });
    Game.entity.unshift(_player);
    scheduler.add(Game.entity[0], true);
    this.hpRegen = new hpRegen();
    this.manaRegen = new manaRegen();
    this.checkAffects = new checkAffects();
    scheduler.add(this.hpRegen, true);
    scheduler.add(this.manaRegen, true);
    scheduler.add(this.checkAffects, true);
    this.drawAll();
    this.engine = new ROT.Engine(scheduler);
    this.engine.start();
  }
};

hpRegen = function () {
  this.getSpeed = () => {
    return 15;
  };
};

hpRegen.prototype.act = function () {
  for (let i = 0; i < Game.entity.length; i++) {
    let addHp =
      1 +
      Math.floor(Game.entity[i].maxHp / 100) +
      Math.floor(Game.entity[i].con / 5);
    Game.entity[i].hp += addHp;
    Game.entity[i].hp = Math.min(Game.entity[i].hp, Game.entity[i].maxHp);
  }
};

manaRegen = function () {
  this.getSpeed = () => {
    return 15;
  };
};

manaRegen.prototype.act = function () {
  for (let i = 0; i < Game.entity.length; i++) {
    let addMana =
      1 +
      Math.floor(Game.entity[i].maxMana / 100) +
      Math.floor(Game.entity[i].int / 5);
    Game.entity[i].mana += addMana;
    Game.entity[i].mana = Math.min(Game.entity[i].mana, Game.entity[i].maxMana);
  }
};

Game.Repository = function (name, ctor) {
  this._name = name;
  this._templates = {};
  this._ctor = ctor;
  this._randomTemplates = {};
};

Game.Repository.prototype.define = function (name, template) {
  this._templates[name] = template;
};

Game.Repository.prototype.create = function (name, level) {
  level = Math.max(1, level);
  if (!this._templates[name]) {
    throw new Error(
      "No template named '" + name + "' in repository '" + this._name + "'"
    );
  }
  let template = new this._templates[name](level);
  return new this._ctor(template);
};

Game.Repository.prototype.createRandom = function (minlvl, maxlvl) {
  minlvl = Math.max(1, minlvl);
  maxlvl = Math.max(minlvl, maxlvl);
  var keys = Object.keys(this._templates);
  var result = this.create(
    keys[(keys.length * Math.random()) << 0],
    minlvl + Math.floor(Math.random() * (maxlvl - minlvl))
  );
  var iterator = 0;
  while (result.maxLvl < minlvl || result.minLvl > maxlvl) {
    iterator++;
    result = this.create(
      keys[(keys.length * Math.random()) << 0],
      minlvl + Math.floor(Math.random() * (maxlvl - minlvl))
    );
    //exit from eternal loop
    if (iterator > 50) {
      return result;
    }
  }
  return result;
};

Game.drawAll = function () {
  this.messageDisplay.clear();
  this.drawMap();
  this.drawEntities();
  this.drawBar();
  this.messageBox.Draw();
};

Game.drawEnd = function (endType) {
  let xOffset = Math.floor(Game.screenWidth / 2) - 3;
  let yOffset = Math.floor(Game.screenHeight / 2) - 2;
  for (let y = 0; y <= 5; y++) {
    for (let x = 0; x <= 5; x++) {
      Game.mainDisplay.draw(x + xOffset, y + yOffset, `${endType}end${x}${y}`);
    }
  }
};

Game.drawBar = function () {
  for (let i = 0; i < 10; i++) {
    Game.messageDisplay.draw(i * 4 + 1, 0, i + 1, 'beige');
    if (typeof Game.skills[i] === 'undefined') {
      Game.mainDisplay.draw(i, Game.screenHeight, 'blanksquare');
    } else {
      Game.mainDisplay.draw(
        i,
        Game.screenHeight,
        ['bluesquare', Game.skills[i].symbol],
        ['#0000', '#0000']
      );
    }
  }
  const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
  for (let i = 0; i < 10; i++) {
    Game.messageDisplay.draw(
      (i + Game.screenWidth - 10) * 4 + 2,
      0,
      letters[i],
      'beige'
    );
    if (typeof Game.inventory[i] === 'undefined') {
      Game.mainDisplay.draw(
        i + Game.screenWidth - 10,
        Game.screenHeight,
        'blanksquare'
      );
    } else {
      if (Game.inventory[i].isEquipped()) {
        _color = 'green';
      } else {
        _color = 'red';
      }
      if (Game.inventory[i].symbol == 'heartoffleshlord') {
        _color = 'purple';
      }
      Game.mainDisplay.draw(
        i + Game.screenWidth - 10,
        Game.screenHeight,
        [_color + 'square', Game.inventory[i].symbol],
        ['#0000', Game.inventory[i].color],
        ['#0000', '#0000']
      );
    }
  }
};

window.onload = function () {
  Game.init();
};
