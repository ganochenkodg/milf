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
    this.trap = null;
    this.items = [];
  }
};

const randomMagicTrap = () =>
  ROT.RNG.getWeightedValue({
    trapred: 30,
    trapgreen: 20,
    trapblue: 20,
    trapviolet: 30
  });

const withRare = (fn) => {
  const [prevMob, prevItem] = [rareMobChance, rareItemChance];
  rareMobChance = 1;
  rareItemChance = 1;
  try {
    return fn();
  } finally {
    rareMobChance = prevMob;
    rareItemChance = prevItem;
  }
};

const pickItemWhere = (minLvl, maxLvl, pred, fallbackKey = 'ironsword') => {
  for (let i = 0; i < 60; i++) {
    const item = Game.ItemRepository.createRandom(minLvl, maxLvl);
    if (pred(item)) return item;
  }
  return Game.ItemRepository.create(fallbackKey, maxLvl);
};

const BIOME_EVENT_WEIGHTS = {
  dungeon: { warehouse: 3, crypt: 3, armory: 4, library: 2, traps: 4, ambush: 2, giants: 2 },
  stone: { garden: 4, warehouse: 4, crypt: 2, armory: 2, traps: 2, ambush: 2, hive: 2, giants: 5 },
  maze: { garden: 1, library: 5, traps: 5, ambush: 2, hive: 4 },
  swamp: { garden: 5, ambush: 2, hive: 6, bloodfeast: 4 },
  bricks: { warehouse: 5, armory: 5, library: 4, traps: 2, ambush: 2, bloodfeast: 2 },
  skulls: { crypt: 6, ambush: 2, giants: 4, bloodfeast: 6 }
};

