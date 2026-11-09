'use strict';

class Entity {
  constructor(properties = {}) {
    this.x = properties.x || 0;
    this.y = properties.y || 0;
    this.player = false;
    this.depth = properties.depth || 1;
    this.level = properties.level || 1;
    this.name = properties.name || 'npc';
    this.maxLvl = properties.maxLvl || 1;
    this.minLvl = properties.minLvl || 1;
    this.acts = properties.acts || {};
    this.str = properties.str || 1;
    this.agi = properties.agi || 1;
    this.int = properties.int || 1;
    this.con = properties.con || 1;
    this.skills = properties.skills || [];
    this.vision = properties.vision || 5;
    this.speed = properties.speed || 100;
    this.symbol = properties.symbol || 'wolf';
    this.deadMessage = properties.deadMessage || ' dies.';
    this.maxHp = 15 + this.con * 6 + this.str * 3;
    this.hp = this.maxHp;
    this.maxMana = 10 + this.int * 8;
    this.mana = this.maxMana;
    this.color = '#0000';
    this.confuse = false;
    this.stun = false;
    this.frozen = false;
    this.maxAtk = properties.maxAtk || 4;
    this.minAtk = properties.minAtk || Math.max(1, Math.floor(this.maxAtk * 0.35));
    this.defense =
      (properties.defense || 0) +
        Math.floor(this.level * 0.6) +
        Math.floor((this.agi + this.con) * 0.25) || 1;
    this.affects = [];
    this.state = 'idle';
    this.targetPos = null;
    this.wanderPath = null;
  }

  getSpeed() {
    return this.speed + this.agi * 0.5;
  }

  getMinAtk() {
    return Math.floor(this.minAtk * (1 + this.str * 0.05));
  }

  getMaxAtk() {
    return Math.floor(this.maxAtk * (1 + this.str * 0.05));
  }

  act() {
    this.doDie();
    if (this.stun || this.depth !== Game.entity[0].depth) return;
    if ('Actor' in this.acts) {
      this.doHunt();
    }
  }

  doDie() {
    if (this.hp >= 1) return;

    const level = this.depth;
    const tile = Game.map[level].Tiles[this.x][this.y];
    Game.messageBox.sendMessage(`The ${this.name}${this.deadMessage}`);

    if ('Actor' in this.acts) {
      const pietyMult = Game.map[level].pietyMultiplier || 1;
      Game.entity[0].piety +=
        (1 + roll(this.level) + Math.floor(Math.pow(1.8, this.level))) * pietyMult;
      if (this.name.startsWith('%c{lightsalmon}rare')) {
        tile.items.push(Game.ItemRepository.createRandom(this.level, this.level + 2));
      }
      if (this.name.startsWith('%c{mediumaquamarine}fleshlord')) {
        tile.items.push(Game.FoodRepository.create('heartoffleshlord', this.level));
      }
      scheduler.remove(this);
      tile.Mob = false;
    } else if (Math.random() < 0.3) {
      const tempEntity = Game.EntityRepository.create(
        ROT.RNG.getItem(['insects', 'snake', 'zombie', 'skeleton', 'ghoul']),
        this.level
      );
      Game.map[level].spawnEntity(tempEntity, this.depth, 'gray', [this.x, this.y]);
      Game.messageBox.sendMessage(
        `The ${tempEntity.name} appears from the ${this.name}.`
      );
    } else {
      tile.Mob = false;
      if (Math.random() < 0.7) {
        tile.items.push(Game.ItemRepository.createRandom(this.level, this.level + 2));
      }
    }

    const idx = Game.entity.indexOf(this);
    if (idx !== -1) {
      Game.entity.splice(idx, 1);
    }
    Game.drawAll();
  }

  doAttack(targetNum) {
    let dmg = randInt(this.getMinAtk(), this.getMaxAtk());
    let color = '%c{}';
    if (Math.random() < 0.05) {
      dmg *= 2;
      color = '%c{lime}';
    }

    if (this.confuse && Math.random() > 0.5) {
      const [dx, dy] = ROT.DIRS[8][roll(8)];
      const newx = this.x + dx;
      const newy = this.y + dy;
      const victim = Game.entity.find(
        (e) => e.x === newx && e.y === newy && e.depth === this.depth
      );
      if (victim) {
        const result = victim.doGetDamage(dmg);
        Game.messageBox.sendMessage(
          `The ${this.name} accidentally hits ${victim.player ? 'you' : `the ${victim.name}`} for ${color}${result}%c{} damage.`
        );
        Game.checkShields(this, victim, 'physical', result);
        victim.doDie();
      }
    } else {
      const target = Game.entity[targetNum];
      const result = target.doGetDamage(dmg);
      Game.messageBox.sendMessage(
        `The ${this.name} hits ${targetNum === 0 ? 'you' : `the ${target.name}`} for ${color}${result}%c{} damage.`
      );
      Game.checkShields(this, target, 'physical', result);
      target.doDie();
    }
    Game.drawAll();
  }

