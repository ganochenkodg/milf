Game.skills = [];

Skill = function (properties) {
  properties = properties || {};
  this.name = properties['name'] || '';
  this.maxLvl = properties['maxLvl'] || 1;
  this.minLvl = properties['minLvl'] || 1;
  this.action = properties['action'] || '';
  this.level = properties['level'] || 1;
  this.options = properties['options'] || {};
  this.symbol = properties['symbol'] || '';
  this.target = properties['target'] || '';
  this.type = properties['type'] || '';
  this.selfProtect = properties['selfProtect'] || false;
  this.weapon = properties['weapon'] || false;
};

function isFloat(n) {
  return n === +n && n !== (n | 0);
}

Game.chooseSkill = function (num) {
  if (num == -1) {
    num = 9;
  }
  if (typeof Game.skills[num] === 'undefined') {
    Game.messageBox.sendMessage(
      "You don't have any skill in slot [" + (num + 1) + '].'
    );
    Game.drawAll();
    window.removeEventListener('keydown', this);
    Game.engine.unlock();
    return;
  }
  Game.messageDisplay.clear();
  Game.drawBar();

  Game.messageDisplay.draw(num * 4 + 1, 0, num + 1, '#0f0');
  Game.messageDisplay.drawText(1, 2, Game.skills[num].name);
  var iterator = 2;
  for (let [key, value] of Object.entries(Game.skills[num].options)) {
    iterator++;
    if (isFloat(value)) value = value.toFixed(2);
    if (
      key == 'minatk' ||
      key == 'maxatk' ||
      key == 'shield' ||
      key == 'heal'
    ) {
      Game.messageDisplay.drawText(
        1,
        iterator,
        `${key}: ${Math.floor(value * (1 + Game.entity[0].int * 0.07))}`
      );
    } else {
      Game.messageDisplay.drawText(1, iterator, `${key}: ${value}`);
    }
  }
  Game.entity[0].Draw();
  mode.mode = 'skill';
  mode.chosenSkill = num;
  Game.generateSkillMap();
  Game.setSkillNearestTarget();
  Game.drawSkillMap();
};

Game.generateSkillMap = function () {
  mode.skillMap = {};
  var level = Game.entity[0].depth;
  var _range = Math.min(
    Game.skills[mode.chosenSkill].options.range,
    Game.entity[0].vision
  );
  fov.compute(
    Game.entity[0].x,
    Game.entity[0].y,
    _range,
    function (x, y, r, visibility) {
      mode.skillMap[x + ',' + y] = 1;
    }
  );
};

Game.setSkillNearestTarget = function () {
  var level = Game.entity[0].depth;
  mode.skillx = Game.entity[0].x;
  mode.skilly = Game.entity[0].y;
  for (let i = 1; i < Game.entity.length; i++) {
    var key = Game.entity[i].x + ',' + Game.entity[i].y;
    if (key in mode.skillMap && Game.entity[i].depth == level) {
      mode.skillx = Game.entity[i].x;
      mode.skilly = Game.entity[i].y;
      return;
    }
  }
};

Game.drawSkillMap = function () {
  this.drawMap();
  var level = Game.entity[0].depth;
  var _range = Math.min(
    Game.skills[mode.chosenSkill].options.range,
    Game.entity[0].vision
  );
  fov.compute(
    Game.entity[0].x,
    Game.entity[0].y,
    _range,
    function (x, y, r, visibility) {
      let xco = Game.getCamera(x, y)[0];
      let yco = Game.getCamera(x, y)[1];
      let _color = '#ff97';
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
    }
  );
  fov.compute(
    mode.skillx,
    mode.skilly,
    Game.skills[mode.chosenSkill].options.radius,
    function (x, y, r, visibility) {
      let xco = Game.getCamera(x, y)[0];
      let yco = Game.getCamera(x, y)[1];
      let _color = '#8f17';
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
    }
  );
  Game.drawEntities();
};

Game.isAffectApplied = function (actor, affect) {
  var affectApplied = false;
  var affectNum = -1;
  if ('shield' in affect) {
    for (let i = 0; i < actor.affects.length; i++) {
      if ('shield' in actor.affects[i]) {
        affectApplied = true;
        affectNum = i;
        break;
      }
    }
  }
  for (let i = 0; i < actor.affects.length; i++) {
    if (actor.affects[i].symbol == affect.symbol) {
      affectApplied = true;
      affectNum = i;
      break;
    }
  }
  return [affectApplied, affectNum];
};

