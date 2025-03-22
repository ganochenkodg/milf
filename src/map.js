Game.map = {};

function lightPasses(x, y) {
  var level = Game.entity[0].depth;
  if (
    x > 0 &&
    x < Game.map[level].width &&
    y > 0 &&
    y < Game.map[level].height
  ) {
    return !Game.map[level].Tiles[x][y].BlocksSight;
  }
  return false;
}

var fov = new ROT.FOV.PreciseShadowcasting(lightPasses);

Game.Tile = function (properties) {
  properties = properties || {};
  this.x = properties['x'];
  this.y = properties['y'];
  this.Blocked = properties['Blocked'] || true;
  this.BlocksSight = properties['BlocksSight'] || true;
  this.Visited = properties['Visited'] || false;
  this.Visible = properties['Visible'] || false;
  this.Symbol = properties['Symbol'] || 'dungeonwall';
  this.Mob = false;
  this.Color = '';
  this.Door = false;
  this.Stairup = false;
  this.Stairdown = false;
  this.items = [];
};

Game.GameMap = function (width, height, terrain, level) {
  this.width = width;
  this.height = height;
  this.Tiles = {};

  for (let i = 0; i < this.width; i++) {
    this.Tiles[i] = new Array(this.height);
    for (let j = 0; j < this.height; j++) {
      this.Tiles[i][j] = new Game.Tile({
        x: i,
        y: j
      });
    }
  }

  let random = Math.random();
  if (random > 0.2) {
    var digger = new ROT.Map.Uniform(width, height, {
      roomWidth: [2, 10],
      roomHeight: [2, 8],
      corridorLength: [1, 8],
      roomDugPercentage: Math.random() / 2 + 0.3
    });
  } else if (random < 0.1) {
    var digger = new ROT.Map.Digger(width, height, {
      roomWidth: [2, 10],
      roomHeight: [2, 14],
      corridorLength: [1, 10],
      dugPercentage: 0.6
    });
  } else {
    var digger = new ROT.Map.DividedMaze(width, height);
  }

  var digCallback = function (x, y, value) {
    if (value) {
      this.Tiles[x][y].Symbol = terrain + 'wall';
      return;
    }
    this.Tiles[x][y].Symbol = terrain + 'floor';
    if (Math.random() < 0.02) {
      this.Tiles[x][y].Symbol = terrain + 'floorrandom';
    }
    this.Tiles[x][y].Blocked = false;
    this.Tiles[x][y].BlocksSight = false;
  };
  digger.create(digCallback.bind(this));

  for (let i = 1; i < width - 1; i++) {
    for (let j = 1; j < height - 1; j++) {
      if (this.Tiles[i][j].BlocksSight && !this.Tiles[i][j + 1].BlocksSight) {
        this.Tiles[i][j].Symbol = terrain + 'wallhor';
      }
      if (
        this.Tiles[i][j].BlocksSight &&
        this.Tiles[i][j + 1].BlocksSight &&
        this.Tiles[i + 1][j].BlocksSight &&
        this.Tiles[i - 1][j].BlocksSight &&
        !this.Tiles[i][j - 1].BlocksSight
      ) {
        this.Tiles[i][j].Symbol = terrain + 'wallhor';
      }
    }
  }

  var doorPlace;
  var doorAmount = Math.floor(Math.random() * 10) + 5;
  for (let i = 0; i < doorAmount; i++) {
    doorPlace = Game.returnDoor(this);
    let xloc = doorPlace[0];
    let yloc = doorPlace[1];
    this.Tiles[xloc][yloc].Symbol = terrain + 'doorclose';
    this.Tiles[xloc][yloc].Blocked = true;
    this.Tiles[xloc][yloc].BlocksSight = true;
    this.Tiles[xloc][yloc].Door = true;
  }

  var stairPlace = Game.returnFree(this);
  let xloc = stairPlace[0];
  let yloc = stairPlace[1];
  this.Tiles[xloc][yloc].Symbol = terrain + 'stairdown';
  this.Tiles[xloc][yloc].Stairdown = true;
  if (level > 1) {
    stairPlace = Game.returnFree(this);
    let xloc = stairPlace[0];
    let yloc = stairPlace[1];
    this.Tiles[xloc][yloc].Symbol = terrain + 'stairup';
    this.Tiles[xloc][yloc].Stairup = true;
  }
  //monsters
  let tempEntity = null;
  let freePlace = null;
  let maxMon = Math.floor(Math.random() * level) * 2 + 15;
  for (let i = 0; i < maxMon; i++) {
    freePlace = Game.returnFree(this);
    tempEntity = Game.EntityRepository.createRandom(level, level + 2);
    //tempEntity = Game.EntityRepository.create('animal', '1');
    tempEntity.x = freePlace[0];
    tempEntity.y = freePlace[1];
    tempEntity.depth = level;
    /*
    if (Math.random() * 100 < RareMobChance) {
      if (Math.random() * 100 < RareBossChance) {
        tempentity.randomize(3);
      } else {
        tempentity.randomize(2);
      }
    }
    */
    this.Tiles[tempEntity.x][tempEntity.y].Mob = true;
    Game.entity.push(tempEntity);
    if ('Actor' in Game.entity[Game.entity.length - 1].acts) {
      scheduler.add(Game.entity[Game.entity.length - 1], true);
    }
  }
  let maxItems = 3 + Math.floor(Math.random() * 5);
  let newItem;
  for (let i = 0; i < maxItems; i++) {
    newItem = Game.ItemRepository.createRandom(1, level);
    freePlace = Game.returnFree(this);
    this.Tiles[freePlace[0]][freePlace[1]].items.push(newItem);
  }
};