  doGetDamage(dmg, cap = 0.9) {
    const actual = Math.max(1, Math.floor(dmg * (1 - Math.min(cap, this.defense / dmg))));
    this.hp -= actual;
    this.onDamaged();
    return actual;
  }

  doGetSkillDamage(dmg) {
    return this.doGetDamage(dmg, 0.6);
  }

  onDamaged() {
    if (this.hp < 1 || !('Actor' in this.acts) || !Game.entity[0]) return;
    const isFleshlord = this.name.startsWith('%c{mediumaquamarine}fleshlord');
    if (!isFleshlord && this.hp * 4 < this.maxHp) {
      if (this.state !== 'panic') {
        this.state = 'panic';
        this.targetPos = null;
        this.wanderPath = null;
        if (Game.map[this.depth].Tiles[this.x][this.y].Visible) {
          Game.messageBox.sendMessage(
            `The ${this.name} %c{khaki}panics%c{} and tries to flee!`
          );
        }
      }
      return;
    }
    this.state = 'hunt';
    this.targetPos = [Game.entity[0].x, Game.entity[0].y];
    this.wanderPath = null;
  }

  fleeFrom(px, py) {
    let bestStep = null;
    let bestDist = Math.max(Math.abs(px - this.x), Math.abs(py - this.y));
    for (const [dx, dy] of ROT.DIRS[8]) {
      const nx = this.x + dx;
      const ny = this.y + dy;
      if (!mobPasses(nx, ny) || (nx === px && ny === py)) continue;
      const d = Math.max(Math.abs(px - nx), Math.abs(py - ny));
      if (d > bestDist) {
        bestDist = d;
        bestStep = [nx, ny];
      }
    }
    if (bestStep) {
      this.move(bestStep[0], bestStep[1]);
      return true;
    }
    return false;
  }

  stepTowards(tx, ty, maxRange) {
    const level = this.depth;
    const dist = Math.max(Math.abs(tx - this.x), Math.abs(ty - this.y));
    const path = [];
    Game.map[level].Tiles[this.x][this.y].Mob = false;
    new ROT.Path.AStar(tx, ty, mobPasses, { topology: 8 }).compute(
      this.x,
      this.y,
      (px, py) => path.push([px, py])
    );
    if (path.length === 0 || (maxRange && path.length - 1 > maxRange)) {
      path.length = 0;
      new ROT.Path.AStar(tx, ty, terrainPasses, { topology: 8 }).compute(
        this.x,
        this.y,
        (px, py) => path.push([px, py])
      );
    }
    Game.map[level].Tiles[this.x][this.y].Mob = true;
    path.shift();

    if (path.length === 0 || (maxRange && path.length > maxRange)) {
      return false;
    }

    const [nextX, nextY] = path[0];
    if (Game.map[level].Tiles[nextX][nextY].Mob) {
      const step = ROT.DIRS[8]
        .map(([dx, dy]) => [this.x + dx, this.y + dy])
        .find(
          ([nx, ny]) =>
            mobPasses(nx, ny) &&
            !(nx === Game.entity[0].x && ny === Game.entity[0].y) &&
            Math.max(Math.abs(tx - nx), Math.abs(ty - ny)) < dist
        );
      if (step) {
        this.move(step[0], step[1]);
        return true;
      }
      return false;
    }

    this.move(nextX, nextY);
    return true;
  }