Game.checkShields = function (actor, target, type, dmg) {
  for (let i = 0; i < target.affects.length; i++) {
    _affect = target.affects[i];
    if ('shield' in _affect) {
      if (type == 'physical') {
        if ('cold' in _affect) {
          if (Math.random() < _affect.cold)
            actor.affects.push({
              freeze: true,
              duration: 2,
              symbol: 'freeze'
            });
        }
        if ('fear' in _affect) {
          if (Math.random() < _affect.fear) п;
          actor.affects.push({
            confuse: true,
            duration: 2,
            symbol: 'confuse'
          });
        }
        if ('fire' in _affect) {
          fireDmg = Math.max(Math.floor(Math.random() * _affect.fire), 1);
          actor.hp -= fireDmg;
          _actor = actor.player
            ? 'You were burned for '
            : 'The ' + actor.name + ' was burned for ';
          Game.messageBox.sendMessage(
            _actor + '%c{red}' + fireDmg + ' %c{}damage.'
          );
        }
      }
      if ('reflection' in _affect) {
        reflectDmg = Math.max(
          Math.floor(Math.random() * _affect.reflection),
          1
        );
        actor.hp -= reflectDmg;
        _actor = actor.player ? 'You got ' : 'The ' + actor.name + ' got ';
        Game.messageBox.sendMessage(
          _actor + '%c{indigo}' + reflectDmg + ' %c{}damage.'
        );
      }
      if ('restoration' in _affect) {
        restoreDmg = Math.max(
          Math.floor(Math.random() * _affect.restoration),
          1
        );
        target.hp += restoreDmg;
        _actor = target.player ? 'You got ' : 'The ' + target.name + ' got ';
        Game.messageBox.sendMessage(
          _actor + '%c{ivory}' + restoreDmg + ' %c{} restored HP.'
        );
      }
    }
  }
};

