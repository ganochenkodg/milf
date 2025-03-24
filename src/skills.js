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
};

Game.SkillRepository = new Game.Repository('skills', Skill);

Game.ItemRepository.define('weakarrow', function (level) {
  this.symbol = ROT.RNG.getItem([
    'firearrow',
    'poisonarrow',
    'stonearrow',
    'icearrow'
  ]);
  if (this.symbol == 'firearrow') {
    this.name = '%c{orange}fire arrow (' + level + ')%c{}';
  }
  if (this.symbol == 'poisonarrow') {
    this.name = '%c{lightgreen}poison arrow (' + level + ')%c{}';
  }
  if (this.symbol == 'stonearrow') {
    this.name = '%c{tan}stone arrow (' + level + ')%c{}';
  }
  if (this.symbol == 'icearrow') {
    this.name = '%c{lightblue}ice arrow (' + level + ')%c{}';
  }
  this.minLvl = 1;
  this.maxLvl = 5;
  this.target = 'range';
  this.type = 'damage';
  this.level = level;
  this.options = {
    cost: 8 + level * 2,
    minAtk: 1,
    maxAtk: 8 + Math.floor(Math.random() * level * 2),
    range: 2 + Math.floor(level / 2),
    radius: 0
  };
});