  doHunt() {
    if (this.hp < 1) return;

    const level = this.depth;
    const enemyMap = {};
    fov.compute(this.x, this.y, this.vision, (x, y, r) => {
      enemyMap[`${x},${y}`] = r;
    });

    const player = Game.entity[0];
    const x = player.x;
    const y = player.y;
    const key = `${x},${y}`;
    const canSee = key in enemyMap && enemyMap[key] < this.vision + 1;
    const isFleshlord = this.name.startsWith('%c{mediumaquamarine}fleshlord');
    const dist = Math.max(Math.abs(x - this.x), Math.abs(y - this.y));

    if (this.state === 'panic' && this.hp * 4 >= this.maxHp) {
      this.state = canSee ? 'hunt' : 'idle';
    }

    if (this.state === 'panic') {
      if (!canSee) {
        this.doWander();
        return;
      }
      if ('Skills' in this.acts) {
        const escapeSkill = this.skills.find(
          (s) => s.type === 'support' && this.mana >= s.options.cost
        );
        if (escapeSkill) {
          this.doSkills(0, escapeSkill);
          return;
        }
      }
      if (this.fleeFrom(x, y)) return;
      if (dist === 1) this.doAttack(0);
      return;
    }

    if (canSee || isFleshlord) {
      this.state = 'hunt';
      this.targetPos = [x, y];
      this.wanderPath = null;
    } else if (this.state === 'hunt' && this.targetPos) {
      const [tx, ty] = this.targetPos;
      if (this.x === tx && this.y === ty) {
        this.state = 'idle';
        this.targetPos = null;
        this.doWander();
        return;
      }
      if (this.confuse && Math.random() > 0.5) {
        const [dx, dy] = ROT.DIRS[8][roll(8)];
        this.move(this.x + dx, this.y + dy);
        return;
      }
      if (!this.stepTowards(tx, ty)) {
        this.state = 'idle';
        this.targetPos = null;
      }
      return;
    } else {
      this.doWander();
      return;
    }

    if ('Skills' in this.acts && Math.random() > 0.2) {
      let clearShot = canSee;
      if (canSee && dist > 1) {
        const losPath = [];
        new ROT.Path.AStar(x, y, lightPasses, { topology: 8 }).compute(
          this.x,
          this.y,
          (px, py) => losPath.push([px, py])
        );
        for (let i = 1; i < losPath.length - 1; i++) {
          if (Game.map[level].Tiles[losPath[i][0]][losPath[i][1]].Mob) {
            clearShot = false;
            break;
          }
        }
      }

      const usable = this.skills.filter((s) => {
        if (this.mana < s.options.cost) return false;
        if (s.type === 'support') {
          if ('heal' in s.options) return this.hp * 2 < this.maxHp;
          if ('distance' in s.options) return this.hp * 3 < this.maxHp && dist <= 2;
          return false;
        }
        if (s.type === 'chant') {
          return !Game.isAffectApplied(this, s)[0] && (canSee || dist <= this.vision);
        }
        if (s.type === 'damage') {
          return canSee && dist <= s.options.range && (clearShot || s.options.radius > 0);
        }
        return false;
      });

      if (usable.length > 0) {
        const chosen = usable.find((s) => s.type === 'support') || ROT.RNG.getItem(usable);
        this.doSkills(0, chosen);
        return;
      }
    }

    if (dist === 1) {
      this.doAttack(0);
      return;
    }

    if (this.confuse && Math.random() > 0.5) {
      const [dx, dy] = ROT.DIRS[8][roll(8)];
      this.move(this.x + dx, this.y + dy);
      return;
    }

    this.stepTowards(x, y, isFleshlord ? 0 : this.vision * 2);
  }

  doWander() {
    if (this.confuse && Math.random() > 0.5) {
      const [dx, dy] = ROT.DIRS[8][roll(8)];
      this.move(this.x + dx, this.y + dy);
      return;
    }

    const map = Game.map[this.depth];
    if (!this.wanderPath || this.wanderPath.length === 0) {
      this.state = 'idle';
      this.targetPos = null;
      if (Math.random() > 0.35) return;

      let tx = null;
      let ty = null;
      if (Math.random() < 0.03) {
        tx = Game.entity[0].x;
        ty = Game.entity[0].y;
      } else {
        for (let tries = 0; tries < 10; tries++) {
          const cx = this.x + randInt(-6, 6);
          const cy = this.y + randInt(-6, 6);
          if ((cx !== this.x || cy !== this.y) && terrainPasses(cx, cy)) {
            tx = cx;
            ty = cy;
            break;
          }
        }
      }
      if (tx === null) return;

      const path = [];
      new ROT.Path.AStar(tx, ty, terrainPasses, { topology: 8 }).compute(
        this.x,
        this.y,
        (px, py) => path.push([px, py])
      );
      path.shift();
      if (path.length === 0) return;
      this.state = 'wander';
      this.targetPos = [tx, ty];
      this.wanderPath = path;
    }

    if (this.wanderPath && this.wanderPath.length > 0) {
      const [nx, ny] = this.wanderPath[0];
      const wasDoor = map.Tiles[nx][ny].Door;
      this.move(nx, ny);
      if (this.x === nx && this.y === ny) {
        this.wanderPath.shift();
        if (this.wanderPath.length === 0) {
          this.state = 'idle';
          this.targetPos = null;
        }
      } else if (!wasDoor || map.Tiles[nx][ny].Door) {
        this.state = 'idle';
        this.targetPos = null;
        this.wanderPath = null;
      }
    }
  }