Game.useSkill = function (actor, skill, skillx, skilly) {
  var result = 0;
  if (
    actor.player &&
    skill.weapon &&
    typeof Game.entity[0].equipment.weapon == undefined
  ) {
    Game.messageBox.sendMessage(
      'You must equip some weapon to use this skill.'
    );
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
      ? 'You cast ' + skill.name + '.'
      : 'The ' + actor.name + ' casts ' + skill.name + '.'
  );
  if (actor.confuse && Math.random() > 0.5) {
    let _confused = ROT.DIRS[8][Math.floor(Math.random() * 7)];
    skillx += _confused[0];
    skilly += _confused[1];
  }
  //find mob collision
  var skillAstar = new ROT.Path.AStar(skillx, skilly, lightPasses, {
    topology: 8
  });
  var skillPath = [];
  var skillPathCallback = function (x, y) {
    skillPath.push([x, y]);
  };
  skillAstar.compute(actor.x, actor.y, skillPathCallback);
  for (let i = 1; i < skillPath.length; i++) {
    skillx = skillPath[i][0];
    skilly = skillPath[i][1];
    if (Game.map[actor.depth].Tiles[skillx][skilly].Mob) {
      break;
    }
  }
  mode.skillMap = {};
  var level = Game.entity[0].depth;
  fov.compute(
    skillx,
    skilly,
    skill.options.radius,
    function (x, y, r, visibility) {
      mode.skillMap[x + ',' + y] = 1;
    }
  );
  if (skill.selfProtect) delete mode.skillMap[actor.x + ',' + actor.y];
  for (let i = 0; i < Game.entity.length; i++) {
    let key = Game.entity[i].x + ',' + Game.entity[i].y;
    if (key in mode.skillMap) {
      let _color = skill.name.match(/^([^}]+)}/)[0];

      if (skill.type == 'damage') {
        result += Math.floor(
          (Math.random() * (skill.options.maxatk - skill.options.minatk) +
            skill.options.minatk) *
            (1 + actor.int * 0.07)
        );
        if (skill.weapon) {
          result += Math.floor(
            (Math.random() * (actor.maxAtk - actor.minAtk) + actor.minAtk) *
              (1 + actor.str * 0.07)
          );
        }
        let dmg = Game.entity[i].doGetSkillDamage(result);
        Game.messageBox.sendMessage(
          (i == 0 ? 'You' : 'The ' + Game.entity[i].name) +
            ' got ' +
            _color +
            dmg +
            '%c{} damage.'
        );
        Game.checkShields(actor, Game.entity[i], 'skill', dmg);
        if ('poison' in skill.options) {
          if (Math.random() < skill.options.poison) {
            Game.addAffect(i, {
              poison: Math.floor(skill.options.maxatk / 2),
              duration: skill.options.duration,
              symbol: 'poison'
            });
          }
        }
        if ('stun' in skill.options) {
          if (Math.random() < skill.options.stun) {
            Game.addAffect(i, {
              stun: true,
              duration: skill.options.duration,
              symbol: 'stun'
            });
          }
        }
        if ('confuse' in skill.options) {
          if (Math.random() < skill.options.confuse) {
            Game.addAffect(i, {
              confuse: true,
              duration: skill.options.duration,
              symbol: 'confuse'
            });
          }
        }
        if ('freeze' in skill.options) {
          if (Math.random() < skill.options.freeze) {
            Game.addAffect(i, {
              freeze: true,
              duration: skill.options.duration,
              symbol: 'freeze'
            });
          }
        }
      }

      if (skill.type == 'chant') {
        let _affect = { ...skill.options, ...{ symbol: skill.symbol } };
        let affectApplied = Game.isAffectApplied(actor, _affect);
        if (affectApplied[0]) {
          Game.removeAffect(i, affectApplied[1]);
        }
        if ('shield' in _affect) {
          _affect.shield = Math.floor(_affect.shield * (1 + actor.int * 0.07));
        }
        Game.addAffect(i, _affect);
      }

      if (skill.type == 'support') {
        if ('heal' in skill.options) {
          _heal = Math.floor(skill.options.heal * (1 + actor.int * 0.07));
          actor.hp += _heal;
          actor.hp = Math.min(actor.hp, actor.maxHp);
          Game.messageBox.sendMessage(
            (actor.player ? 'You' : 'The ' + actor.name) +
              ' restored ' +
              _color +
              _heal +
              '%c{} life.'
          );
        }
        if ('distance' in skill.options) {
          var iterator = 0;
          var freeplace = Game.returnFree(Game.map[actor.depth]);
          var _dist = skill.options.distance;
          while (
            freeplace[0] + _dist < actor.x ||
            freeplace[0] > actor.x + _dist ||
            freeplace[1] + _dist < actor.y ||
            freeplace[1] > actor.y + _dist
          ) {
            iterator++;
            freeplace = Game.returnFree(Game.map[actor.depth]);
            if (iterator > 100) break;
          }
          actor.x = freeplace[0];
          actor.y = freeplace[1];
          Game.messageBox.sendMessage(
            (actor.player ? 'You' : 'The ' + actor.name) +
              _color +
              ' teleported' +
              '%c{} in random position.'
          );
        }
      }

      Game.entity[i].doDie();
    }
  }
};

Game.addAffect = function (targetNum, affect) {
  for (let [key, value] of Object.entries(affect)) {
    if (key == 'str') Game.entity[targetNum].str += value;
    if (key == 'con') Game.entity[targetNum].con += value;
    if (key == 'int') Game.entity[targetNum].int += value;
    if (key == 'agi') Game.entity[targetNum].agi += value;
    if (key == 'speed') Game.entity[targetNum].speed += value;
    if (key == 'shield') {
      if (targetNum == 0) {
        Game.entity[targetNum].shield += value;
        Game.entity[targetNum].applyStats();
      } else {
        Game.entity[targetNum].defense += value;
      }
    }
    if (key == 'stun') Game.entity[targetNum].stun = true;
    if (key == 'freeze') Game.entity[targetNum].frozen = true;
    if (key == 'confuse') Game.entity[targetNum].confuse = true;
  }
  Game.entity[targetNum].affects.push(affect);
};

Game.removeAffect = function (targetNum, affectNum) {
  for (let [key, value] of Object.entries(
    Game.entity[targetNum].affects[affectNum]
  )) {
    if (key == 'str') Game.entity[targetNum].str -= value;
    if (key == 'con') Game.entity[targetNum].con -= value;
    if (key == 'int') Game.entity[targetNum].int -= value;
    if (key == 'agi') Game.entity[targetNum].agi -= value;
    if (key == 'speed') Game.entity[targetNum].speed -= value;
    if (key == 'shield') {
      if (targetNum == 0) {
        Game.entity[targetNum].shield -= value;
        Game.entity[targetNum].applyStats();
      } else {
        Game.entity[targetNum].defense -= value;
      }
    }
    if (key == 'stun') Game.entity[targetNum].stun = false;
    if (key == 'freeze') Game.entity[targetNum].frozen = false;
    if (key == 'confuse') Game.entity[targetNum].confuse = false;
  }
  Game.entity[targetNum].affects.splice(affectNum, 1);
};

