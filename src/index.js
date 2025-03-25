var scheduler = new ROT.Scheduler.Speed();
var mode = {
  mode: 'play',
  chosenItem: -1,
  chosenskill: -1,
  skillmap: null,
  skillx: -1,
  skilly: -1,
  blinkmap: null
};

var Game = {
  mainDisplay: null,
  messageDisplay: null,
  messageBox: null,
  engine: null,
  inventory: [],
  skills: [],
  screenWidth: mapWidth,
  screenHeight: mapHeight,
  init: function () {
    if (this.screenWidth < 25) {
      this.screenWidth = 25;
    }
    if (this.screenHeight < 10) {
      this.screenHeight = 10;
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
    var freeplace = this.returnFree(Game.map[1]);
    let _player = new Player({
      x: freeplace[0],
      y: freeplace[1]
    });
    Game.entity.unshift(_player);
    scheduler.add(Game.entity[0], true);
    this.hpRegen = new Hpregen();
    this.manaRegen = new Manaregen();
    //this.checkaffects = new AffectsCheck();
    scheduler.add(this.hpRegen, true);
    scheduler.add(this.manaRegen, true);
    /*
    scheduler.add(Game.entity[0], true);
    scheduler.add(this.checkaffects, true);
    let newitem = {};
    for (let i=0; i<6; i++) {
      newitem = Game.ItemRepository.createRandom(1,1);
      Game.inventory.push(newitem);
    }
    let _newitem = Game.ItemRepository.create('novicesword', 1);
    Game.inventory.push(_newitem);
    */
    this.drawAll();
    this.engine = new ROT.Engine(scheduler);
    this.engine.start();
  }
};

Hpregen = function () {
  this.getSpeed = () => {
    return 15;
  };
};

Hpregen.prototype.act = function () {
  for (let i = 0; i < Game.entity.length; i++) {
    let addHp =
      1 +
      Math.floor(Game.entity[i].maxHp / 100) +
      Math.floor(Game.entity[i].con / 5);
    Game.entity[i].hp += addHp;
    Game.entity[i].hp = Math.min(Game.entity[i].hp, Game.entity[i].maxHp);
  }
};

Manaregen = function () {
  this.getSpeed = () => {
    return 15;
  };
};

Manaregen.prototype.act = function () {
  for (let i = 0; i < Game.entity.length; i++) {
    let addMana =
      1 +
      Math.floor(Game.entity[i].maxMana / 100) +
      Math.floor(Game.entity[i].int / 7);
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

// Define a new named template.
Game.Repository.prototype.define = function (name, template) {
  this._templates[name] = template;
};

// Create an object based on a template.
Game.Repository.prototype.create = function (name, level) {
  if (!this._templates[name]) {
    throw new Error(
      "No template named '" + name + "' in repository '" + this._name + "'"
    );
  }
  let template = new this._templates[name](level);
  return new this._ctor(template);
};

// Create an object based on a random template
Game.Repository.prototype.createRandom = function (minlvl, maxlvl) {
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
  //this.drawEntities();
  this.messageBox.Draw();
};

Game.drawBar = function () {
  for (let i = 0; i < 10; i++) {
    Game.messageDisplay.draw(i * 4 + 1, 0, i + 1, 'beige');
    if (typeof Game.skills[i] === 'undefined') {
      Game.mainDisplay.draw(i, Game.screenHeight, 'blanksquare');
    }
    //} else {
    //  Game.display.draw(i, Game.screenHeight, ['whitesquare', Game.skills[i].Symbol], ['#0000', '#0000']);
    //}
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
