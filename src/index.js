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

Game.drawAll = function () {
  this.messageDisplay.clear();
  this.drawMap();
  this.entity[0].Draw();
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