checkAffects = function () {
  this.getSpeed = function () {
    return 100;
  };
};

checkAffects.prototype.act = function () {
  for (let i = 0; i < Game.entity.length; i++) {
    let _actor = i == 0 ? 'You are ' : 'The ' + Game.entity[i].name + ' is ';
    for (let j = 0; j < Game.entity[i].affects.length; j++) {
      if ('poison' in Game.entity[i].affects[j]) {
        let dmg = Math.floor(Math.random() * Game.entity[i].affects[j].poison);
        let result = Game.entity[i].doGetSkillDamage(dmg);
        if (
          Game.map[Game.entity[i].depth].Tiles[Game.entity[i].x][
            Game.entity[i].y
          ].Visible
        ) {
          Game.messageBox.sendMessage(
            _actor + 'poisoned and got %c{lightgreen}' + result + '%c{} damage.'
          );
        }
      }
      if ('stun' in Game.entity[i].affects[j]) {
        Game.entity[i].stun = true;
        if (
          Game.map[Game.entity[i].depth].Tiles[Game.entity[i].x][
            Game.entity[i].y
          ].Visible &&
          i > 0
        ) {
          Game.messageBox.sendMessage(_actor + 'stunned.');
        }
      }
      if ('confuse' in Game.entity[i].affects[j]) {
        Game.entity[i].confuse = true;
        if (
          Game.map[Game.entity[i].depth].Tiles[Game.entity[i].x][
            Game.entity[i].y
          ].Visible &&
          i > 0
        ) {
          Game.messageBox.sendMessage(_actor + 'confused.');
        }
      }
      if ('freeze' in Game.entity[i].affects[j]) {
        Game.entity[i].frozen = true;
        if (
          Game.map[Game.entity[i].depth].Tiles[Game.entity[i].x][
            Game.entity[i].y
          ].Visible &&
          i > 0
        ) {
          Game.messageBox.sendMessage(_actor + 'frozen.');
        }
      }

      Game.entity[i].affects[j].duration -= 1;
      if (Game.entity[i].affects[j].duration < 1) {
        Game.removeAffect(i, j);
      }
      Game.entity[i].doDie();
    }
  }
};

Game.SkillRepository = new Game.Repository('skills', Skill);

Game.SkillRepository.define('firearrow', function (level) {
  this.symbol = 'firearrow';
  this.name = '%c{orange}fire arrow (' + level + ')%c{}';
  this.minLvl = 1;
  this.maxLvl = 5;
  this.target = 'range';
  this.type = 'damage';
  this.level = level;
  this.options = {
    cost: 4 + level * 2,
    minatk: 1,
    maxatk: 8 + Math.floor(Math.random() * level * 2),
    range: 3 + Math.floor(level / 2),
    radius: 0
  };
});

Game.SkillRepository.define('poisonarrow', function (level) {
  this.symbol = 'poisonarrow';
  this.name = '%c{lightgreen}poison arrow (' + level + ')%c{}';
  this.minLvl = 1;
  this.maxLvl = 5;
  this.target = 'range';
  this.type = 'damage';
  this.level = level;
  this.options = {
    cost: 6 + level * 2,
    minatk: 1,
    maxatk: 6 + Math.floor(Math.random() * level * 2),
    range: 2 + Math.floor(level / 2),
    radius: 0,
    poison: 0.5 + level * 0.05,
    duration: 2 + Math.floor(level / 5)
  };
});

Game.SkillRepository.define('stonearrow', function (level) {
  this.symbol = 'stonearrow';
  this.name = '%c{tan}stone arrow (' + level + ')%c{}';
  this.minLvl = 1;
  this.maxLvl = 5;
  this.target = 'range';
  this.type = 'damage';
  this.level = level;
  this.options = {
    cost: 6 + level * 2,
    minatk: 1,
    maxatk: 8 + Math.floor(Math.random() * level * 2),
    range: 2 + Math.floor(level / 2),
    radius: 0,
    confuse: 0.2 + level * 0.02,
    duration: 2 + Math.floor(level / 5)
  };
});

