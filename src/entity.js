Entity = function (properties) {
  properties = properties || {};
  this.x = properties['x'] || 0;
  this.y = properties['y'] || 0;
  this.player = false;
  this.depth = properties['depth'] || 1;
  this.level = properties['level'] || 1;
  this.name = properties['name'] || 'npc';
  this.acts = properties['acts'] || {};
  this.drop = properties['drop'] || {};
  this.str = properties['str'] || 1;
  this.agi = properties['agi'] || 1;
  this.int = properties['int'] || 1;
  this.con = properties['con'] || 1;
  this.skills = properties['skills'] || [];
  this.vision = properties['vision'] || 5;
  this.speed = properties['speed'] || 100;
  this.symbol = properties['symbol'] || 'wolf';
  this.maxHp = 15 + this.con * 6 + this.str * 3;
  this.hp = this.maxHp;
  this.maxMana = 10 + this.int * 8;
  this.mana = this.maxMana;
  this.color = '#0000';
  this.confuse = false;
  this.stun = false;
  this.summoned = false;
  this.frozen = false;
  this.minAtk = properties['minAtk'] || 1;
  this.maxAtk = properties['maxAtk'] || 4;
  this.skillRange = properties['skillRange'] || 3;
  this.range = properties['range'] || 1;
  this.defense =
    properties['defense'] + Math.floor((this.agi + this.con) * 0.1) || 1;

  this.rareness = 1;
  //this.rarechance = RareItemDefaultChance;
  this.affects = [];
  this.timestamp = Math.random() * 1000 + Date.now();
  this.getSpeed = function () {
    return this.speed + this.agi * 0.5;
  };
  this.getMinAtk = function () {
    return Math.floor(this.minAtk * (1 + this.str * 0.05));
  };
  this.getMaxAtk = function () {
    return Math.floor(this.maxAtk * (1 + this.str * 0.05));
  };
};

function mobPasses(x, y) {
  var level = Game.entity[0].depth;
  if (
    x > 0 &&
    x < Game.map[level].width &&
    y > 0 &&
    y < Game.map[level].height
  ) {
    return (
      !Game.map[level].Tiles[x][y].Blocked && !Game.map[level].Tiles[x][y].Mob
    );
  }
  return false;
}

Entity.prototype.act = function () {
  this.doDie();
  if (this.stun) {
    return;
  }
  if (this.depth != Game.entity[0].depth) {
    return;
  }
  if ('Hunt' in this.acts) {
    this.doHunt();
  }
};

Entity.prototype.doDie = function () {
  if (this.hp < 1) {
    var level = this.depth;
    if ('Actor' in this.acts) {
      Game.messageBox.sendMessage('The ' + this.name + ' died.');
    } else {
      Game.messageBox.sendMessage('The ' + this.name + ' destroyed.');
    }
    Game.entity[0].piety +=
      this.level + Math.floor(Math.random() * this.level * 0.5);
    scheduler.remove(this);

    Game.map[level].Tiles[this.x][this.y].Mob = false;
    for (var i = 0; i < Game.entity.length; i++) {
      if (Game.entity[i] === this) {
        Game.entity.splice(i, 1);
      }
    }
    Game.drawAll();
  }
};

Entity.prototype.doAttack = function (targetNum) {
  let dmg =
    this.getMinAtk() +
    Math.floor(Math.random() * (this.getMaxAtk() - this.getMinAtk()));
  let _color = '%c{}';
  if (Math.random() < 0.05) {
    dmg = dmg * 2;
    _color = '%c{lime}';
  }
  if (this.confuse && Math.random() > 0.5) {
    let _confused = ROT.DIRS[8][Math.floor(Math.random() * 7)];
    newx = this.x + _confused[0];
    newy = this.y + _confused[1];
    for (let i = 0; i < Game.entity.length; i++) {
      if (
        Game.entity[i].x == newx &&
        Game.entity[i].y == newy &&
        Game.entity[i].depth == this.depth
      ) {
        let result = Game.entity[i].doGetDamage(dmg);
        Game.messageBox.sendMessage(
          'The ' +
            this.name +
            ' occasionally hits ' +
            Game.entity[i].name +
            ' for ' +
            _color +
            result +
            ' %c{}damage.'
        );
        Game.entity[i].doDie();
      }
    }
  } else {
    let result = Game.entity[targetNum].doGetDamage(dmg);
    Game.messageBox.sendMessage(
      'The ' +
        this.name +
        ' hits ' +
        (targetNum == 0 ? 'you' : 'the ' + Game.entity[targetNum].name) +
        ' for ' +
        _color +
        result +
        ' %c{}damage.'
    );
  }
  Game.drawAll();
};

