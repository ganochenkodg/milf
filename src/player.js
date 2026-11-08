'use strict';

Game.entity = [];

const DIRECTION_KEYS = {
  38: 0, 104: 0,
  33: 1, 105: 1,
  39: 2, 102: 2,
  34: 3, 99: 3,
  40: 4, 98: 4,
  35: 5, 97: 5,
  37: 6, 100: 6,
  36: 7, 103: 7
};

const EQUIP_TYPES = new Set(['weapon', 'armor', 'book']);

class Player {
  constructor(properties = {}) {
    this.x = properties.x;
    this.y = properties.y;
    this.depth = 1;
    this.str = playerStatsMod + roll(3);
    this.int = playerStatsMod + roll(3);
    this.agi = playerStatsMod + roll(3);
    this.con = playerStatsMod + roll(3);
    this.minAtk = 1;
    this.maxAtk = 4;
    this.shield = 0;
    this.defense = Math.floor((this.agi + this.con) * 0.2) + this.shield;
    this.piety = 10;
    this.player = true;
    this.maxHp = 15 + this.con * 6 + this.str * 3;
    this.speed = 100;
    this.color = '#0000';
    this.maxMana = 10 + this.int * 8;
    this.hp = this.maxHp;
    this.mana = this.maxMana;
    this.name = Game.namegen();
    this.vision = 5;
    this.symbol = ROT.RNG.getItem(playerTiles);
    this.confuse = false;
    this.stun = false;
    this.frozen = false;
    this.resting = false;
    this.equipment = {};
    this.affects = [];
    this.books = [];
  }

  getSpeed() {
    return this.speed + this.agi * 0.5;
  }

  getMinAtk() {
    return Math.floor(this.minAtk * (1 + this.str * 0.05));
  }

  getMaxAtk() {
    return Math.floor(this.maxAtk * (1 + this.str * 0.05));
  }

  applyStats() {
    this.maxHp = 15 + this.con * 6 + this.str * 3;
    this.maxMana = 10 + this.int * 8;
    this.hp = Math.min(this.hp, this.maxHp);
    this.mana = Math.min(this.mana, this.maxMana);
    this.defense = Math.floor((this.agi + this.con) * 0.2) + this.shield;

    if (this.equipment.weapon) {
      this.minAtk = this.equipment.weapon.options.minatk;
      this.maxAtk = this.equipment.weapon.options.maxatk;
    } else {
      this.minAtk = 1;
      this.maxAtk = 4;
    }

    if (this.equipment.armor) {
      this.defense += this.equipment.armor.options.defense;
    }
  }

  mutate() {
    let [applied, idx] = Game.isAffectApplied(this, { symbol: 'fleshlordchant2' });
    if (applied) {
      this.affects[idx].symbol = 'fleshlordchant3';
      this.name = '%c{mediumaquamarine}fleshlord%c{}';
      this.symbol = 'fleshlord3';
      this.color = '#0000';
      return;
    }

    [applied, idx] = Game.isAffectApplied(this, { symbol: 'fleshlordchant1' });
    if (applied) {
      this.affects[idx].symbol = 'fleshlordchant2';
      this.color = '#626b';
      return;
    }

    Game.addAffect(0, {
      duration: 999999999,
      symbol: 'fleshlordchant1'
    });
    this.color = '#6267';
  }

  move(newx, newy) {
    if (this.frozen || (newx === this.x && newy === this.y)) return;
    this.x = newx;
    this.y = newy;
    Game.triggerTrap(this);
  }

  goDown() {
    const [x, y] = Game.getStairup(this.depth + 1);
    this.x = x;
    this.y = y;
    this.depth++;
    Game.messageBox.sendMessage('You went down the stairs.');
  }

  goUp() {
    const [x, y] = Game.getStairdown(this.depth - 1);
    this.x = x;
    this.y = y;
    this.depth--;
    Game.messageBox.sendMessage('You went up the stairs.');
  }