Game.SkillRepository.define('icearrow', function (level) {
  this.symbol = 'icearrow';
  this.name = '%c{lightblue}ice arrow (' + level + ')%c{}';
  this.minLvl = 1;
  this.maxLvl = 5;
  this.target = 'range';
  this.type = 'damage';
  this.level = level;
  this.options = {
    cost: 6 + level * 2,
    minatk: 1,
    maxatk: 6 + Math.floor(Math.random() * level * 2),
    range: 2 + Math.floor(level / 2),
    radius: 0,
    freeze: 0.2 + level * 0.04,
    duration: 2 + Math.floor(level / 5)
  };
});

Game.SkillRepository.define('poisonslash', function (level) {
  this.symbol = 'poisonslash';
  this.name = '%c{darkseagreen}poison slash (' + level + ')%c{}';
  this.weapon = true;
  this.minLvl = 1;
  this.maxLvl = 10;
  this.target = 'range';
  this.type = 'damage';
  this.level = level;
  this.options = {
    cost: 12 + level * 2,
    minatk: 1,
    maxatk: 8 + level + Math.floor(Math.random() * level),
    range: 1,
    radius: 0,
    poison: 0.5 + level * 0.05,
    duration: 1 + Math.floor(level / 5)
  };
});

Game.SkillRepository.define('rapidcut', function (level) {
  this.symbol = 'rapidcut';
  this.name = '%c{salmon}rapid cut (' + level + ')%c{}';
  this.weapon = true;
  this.minLvl = 1;
  this.maxLvl = 10;
  this.target = 'range';
  this.type = 'damage';
  this.level = level;
  this.options = {
    cost: 8 + level * 2,
    minatk: 4,
    maxatk: 4 + level + Math.floor(Math.random() * level),
    range: 1,
    radius: 0
  };
});

Game.SkillRepository.define('iceshield', function (level) {
  this.symbol = 'iceshield';
  this.name = '%c{lightsteelblue}ice shield (' + level + ')%c{}';
  this.minLvl = 1;
  this.maxLvl = 10;
  this.target = 'self';
  this.type = 'chant';
  this.level = level;
  this.options = {
    cost: 14 + level * 2,
    shield: 2 + level,
    duration: 8 + level * 2,
    cold: 0.1 + level * 0.01,
    range: 0,
    radius: 0
  };
});

Game.SkillRepository.define('strengthofstone', function (level) {
  this.symbol = 'strengthofstone';
  this.name = '%c{papayawhip}strength of stone (' + level + ')%c{}';
  this.minLvl = 1;
  this.maxLvl = 10;
  this.target = 'self';
  this.type = 'chant';
  this.level = level;
  this.options = {
    cost: 10 + level * 2,
    str: 2 + level,
    duration: 8 + level * 2,
    range: 0,
    radius: 0
  };
});

Game.SkillRepository.define('twistingslash', function (level) {
  this.symbol = 'twistingslash';
  this.name = '%c{coral}twisting slash (' + level + ')%c{}';
  this.weapon = true;
  this.selfProtect = true;
  this.minLvl = 3;
  this.maxLvl = 13;
  this.target = 'range';
  this.type = 'damage';
  this.level = level;
  this.options = {
    cost: 20 + level * 2,
    minatk: 2,
    maxatk: 10 + level + Math.floor(Math.random() * level),
    range: 1,
    radius: 1
  };
});

Game.SkillRepository.define('fireball', function (level) {
  this.symbol = 'fireball';
  this.name = '%c{orange}fireball (' + level + ')%c{}';
  this.minLvl = 3;
  this.maxLvl = 15;
  this.target = 'range';
  this.selfProtect = true;
  this.type = 'damage';
  this.level = level;
  this.options = {
    cost: 20 + level * 2,
    minatk: 8,
    maxatk: 12 + level + Math.floor(Math.random() * level),
    range: 5 + Math.floor(level / 3),
    radius: 1
  };
});