Game.GameMap = class GameMap {
  constructor(width, height, terrain, level) {
    this.width = width;
    this.height = height;
    this.pietyMultiplier = 1;
    this.event = null;
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

    let upPos = null;
    if (level > 1) {
      upPos = Game.returnFree(this);
      this.Tiles[upPos[0]][upPos[1]].Symbol = `${terrain}stairup`;
      this.Tiles[upPos[0]][upPos[1]].Stairup = true;
    }

    let freeCount = 0;
    for (let x = 1; x < width - 1; x++) {
      for (let y = 1; y < height - 1; y++) {
        if (!this.Tiles[x][y].Blocked && !this.Tiles[x][y].Mob) freeCount++;
      }
    }

    const maxMon = Math.min(Math.floor(freeCount * 0.35), roll(level) * 2 + 10);
    for (let i = 0; i < maxMon; i++) {
      this.spawnEntity(Game.EntityRepository.createRandom(level, level + 2), level, 'gray');
    }

    if ((level + 2) % 10 === 0) {
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

    this.addTraps(randInt(1, 3), () => 'trapspikes');
    this.addTraps(randInt(1, 3), randomMagicTrap);

    if (level % 5 === 0) {
      this.applyMiniEvent(terrain, level, upPos || [downX, downY]);
    }
  }

  addTraps(count, typeFn) {
    for (let i = 0; i < count; i++) {
      const [tx, ty] = Game.returnFree(this);
      this.Tiles[tx][ty].trap = { type: typeFn(), revealed: false };
    }
  }

  spawnContainer(name, level, pos) {
    const c = Game.EntityRepository.create('container', level);
    c.name = c.symbol = name;
    this.spawnEntity(c, level, 'gray', pos);
  }

  spawnMobs(count, keyOrPool, level, mobLvl = level, color = 'gray', rare = false) {
    for (let i = 0; i < count; i++) {
      const key = Array.isArray(keyOrPool) ? ROT.RNG.getItem(keyOrPool) : keyOrPool;
      const mob = rare
        ? withRare(() => Game.EntityRepository.create(key, mobLvl))
        : Game.EntityRepository.create(key, mobLvl);
      this.spawnEntity(mob, level, color);
    }
  }

  getClusterTiles() {
    let best = [];
    for (let x = 2; x < this.width - 2; x++) {
      for (let y = 2; y < this.height - 2; y++) {
        const tiles = [];
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            const t = this.Tiles[x + dx][y + dy];
            if (!t.Blocked && !t.Mob && !t.Stairup && !t.Stairdown && !t.trap) {
              tiles.push([x + dx, y + dy]);
            }
          }
        }
        if (
          tiles.length > best.length ||
          (tiles.length === best.length && Math.random() < 0.25)
        ) {
          best = tiles;
        }
      }
    }
    return best.length > 0 ? best : [Game.returnFree(this)];
  }

  applyMiniEvent(terrain, level, entryPos) {
    const weights = BIOME_EVENT_WEIGHTS[terrain] || BIOME_EVENT_WEIGHTS.dungeon;
    const event = ROT.RNG.getWeightedValue(weights);
    this.event = event;
    const cluster = this.getClusterTiles();
    const isGear = (it) => it.type === 'weapon' || it.type === 'armor';
    const isNonPotion = (it) => it.type !== 'potion';
    const healPotionKey = (l) =>
      l >= 20 ? 'largehealingpotion' : l >= 10 ? 'mediumhealingpotion' : 'smallhealingpotion';
    const growthPotionKey = (l) =>
      l >= 20 ? 'largegrowthpotion' : l >= 12 ? 'mediumgrowthpotion' : 'smallgrowthpotion';

    switch (event) {
      case 'garden': {
        for (const [cx, cy] of cluster) {
          const food =
            Math.random() < 0.4
              ? Game.FoodRepository.create('mysticalmushroom', level)
              : Game.FoodRepository.createRandom(level, level + 2);
          this.Tiles[cx][cy].items.push(food);
        }
        this.spawnMobs(randInt(4, 6), 'snake', level);
        if (level >= 10) this.spawnMobs(1, 'weird', level);
        Game.messageBox.sendMessage(
          '%c{yellowgreen}Mini-Event: You found an overgrown mushroom garden crawling with snakes!%c{}'
        );
        break;
      }
      case 'warehouse': {
        for (const pos of cluster) {
          this.spawnContainer('barrel', level, pos);
        }
        const extra = randInt(6, 10);
        for (let i = 0; i < extra; i++) {
          if (Math.random() < 0.5) {
            const rat = Game.EntityRepository.create('monsters720', level);
            rat.name = rat.symbol = 'giant rat';
            this.spawnEntity(rat, level, 'gray');
          } else {
            this.spawnMobs(1, 'insects', level);
          }
        }
        Game.messageBox.sendMessage(
          '%c{tan}Mini-Event: An abandoned barrel warehouse infested with rats and insects!%c{}'
        );
        break;
      }
      case 'crypt': {
        for (const pos of cluster) {
          this.spawnContainer(ROT.RNG.getItem(['coffin', 'crypt']), level, pos);
        }
        const pool =
          level >= 18
            ? ['skeleton', 'zombie', 'ghoul', 'lich', 'darkknight']
            : ['skeleton', 'zombie', 'ghoul'];
        this.spawnMobs(randInt(6, 8), pool, level);
        Game.messageBox.sendMessage(
          '%c{silver}Mini-Event: An ancient crypt! Coffins and restless undead fill the floor.%c{}'
        );
        break;
      }
      case 'armory': {
        const gearCount = randInt(5, 7);
        for (let i = 0; i < gearCount; i++) {
          const [cx, cy] = cluster[i % cluster.length];
          const item =
            Math.random() < 0.25
              ? Game.ItemRepository.create(
                  ROT.RNG.getItem(['elementalsword', 'elementalstaff']),
                  level + 1
                )
              : pickItemWhere(level, level + 3, isGear);
          this.Tiles[cx][cy].items.push(item);
        }
        const guardKey =
          level >= 18 ? 'darkknight' : level >= 8 ? 'goblinwarrior' : 'littlegoblinwarrior';
        this.spawnMobs(randInt(3, 4), guardKey, level, level + 1, 'lightsalmon', true);
        Game.messageBox.sendMessage(
          '%c{coral}Mini-Event: A forgotten armory guarded by elite warriors!%c{}'
        );
        break;
      }
      case 'library': {
        const bookCount = randInt(5, 7);
        for (let i = 0; i < bookCount; i++) {
          const [cx, cy] = cluster[i % cluster.length];
          this.Tiles[cx][cy].items.push(
            pickItemWhere(level, level + 3, (it) => it.type === 'book', 'bookofarrows')
          );
        }
        this.addTraps(4, randomMagicTrap);
        const mageKey =
          level >= 16 ? 'lich' : level >= 7 ? 'goblinwizard' : 'littlegoblinwizard';
        this.spawnMobs(3, mageKey, level, level + 1);
        Game.messageBox.sendMessage(
          '%c{turquoise}Mini-Event: An arcane library of spellbooks guarded by mages!%c{}'
        );
        break;
      }
      case 'traps': {
        const [cx, cy] = cluster[0];
        for (let i = 0; i < 3; i++) {
          this.Tiles[cx][cy].items.push(
            withRare(() => pickItemWhere(level + 2, level + 4, isNonPotion))
          );
        }
        const anyTrap = () => (Math.random() < 0.5 ? 'trapspikes' : randomMagicTrap());
        for (let i = 1; i < cluster.length; i++) {
          const [tx, ty] = cluster[i];
          this.Tiles[tx][ty].trap = { type: anyTrap(), revealed: false };
        }
        this.addTraps(randInt(8, 10), anyTrap);
        Game.messageBox.sendMessage(
          '%c{orange}Mini-Event: Trap Gauntlet! Watch your step around the treasure cache.%c{}'
        );
        break;
      }
      case 'ambush': {
        const lootCount = randInt(6, 8);
        for (let i = 0; i < lootCount; i++) {
          const [lx, ly] = Game.returnFree(this);
          this.Tiles[lx][ly].items.push(
            withRare(() => pickItemWhere(level + 1, level + 4, isNonPotion))
          );
        }
        const bossPool =
          level >= 18
            ? ['darkknight', 'lich', 'ettin', 'troll', 'weird']
            : level >= 10
              ? ['goblinwarrior', 'goblinwizard', 'skeleton', 'zombie', 'ghoul', 'weird']
              : ['littlegoblinwarrior', 'littlegoblinwizard', 'snake'];
        const bossCount = randInt(3, 4);
        for (let i = 0; i < bossCount; i++) {
          const boss = withRare(() =>
            Game.EntityRepository.create(ROT.RNG.getItem(bossPool), level + 1)
          );
          this.spawnEntity(boss, level, 'lightsalmon');
          boss.state = 'hunt';
          boss.targetPos = [...entryPos];
        }
        Game.messageBox.sendMessage(
          '%c{crimson}Mini-Event: Champion Ambush! Elite bosses are hunting you across the floor!%c{}'
        );
        break;
      }
      case 'hive': {
        const potCount = randInt(3, 4);
        for (let i = 0; i < potCount; i++) {
          const [cx, cy] = cluster[i % cluster.length];
          this.Tiles[cx][cy].items.push(
            Game.ItemRepository.create(growthPotionKey(level), level + 2)
          );
        }
        this.addTraps(5, () => 'trapgreen');
        this.spawnMobs(randInt(6, 9), ['insects', 'snake'], level);
        Game.messageBox.sendMessage(
          '%c{limegreen}Mini-Event: A venomous hive! Growth potions lie amidst poison traps and swarms.%c{}'
        );
        break;
      }
      case 'giants': {
        const gearCount = randInt(3, 4);
        for (let i = 0; i < gearCount; i++) {
          const [cx, cy] = cluster[i % cluster.length];
          this.Tiles[cx][cy].items.push(pickItemWhere(level + 3, level + 6, isGear));
        }
        const potCount = randInt(3, 4);
        for (let i = 0; i < potCount; i++) {
          const [cx, cy] = cluster[(i + gearCount) % cluster.length];
          const potLvl = randInt(level + 10, level + 15);
          this.Tiles[cx][cy].items.push(
            withRare(() => Game.ItemRepository.create(healPotionKey(potLvl), potLvl))
          );
        }
        const giantPool =
          level >= 22 ? ['ettin', 'twoheadedettin', 'troll'] : ['ettin', 'troll'];
        const giants = randInt(3, 5);
        for (let i = 0; i < giants; i++) {
          const giant = Game.EntityRepository.create(ROT.RNG.getItem(giantPool), level + 1);
          giant.con += 8;
          giant.maxHp = 15 + giant.con * 6 + giant.str * 3;
          giant.hp = giant.maxHp;
          this.spawnEntity(giant, level, 'gray');
        }
        Game.messageBox.sendMessage(
          "%c{gold}Mini-Event: Giants' Pit! High-level gear and rare potent elixirs await.%c{}"
        );
        break;
      }
      case 'bloodfeast': {
        this.pietyMultiplier = 2;
        const [cx, cy] = cluster[0];
        for (let i = 0; i < 2; i++) {
          this.Tiles[cx][cy].items.push(
            withRare(() => pickItemWhere(level + 1, level + 3, isNonPotion))
          );
        }
        const potLvl = level + 5;
        this.Tiles[cx][cy].items.push(
          withRare(() => Game.ItemRepository.create(healPotionKey(potLvl), potLvl))
        );
        for (let i = 1; i < cluster.length; i++) {
          const [tx, ty] = cluster[i];
          this.Tiles[tx][ty].trap = { type: 'trapspikes', revealed: false };
        }
        const pool = level >= 16 ? ['ghoul', 'lich', 'darkknight'] : ['ghoul', 'zombie'];
        this.spawnMobs(randInt(5, 7), pool, level);
        Game.messageBox.sendMessage(
          '%c{crimson}Mini-Event: Blood Altar! All kills on this floor grant +100% piety!%c{}'
        );
        break;
      }
    }
  }

  spawnEntity(entity, level, levelColor, pos) {
    const [x, y] = pos || Game.returnFree(this);
    entity.x = x;
    entity.y = y;
    entity.depth = level;
    if ('Actor' in entity.acts) {
      entity.name += `%c{${levelColor}} (${entity.level})%c{}`;
      scheduler.add(entity, true);
    }
    this.Tiles[x][y].Mob = true;
    Game.entity.push(entity);
    return entity;
  }
};

