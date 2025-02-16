var tileSet = document.createElement('img');
tileSet.src = 'resources/tiles.png';
var terrains = ['dungeon', 'stone', 'maze', 'swamp', 'bricks', 'skulls'];
var playerTiles = [
  'warrior1',
  'warrior2',
  'warrior3',
  'wizard1',
  'wizard2',
  'wizard3'
];
var gameTilemap = {
  //dungeon tiles
  dungeonwall: [0, 0],
  dungeonwallhor: [32, 0],
  dungeonfloor: [64, 0],
  dungeonfloorrandom: [96, 0],
  dungeondoorclose: [128, 0],
  dungeondooropen: [160, 0],
  dungeonstairdown: [192, 0],
  dungeonstairup: [224, 0],
  stonewall: [0, 32],
  stonewallhor: [32, 32],
  stonefloor: [64, 32],
  stonefloorrandom: [96, 32],
  stonedoorclose: [128, 32],
  stonedooropen: [160, 32],
  stonestairdown: [192, 32],
  stonestairup: [224, 32],
  mazewall: [0, 64],
  mazewallhor: [32, 64],
  mazefloor: [64, 64],
  mazefloorrandom: [96, 64],
  mazedoorclose: [128, 64],
  mazedooropen: [160, 64],
  mazestairdown: [192, 64],
  mazestairup: [224, 64],
  swampwall: [0, 96],
  swampwallhor: [32, 96],
  swampfloor: [64, 96],
  swampfloorrandom: [96, 96],
  swampdoorclose: [128, 96],
  swampdooropen: [160, 96],
  swampstairdown: [192, 96],
  swampstairup: [224, 96],
  brickswall: [0, 128],
  brickswallhor: [32, 128],
  bricksfloor: [64, 128],
  bricksfloorrandom: [96, 128],
  bricksdoorclose: [128, 128],
  bricksdooropen: [160, 128],
  bricksstairdown: [192, 128],
  bricksstairup: [224, 128],
  skullswall: [0, 160],
  skullswallhor: [32, 160],
  skullsfloor: [64, 160],
  skullsfloorrandom: [96, 160],
  skullsdoorclose: [128, 160],
  skullsdooropen: [160, 160],
  skullsstairdown: [192, 160],
  skullsstairup: [224, 160],

  //player tilkes
  warrior1: [256, 0],
  wizard1: [288, 0],
  wizard2: [320, 0],
  wizard3: [352, 0],
  warrior2: [384, 0],
  warrior3: [420, 0]
};