Game.SkillRepository.define('acidcloud', function (level) {
  this.symbol = 'acidcloud';
  this.name = '%c{lightgreen}acid cloud (' + level + ')%c{}';
  this.minLvl = 5;
  this.maxLvl = 15;
  this.selfProtect = true;
  this.target = 'range';
  this.type = 'damage';
  this.level = level;
  this.options = {
    cost: 22 + level * 2,
    minatk: 4,
    maxatk: 6 + level + Math.floor(Math.random() * level),
    range: 4,
    radius: 1,
    poison: 0.5 + level * 0.05,
    duration: 3 + Math.floor(level / 5)
  };
});

Game.SkillRepository.define('calltheshadows', function (level) {
  this.symbol = 'calltheshadows';
  this.name = '%c{lightslategray}call the shadows (' + level + ')%c{}';
  this.minLvl = 10;
  this.maxLvl = 20;
  this.selfProtect = true;
  this.target = 'range';
  this.type = 'damage';
  this.level = level;
  this.options = {
    cost: 30 + level * 2,
    minatk: 10,
    maxatk: 16 + level + Math.floor(Math.random() * level),
    range: 4,
    radius: 1,
    stun: 0.3 + level * 0.03,
    duration: 2
  };
});

Game.SkillRepository.define('tsunami', function (level) {
  this.symbol = 'tsunami';
  this.name = '%c{mediumturquoise}tsunami (' + level + ')%c{}';
  this.minLvl = 8;
  this.maxLvl = 18;
  this.target = 'range';
  this.selfProtect = true;
  this.type = 'damage';
  this.level = level;
  this.options = {
    cost: 25 + level * 2,
    minatk: 12,
    maxatk: 14 + level + Math.floor(Math.random() * level),
    confuse: 0.4 + level * 0.01,
    range: 3 + Math.floor(level / 3),
    radius: 2
  };
});

Game.SkillRepository.define('crackedearth', function (level) {
  this.symbol = 'crackedearth';
  this.name = '%c{brown}cracked earth (' + level + ')%c{}';
  this.minLvl = 10;
  this.maxLvl = 20;
  this.target = 'range';
  this.selfProtect = true;
  this.type = 'damage';
  this.level = level;
  this.options = {
    cost: 30 + level * 2,
    minatk: 4,
    maxatk: 24 + level + Math.floor(Math.random() * level),
    range: 5 + Math.floor(level / 3),
    radius: 1
  };
});

Game.SkillRepository.define('flamechains', function (level) {
  this.symbol = 'flamechains';
  this.name = '%c{crimson}flame chains (' + level + ')%c{}';
  this.minLvl = 12;
  this.maxLvl = 24;
  this.target = 'range';
  this.selfProtect = true;
  this.type = 'damage';
  this.level = level;
  this.options = {
    cost: 30 + level * 2,
    minatk: 20,
    maxatk: 20 + level + Math.floor(Math.random() * level),
    stun: 0.2 + level * 0.04,
    range: 6,
    radius: 0,
    duration: Math.floor(level / 5)
  };
});

Game.SkillRepository.define('lightningstrike', function (level) {
  this.symbol = 'lightningstrike';
  this.name = '%c{azure}lightning strike (' + level + ')%c{}';
  this.weapon = true;
  this.selfProtect = true;
  this.minLvl = 8;
  this.maxLvl = 20;
  this.target = 'range';
  this.type = 'damage';
  this.level = level;
  this.options = {
    cost: 16 + level * 2,
    minatk: 8,
    maxatk: 10 + level + Math.floor(Math.random() * level),
    confuse: level * 0.05,
    range: 1,
    radius: 1,
    duration: 1
  };
});

Game.SkillRepository.define('magiceye', function (level) {
  this.symbol = 'magiceye';
  this.name = '%c{lavender}magic eye (' + level + ')%c{}';
  this.minLvl = 5;
  this.maxLvl = 40;
  this.target = 'self';
  this.type = 'chant';
  this.level = level;
  this.options = {
    cost: 40 + level * 2,
    vision: 1 + Math.floor(level / 15),
    duration: 10 + level * 2,
    range: 0,
    radius: 0
  };
});

Game.SkillRepository.define('icefall', function (level) {
  this.symbol = 'icefall';
  this.name = '%c{skyblue}icefall (' + level + ')%c{}';
  this.selfProtect = true;
  this.minLvl = 5;
  this.maxLvl = 20;
  this.target = 'range';
  this.type = 'damage';
  this.level = level;
  this.options = {
    cost: 15 + level * 2,
    minatk: 6,
    maxatk: 6 + level + Math.floor(Math.random() * level),
    freeze: 0.4 + level * 0.03,
    range: 5,
    radius: 1,
    duration: 2 + Math.floor(level / 10)
  };
});

