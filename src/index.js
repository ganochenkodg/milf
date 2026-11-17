'use strict';

const scheduler = new ROT.Scheduler.Speed();
const INVENTORY_LETTERS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];

const mode = {
  mode: 'play',
  chosenItem: -1,
  chosenSkill: -1,
  skillMap: null,
  skillx: -1,
  skilly: -1
};

const createPeriodicActor = (speed, act) => ({
  getSpeed: () => speed,
  act
});

const Game = {
  mainDisplay: null,
  messageDisplay: null,
  messageBox: null,
  engine: null,
  inventory: [],
  skills: [],
  screenWidth: 25,
  screenHeight: 10,

  init(gameMode = 'normal') {
    document.getElementById('menu')?.remove();

    this.screenWidth = Math.max(20, Math.floor((window.innerWidth - 300) / 32));
    this.screenHeight = Math.max(11, Math.floor((window.innerHeight - 360) / 32));

    this.mainDisplay = new ROT.Display({
      width: this.screenWidth,
      height: this.screenHeight + 1,
      layout: 'tile',
      tileColorize: true,
      fg: 'transparent',
      bg: 'black',
      tileWidth: 32,
      tileHeight: 32,
      tileSet,
      tileMap: gameTilemap
    });

    this.messageDisplay = new ROT.Display({
      width: this.screenWidth * 4,
      height: 16,
      fontSize: 13
    });

    document.body.appendChild(this.mainDisplay.getContainer());
    document.body.appendChild(this.messageDisplay.getContainer());
    this.messageBox = new Game.MessageBox(13);

    cfg = DIFFICULTY_SETTINGS[gameMode] || DIFFICULTY_SETTINGS.normal;
    for (let i = 0; i < cfg.startItems; i++) {
      this.inventory.push(Game.ItemRepository.createRandom(1, cfg.maxStartLvl));
    }

    this.generateMap(1);

    const [px, py] = this.returnFree(Game.map[1]);
    const player = new Player({ x: px, y: py });
    Game.entity.unshift(player);

    const regen = createPeriodicActor(15, () => {
      for (const e of Game.entity) {
        if (e.depth !== Game.entity[0].depth || (!e.player && !('Actor' in e.acts))) continue;
        e.hp = Math.min(e.maxHp, e.hp + 1 + Math.floor(e.maxHp / 100) + Math.floor(e.con / 5));
        e.mana = Math.min(e.maxMana, e.mana + 1 + Math.floor(e.maxMana / 100) + Math.floor(e.int / 5));
      }
    });

    scheduler.add(player, true);
    scheduler.add(regen, true);
    scheduler.add(new checkAffects(), true);

    if (tileSet.complete) {
      this.drawAll();
    } else {
      tileSet.onload = () => this.drawAll();
    }

    this.engine = new ROT.Engine(scheduler);
    this.engine.start();
  },

  drawAll() {
    this.messageDisplay.clear();
    this.drawMap();
    this.drawEntities();
    this.drawBar();
    this.messageBox.Draw();
  },

  drawEnd(endType) {
    const xOffset = Math.floor(this.screenWidth / 2) - 3;
    const yOffset = Math.floor(this.screenHeight / 2) - 2;
    for (let y = 0; y <= 5; y++) {
      for (let x = 0; x <= 5; x++) {
        this.mainDisplay.draw(x + xOffset, y + yOffset, `${endType}end${x}${y}`);
      }
    }
  },

  drawBar() {
    for (let i = 0; i < 10; i++) {
      this.messageDisplay.draw(i * 4 + 1, 0, i + 1, 'beige');
      const skill = this.skills[i];
      if (!skill) {
        this.mainDisplay.draw(i, this.screenHeight, 'blanksquare', '#0000', 'black');
      } else {
        this.mainDisplay.draw(
          i,
          this.screenHeight,
          ['bluesquare', skill.symbol],
          ['#0000', '#0000'],
          ['black', 'transparent']
        );
      }

      const slotX = i + this.screenWidth - 10;
      this.messageDisplay.draw(slotX * 4 + 2, 0, INVENTORY_LETTERS[i], 'beige');
      const item = this.inventory[i];
      if (!item) {
        this.mainDisplay.draw(slotX, this.screenHeight, 'blanksquare', '#0000', 'black');
      } else {
        const bgSquare =
          item.symbol === 'heartoffleshlord'
            ? 'purplesquare'
            : item.isEquipped()
              ? 'greensquare'
              : 'redsquare';
        this.mainDisplay.draw(
          slotX,
          this.screenHeight,
          [bgSquare, item.symbol],
          ['#0000', item.color],
          ['black', 'transparent']
        );
      }
    }
  }
};

Game.Repository = class Repository {
  constructor(name, ctor) {
    this._name = name;
    this._templates = {};
    this._ctor = ctor;
  }

  define(name, template) {
    this._templates[name] = template;
  }

  create(name, level) {
    level = Math.max(1, level);
    const Template = this._templates[name];
    if (!Template) {
      throw new Error(`No template named '${name}' in repository '${this._name}'`);
    }
    return new this._ctor(new Template(level));
  }

  createRandom(minlvl, maxlvl) {
    minlvl = Math.max(1, minlvl);
    maxlvl = Math.max(minlvl, maxlvl);
    const keys = Object.keys(this._templates);
    let result;
    for (let i = 0; i <= 50; i++) {
      result = this.create(ROT.RNG.getItem(keys), randInt(minlvl, maxlvl));
      if (result.maxLvl >= minlvl && result.minLvl <= maxlvl) {
        return result;
      }
    }
    return result;
  }
};
