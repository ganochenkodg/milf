Game.skills = [];

Skill = function (properties) {
  properties = properties || {};
  this.name = properties['name'] || '';
  this.action = properties['action'] || '';
  this.level = properties['level'] || 1;
  this.options = properties['options'] || {};
  this.symbol = properties['symbol'] || '';
  this.target = properties['target'] || '';
  this.type = properties['type'] || '';
  this.weapon = properties['weapon'] || false;
};

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
    if (key == 'minatk' || key == 'maxatk') {
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
    cost: 8 + level * 2,
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
    cost: 10 + level * 2,
    minatk: 1,
    maxatk: 6 + Math.floor(Math.random() * level * 2),
    range: 2 + Math.floor(level / 2),
    radius: 0,
    poison: 0.5 + level * 0.05,
    duration: 2 + Math.floor(level / 2)
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
    cost: 10 + level * 2,
    minatk: 1,
    maxatk: 8 + Math.floor(Math.random() * level * 2),
    range: 2 + Math.floor(level / 2),
    radius: 0,
    confuse: 0.1 + level * 0.02,
    duration: 2 + Math.floor(level / 2)
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
    cost: 10 + level * 2,
    minatk: 1,
    maxatk: 6 + Math.floor(Math.random() * level * 2),
    range: 2 + Math.floor(level / 2),
    radius: 0,
    frozen: 0.1 + level * 0.04,
    duration: 2 + Math.floor(level / 2)
  };
});
