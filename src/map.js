'use strict';

Game.map = {};

const lightPasses = (x, y) => {
  const map = Game.map[Game.entity[0].depth];
  return (
    x > 0 &&
    x < map.width &&
    y > 0 &&
    y < map.height &&
    !map.Tiles[x][y].BlocksSight
  );
};

const fov = new ROT.FOV.PreciseShadowcasting(lightPasses);

Game.Tile = class Tile {
  constructor(properties = {}) {
    this.x = properties.x;
    this.y = properties.y;
    this.Blocked = properties.Blocked ?? true;
    this.BlocksSight = properties.BlocksSight ?? true;
    this.Visited = properties.Visited ?? false;
    this.Visible = properties.Visible ?? false;
    this.Symbol = properties.Symbol || 'dungeonwall';
    this.Mob = false;
    this.Color = '';
    this.Door = false;
    this.Stairup = false;
    this.Stairdown = false;
    this.items = [];
  }
};

Game.GameMap = class GameMap {
  constructor(width, height, terrain, level) {
    this.width = width;
    this.height = height;
    this.Tiles = {};

    for (let x = 0; x < width; x++) {
      this.Tiles[x] = new Array(height);
      for (let y = 0; y < height; y++) {
        this.Tiles[x][y] = new Game.Tile({ x, y });
      }
    }

    const rollGen = Math.random();
    let digger;
    if (rollGen > 0.2) {
      digger = new ROT.Map.Uniform(width, height, {
        roomWidth: [2, Math.min(8, width - 4)],
        roomHeight: [2, Math.min(6, height - 4)],
        corridorLength: [1, 6],
        roomDugPercentage: Math.random() / 2 + 0.3
      });
    } else if (rollGen < 0.1) {
      digger = new ROT.Map.Digger(width, height, {
        roomWidth: [2, Math.min(8, width - 4)],
        roomHeight: [2, Math.min(9, height - 4)],
        corridorLength: [1, 7],
        dugPercentage: 0.6
      });
    } else {
      digger = new ROT.Map.DividedMaze(width, height);
    }

    digger.create((x, y, isWall) => {
      const tile = this.Tiles[x][y];
      if (isWall) {
        tile.Symbol = `${terrain}wall`;
        return;
      }
      tile.Symbol = Math.random() < 0.02 ? `${terrain}floorrandom` : `${terrain}floor`;
      tile.Blocked = false;
      tile.BlocksSight = false;
    });

    for (let x = 1; x < width - 1; x++) {
      for (let y = 1; y < height - 1; y++) {
        const tile = this.Tiles[x][y];
        if (!tile.BlocksSight) continue;
        const openBelow = !this.Tiles[x][y + 1].BlocksSight;
        const openAboveOnly =
          this.Tiles[x][y + 1].BlocksSight &&
          this.Tiles[x + 1][y].BlocksSight &&
          this.Tiles[x - 1][y].BlocksSight &&
          !this.Tiles[x][y - 1].BlocksSight;
        if (openBelow || openAboveOnly) {
          tile.Symbol = `${terrain}wallhor`;
        }
      }
    }

    const doorAmount = randInt(3, 9);
    for (let i = 0; i < doorAmount; i++) {
      const doorPos = Game.returnDoor(this);
      if (!doorPos) break;
      const tile = this.Tiles[doorPos[0]][doorPos[1]];
      tile.Symbol = `${terrain}doorclose`;
      tile.Blocked = true;
      tile.BlocksSight = true;
      tile.Door = true;
    }

    const [downX, downY] = Game.returnFree(this);
    this.Tiles[downX][downY].Symbol = `${terrain}stairdown`;
    this.Tiles[downX][downY].Stairdown = true;

    if (level > 1) {
      const [upX, upY] = Game.returnFree(this);
      this.Tiles[upX][upY].Symbol = `${terrain}stairup`;
      this.Tiles[upX][upY].Stairup = true;
    }

    let freeCount = 0;
    for (let x = 1; x < width - 1; x++) {
      for (let y = 1; y < height - 1; y++) {
        if (!this.Tiles[x][y].Blocked && !this.Tiles[x][y].Mob) freeCount++;
      }
    }

    const maxMon = Math.min(Math.floor(freeCount * 0.4), roll(level) * 2 + 10);
    for (let i = 0; i < maxMon; i++) {
      this.spawnEntity(Game.EntityRepository.createRandom(level, level + 2), level, 'gray');
    }

    if (level % 10 === 0) {
      this.spawnEntity(Game.EntityRepository.create('fleshlord', level), level, 'lavender');
      Game.messageBox.sendMessage('%c{mediumaquamarine}IT FOLLOWS YOU!%c{}');
    }

    const maxItems = randInt(3, 7);
    const minItemLvl = Math.max(1, level - 5);
    for (let i = 0; i < maxItems; i++) {
      const [ix, iy] = Game.returnFree(this);
      this.Tiles[ix][iy].items.push(Game.ItemRepository.createRandom(minItemLvl, level + 1));
    }
    for (let i = 0; i < maxItems + 3; i++) {
      const [fx, fy] = Game.returnFree(this);
      this.Tiles[fx][fy].items.push(Game.FoodRepository.createRandom(minItemLvl, level + 1));
    }
  }

  spawnEntity(entity, level, levelColor) {
    const [x, y] = Game.returnFree(this);
    entity.x = x;
    entity.y = y;
    entity.depth = level;
    if ('Actor' in entity.acts) {
      entity.name += `%c{${levelColor}} (${entity.level})%c{}`;
      scheduler.add(entity, true);
    }
    this.Tiles[x][y].Mob = true;
    Game.entity.push(entity);
  }
};

