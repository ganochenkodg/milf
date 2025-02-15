var tileSet = document.createElement('img');
tileSet.src = 'resources/tiles.png';
var terrains = ['dungeon', 'stone', 'maze'];
var playerTiles = ['human', 'dwarf', 'wizard', 'wizard2', 'thief', 'knight'];
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
  //player tilkes
  human: [288, 0],
  dwarf: [256, 0],
  wizard: [320, 0],
  wizard2: [352, 0],
  thief: [384, 0],
  knight: [420, 0]
};
