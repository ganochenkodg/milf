'use strict';

Game.skills = [];

const INT_SCALED_KEYS = new Set(['minatk', 'maxatk', 'shield', 'heal']);
const AFFECT_STAT_KEYS = new Set(['str', 'con', 'int', 'agi', 'speed', 'vision']);
const STATUS_AFFECTS = [
  ['stun', 'stun', 'stunned.'],
  ['confuse', 'confuse', 'confused.'],
  ['freeze', 'frozen', 'frozen.']
];

class Skill {
  constructor(properties = {}) {
    this.name = properties.name || '';
    this.maxLvl = properties.maxLvl || 1;
    this.minLvl = properties.minLvl || 1;
    this.action = properties.action || '';
    this.level = properties.level || 1;
    this.options = properties.options || {};
    this.symbol = properties.symbol || '';
    this.target = properties.target || '';
    this.type = properties.type || '';
    this.selfProtect = properties.selfProtect || false;
    this.weapon = properties.weapon || false;
  }
}

const isFloat = (n) => n === +n && n !== (n | 0);

Game.chooseSkill = function (num) {
  if (num === -1) num = 9;
  const skill = Game.skills[num];
  const player = Game.entity[0];

  if (!skill) {
    Game.messageBox.sendMessage(`You don't have any skill in slot [${num + 1}].`);
    Game.drawAll();
    window.removeEventListener('keydown', this);
    Game.engine.unlock();
    return;
  }

  Game.messageDisplay.clear();
  Game.drawBar();
  Game.messageDisplay.draw(num * 4 + 1, 0, num + 1, '#0f0');
  Game.messageDisplay.drawText(1, 2, skill.name);

  let row = 2;
  for (let [key, value] of Object.entries(skill.options)) {
    row++;
    if (isFloat(value)) value = value.toFixed(2);
    const displayValue = INT_SCALED_KEYS.has(key)
      ? Math.floor(value * (1 + player.int * 0.07))
      : value;
    Game.messageDisplay.drawText(1, row, `${key}: ${displayValue}`);
  }

  player.Draw();
  mode.mode = 'skill';
  mode.chosenSkill = num;
  Game.generateSkillMap();
  Game.setSkillNearestTarget();
  Game.drawSkillMap();
};

Game.generateSkillMap = function () {
  mode.skillMap = {};
  const player = Game.entity[0];
  const range = Math.min(
    Game.skills[mode.chosenSkill].options.range,
    player.vision
  );
  fov.compute(player.x, player.y, range, (x, y) => {
    mode.skillMap[`${x},${y}`] = 1;
  });
};

Game.setSkillNearestTarget = function () {
  const player = Game.entity[0];
  mode.skillx = player.x;
  mode.skilly = player.y;
  for (let i = 1; i < Game.entity.length; i++) {
    const entity = Game.entity[i];
    if (entity.depth === player.depth && `${entity.x},${entity.y}` in mode.skillMap) {
      mode.skillx = entity.x;
      mode.skilly = entity.y;
      return;
    }
  }
};

Game.drawSkillMap = function () {
  this.drawMap();
  const player = Game.entity[0];
  const level = player.depth;
  const skill = Game.skills[mode.chosenSkill];
  const range = Math.min(skill.options.range, player.vision);

  fov.compute(player.x, player.y, range, (x, y) => {
    Game.drawTile(x, y, level, '#ff97');
  });
  fov.compute(mode.skillx, mode.skilly, skill.options.radius, (x, y) => {
    Game.drawTile(x, y, level, '#8f17');
  });
  Game.drawEntities();
};

Game.isAffectApplied = function (actor, affect) {
  if ('shield' in affect) {
    const idx = actor.affects.findIndex((a) => 'shield' in a);
    if (idx !== -1) return [true, idx];
  }
  const idx = actor.affects.findIndex((a) => a.symbol === affect.symbol);
  return [idx !== -1, idx];
};