  doSkills(targetNum, skill) {
    if (skill.target === 'range') {
      const target = Game.entity[targetNum];
      Game.useSkill(this, skill, target.x, target.y);
    } else if (skill.target === 'self') {
      Game.useSkill(this, skill, this.x, this.y);
    }
  }

  move(newx, newy) {
    if (this.frozen) return;
    const map = Game.map[this.depth];
    if (newx <= 0 || newx >= map.width - 1 || newy <= 0 || newy >= map.height - 1) {
      return;
    }
    if (newx === Game.entity[0].x && newy === Game.entity[0].y) {
      return;
    }
    const tile = map.Tiles[newx][newy];
    if (tile.Mob) return;
    if (tile.Blocked) {
      if (tile.Door) {
        tile.Door = false;
        tile.Symbol = tile.Symbol.replace('close', 'open');
        tile.Blocked = false;
        tile.BlocksSight = false;
      }
      return;
    }
    map.Tiles[this.x][this.y].Mob = false;
    this.x = newx;
    this.y = newy;
    tile.Mob = true;
    Game.triggerTrap(this);
  }

  Draw() {
    if (this.depth !== Game.entity[0].depth) return;
    const tile = Game.map[this.depth].Tiles[this.x][this.y];
    if (!tile.Visible) return;

    const hpbar = Math.max(1, Math.min(8, Math.floor((this.hp * 8) / this.maxHp)));
    const [camX, camY] = Game.getCamera(this.x, this.y);
    const trap = tile.trap?.revealed ? [tile.trap.type] : [];
    const symbols = [tile.Symbol, ...trap, this.symbol, `hp${hpbar}`];
    const colors = [tile.Color, ...trap.map(() => '#0000'), this.color, '#0000'];
    Game.mainDisplay.draw(
      camX,
      camY,
      symbols,
      colors,
      symbols.map(() => 'transparent')
    );
  }
}

function terrainPasses(x, y) {
  const map = Game.map[Game.entity[0].depth];
  if (x > 0 && x < map.width && y > 0 && y < map.height) {
    const tile = map.Tiles[x][y];
    return !tile.Blocked || tile.Door;
  }
  return false;
}

function mobPasses(x, y) {
  return terrainPasses(x, y) && !Game.map[Game.entity[0].depth].Tiles[x][y].Mob;
}

Game.drawEntities = function () {
  Game.entity.forEach((entity) => entity.Draw());
};

Game.EntityRepository = new Game.Repository('entities', Entity);

function pickFrom(value) {
  return Array.isArray(value) ? ROT.RNG.getItem(value) : value;
}