Game.returnFree = function (map) {
  var xrand = 0;
  var yrand = 0;
  while (map.Tiles[xrand][yrand].Blocked || map.Tiles[xrand][yrand].Mob) {
    xrand = Math.round(Math.random() * (map.width - 1));
    yrand = Math.round(Math.random() * (map.height - 1));
  }
  return [xrand, yrand];
};

Game.returnDoor = function (map) {
  var xrand;
  var yrand;
  var result = false;
  while (!result) {
    xrand = Math.round(Math.random() * (map.width - 3)) + 1;
    yrand = Math.round(Math.random() * (map.height - 3)) + 1;
    result = Game.isDoorReady(xrand, yrand, map);
  }
  return [xrand, yrand];
};

Game.isDoorReady = function (x, y, map) {
  if (
    map.Tiles[x - 1][y].Blocked &&
    map.Tiles[x + 1][y].Blocked &&
    !map.Tiles[x][y - 1].Blocked &&
    !map.Tiles[x][y + 1].Blocked
  ) {
    return true;
  }
  if (
    map.Tiles[x][y - 1].Blocked &&
    map.Tiles[x][y + 1].Blocked &&
    !map.Tiles[x - 1][y].Blocked &&
    !map.Tiles[x + 1][y].Blocked
  ) {
    return true;
  }
  return false;
};

Game.getStairup = function (level) {
  for (let i = 0; i < Game.map[level].width; i++) {
    for (let j = 0; j < Game.map[level].height; j++) {
      if (Game.map[level].Tiles[i][j].Stairup) {
        return [i, j];
      }
    }
  }
};

Game.getStairdown = function (level) {
  for (let i = 0; i < Game.map[level].width; i++) {
    for (let j = 0; j < Game.map[level].height; j++) {
      if (Game.map[level].Tiles[i][j].Stairdown) {
        return [i, j];
      }
    }
  }
};

Game.generateMap = function (level) {
  var newMapWidth = Math.floor(Math.random() * 40) + 35;
  var newMapHeight = Math.floor(Math.random() * 30) + 15;

  var terrain = ROT.RNG.getItem(terrains);
  Game.map[level] = new Game.GameMap(newMapWidth, newMapHeight, terrain, level);

  /*
  //create monsters
  let tempentity = null;
  let freeplace = null;
  let maxmon = Math.floor(Math.random() * level) * 2 + 15;
  for (let i = 0; i < maxmon; i++) {
    freeplace = this.returnFree(level);
    tempentity = Game.EntityRepository.createRandom(level - 1, level + 1);
    tempentity.x = freeplace[0];
    tempentity.y = freeplace[1];
    tempentity.depth = level;
    if (Math.random() * 100 < RareMobChance) {
      if (Math.random() * 100 < RareBossChance) {
        tempentity.randomize(3);
      } else {
        tempentity.randomize(2);
      }
    }
    Game.map[level].Tiles[tempentity.x][tempentity.y].Mob = true;
    Game.entity.push(tempentity);
    if ('Actor' in Game.entity[Game.entity.length - 1].acts) {
      scheduler.add(Game.entity[Game.entity.length - 1], true);
    }
  }
  */
};