Game.returnFree = function (map) {
  let x = 0;
  let y = 0;
  while (map.Tiles[x][y].Blocked || map.Tiles[x][y].Mob) {
    x = randInt(0, map.width - 1);
    y = randInt(0, map.height - 1);
  }
  return [x, y];
};

Game.createPortal = function (x, y, level) {
  const map = Game.map[level];
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      const nx = x + i;
      const ny = y + j;
      if (nx <= 0 || nx >= map.width - 1 || ny <= 0 || ny >= map.height - 1) continue;
      const tile = map.Tiles[nx][ny];
      if (!tile.Blocked && !tile.Mob && !tile.Stairup && !tile.Stairdown) {
        tile.Symbol = 'portal';
        Game.drawAll();
        return;
      }
    }
  }
  const [fx, fy] = Game.returnFree(map);
  map.Tiles[fx][fy].Symbol = 'portal';
  Game.drawAll();
};

Game.returnDoor = function (map) {
  for (let tries = 0; tries < 200; tries++) {
    const x = randInt(1, map.width - 2);
    const y = randInt(1, map.height - 2);
    if (Game.isDoorReady(x, y, map)) return [x, y];
  }
  return null;
};

Game.isDoorReady = function (x, y, map) {
  const left = map.Tiles[x - 1][y].Blocked;
  const right = map.Tiles[x + 1][y].Blocked;
  const up = map.Tiles[x][y - 1].Blocked;
  const down = map.Tiles[x][y + 1].Blocked;
  return (left && right && !up && !down) || (up && down && !left && !right);
};

Game.findTile = function (level, predicate) {
  const map = Game.map[level];
  for (let x = 0; x < map.width; x++) {
    for (let y = 0; y < map.height; y++) {
      if (predicate(map.Tiles[x][y])) return [x, y];
    }
  }
};

Game.getStairup = (level) => Game.findTile(level, (t) => t.Stairup);
Game.getStairdown = (level) => Game.findTile(level, (t) => t.Stairdown);

Game.generateMap = function (level) {
  const width = randInt(25, 45);
  const height = randInt(15, 25);
  const terrain = ROT.RNG.getItem(terrains);
  Game.map[level] = new Game.GameMap(width, height, terrain, level);
};

Game.clearTiles = function () {
  for (let x = 0; x < this.screenWidth; x++) {
    for (let y = 0; y < this.screenHeight; y++) {
      Game.mainDisplay.draw(x, y, '', 'black');
    }
  }
};

Game.drawTile = function (x, y, level, color) {
  const [xco, yco] = Game.getCamera(x, y);
  if (xco < 0 || xco >= Game.screenWidth || yco < 0 || yco >= Game.screenHeight) {
    return;
  }
  const tile = Game.map[level].Tiles[x][y];
  if (tile.items[0]) {
    Game.mainDisplay.draw(xco, yco, [tile.Symbol, tile.items[0].symbol], ['#0000', color]);
  } else {
    Game.mainDisplay.draw(xco, yco, tile.Symbol, color);
  }
  tile.Color = color;
};

Game.drawMap = function () {
  Game.clearTiles();
  const player = Game.entity[0];
  const level = player.depth;
  const map = Game.map[level];

  for (let x = 0; x < map.width; x++) {
    for (let y = 0; y < map.height; y++) {
      const tile = map.Tiles[x][y];
      Game.drawTile(x, y, level, tile.Visited ? '#0009' : '#000f');
      tile.Visible = false;
    }
  }

  fov.compute(player.x, player.y, player.vision, (x, y, r) => {
    Game.drawTile(x, y, level, '#000' + Math.min(9, r));
    map.Tiles[x][y].Visited = true;
    map.Tiles[x][y].Visible = true;
  });
};

const computeAxisCamera = (coord, playerCoord, mapSize, screenSize) => {
  if (mapSize <= screenSize) {
    return Math.floor((screenSize - mapSize) / 2) + coord;
  }
  const half = Math.round(screenSize / 2);
  let offset = 0;
  if (half - playerCoord - 1 > 0) {
    offset = playerCoord - half + 1;
  }
  if (mapSize - playerCoord - 1 < half) {
    offset = playerCoord + half - mapSize;
  }
  return half + coord - playerCoord - 1 + offset;
};

Game.getCamera = function (x, y) {
  const player = Game.entity[0];
  const map = Game.map[player.depth];
  return [
    computeAxisCamera(x, player.x, map.width, this.screenWidth),
    computeAxisCamera(y, player.y, map.height, this.screenHeight)
  ];
};