Entity.prototype.doGetDamage = function (dmg) {
  dmg = Math.max(1, Math.floor(dmg * (1 - Math.min(0.9, this.defense / dmg))));
  this.hp -= dmg;
  return dmg;
};

Entity.prototype.doGetSkillDamage = function (dmg) {
  dmg = Math.max(1, Math.floor(dmg * (1 - Math.min(0.6, this.defense / dmg))));
  this.hp -= dmg;
  return dmg;
};

Entity.prototype.doHunt = function () {
  if (this.hp < 1) {
    return;
  }
  var level = this.depth;
  var targetNum = 0;
  let enemyRadius = this.vision + 1;
  let enemyMap = [];
  fov.compute(this.x, this.y, this.vision, function (x, y, r, visibility) {
    enemyMap[x + ',' + y] = r;
  });

  var key = Game.entity[0].x + ',' + Game.entity[0].y;
  if (key in enemyMap && enemyMap[key] < enemyRadius) {
    var x = Game.entity[0].x;
    var y = Game.entity[0].y;

    var astar = new ROT.Path.AStar(x, y, mobPasses, {
      topology: 8
    });

    var path = [];
    var pathCallback = function (x, y) {
      path.push([x, y]);
    };
    Game.map[level].Tiles[this.x][this.y].Mob = false;
    astar.compute(this.x, this.y, pathCallback);
    Game.map[level].Tiles[this.x][this.y].Mob = true;
    path.shift();
    if (path.length > this.vision) {
      return;
    }

    if (
      'Skills' in this.acts &&
      Math.random(0) > 0.2 &&
      path.length < this.skillRange + 1
    ) {
      var useSkill = false;
      let _skill = ROT.RNG.getItem(this.skills);
      if (
        _skill.type == 'damage' &&
        path.length < _skill.options.range + 1 &&
        this.mana > _skill.options.cost
      ) {
        useSkill = true;
      }
      if (_skill.type == 'chant' && this.mana > _skill.options.cost) {
        let affectApplied = Game.isAffectApplied(this, _skill);
        if (!affectApplied[0]) {
          useSkill = true;
        }
      }
      if (useSkill) {
        console.log(_skill);
        this.doSkills(0, _skill);
        return;
      }
    }

    if (path.length > this.range) {
      if (this.confuse && Math.random() > 0.5) {
        let _confused = ROT.DIRS[8][Math.floor(Math.random() * 7)];
        let newx = this.x + _confused[0];
        let newy = this.y + _confused[1];
        this.move(newx, newy);
      } else {
        this.move(path[0][0], path[0][1]);
      }
    } else if ('Attack' in this.acts && path.length == 1) {
      this.doAttack(0);
    }
  }
};

Entity.prototype.doSkills = function (targetNum, skill) {
  if (skill.target == 'range') {
    Game.useSkill(
      this,
      skill,
      Game.entity[targetNum].x,
      Game.entity[targetNum].y
    );
  }
  if (skill.target == 'self') {
    Game.useSkill(this, skill, this.x, this.y);
  }
};

Entity.prototype.move = function (newx, newy) {
  if (this.frozen) return;
  var level = this.depth;
  Game.map[level].Tiles[this.x][this.y].Mob = false;
  this.x = newx;
  this.y = newy;
  Game.map[level].Tiles[this.x][this.y].Mob = true;
};