Game.SkillRepository.define('auraoffear', function (level) {
  this.symbol = 'auraoffear';
  this.name = '%c{thistle}aura of fear (' + level + ')%c{}';
  this.minLvl = 5;
  this.maxLvl = 20;
  this.target = 'self';
  this.type = 'chant';
  this.level = level;
  this.options = {
    cost: 30 + level * 2,
    shield: 6 + level,
    duration: 15 + level * 2,
    fear: 0.3 + level * 0.01,
    range: 0,
    radius: 0
  };
});

Game.SkillRepository.define('frozentomb', function (level) {
  this.symbol = 'frozentomb';
  this.name = '%c{cornflowerblue}frozen tomb (' + level + ')%c{}';
  this.minLvl = 15;
  this.maxLvl = 30;
  this.target = 'range';
  this.selfProtect = true;
  this.type = 'damage';
  this.level = level;
  this.options = {
    cost: 30 + level * 2,
    minatk: 15,
    maxatk: 25 + level + Math.floor(Math.random() * level),
    freeze: 0.4 + level * 0.02,
    range: 6,
    radius: 0,
    duration: Math.floor(level / 5)
  };
});

Game.SkillRepository.define('fireshield', function (level) {
  this.symbol = 'fireshield';
  this.name = '%c{thistle}fire shield (' + level + ')%c{}';
  this.minLvl = 10;
  this.maxLvl = 25;
  this.target = 'self';
  this.type = 'chant';
  this.level = level;
  this.options = {
    cost: 40 + level * 2,
    shield: 10 + level,
    duration: 15 + level * 2,
    fire: level * 2,
    range: 0,
    radius: 0
  };
});

Game.SkillRepository.define('lightningbolt', function (level) {
  this.symbol = 'lightningbolt';
  this.name = '%c{aliceblue}lightning bolt (' + level + ')%c{}';
  this.minLvl = 5;
  this.maxLvl = 45;
  this.target = 'range';
  this.type = 'damage';
  this.level = level;
  this.options = {
    cost: 15 + level * 2,
    minatk: 5,
    maxatk: 5 + level * 2,
    range: 5 + Math.floor(level / 10),
    radius: 0
  };
});

Game.SkillRepository.define('rainofblades', function (level) {
  this.symbol = 'rainofblades';
  this.name = '%c{darkred}rain of blades (' + level + ')%c{}';
  this.weapon = true;
  this.selfProtect = true;
  this.minLvl = 25;
  this.maxLvl = 100;
  this.target = 'range';
  this.type = 'damage';
  this.level = level;
  this.options = {
    cost: 50 + level * 2,
    minatk: 15,
    maxatk: 20 + level + Math.floor(Math.random() * level),
    confuse: level * 0.02,
    range: 5,
    radius: 2,
    duration: 1
  };
});

Game.SkillRepository.define('honor', function (level) {
  this.symbol = 'honor';
  this.name = '%c{lightyellow}honor (' + level + ')%c{}';
  this.minLvl = 25;
  this.maxLvl = 100;
  this.target = 'self';
  this.type = 'chant';
  this.level = level;
  this.options = {
    cost: 60 + level * 2,
    shield: 20 + level,
    duration: 20 + level * 2,
    restoration: Math.min(level * 0.01, 0.9),
    str: Math.floor(level / 2),
    range: 0,
    radius: 0
  };
});

Game.SkillRepository.define('arcaneshield', function (level) {
  this.symbol = 'arcaneshield';
  this.name = '%c{purple}arcane shield (' + level + ')%c{}';
  this.minLvl = 25;
  this.maxLvl = 100;
  this.target = 'self';
  this.type = 'chant';
  this.level = level;
  this.options = {
    cost: 60 + level * 2,
    shield: 30 + level,
    duration: 30 + level * 2,
    int: Math.floor(level / 2),
    range: 0,
    radius: 0
  };
});

Game.SkillRepository.define('reflectionshield', function (level) {
  this.symbol = 'reflectionshield';
  this.name = '%c{royalblue}reflection shield (' + level + ')%c{}';
  this.minLvl = 25;
  this.maxLvl = 100;
  this.target = 'self';
  this.type = 'chant';
  this.level = level;
  this.options = {
    cost: 40 + level * 2,
    shield: 20 + level,
    duration: 25 + level * 2,
    reflection: Math.min(level * 0.01, 0.9),
    range: 0,
    radius: 0
  };
});