Game.checkShields = function (actor, target, type, dmg) {
  for (const affect of target.affects) {
    if (!('shield' in affect)) continue;

    if (type === 'physical') {
      if ('cold' in affect && Math.random() < affect.cold) {
        actor.affects.push({ freeze: true, duration: 2, symbol: 'freeze' });
      }
      if ('fear' in affect && Math.random() < affect.fear) {
        actor.affects.push({ confuse: true, duration: 2, symbol: 'confuse' });
      }
      if ('fire' in affect) {
        const fireDmg = Math.max(roll(affect.fire), 1);
        actor.hp -= fireDmg;
        const prefix = actor.player
          ? 'You were burned for '
          : `The ${actor.name} was burned for `;
        Game.messageBox.sendMessage(`${prefix}%c{red}${fireDmg} %c{}damage.`);
      }
    }

    if ('reflection' in affect) {
      const reflectDmg = Math.max(roll(affect.reflection * dmg), 1);
      actor.hp -= reflectDmg;
      const prefix = actor.player ? 'You got ' : `The ${actor.name} got `;
      Game.messageBox.sendMessage(`${prefix}%c{indigo}${reflectDmg} %c{}damage.`);
    }

    if ('restoration' in affect) {
      const restoreDmg = Math.max(roll(affect.restoration * dmg), 1);
      target.hp = Math.min(target.hp + restoreDmg, target.maxHp);
      const prefix = target.player ? 'You got ' : `The ${target.name} got `;
      Game.messageBox.sendMessage(
        `${prefix}%c{ivory}${restoreDmg} %c{} restored HP.`
      );
    }
  }
};

Game.useSkill = function (actor, skill, skillx, skilly) {
  if (actor.player && skill.weapon && !Game.entity[0].equipment.weapon) {
    Game.messageBox.sendMessage('You must equip some weapon to use this skill.');
    return;
  }

  if (skill.options.cost > actor.mana) {
    if (actor.player) {
      Game.messageBox.sendMessage("You don't have enough mana.");
    }
    return;
  }

  actor.mana -= skill.options.cost;
  Game.messageBox.sendMessage(
    actor.player
      ? `You cast ${skill.name}.`
      : `The ${actor.name} casts ${skill.name}.`
  );

  if (actor.confuse && Math.random() > 0.5) {
    const [dx, dy] = ROT.DIRS[8][roll(8)];
    skillx += dx;
    skilly += dy;
  }

  const skillPath = [];
  new ROT.Path.AStar(skillx, skilly, lightPasses, { topology: 8 }).compute(
    actor.x,
    actor.y,
    (x, y) => skillPath.push([x, y])
  );
  for (let i = 1; i < skillPath.length; i++) {
    [skillx, skilly] = skillPath[i];
    if (Game.map[actor.depth].Tiles[skillx][skilly].Mob) break;
  }

  mode.skillMap = {};
  fov.compute(skillx, skilly, skill.options.radius, (x, y) => {
    mode.skillMap[`${x},${y}`] = 1;
  });
  if (skill.selfProtect) {
    delete mode.skillMap[`${actor.x},${actor.y}`];
  }

  const color = skill.name.match(/^([^}]+)}/)[0];

  for (let i = Game.entity.length - 1; i >= 0; i--) {
    const target = Game.entity[i];
    if (target.depth !== actor.depth) continue;
    if (!(`${target.x},${target.y}` in mode.skillMap)) continue;

    if (skill.type === 'damage') {
      let rawDmg = Math.floor(
        (Math.random() * (skill.options.maxatk - skill.options.minatk) +
          skill.options.minatk) *
          (1 + actor.int * 0.07)
      );
      if (skill.weapon) {
        rawDmg += Math.floor(
          (Math.random() * (actor.maxAtk - actor.minAtk) + actor.minAtk) *
            (1 + actor.str * 0.07)
        );
      }

      const dmg = target.doGetSkillDamage(rawDmg);
      Game.messageBox.sendMessage(
        `${i === 0 ? 'You' : `The ${target.name}`} got ${color}${dmg}%c{} damage.`
      );
      Game.checkShields(actor, target, 'skill', dmg);

      if ('poison' in skill.options && Math.random() < skill.options.poison) {
        Game.addAffect(i, {
          poison: Math.floor(skill.options.maxatk / 2),
          duration: skill.options.duration,
          symbol: 'poison'
        });
      }
      for (const [optKey] of STATUS_AFFECTS) {
        if (optKey in skill.options && Math.random() < skill.options[optKey]) {
          Game.addAffect(i, {
            [optKey]: true,
            duration: skill.options.duration,
            symbol: optKey
          });
        }
      }
    }

    if (skill.type === 'chant') {
      const affect = { ...skill.options, symbol: skill.symbol };
      const [applied, idx] = Game.isAffectApplied(actor, affect);
      if (applied) {
        Game.removeAffect(i, idx);
      }
      if ('shield' in affect) {
        affect.shield = Math.floor(affect.shield * (1 + actor.int * 0.07));
      }
      Game.addAffect(i, affect);
    }

    if (skill.type === 'support') {
      if ('heal' in skill.options) {
        const heal = Math.floor(skill.options.heal * (1 + actor.int * 0.07));
        actor.hp = Math.min(actor.hp + heal, actor.maxHp);
        Game.messageBox.sendMessage(
          `${actor.player ? 'You' : `The ${actor.name}`} restored ${color}${heal}%c{} life.`
        );
      }
      if ('distance' in skill.options) {
        const map = Game.map[actor.depth];
        const dist = skill.options.distance;
        let freeplace = Game.returnFree(map);
        for (
          let tries = 0;
          tries <= 100 &&
          (Math.abs(freeplace[0] - actor.x) > dist ||
            Math.abs(freeplace[1] - actor.y) > dist);
          tries++
        ) {
          freeplace = Game.returnFree(map);
        }
        if (!actor.player) {
          map.Tiles[actor.x][actor.y].Mob = false;
        }
        [actor.x, actor.y] = freeplace;
        if (!actor.player) {
          map.Tiles[actor.x][actor.y].Mob = true;
        }
        Game.messageBox.sendMessage(
          `${actor.player ? 'You' : `The ${actor.name}`}${color} teleported%c{} in random position.`
        );
      }
    }

    target.doDie();
  }
  actor.doDie();
};