Game.returnFree = function (map) {
  for (let tries = 0; tries < 200; tries++) {
    const x = randInt(1, map.width - 2);
    const y = randInt(1, map.height - 2);
    const t = map.Tiles[x][y];
    if (!t.Blocked && !t.Mob && !t.Stairdown && !t.Stairup && !t.trap) {
      return [x, y];
    }
  }
  for (let x = 1; x < map.width - 1; x++) {
    for (let y = 1; y < map.height - 1; y++) {
      const t = map.Tiles[x][y];
      if (!t.Blocked && !t.Mob && !t.Stairdown && !t.Stairup && !t.trap) {
        return [x, y];
      }
    }
  }
  for (let x = 1; x < map.width - 1; x++) {
    for (let y = 1; y < map.height - 1; y++) {
      const t = map.Tiles[x][y];
      if (!t.Blocked && !t.Stairdown && !t.Stairup) return [x, y];
    }
  }
  return [1, 1];
};

const TRAP_META = {
  trapspikes: ['stepped on %c{silver}spikes', 'red'],
  trapred: ['triggered a %c{red}fire trap', 'red'],
  trapgreen: ['triggered a %c{limegreen}poison trap', 'limegreen'],
  trapblue: ['triggered an %c{aqua}ice trap', 'aqua']
};