  hasVisibleHostile() {
    const tiles = Game.map[this.depth].Tiles;
    return Game.entity.some(
      (e) =>
        e !== this &&
        e.depth === this.depth &&
        'Actor' in e.acts &&
        tiles[e.x][e.y].Visible
    );
  }

  startResting() {
    if (this.hasVisibleHostile()) {
      Game.messageBox.sendMessage('You cannot rest while enemies are in sight!');
      Game.drawAll();
      return;
    }
    if (this.hp >= this.maxHp && this.mana >= this.maxMana) {
      Game.messageBox.sendMessage('You are already at full health and mana.');
      Game.drawAll();
      return;
    }
    this.resting = true;
    Game.messageBox.sendMessage(
      '%c{palegreen}You start resting... (press any key to stop)%c{}'
    );
    this.restStep();
    this.finishTurn();
  }

  restStep() {
    const hpGain = Math.max(1, Math.floor(this.maxHp * 0.01));
    const manaGain = Math.max(1, Math.floor(this.maxMana * 0.01));
    this.hp = Math.min(this.maxHp, this.hp + hpGain);
    this.mana = Math.min(this.maxMana, this.mana + manaGain);
  }

  async act() {
    this.applyStats();
    if (this.hp < 1) {
      this.resting = false;
      Game.engine.lock();
      Game.messageBox.sendMessage(
        'You are dead! Press %c{red}F5%c{} to start new game.'
      );
      Game.drawAll();
      Game.drawEnd('bad');
      return;
    }
    if (this.stun) {
      this.resting = false;
      Game.drawAll();
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return;
    }

    if (this.resting) {
      Game.drawAll();
      if (this.hasVisibleHostile()) {
        this.resting = false;
        Game.messageBox.sendMessage('%c{orange}Enemy spotted! You stop resting.%c{}');
        Game.drawAll();
      } else if (this.hp >= this.maxHp && this.mana >= this.maxMana) {
        this.resting = false;
        Game.messageBox.sendMessage('%c{palegreen}You are fully rested.%c{}');
        Game.drawAll();
      } else {
        window.addEventListener('keydown', this);
        await new Promise((resolve) => setTimeout(resolve, 70));
        window.removeEventListener('keydown', this);
        if (this.resting) {
          this.restStep();
          Game.drawAll();
          return;
        }
      }
    }

    Game.engine.lock();
    window.addEventListener('keydown', this);
  }

  Draw() {
    const tile = Game.map[this.depth].Tiles[this.x][this.y];
    const [camX, camY] = Game.getCamera(this.x, this.y);
    const trap = tile.trap?.revealed ? [tile.trap.type] : [];
    const symbols = [tile.Symbol, ...trap, this.symbol];
    const colors = [tile.Color, ...trap.map(() => '#0000'), this.color];
    Game.mainDisplay.draw(
      camX,
      camY,
      symbols,
      colors,
      symbols.map(() => 'transparent')
    );

    const xoffset = Game.screenWidth * 4 - 38;
    const weaponName = this.equipment.weapon ? this.equipment.weapon.name : '-';
    const armorName = this.equipment.armor ? this.equipment.armor.name : '-';

    const statsLines = [
      [2, `Name: ${this.name}`],
      [3, `HP: %c{red}${this.hp}/${this.maxHp} %c{}Mana: %c{blue}${this.mana}/${this.maxMana}`],
      [4, `Str: %c{gold}${this.str} %c{}Int: %c{turquoise}${this.int}`],
      [5, `Con: %c{yellowgreen}${this.con} %c{}Agi: %c{wheat}${this.agi}`],
      [6, `Defense: %c{coral}${this.defense} %c{}Speed: %c{lightblue}${this.getSpeed()}%`],
      [7, `Attack: %c{red}${this.getMinAtk()} - ${this.getMaxAtk()}`],
      [8, `Weapon: ${weaponName}`],
      [9, `Armor: ${armorName}`],
      [10, `Piety: %c{crimson}${this.piety}`],
      [14, `Lvl: ${this.depth} x: ${this.x} y: ${this.y}`]
    ];

    for (const [row, text] of statsLines) {
      Game.messageDisplay.drawText(xoffset, row, text);
    }

    for (let i = 0; i < this.affects.length; i++) {
      Game.mainDisplay.draw(Game.screenWidth - 1, i, this.affects[i].symbol, '#0000');
    }
  }