function applyAffectModifiers(targetNum, affect, sign) {
  const target = Game.entity[targetNum];
  const active = sign > 0;
  for (const [key, value] of Object.entries(affect)) {
    if (AFFECT_STAT_KEYS.has(key)) {
      target[key] += sign * value;
    } else if (key === 'shield') {
      if (targetNum === 0) {
        target.shield += sign * value;
        target.applyStats();
      } else {
        target.defense += sign * value;
      }
    } else if (key === 'stun') {
      target.stun = active;
    } else if (key === 'freeze') {
      target.frozen = active;
    } else if (key === 'confuse') {
      target.confuse = active;
    }
  }
}

Game.addAffect = function (targetNum, affect) {
  applyAffectModifiers(targetNum, affect, 1);
  Game.entity[targetNum].affects.push(affect);
};

Game.removeAffect = function (targetNum, affectNum) {
  const target = Game.entity[targetNum];
  applyAffectModifiers(targetNum, target.affects[affectNum], -1);
  target.affects.splice(affectNum, 1);
};

class checkAffects {
  getSpeed() {
    return 100;
  }

  act() {
    const playerDepth = Game.entity[0].depth;
    for (let i = Game.entity.length - 1; i >= 0; i--) {
      const entity = Game.entity[i];
      if (entity.depth !== playerDepth) continue;

      const actorPrefix = i === 0 ? 'You are ' : `The ${entity.name} is `;
      const visible = Game.map[entity.depth].Tiles[entity.x][entity.y].Visible;

      for (let j = entity.affects.length - 1; j >= 0; j--) {
        const affect = entity.affects[j];
        if ('poison' in affect) {
          const dmg = roll(affect.poison);
          const result = entity.doGetSkillDamage(dmg);
          if (visible) {
            Game.messageBox.sendMessage(
              `${actorPrefix}poisoned and got %c{lightgreen}${result}%c{} damage.`
            );
          }
        }
        for (const [affectKey, entityProp, statusMsg] of STATUS_AFFECTS) {
          if (affectKey in affect) {
            entity[entityProp] = true;
            if (visible && i > 0) {
              Game.messageBox.sendMessage(`${actorPrefix}${statusMsg}`);
            }
          }
        }

        affect.duration -= 1;
        if (affect.duration < 1) {
          Game.removeAffect(i, j);
        }
      }
      entity.doDie();
    }
  }
}