const ENTITY_DEFS = {
  dogs: {
    minLvl: 1, maxLvl: 10,
    names: ['dog', 'puppy', 'hyena', 'fox', 'jackal', 'coyote', 'wolf'],
    acts: { Actor: true },
    stats: (l) => ({
      str: 1 + roll(l * 2),
      agi: 1 + roll(l),
      int: 1 + roll(l),
      con: 1 + roll(l),
      maxAtk: 2 + roll(l * 2)
    })
  },
  container: {
    minLvl: 1, maxLvl: 50,
    names: ['chest', 'barrel', 'coffin', 'crypt'],
    deadMessage: ' is destroyed.',
    stats: (l) => ({ con: 10 + roll(l / 2) })
  },
  cats: {
    minLvl: 3, maxLvl: 13, vision: 6, defense: 2,
    names: ['cat', 'bobcat', 'cougar', 'cheetah', 'lynx', 'ocelot', 'male lion', 'female lion'],
    acts: { Actor: true },
    stats: (l) => ({
      str: 2 + roll(l),
      agi: 4 + roll(l * 2),
      int: 1 + roll(l),
      con: 2 + roll(l),
      maxAtk: 4 + roll(l * 2)
    })
  },
  insects: {
    minLvl: 5, maxLvl: 16, vision: 5, defense: 5,
    names: [
      'giant centipede', 'lampreymander', 'giant earthworm',
      'giant ant', 'lesser giant ant', 'giant spider', 'lesser giant spider'
    ],
    acts: { Actor: true },
    stats: (l) => ({
      str: 2 + roll(l),
      agi: 4 + roll(l * 2),
      int: 1 + roll(l),
      con: 2 + roll(l),
      maxAtk: 6 + roll(l * 2)
    })
  },
  monsters720: {
    minLvl: 7, maxLvl: 20, vision: 6, defense: 8,
    names: ['manticore', 'lycanthrope', 'giant bat', 'giant rat', 'warg'],
    acts: { Actor: true },
    stats: (l) => ({
      str: 3 + roll(l * 2),
      agi: 2 + roll(l),
      int: 1 + roll(l),
      con: 2 + roll(l),
      maxAtk: 6 + roll(l * 2)
    })
  },
  littlegoblinwarrior: {
    minLvl: 2, maxLvl: 10,
    names: 'little goblin warrior',
    symbols: ['goblin3', 'goblin6'],
    acts: { Actor: true, Skills: true },
    stats: (l) => ({
      str: 4 + roll(l),
      agi: 1 + roll(l),
      int: 3 + roll(l),
      con: 3 + roll(l),
      maxAtk: 6 + roll(l * 2)
    }),
    skills: (l) => [
      Game.SkillRepository.create(
        ROT.RNG.getWeightedValue({ rapidcut: 2, poisonslash: 1, strengthofstone: 1 }),
        1 + roll(l / 2)
      ),
      Game.SkillRepository.create('strengthofstone', 1)
    ],
    rare: (mob, l) => {
      mob.str += 4;
      mob.con += 4;
      mob.skills.push(Game.SkillRepository.create('iceshield', 1 + Math.floor(l / 2)));
    }
  },
  snake: {
    minLvl: 3, maxLvl: 15,
    names: 'snake',
    symbols: ['snake1', 'snake2', 'snake3', 'snake4'],
    acts: { Actor: true, Skills: true },
    stats: (l) => ({
      str: 2 + roll(l),
      agi: 5 + roll(l),
      int: 1 + roll(3),
      con: 3 + roll(l),
      maxAtk: 6 + roll(l * 2)
    }),
    skills: (l) => [Game.SkillRepository.create('poisonslash', l - 2)],
    rare: (mob) => {
      mob.str += 4;
      mob.con += 4;
    }
  },
  littlegoblinwizard: {
    minLvl: 3, maxLvl: 10,
    names: 'little goblin wizard',
    symbols: ['goblin7', 'goblin8'],
    acts: { Actor: true, Skills: true },
    stats: (l) => ({
      str: 1 + roll(l),
      agi: 3 + roll(l),
      int: 5 + roll(l),
      con: 1 + roll(l),
      maxAtk: 2 + roll(l * 2)
    }),
    skills: (l) => [
      Game.SkillRepository.create(
        ROT.RNG.getWeightedValue({
          firearrow: 3, icearrow: 1, poisonarrow: 2, stonearrow: 1, iceshield: 1
        }),
        1 + roll(l / 2)
      )
    ],
    rare: (mob, l) => {
      mob.int += 4;
      mob.agi += 4;
      mob.skills.push(Game.SkillRepository.create('iceshield', 1 + Math.floor(l / 2)));
    }
  },
  goblinwarrior: {
    minLvl: 8, maxLvl: 20, defense: 5,
    names: 'goblin warrior',
    symbols: ['goblin4', 'goblin5'],
    acts: { Actor: true, Skills: true },
    stats: (l) => ({
      str: l + roll(l),
      agi: 4 + roll(l),
      int: 4 + roll(l),
      con: 5 + roll(l),
      maxAtk: 2 + l + roll(l)
    }),
    skills: (l) => [
      Game.SkillRepository.create(
        ROT.RNG.getWeightedValue({ twistingslash: 3, lightningstrike: 1 }),
        3 + roll(l / 2)
      ),
      Game.SkillRepository.create('strengthofstone', 1)
    ],
    rare: (mob) => {
      mob.str += 4;
      mob.con += 4;
      mob.skills.push(Game.SkillRepository.create('iceshield', 4));
    }
  },
  goblinwizard: {
    minLvl: 7, maxLvl: 16, defense: 3, vision: 6,
    names: 'goblin wizard',
    symbols: ['goblin1', 'goblin2'],
    acts: { Actor: true, Skills: true },
    stats: (l) => ({
      str: 3 + roll(l),
      agi: 3 + roll(l),
      int: l + roll(l),
      con: 1 + roll(l),
      maxAtk: 4 + roll(l)
    }),
    skills: (l) => [
      Game.SkillRepository.create(
        ROT.RNG.getWeightedValue({ firearrow: 3, fireball: 1 }),
        3 + roll(l / 2)
      )
    ],
    rare: (mob) => {
      mob.int += 4;
      mob.agi += 4;
      mob.skills.push(Game.SkillRepository.create('iceshield', 3));
    }
  },
  skeleton: {
    minLvl: 10, maxLvl: 20, defense: 6,
    names: 'skeleton',
    deadMessage: ' turns to ash.',
    acts: { Actor: true },
    stats: (l) => ({
      str: l + roll(l),
      agi: 3 + roll(l),
      int: 2 + roll(l),
      con: 4 + roll(l),
      maxAtk: 7 + roll(l)
    }),
    rare: (mob) => {
      mob.str += 2;
      mob.agi += 2;
      mob.con += 2;
    }
  },
  lich: {
    minLvl: 16, maxLvl: 40, defense: 6, vision: 7,
    names: ['lich', 'banshee', 'cultist', 'witch'],
    deadMessage: ' turns to ash.',
    acts: { Actor: true, Skills: true },
    stats: (l) => ({
      str: 3 + roll(l),
      agi: 3 + roll(l),
      int: l + roll(l),
      con: 5 + roll(l),
      maxAtk: 5 + roll(l)
    }),
    skills: (l) => [
      Game.SkillRepository.create(
        ROT.RNG.getItem(['lightningbolt', 'acidcloud', 'icefall', 'frozentomb', 'darkness']),
        8 + roll(l / 2)
      ),
      Game.SkillRepository.createRandom(10, l - 2)
    ],
    rare: (mob) => {
      mob.int += 4;
      mob.con += 4;
      mob.skills.push(
        Game.SkillRepository.create(
          ROT.RNG.getItem(['iceshield', 'auraoffear', 'arcaneshield']),
          3 + roll(7)
        )
      );
    }
  },
  darkknight: {
    minLvl: 20, maxLvl: 45, defense: 10,
    names: ['dark knight', 'reaper', 'wraith', 'cultist'],
    deadMessage: ' turns to ash.',
    acts: { Actor: true, Skills: true },
    stats: (l) => ({
      str: l + roll(l),
      agi: 4 + roll(l),
      int: 4 + roll(l),
      con: 6 + roll(l),
      maxAtk: 6 + l + roll(l)
    }),
    skills: (l) => [
      Game.SkillRepository.create(
        ROT.RNG.getItem(['twistingslash', 'lightningstrike', 'icefall']),
        5 + roll(l / 2)
      )
    ],
    rare: (mob, l) => {
      mob.str += 3;
      mob.con += 3;
      mob.skills.push(
        Game.SkillRepository.create(
          ROT.RNG.getItem(['auraofwinter', 'reflectionshield', 'heal']),
          2 + roll(l)
        )
      );
    }
  },
  zombie: {
    minLvl: 10, maxLvl: 22, defense: 4,
    names: 'zombie',
    deadMessage: ' turns to ash.',
    acts: { Actor: true },
    stats: (l) => ({
      str: l + roll(l),
      agi: 2 + roll(l / 2),
      int: 1 + roll(l / 2),
      con: 6 + roll(l),
      maxAtk: 4 + l + roll(l)
    }),
    rare: (mob) => {
      mob.str += 3;
      mob.con += 5;
    }
  },
  ghoul: {
    minLvl: 12, maxLvl: 25, defense: 4,
    names: 'ghoul',
    acts: { Actor: true, Skills: true },
    stats: (l) => ({
      str: l + roll(l),
      agi: 4 + roll(l),
      int: 2 + roll(l),
      con: 5 + roll(l),
      maxAtk: 4 + l + roll(l)
    }),
    skills: () => [
      Game.SkillRepository.create(
        ROT.RNG.getItem(['poisonslash', 'acidcloud']),
        4 + roll(4)
      )
    ],
    rare: (mob, l) => {
      mob.str += 2;
      mob.agi += 2;
      mob.skills.push(Game.SkillRepository.createRandom(15, l));
    }
  },
  ettin: {
    minLvl: 18, maxLvl: 30, defense: 6,
    names: 'ettin',
    acts: { Actor: true },
    stats: (l) => ({
      str: l + roll(l),
      agi: 3 + roll(l),
      int: 2 + roll(l / 2),
      con: 6 + roll(l),
      maxAtk: 6 + l + roll(l)
    }),
    rare: (mob) => {
      mob.str += 5;
      mob.con += 3;
    }
  },
  twoheadedettin: {
    minLvl: 25, maxLvl: 35, defense: 8,
    names: 'two headed ettin',
    acts: { Actor: true, Skills: true },
    stats: (l) => ({
      str: l + roll(l),
      agi: 4 + roll(l),
      int: 3 + roll(l),
      con: 8 + roll(l),
      maxAtk: 8 + l + roll(l)
    }),
    skills: (l) => [Game.SkillRepository.createRandom(10, l)],
    rare: (mob, l) => {
      mob.str += 4;
      mob.con += 4;
      mob.skills.push(Game.SkillRepository.createRandom(l - 2, l + 2));
    }
  },
  troll: {
    minLvl: 20, maxLvl: 32, defense: 10,
    names: 'troll',
    acts: { Actor: true, Skills: true },
    stats: (l) => ({
      str: l + roll(l),
      agi: 4 + roll(l),
      int: 3 + roll(l),
      con: 7 + roll(l),
      maxAtk: 6 + l + roll(l)
    }),
    skills: () => [
      Game.SkillRepository.create(
        ROT.RNG.getItem(['crackedearth', 'strengthofstone', 'rapidcut']),
        4 + roll(4)
      )
    ],
    rare: (mob, l) => {
      mob.con += 10;
      mob.skills.push(Game.SkillRepository.createRandom(l - 2, l + 2));
    }
  },
  weird: {
    minLvl: 10, maxLvl: 40, defense: 10,
    names: ['dryad', 'wendigo', 'forest spirit', 'myconid'],
    acts: { Actor: true, Skills: true },
    stats: (l) => ({
      str: 10 + roll(l),
      agi: 6 + roll(l),
      int: 6 + roll(l),
      con: 7 + roll(l),
      maxAtk: 6 + l + roll(l)
    }),
    skills: (l) => [Game.SkillRepository.createRandom(l - 2, l + 2)],
    rare: (mob, l) => {
      mob.con += 10;
      mob.skills.push(Game.SkillRepository.createRandom(l - 2, l + 2));
    }
  },
  fleshlord: {
    minLvl: -100, maxLvl: -50, vision: 30, speed: 90,
    names: '%c{mediumaquamarine}fleshlord%c{}',
    symbols: 'fleshlord3',
    deadMessage: ' turns into chunks of flesh.',
    acts: { Actor: true, Skills: true },
    stats: (l) => ({
      level: l + 8,
      defense: 8 + l,
      str: 10 + l + roll(l),
      agi: 10 + Math.floor(l / 2),
      int: 10 + l + roll(l),
      con: 20 + l + roll(l),
      maxAtk: 15 + l + roll(l)
    }),
    skills: (l) => {
      const count = 2 + roll(3);
      return Array.from({ length: count }, () => Game.SkillRepository.createRandom(10, l));
    }
  }
};

for (const [key, def] of Object.entries(ENTITY_DEFS)) {
  Game.EntityRepository.define(key, function (level) {
    this.minLvl = def.minLvl;
    this.maxLvl = def.maxLvl;
    this.level = level;
    this.name = pickFrom(def.names);
    this.symbol = def.symbols ? pickFrom(def.symbols) : this.name;
    if (def.vision !== undefined) this.vision = def.vision;
    if (def.defense !== undefined) this.defense = def.defense;
    if (def.speed !== undefined) this.speed = def.speed;
    if (def.deadMessage) this.deadMessage = def.deadMessage;
    if (def.acts) this.acts = { ...def.acts };
    if (def.stats) Object.assign(this, def.stats(level));
    if (def.skills) this.skills = def.skills(level);
    if (def.rare && Math.random() < rareMobChance) {
      this.name = `%c{lightsalmon}rare ${this.name}%c{}`;
      def.rare(this, level);
    }
  });
}
