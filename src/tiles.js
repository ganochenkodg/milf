var tileSet = document.createElement('img');
tileSet.src = 'resources/tiles.png';
const terrains = ['dungeon', 'stone', 'maze', 'swamp', 'bricks', 'skulls'];
const playerTiles = [
  'warrior1',
  'warrior2',
  'warrior3',
  'wizard1',
  'wizard2',
  'wizard3'
];
const gameTilemap = {
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
  //ui
  hp1: [256, 64],
  hp2: [288, 64],
  hp3: [320, 64],
  hp4: [352, 64],
  hp5: [384, 64],
  hp6: [416, 64],
  hp7: [448, 64],
  hp8: [480, 64],
  blanksquare: [0, 192],
  bluesquare: [32, 192],
  redsquare: [64, 192],
  greensquare: [96, 192],
  //enemies
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
  goblin1: [224, 224],
  goblin2: [256, 224],
  goblin3: [288, 224],
  goblin4: [320, 224],
  goblin5: [352, 224],
  goblin6: [384, 224],
  goblin7: [416, 224],
  goblin8: [448, 224],
  skeleton: [480, 224],
  lich: [512, 224],
  'dark knight': [544, 224],
  zombie: [576, 224],
  ghoul: [608, 224],
  //player tiles
  warrior1: [256, 0],
  wizard1: [288, 0],
  wizard2: [320, 0],
  wizard3: [352, 0],
  warrior2: [384, 0],
  warrior3: [420, 0],
  //food
  mushroom1: [256, 128],
  mushroom2: [288, 128],
  herb1: [256, 96],
  herb2: [288, 96],
  herb3: [320, 96],
  herb4: [352, 96],
  herb5: [384, 96],
  herb6: [416, 96],
  herb7: [448, 96],
  herb8: [480, 96],
  herb9: [512, 96],
  herb10: [544, 96],
  herb11: [576, 96],
  herb12: [608, 96],
  herb13: [640, 96],
  //weapon tiles
  sword1: [0, 256],
  sword2: [32, 256],
  sword3: [64, 256],
  sword4: [96, 256],
  sword5: [128, 256],
  sword6: [160, 256],
  sword7: [0, 288],
  sword8: [32, 288],
  sword9: [64, 288],
  sword10: [96, 288],
  sword11: [128, 288],
  sword12: [160, 288],
  staff1: [0, 320],
  staff2: [32, 320],
  staff3: [64, 320],
  staff4: [96, 320],
  staff5: [128, 320],
  staff6: [160, 320],
  staff7: [0, 352],
  staff8: [32, 352],
  staff9: [64, 352],
  staff10: [96, 352],
  staff11: [128, 352],
  staff12: [160, 352],
  //armor
  armor1: [192, 256],
  armor2: [224, 256],
  armor3: [256, 256],
  armor4: [288, 256],
  armor5: [320, 256],
  armor6: [352, 256],
  armor7: [192, 288],
  armor8: [224, 288],
  armor9: [256, 288],
  armor10: [288, 288],
  armor11: [320, 288],
  armor12: [352, 288],
  //other items
  potion1: [0, 384],
  potion2: [32, 384],
  potion3: [64, 384],
  potion4: [96, 384],
  potion5: [128, 384],
  potion6: [0, 416],
  potion7: [32, 416],
  potion8: [64, 416],
  potion9: [96, 416],
  potion10: [128, 416],
  scroll1: [0, 448],
  book1: [32, 448],
  scroll2: [64, 448],
  book2: [96, 448],
  scroll3: [128, 448],
  book3: [160, 448],
  //spells
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
