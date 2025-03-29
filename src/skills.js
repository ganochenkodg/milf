Game.skills = [];

Skill = function (properties) {
  properties = properties || {};
  this.name = properties['name'] || '';
  this.action = properties['action'] || '';
  this.level = properties['level'] || 1;
  this.options = properties['options'] || {};
  this.formulas = properties['formulas'] || {};
  this.symbol = properties['symbol'] || '';
  this.target = properties['target'] || '';
  this.type = properties['type'] || '';
  this.weapon = properties['weapon'] || false;
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