Game.SkillRepository.define('auraofwinter', function (level) {
  this.symbol = 'auraofwinter';
  this.name = '%c{steelblue}aura of winter (' + level + ')%c{}';
  this.minLvl = 20;
  this.maxLvl = 100;
  this.target = 'self';
  this.type = 'chant';
  this.level = level;
  this.options = {
    cost: 40 + level * 2,
    shield: 25 + level,
    duration: 20 + level * 2,
    cold: 0.3 + level * 0.01,
    range: 0,
    radius: 0
  };
});

Game.SkillRepository.define('solareclipse', function (level) {
  this.symbol = 'solareclipse';
  this.name = '%c{mediumorchid}solareclipse (' + level + ')%c{}';
  this.selfProtect = true;
  this.minLvl = 20;
  this.maxLvl = 100;
  this.target = 'range';
  this.type = 'damage';
  this.level = level;
  this.options = {
    cost: 50 + level * 2,
    minatk: 25,
    maxatk: 35 + level + Math.floor(Math.random() * level),
    range: 1,
    radius: 1
  };
});

Game.SkillRepository.define('supernova', function (level) {
  this.symbol = 'supernova';
  this.name = '%c{snow}supernova (' + level + ')%c{}';
  this.minLvl = 25;
  this.maxLvl = 100;
  this.weapon = true;
  this.target = 'range';
  this.type = 'damage';
  this.level = level;
  this.options = {
    cost: 40 + level * 2,
    minatk: 15,
    maxatk: 20 + level * 2,
    range: 5 + Math.floor(level / 10),
    radius: 0
  };
});

Game.SkillRepository.define('darkness', function (level) {
  this.symbol = 'darkness';
  this.name = '%c{slategray}darkness (' + level + ')%c{}';
  this.selfProtect = true;
  this.minLvl = 25;
  this.maxLvl = 100;
  this.target = 'range';
  this.type = 'damage';
  this.level = level;
  this.options = {
    cost: 50 + level * 2,
    minatk: 6,
    maxatk: 15 + level + Math.floor(Math.random() * level),
    stun: level * 0.02,
    confuse: 0.3 + level * 0.02,
    range: 5,
    radius: 2,
    duration: 2 + Math.floor(level / 10)
  };
});

Game.SkillRepository.define('speedoflight', function (level) {
  this.symbol = 'speedoflight';
  this.name = '%c{seashell}speed of light (' + level + ')%c{}';
  this.minLvl = 25;
  this.maxLvl = 100;
  this.target = 'self';
  this.type = 'chant';
  this.level = level;
  this.options = {
    cost: 50 + level * 2,
    agi: Math.floor(level / 2),
    speed: Math.floor(level / 2),
    duration: 20 + level * 2,
    range: 0,
    radius: 0
  };
});

Game.SkillRepository.define('plague', function (level) {
  this.symbol = 'plague';
  this.name = '%c{darkseagreen}plague (' + level + ')%c{}';
  this.minLvl = 20;
  this.maxLvl = 100;
  this.selfProtect = true;
  this.target = 'range';
  this.type = 'damage';
  this.level = level;
  this.options = {
    cost: 50 + level * 2,
    minatk: 10,
    maxatk: 20 + level + Math.floor(Math.random() * level),
    range: 6,
    radius: 2,
    poison: level * 0.03,
    duration: Math.floor(level / 3)
  };
});

Game.SkillRepository.define('heal', function (level) {
  this.symbol = 'heal';
  this.name = '%c{Chartreuse}heal (' + level + ')%c{}';
  this.minLvl = 15;
  this.maxLvl = 50;
  this.target = 'self';
  this.type = 'support';
  this.level = level;
  this.options = {
    cost: 20 + level * 2,
    heal: level,
    range: 0,
    radius: 0
  };
});

Game.SkillRepository.define('teleport', function (level) {
  this.symbol = 'teleport';
  this.name = '%c{mistyrose}teleport (' + level + ')%c{}';
  this.minLvl = 10;
  this.maxLvl = 50;
  this.target = 'self';
  this.type = 'support';
  this.level = level;
  this.options = {
    cost: 15 + level * 2,
    distance: Math.floor(level / 2),
    range: 0,
    radius: 0
  };
});