Game.triggerTrap = function (actor) {
  const level = actor.depth;
  const map = Game.map[level];
  const tile = map.Tiles[actor.x][actor.y];
  const trap = tile.trap;
  if (!trap) return;
  if (!actor.player && actor.state !== 'hunt' && actor.state !== 'panic') return;

  const trapX = actor.x;
  const trapY = actor.y;
  trap.revealed = true;

  const actorIdx = Game.entity.indexOf(actor);
  if (actorIdx === -1) return;

  const expectedHp = 75 + level * 18;
  const dmg = randInt(Math.floor(expectedHp * 0.2), Math.ceil(expectedHp * 0.3));
  const showMsg = actor.player || tile.Visible;
  const subj = actor.player ? 'You' : `The ${actor.name}`;

  if (trap.type === 'trapviolet') {
    if (!actor.player) map.Tiles[actor.x][actor.y].Mob = false;
    [actor.x, actor.y] = Game.returnFree(map);
    if (!actor.player) map.Tiles[actor.x][actor.y].Mob = true;
    if (showMsg || map.Tiles[actor.x][actor.y].Visible) {
      Game.messageBox.sendMessage(
        `${subj} triggered a %c{violet}teleport trap%c{} and vanished!`
      );
    }
  } else {
    const hitDmg = trap.type === 'trapgreen' ? Math.max(1, Math.floor(dmg * 0.5)) : dmg;
    actor.hp -= hitDmg;
    if (!actor.player) actor.onDamaged();
    if (showMsg) {
      const [verb, col] = TRAP_META[trap.type];
      Game.messageBox.sendMessage(
        `${subj} ${verb}%c{} for %c{${col}}${hitDmg}%c{} damage!`
      );
    }
    if (actor.hp >= 1 && trap.type !== 'trapspikes') {
      const affect =
        trap.type === 'trapred'
          ? { confuse: true, duration: 2, symbol: 'confuse' }
          : trap.type === 'trapblue'
            ? { freeze: true, duration: 2, symbol: 'freeze' }
            : { poison: Math.max(4, Math.floor(dmg * 0.35)), duration: 3, symbol: 'poison' };
      Game.addAffect(actorIdx, affect);
    }
  }

  if (trap.type !== 'trapspikes') {
    const player = Game.entity[0];
    for (const e of Game.entity) {
      if (e.player || e.depth !== level || !e.acts || !('Actor' in e.acts) || e.hp < 1) {
        continue;
      }
      if (
        Math.max(Math.abs(e.x - trapX), Math.abs(e.y - trapY)) <= 12 &&
        Math.random() < 0.5
      ) {
        if (e.state !== 'panic') e.state = 'hunt';
        e.targetPos = [player.x, player.y];
        e.wanderPath = null;
      }
    }
  }

  if (!actor.player) actor.doDie();
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
  const symbols = [tile.Symbol];
  const colors = ['#0000'];
  if (tile.trap?.revealed) {
    symbols.push(tile.trap.type);
    colors.push('#0000');
  }
  if (tile.items[0]) {
    symbols.push(tile.items[0].symbol);
    colors.push('#0000');
  }
  colors[colors.length - 1] = color;
  Game.mainDisplay.draw(
    xco,
    yco,
    symbols.length === 1 ? symbols[0] : symbols,
    colors.length === 1 ? colors[0] : colors
  );
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
