'use strict';

const tileSet = document.createElement('img');
tileSet.src = 'resources/tiles.png';

const terrains = ['dungeon', 'stone', 'maze', 'swamp', 'bricks', 'skulls'];
const playerTiles = ['warrior1', 'warrior2', 'warrior3', 'wizard1', 'wizard2', 'wizard3'];

const gameTilemap = {
  portal: [448, 0],
  // UI
  blanksquare: [0, 192],
  bluesquare: [32, 192],
  redsquare: [64, 192],
  greensquare: [96, 192],
  purplesquare: [128, 192],
  // Containers
  chest: [256, 32],
  barrel: [388, 32],
  coffin: [480, 32],
  crypt: [544, 32],
  // Enemies
  dog: [0, 224],
  puppy: [32, 224],
  hyena: [64, 224],
  fox: [96, 224],
  jackal: [128, 224],
  coyote: [160, 224],
  wolf: [192, 224],
  cat: [320, 128],
  bobcat: [352, 128],
  cougar: [384, 128],
  cheetah: [416, 128],
  lynx: [448, 128],
  ocelot: [480, 128],
  'male lion': [512, 128],
  'female lion': [544, 128],
  skeleton: [480, 224],
  lich: [512, 224],
  'dark knight': [544, 224],
  zombie: [576, 224],
  ghoul: [608, 224],
  ettin: [384, 256],
  'two headed ettin': [416, 256],
  troll: [448, 256],
  banshee: [384, 288],
  reaper: [416, 288],
  wraith: [448, 288],
  cultist: [480, 288],
  witch: [512, 288],
  'giant centipede': [192, 320],
  lampreymander: [224, 320],
  'giant earthworm': [256, 320],
  manticore: [288, 320],
  'giant ant': [320, 320],
  lycanthrope: [352, 320],
  'giant bat': [384, 320],
  'lesser giant ant': [416, 320],
  'giant spider': [448, 320],
  'lesser giant spider': [480, 320],
  warg: [512, 320],
  'giant rat': [544, 320],
  dryad: [320, 352],
  wendigo: [352, 352],
  'forest spirit': [384, 352],
  myconid: [416, 352],
  fleshlord1: [448, 352],
  fleshlord2: [480, 352],
  fleshlord3: [512, 352],
  fleshlordchant1: [544, 352],
  fleshlordchant2: [576, 352],
  fleshlordchant3: [608, 352],
  // Player tiles
  warrior1: [256, 0],
  wizard1: [288, 0],
  wizard2: [320, 0],
  wizard3: [352, 0],
  warrior2: [384, 0],
  warrior3: [416, 0],
  // Food & special
  mushroom1: [256, 128],
  mushroom2: [288, 128],
  heartoffleshlord: [160, 192],
  // Elemental weapons
  elementalsword1: [192, 352],
  elementalsword2: [224, 352],
  elementalstaff1: [256, 352],
  elementalstaff2: [288, 352],
  // Statuses & spells
  poison: [192, 448],
  freeze: [224, 448],
  stun: [256, 448],
  confuse: [288, 448],
  firearrow: [0, 480],
  poisonarrow: [32, 480],
  stonearrow: [64, 480],
  icearrow: [96, 480],
  poisonslash: [128, 480],
  rapidcut: [160, 480],
  iceshield: [192, 480],
  strengthofstone: [224, 480],
  twistingslash: [256, 480],
  fireball: [288, 480],
  acidcloud: [320, 480],
  calltheshadows: [352, 480],
  tsunami: [384, 480],
  crackedearth: [416, 480],
  flamechains: [448, 480],
  lightningstrike: [480, 480],
  arcaneshield: [512, 480],
  magiceye: [0, 512],
  icefall: [32, 512],
  auraoffear: [64, 512],
  frozentomb: [96, 512],
  fireshield: [128, 512],
  lightningbolt: [160, 512],
  rainofblades: [192, 512],
  honor: [224, 512],
  reflectionshield: [256, 512],
  auraofwinter: [288, 512],
  solareclipse: [320, 512],
  supernova: [352, 512],
  darkness: [384, 512],
  speedoflight: [416, 512],
  heal: [448, 512],
  plague: [480, 512],
  teleport: [512, 512]
};

// Terrain tile sets (6 terrains x 8 tile variants)
const TERRAIN_PARTS = ['wall', 'wallhor', 'floor', 'floorrandom', 'doorclose', 'dooropen', 'stairdown', 'stairup'];
terrains.forEach((terrain, row) => {
  TERRAIN_PARTS.forEach((part, col) => {
    gameTilemap[terrain + part] = [col * 32, row * 32];
  });
});

// Indexed sprite series
const addTileSeries = (prefix, count, startX, startY, perRow = count) => {
  for (let i = 0; i < count; i++) {
    const col = i % perRow;
    const row = Math.floor(i / perRow);
    gameTilemap[`${prefix}${i + 1}`] = [startX + col * 32, startY + row * 32];
  }
};

addTileSeries('hp', 8, 256, 64);
addTileSeries('goblin', 8, 224, 224);
addTileSeries('snake', 4, 480, 256);
addTileSeries('herb', 13, 256, 96);
addTileSeries('sword', 12, 0, 256, 6);
addTileSeries('staff', 12, 0, 320, 6);
addTileSeries('armor', 12, 192, 256, 6);
addTileSeries('potion', 10, 0, 384, 5);
addTileSeries('book', 6, 0, 448);

// 6x6 end-screen banners
for (let y = 0; y <= 5; y++) {
  for (let x = 0; x <= 5; x++) {
    gameTilemap[`badend${x}${y}`] = [x * 32, 544 + y * 32];
    gameTilemap[`goodend${x}${y}`] = [192 + x * 32, 544 + y * 32];
  }
}