Game.clearTiles = function () {
  for (let i = 0; i < this.screenWidth; i++) {
    for (let j = 0; j < this.screenHeight; j++) {
      Game.mainDisplay.draw(i, j, '', 'black');
    }
  }
};

Game.drawMap = function () {
  Game.clearTiles();
  var level = Game.entity[0].depth;
  for (let i = 0; i < Game.map[level].width; i++) {
    for (let j = 0; j < Game.map[level].height; j++) {
      let _color = '#000f';
      if (Game.map[level].Tiles[i][j].Visited) {
        _color = '#0009';
      }
      let xco = Game.getCamera(i, j)[0];
      let yco = Game.getCamera(i, j)[1];
      if (
        yco < Game.screenHeight &&
        yco > -1 &&
        xco < Game.screenWidth &&
        xco > -1
      ) {
        if (typeof Game.map[level].Tiles[i][j].items[0] !== 'undefined') {
          this.mainDisplay.draw(
            xco,
            yco,
            [
              Game.map[level].Tiles[i][j].Symbol,
              Game.map[level].Tiles[i][j].items[0].symbol
            ],
            ['#0000', _color]
          );
        } else {
          this.mainDisplay.draw(
            xco,
            yco,
            Game.map[level].Tiles[i][j].Symbol,
            _color
          );
        }
        Game.map[level].Tiles[i][j].Color = _color;
      }
      Game.map[level].Tiles[i][j].Visible = false;
    }
  }

  fov.compute(
    Game.entity[0].x,
    Game.entity[0].y,
    Game.entity[0].vision,
    function (x, y, r, visibility) {
      if (r > 9) {
        r = 9;
      }
      let xco = Game.getCamera(x, y)[0];
      let yco = Game.getCamera(x, y)[1];
      let _color = '#000' + r;
      if (
        yco < Game.screenHeight &&
        yco > -1 &&
        xco < Game.screenWidth &&
        xco > -1
      ) {
        if (typeof Game.map[level].Tiles[x][y].items[0] !== 'undefined') {
          Game.mainDisplay.draw(
            xco,
            yco,
            [
              Game.map[level].Tiles[x][y].Symbol,
              Game.map[level].Tiles[x][y].items[0].symbol
            ],
            ['#0000', _color]
          );
        } else {
          Game.mainDisplay.draw(
            xco,
            yco,
            Game.map[level].Tiles[x][y].Symbol,
            _color
          );
        }
        Game.map[level].Tiles[x][y].Color = _color;
      }
      Game.map[level].Tiles[x][y].Visited = true;
      Game.map[level].Tiles[x][y].Visible = true;
    }
  );
};

Game.getCamera = function (x, y) {
  let xoffset = 0;
  let yoffset = 0;
  var level = Game.entity[0].depth;
  if (Math.round(this.screenWidth / 2) - Game.entity[0].x - 1 > 0) {
    xoffset = Game.entity[0].x - Math.round(this.screenWidth / 2) + 1;
  }
  if (
    Game.map[level].width - Game.entity[0].x - 1 <
    Math.round(this.screenWidth / 2)
  ) {
    xoffset =
      Game.entity[0].x +
      Math.round(this.screenWidth / 2) -
      Game.map[level].width;
  }
  if (Math.round(this.screenHeight / 2) - Game.entity[0].y - 1 > 0) {
    yoffset = Game.entity[0].y - Math.round(this.screenHeight / 2) + 1;
  }
  if (
    Game.map[level].height - Game.entity[0].y - 1 <
    Math.round(this.screenHeight / 2)
  ) {
    yoffset =
      Game.entity[0].y +
      Math.round(this.screenHeight / 2) -
      Game.map[level].height;
  }
  let newx =
    Math.round(this.screenWidth / 2) + x - Game.entity[0].x - 1 + xoffset;
  let newy =
    Math.round(this.screenHeight / 2) + y - Game.entity[0].y - 1 + yoffset;
  return [newx, newy];
};