Game.SkillRepository = new Game.Repository('skills', Skill);

const SKILL_DEFS = [
  ['firearrow', 'orange', 'fire arrow', 1, 5, 'range', 'damage', {}, (l) => ({
    cost: 4 + l * 2, minatk: 1, maxatk: 8 + l * 2, range: 3 + Math.floor(l / 2), radius: 0
  })],
  ['poisonarrow', 'lightgreen', 'poison arrow', 1, 5, 'range', 'damage', {}, (l) => ({
    cost: 6 + l * 2, minatk: 1, maxatk: 6 + l * 2, range: 2 + Math.floor(l / 2), radius: 0,
    poison: 0.5 + l * 0.05, duration: 2 + Math.floor(l / 5)
  })],
  ['stonearrow', 'tan', 'stone arrow', 1, 5, 'range', 'damage', {}, (l) => ({
    cost: 6 + l * 2, minatk: 1, maxatk: 8 + l * 2, range: 2 + Math.floor(l / 2), radius: 0,
    confuse: 0.2 + l * 0.02, duration: 2 + Math.floor(l / 5)
  })],
  ['icearrow', 'lightblue', 'ice arrow', 1, 5, 'range', 'damage', {}, (l) => ({
    cost: 6 + l * 2, minatk: 1, maxatk: 6 + l * 2, range: 2 + Math.floor(l / 2), radius: 0,
    freeze: 0.2 + l * 0.04, duration: 2 + Math.floor(l / 5)
  })],
  ['poisonslash', 'darkseagreen', 'poison slash', 1, 10, 'range', 'damage', { weapon: true, selfProtect: true }, (l) => ({
    cost: 12 + l * 2, minatk: 1, maxatk: 8 + l * 2, range: 1, radius: 0,
    poison: 0.5 + l * 0.05, duration: 1 + Math.floor(l / 5)
  })],
  ['rapidcut', 'salmon', 'rapid cut', 1, 10, 'range', 'damage', { weapon: true, selfProtect: true }, (l) => ({
    cost: 8 + l * 2, minatk: 4, maxatk: 4 + l * 2, range: 1, radius: 0
  })],
  ['iceshield', 'lightsteelblue', 'ice shield', 1, 10, 'self', 'chant', {}, (l) => ({
    cost: 14 + l * 2, shield: 2 + l, duration: 8 + l * 2, cold: 0.1 + l * 0.01, range: 0, radius: 0
  })],
  ['strengthofstone', 'papayawhip', 'strength of stone', 1, 10, 'self', 'chant', {}, (l) => ({
    cost: 10 + l * 2, str: 2 + l, duration: 8 + l * 2, range: 0, radius: 0
  })],
  ['twistingslash', 'coral', 'twisting slash', 3, 13, 'range', 'damage', { weapon: true, selfProtect: true }, (l) => ({
    cost: 20 + l * 2, minatk: 2, maxatk: 10 + l * 2, range: 1, radius: 1
  })],
  ['fireball', 'orange', 'fireball', 3, 15, 'range', 'damage', { selfProtect: true }, (l) => ({
    cost: 20 + l * 2, minatk: 8, maxatk: 12 + l * 2, range: 5 + Math.floor(l / 3), radius: 1
  })],
  ['acidcloud', 'lightgreen', 'acid cloud', 5, 15, 'range', 'damage', { selfProtect: true }, (l) => ({
    cost: 22 + l * 2, minatk: 4, maxatk: 6 + l * 2, range: 4, radius: 1,
    poison: 0.5 + l * 0.05, duration: 3 + Math.floor(l / 5)
  })],
  ['calltheshadows', 'lightslategray', 'call the shadows', 10, 20, 'range', 'damage', { selfProtect: true }, (l) => ({
    cost: 30 + l * 2, minatk: 10, maxatk: 16 + l * 2, range: 4, radius: 1,
    stun: 0.3 + l * 0.03, duration: 2
  })],
  ['tsunami', 'mediumturquoise', 'tsunami', 8, 18, 'range', 'damage', { selfProtect: true }, (l) => ({
    cost: 25 + l * 2, minatk: 12, maxatk: 14 + l * 2,
    confuse: 0.4 + l * 0.01, range: 3 + Math.floor(l / 3), radius: 2
  })],
  ['crackedearth', 'brown', 'cracked earth', 10, 20, 'range', 'damage', { selfProtect: true }, (l) => ({
    cost: 30 + l * 2, minatk: 4, maxatk: 24 + l * 2, range: 5 + Math.floor(l / 3), radius: 1
  })],
  ['flamechains', 'crimson', 'flame chains', 12, 24, 'range', 'damage', { selfProtect: true }, (l) => ({
    cost: 30 + l * 2, minatk: 20, maxatk: 20 + l * 2,
    stun: 0.2 + l * 0.04, range: 6, radius: 0, duration: Math.floor(l / 5)
  })],
  ['lightningstrike', 'azure', 'lightning strike', 8, 20, 'range', 'damage', { weapon: true, selfProtect: true }, (l) => ({
    cost: 16 + l * 2, minatk: 8, maxatk: 10 + l * 2,
    confuse: l * 0.05, range: 1, radius: 1, duration: 1
  })],
  ['magiceye', 'lavender', 'magic eye', 5, 40, 'self', 'chant', {}, (l) => ({
    cost: 40 + l * 2, vision: 1 + Math.floor(l / 15), duration: 10 + l * 2, range: 0, radius: 0
  })],
  ['icefall', 'skyblue', 'icefall', 5, 20, 'range', 'damage', { selfProtect: true }, (l) => ({
    cost: 15 + l * 2, minatk: 6, maxatk: 6 + l * 2,
    freeze: 0.4 + l * 0.03, range: 5, radius: 1, duration: 2 + Math.floor(l / 10)
  })],
  ['auraoffear', 'thistle', 'aura of fear', 5, 20, 'self', 'chant', {}, (l) => ({
    cost: 30 + l * 2, shield: 6 + l, duration: 15 + l * 2, fear: 0.3 + l * 0.01, range: 0, radius: 0
  })],
  ['frozentomb', 'cornflowerblue', 'frozen tomb', 15, 30, 'range', 'damage', { selfProtect: true }, (l) => ({
    cost: 30 + l * 2, minatk: 15, maxatk: 25 + l * 2,
    freeze: 0.4 + l * 0.02, range: 6, radius: 0, duration: Math.floor(l / 5)
  })],
  ['fireshield', 'thistle', 'fire shield', 10, 25, 'self', 'chant', {}, (l) => ({
    cost: 40 + l * 2, shield: 10 + l, duration: 15 + l * 2, fire: l * 2, range: 0, radius: 0
  })],
  ['lightningbolt', 'aliceblue', 'lightning bolt', 5, 45, 'range', 'damage', {}, (l) => ({
    cost: 15 + l * 2, minatk: 5, maxatk: 5 + l * 2, range: 5 + Math.floor(l / 10), radius: 0
  })],
  ['rainofblades', 'darkred', 'rain of blades', 25, 100, 'range', 'damage', { weapon: true, selfProtect: true }, (l) => ({
    cost: 50 + l * 2, minatk: 15, maxatk: 20 + l * 2,
    confuse: l * 0.02, range: 5, radius: 2, duration: 1
  })],
  ['honor', 'lightyellow', 'honor', 25, 100, 'self', 'chant', {}, (l) => ({
    cost: 60 + l * 2, shield: 20 + l, duration: 20 + l * 2,
    restoration: Math.min(l * 0.01, 0.9), str: Math.floor(l / 2), range: 0, radius: 0
  })],
  ['arcaneshield', 'purple', 'arcane shield', 25, 100, 'self', 'chant', {}, (l) => ({
    cost: 60 + l * 2, shield: 30 + l, duration: 30 + l * 2, int: Math.floor(l / 2), range: 0, radius: 0
  })],
  ['reflectionshield', 'royalblue', 'reflection shield', 25, 100, 'self', 'chant', {}, (l) => ({
    cost: 40 + l * 2, shield: 20 + l, duration: 25 + l * 2,
    reflection: Math.min(l * 0.01, 0.9), range: 0, radius: 0
  })],
  ['auraofwinter', 'steelblue', 'aura of winter', 20, 100, 'self', 'chant', {}, (l) => ({
    cost: 40 + l * 2, shield: 25 + l, duration: 20 + l * 2, cold: 0.3 + l * 0.01, range: 0, radius: 0
  })],
  ['solareclipse', 'mediumorchid', 'solar eclipse', 20, 100, 'range', 'damage', { selfProtect: true }, (l) => ({
    cost: 50 + l * 2, minatk: 25, maxatk: 35 + l * 2, range: 1, radius: 1
  })],
  ['supernova', 'snow', 'supernova', 25, 100, 'range', 'damage', { weapon: true }, (l) => ({
    cost: 40 + l * 2, minatk: 15, maxatk: 20 + l * 2, range: 5 + Math.floor(l / 10), radius: 0
  })],
  ['darkness', 'slategray', 'darkness', 25, 100, 'range', 'damage', { selfProtect: true }, (l) => ({
    cost: 50 + l * 2, minatk: 6, maxatk: 15 + l * 2,
    stun: l * 0.02, confuse: 0.3 + l * 0.02, range: 5, radius: 2, duration: 2 + Math.floor(l / 10)
  })],
  ['speedoflight', 'seashell', 'speed of light', 25, 100, 'self', 'chant', {}, (l) => ({
    cost: 50 + l * 2, agi: Math.floor(l / 2), speed: Math.floor(l / 2),
    duration: 20 + l * 2, range: 0, radius: 0
  })],
  ['plague', 'darkseagreen', 'plague', 20, 100, 'range', 'damage', { selfProtect: true }, (l) => ({
    cost: 50 + l * 2, minatk: 10, maxatk: 20 + l * 2, range: 6, radius: 2,
    poison: l * 0.03, duration: Math.floor(l / 3)
  })],
  ['heal', 'Chartreuse', 'heal', 15, 50, 'self', 'support', {}, (l) => ({
    cost: 20 + l * 2, heal: l, range: 0, radius: 0
  })],
  ['teleport', 'mistyrose', 'teleport', 10, 50, 'self', 'support', {}, (l) => ({
    cost: 15 + l * 2, distance: Math.floor(l / 2), range: 0, radius: 0
  })]
];

for (const [key, color, label, minLvl, maxLvl, target, type, flags, optionsFn] of SKILL_DEFS) {
  Game.SkillRepository.define(key, function (level) {
    this.symbol = key;
    this.name = `%c{${color}}${label} (${level})%c{}`;
    this.minLvl = minLvl;
    this.maxLvl = maxLvl;
    this.target = target;
    this.type = type;
    this.level = level;
    if (flags.weapon) this.weapon = true;
    if (flags.selfProtect) this.selfProtect = true;
    this.options = optionsFn(level);
  });
}
