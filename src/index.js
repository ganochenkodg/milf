var scheduler = new ROT.Scheduler.Speed();
var mode = {
  mode: 'play',
  chosenitem: -1,
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
  screenWidth: MapWidth,
  screenHeight: MapHeight,
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
    this.messageBox = new Game.MessageBox(Game.screenWidth * 4 - 30, 12);
    var freeplace = this.returnFree(Game.map[1]);
    let _player = new Player({
      x: freeplace[0],
      y: freeplace[1]
    });
    Game.entity.unshift(_player);
    scheduler.add(Game.entity[0], true);
    /*
    this.hpregen = new Hpregen();
    this.manaregen = new Manaregen();
    this.checkaffects = new AffectsCheck();
    scheduler.add(this.hpregen, true);
    scheduler.add(this.manaregen, true);
    scheduler.add(Game.entity[0], true);
    scheduler.add(this.checkaffects, true);
    let newitem = {};
    for (let i=0; i<6; i++) {
      newitem = Game.ItemRepository.createRandom(1,1);
      Game.inventory.push(newitem);
    }
//    newitem = Game.ItemRepository.create('giantsword');
//    Game.inventory.push(newitem);
    */
    this.drawAll();
    this.engine = new ROT.Engine(scheduler);
    this.engine.start();
  }
};

Game.Repository = function (name, ctor) {
  this._name = name;
  this._templates = {};
  this._ctor = ctor;
  this._randomTemplates = {};
};

// Define a new named template.
Game.Repository.prototype.define = function (name, template, options) {
  this._templates[name] = template;
  // Apply any options
  var disableRandomCreation = options && options['disableRandomCreation'];
  if (!disableRandomCreation) {
    this._randomTemplates[name] = template;
  }
};

// Create an object based on a template.
Game.Repository.prototype.create = function (name, extraProperties) {
  if (!this._templates[name]) {
    throw new Error(
      "No template named '" + name + "' in repository '" + this._name + "'"
    );
  }
  // ебаное наследование объектов в js
  let tmptemplate = Object.create(this._templates[name]);
  var template = tmptemplate;
  if (typeof template.options !== 'undefined') {
    template.options = JSON.parse(JSON.stringify(tmptemplate.options));
  }
  if (typeof template.skills !== 'undefined') {
    template.skills = JSON.parse(JSON.stringify(tmptemplate.skills));
  }
  // Apply any extra properties
  if (extraProperties) {
    for (var key in extraProperties) {
      template[key] = extraProperties[key];
    }
  }
  // Create the object, passing the template as an argument
  return new this._ctor(template);
};

// Create an object based on a random template
Game.Repository.prototype.createRandom = function (minlvl, maxlvl) {
  var keys = Object.keys(this._randomTemplates);
  var result = this.create(keys[(keys.length * Math.random()) << 0]);
  var iterator = 0;
  if (typeof minlvl !== 'undefined' && typeof maxlvl !== 'undefined') {
    while (result.level < minlvl || result.level > maxlvl) {
      iterator++;
      result = this.create(keys[(keys.length * Math.random()) << 0]);
      //exit from eternal loop
      if (iterator > 100) {
        return result;
      }
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
  var letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
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
    }
  }
};

window.onload = function () {
  Game.init();
};