Entity.prototype.Draw = function () {
  if (this.depth != Game.entity[0].depth) {
    return;
  }
  var level = this.depth;
  if (Game.map[level].Tiles[this.x][this.y].Visible) {
    let hpbar = Math.min(8, Math.floor((this.hp * 8) / this.maxHp));
    if (hpbar < 1) {
      hpbar = 1;
    }
    let _color = Game.map[level].Tiles[this.x][this.y].Color;
    /*
    if (this.summoned) {
      var hpmod = 30;
    } else {
      var hpmod = (this.rareness - 1) * 8;
    }
    */
    Game.mainDisplay.draw(
      Game.getCamera(this.x, this.y)[0],
      Game.getCamera(this.x, this.y)[1],
      [Game.map[level].Tiles[this.x][this.y].Symbol, this.symbol, 'hp' + hpbar],
      [_color, this.color, '#0000'],
      ['transparent', 'transparent', 'transparent']
    );
  }
};

Game.drawEntities = function () {
  for (let i = 0; i < Game.entity.length; i++) {
    Game.entity[i].Draw();
  }
};

Game.EntityRepository = new Game.Repository('entities', Entity);

Game.EntityRepository.define('dogs', function (level) {
  this.minLvl = 1;
  this.maxLvl = 10;
  this.level = level;
  this.name = ROT.RNG.getItem([
    'dog',
    'puppy',
    'hyena',
    'fox',
    'jackal',
    'coyote',
    'wolf'
  ]);
  this.str = 1 + Math.floor(Math.random() * level * 2);
  this.agi = 1 + Math.floor(Math.random() * level * 2);
  this.int = 1 + Math.floor(Math.random() * level * 2);
  this.con = 1 + Math.floor(Math.random() * level * 2);
  this.maxAtk = 2 + Math.floor(Math.random() * level * 2);
  this.acts = {
    Hunt: true,
    Attack: true,
    Actor: true
  };
  this.symbol = this.name;
});

Game.EntityRepository.define('littlegoblinwarrior', function (level) {
  this.minLvl = 2;
  this.maxLvl = 10;
  this.level = level;
  this.name = 'little goblin warrior';
  this.str = 4 + Math.floor(Math.random() * level * 2);
  this.agi = 1 + Math.floor(Math.random() * level * 2);
  this.int = 3 + Math.floor(Math.random() * level * 2);
  this.con = 3 + Math.floor(Math.random() * level * 2);
  this.maxAtk = 6 + Math.floor(Math.random() * level * 2);
  this.skillRange = 1;
  this.acts = {
    Hunt: true,
    Attack: true,
    Actor: true,
    Skills: true
  };
  this.skills = [
    Game.SkillRepository.create(
      ROT.RNG.getWeightedValue({
        rapidcut: 2,
        poisonslash: 1,
        strengthofstone: 1
      }),
      1 + Math.floor((Math.random() * level) / 2)
    ),
    Game.SkillRepository.create('strengthofstone', 1)
  ];

  this.symbol = ROT.RNG.getItem(['goblin3', 'goblin6']);
});

Game.EntityRepository.define('littlegoblinwizard', function (level) {
  this.minLvl = 3;
  this.maxLvl = 10;
  this.level = level;
  this.name = 'little goblin wizard';
  this.str = 1 + Math.floor(Math.random() * level * 2);
  this.agi = 3 + Math.floor(Math.random() * level * 2);
  this.int = 5 + Math.floor(Math.random() * level * 2);
  this.con = 1 + Math.floor(Math.random() * level * 2);
  this.maxAtk = 2 + Math.floor(Math.random() * level * 2);
  this.acts = {
    Hunt: true,
    Attack: true,
    Actor: true,
    Skills: true
  };
  this.skills = [
    Game.SkillRepository.create(
      ROT.RNG.getWeightedValue({
        firearrow: 3,
        icearrow: 1,
        poisonarrow: 2,
        stonearrow: 1,
        iceshield: 1
      }),
      1 + Math.floor((Math.random() * level) / 2)
    )
  ];
  this.symbol = ROT.RNG.getItem(['goblin7', 'goblin8']);
});