  doGetDamage(dmg, cap = 0.9) {
    if (this.resting) {
      this.resting = false;
      Game.messageBox.sendMessage('%c{orange}You take damage and stop resting!%c{}');
    }
    const actual = Math.max(1, Math.floor(dmg * (1 - Math.min(cap, this.defense / dmg))));
    this.hp -= actual;
    return actual;
  }

  doGetSkillDamage(dmg) {
    return this.doGetDamage(dmg, 0.6);
  }

  doAttack(x, y) {
    const target = Game.entity.find(
      (e) => e.x === x && e.y === y && e.depth === this.depth
    );
    if (!target) return;

    let dmg = randInt(this.getMinAtk(), this.getMaxAtk());
    let color = '%c{}';
    if (Math.random() < 0.05) {
      dmg *= 2;
      color = '%c{lime}';
    }
    const result = target.doGetDamage(dmg);
    Game.messageBox.sendMessage(
      `You hit the ${target.name} for ${color}${result} %c{}damage.`
    );
    Game.checkShields(this, target, 'physical', result);
    target.doDie();
    Game.drawMap();
    Game.drawEntities();
  }

  doWorship() {
    if (this.piety < 15) {
      Game.messageBox.sendMessage(
        'You are nothing for %c{gold}God of Random%c{}, get more piety.'
      );
      return;
    }
    const level = Math.floor(Math.log2(this.piety / 15 + 1));
    const threshold = 15 * (Math.pow(2, level) - 1);
    this.piety -= threshold;

    const r = Math.random();
    if (r < 0.03) {
      [this.x, this.y] = Game.returnFree(Game.map[this.depth]);
      Game.messageBox.sendMessage(
        '%c{gold}God of Random%c{} laughs and %c{violet}teleports%c{} you to a random location!'
      );
      return;
    }
    if (r < 0.08) {
      this.hp = this.maxHp;
      this.mana = this.maxMana;
      Game.messageBox.sendMessage(
        '%c{gold}God of Random%c{} blesses you, restoring all %c{red}health%c{} and %c{blue}mana%c{}!'
      );
      return;
    }
    if (r < 0.28) {
      const stat = ROT.RNG.getItem(['str', 'int', 'con', 'agi']);
      const boost = 1 + Math.floor(level / 2) + roll(1, level / 2);
      this[stat] += boost;
      this.applyStats();
      Game.messageBox.sendMessage(
        `%c{gold}God of Random%c{} blesses your body (%c{palegreen}+${boost} ${stat.toUpperCase()}%c{})!`
      );
      return;
    }

    let newItem;
    do {
      newItem = Game.ItemRepository.createRandom(level, level + 1);
    } while (newItem.type === 'potion');

    Game.messageBox.sendMessage(
      `%c{gold}God of Random%c{} gifts you the ${newItem.name}.`
    );
    if (Game.inventory.length > 9) {
      Game.map[this.depth].Tiles[this.x][this.y].items.push(newItem);
    } else {
      Game.inventory.push(newItem);
    }
  }

  finishTurn() {
    Game.drawAll();
    window.removeEventListener('keydown', this);
    Game.engine.unlock();
  }

  handleSkillMode(code) {
    if (code === 13) {
      mode.mode = 'play';
      window.removeEventListener('keydown', this);
      Game.useSkill(
        this,
        Game.skills[mode.chosenSkill],
        mode.skillx,
        mode.skilly
      );
      Game.drawAll();
      Game.engine.unlock();
      return;
    }
    if (code === 27) {
      mode.mode = 'play';
      this.finishTurn();
      return;
    }
    let newx = mode.skillx;
    let newy = mode.skilly;
    if (code in DIRECTION_KEYS) {
      const [dx, dy] = ROT.DIRS[8][DIRECTION_KEYS[code]];
      newx += dx;
      newy += dy;
    }
    if (`${newx},${newy}` in mode.skillMap) {
      mode.skillx = newx;
      mode.skilly = newy;
      Game.drawSkillMap();
    }
  }

