var tileSet = document.createElement('img');
tileSet.src = 'resources/tiles.png';
var terrains = ['dungeon', 'stone'];
var playerTiles = ['human', 'dwarf', 'wizard'];
var gameTilemap = {
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
  human: [288, 0],
  dwarf: [256, 0],
  wizard: [320, 0]
};