  handleItemMode(code) {
    const num = mode.chosenItem;
    const item = Game.inventory[num];
    switch (code) {
      case 69: // E
        if (item.type === 'food') {
          Game.doItem('eat', num);
        } else if (item.type === 'potion') {
          Game.doItem('drink', num);
        } else if (EQUIP_TYPES.has(item.type)) {
          Game.doItem(item.isEquipped() ? 'unequip' : 'equip', num);
        }
        break;
      case 68: // D
        Game.doItem('drop', num);
        break;
      case 83: // S
        Game.doItem('sacrifice', num);
        break;
      case 87: // W
        if (EQUIP_TYPES.has(item.type)) {
          Game.doItem('equip', num);
        } else {
          Game.messageBox.sendMessage("You can't do this.");
        }
        break;
      case 27: // Esc
        break;
      default:
        Game.messageBox.sendMessage("You can't do this.");
    }
    mode.mode = 'play';
    this.finishTurn();
  }

  handleEvent(e) {
    if (this.resting) {
      this.resting = false;
      Game.messageBox.sendMessage('You stop resting.');
      Game.drawAll();
      return;
    }

    const code = e.keyCode;

    if (mode.mode === 'skill') {
      this.handleSkillMode(code);
      return;
    }

    if (mode.mode === 'item') {
      this.handleItemMode(code);
      return;
    }

    if (mode.mode !== 'play') return;

    let newx = this.x;
    let newy = this.y;
    let level = this.depth;

    if (code in DIRECTION_KEYS) {
      const [dx, dy] = ROT.DIRS[8][DIRECTION_KEYS[code]];
      newx += dx;
      newy += dy;
    } else if (code >= 48 && code <= 57) {
      Game.chooseSkill(code - 49);
      return;
    } else if (code >= 65 && code <= 74) {
      Game.chooseItem(code - 65);
      return;
    } else {
      switch (code) {
        case 87: // W
          this.doWorship();
          break;
        case 13: { // Enter
          Game.pickupItem();
          const currentTile = Game.map[level].Tiles[newx][newy];
          if (currentTile.Stairdown) {
            if (!Game.map[level + 1]) {
              Game.generateMap(level + 1);
            }
            this.goDown();
            this.finishTurn();
            return;
          }
          if (currentTile.Stairup) {
            this.goUp();
            this.finishTurn();
            return;
          }
          if (currentTile.Symbol === 'portal') {
            Game.doWin();
            window.removeEventListener('keydown', this);
            return;
          }
          break;
        }
        case 90: // Z
          this.startResting();
          return;
        case 101: // Numpad 5
          break;
        default:
          return;
      }
    }

    if (this.confuse && Math.random() > 0.5) {
      const [dx, dy] = ROT.DIRS[8][roll(8)];
      newx = this.x + dx;
      newy = this.y + dy;
    }

    const targetTile = Game.map[level].Tiles[newx][newy];
    if (targetTile.Blocked) {
      if (targetTile.Door) {
        Game.messageBox.sendMessage('You opened the door.');
        targetTile.Door = false;
        targetTile.Symbol = targetTile.Symbol.replace('close', 'open');
        targetTile.Blocked = false;
        targetTile.BlocksSight = false;
      } else {
        Game.messageBox.sendMessage("You can't go there.");
      }
      newx = this.x;
      newy = this.y;
    }

    if (Game.map[level].Tiles[newx][newy].Mob) {
      this.doAttack(newx, newy);
      newx = this.x;
      newy = this.y;
    }

    this.move(newx, newy);
    this.finishTurn();
  }

  doDie() {}
}

Game.doWin = function () {
  Game.engine.lock();
  Game.messageBox.sendMessage(
    '%c{gold}You found a way out from infinite dungeon! Congratulations!%c{}'
  );
  Game.drawAll();
  Game.drawEnd('good');
};
