Game.entity = [];

Player = function (properties) {
  properties = properties || {};
  this.x = properties['x'];
  this.y = properties['y'];
  this.depth = 1;
  this.str = 5 + Math.floor(Math.random() * 3);
  this.int = 5 + Math.floor(Math.random() * 3);
  this.agi = 5 + Math.floor(Math.random() * 3);
  this.con = 5 + Math.floor(Math.random() * 3);
  this.minAtk = 1;
  this.maxAtk = 4;
  this.defense = Math.floor((this.agi + this.con) * 0.1);
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
  this.summoned = false;
  this.crippled = false;
  this.equipment = {};
  this.affects = [];
  this.books = [];
  this.getSpeed = function () {
    return this.speed + this.agi * 0.5;
  };
  this.getMinAtk = function () {
    return Math.floor(this.minAtk * (1 + this.str * 0.05));
  };
  this.getMaxAtk = function () {
    return Math.floor(this.maxAtk * (1 + this.str * 0.05));
  };
};

Player.prototype.applyStats = function () {
  this.maxHp = 15 + this.con * 6 + this.str * 3;
  this.maxMana = 10 + this.int * 8;
  this.hp = Math.min(this.hp, this.maxHp);
  this.mana = Math.min(this.mana, this.maxMana);
  this.defense = Math.floor((this.agi + this.con) * 0.1);
  if (typeof this.equipment.weapon !== 'undefined') {
    this.minAtk = this.equipment.weapon.options.minatk;
    this.maxAtk = this.equipment.weapon.options.maxatk;
  } else {
    this.minAtk = 1;
    this.maxAtk = 4;
  }
  if (typeof this.equipment.armor !== 'undefined') {
    this.defense += this.equipment.armor.options.defense;
  }
};

Player.prototype.move = function (newx, newy) {
  if (this.crippled) return;
  this.x = newx;
  this.y = newy;
};

Player.prototype.goDown = function () {
  var stairloc = Game.getStairup(Game.entity[0].depth + 1);
  Game.entity[0].x = stairloc[0];
  Game.entity[0].y = stairloc[1];
  Game.entity[0].depth++;
  Game.messageBox.sendMessage('You went down the stairs.');
};

Player.prototype.goUp = function () {
  var stairloc = Game.getStairdown(Game.entity[0].depth - 1);
  Game.entity[0].x = stairloc[0];
  Game.entity[0].y = stairloc[1];
  Game.entity[0].depth--;
  Game.messageBox.sendMessage('You went up the stairs.');
};

Player.prototype.act = function () {
  if (this.stun) {
    return;
  }
  Game.engine.lock();
  Game.entity[0].applyStats();
  if (Game.entity[0].hp < 1) {
    Game.messageBox.sendMessage(
      'You are dead! Press %c{red}F5%c{} to start new game.'
    );
    Game.drawAll();
    return;
  }
  this.doDie();
  window.addEventListener('keydown', this);
};

Player.prototype.Draw = function () {
  let _color = Game.map[Game.entity[0].depth].Tiles[this.x][this.y].Color;
  Game.mainDisplay.draw(
    Game.getCamera(Game.entity[0].x, Game.entity[0].y)[0],
    Game.getCamera(Game.entity[0].x, Game.entity[0].y)[1],
    [
      Game.map[Game.entity[0].depth].Tiles[Game.entity[0].x][Game.entity[0].y]
        .Symbol,
      Game.entity[0].symbol
    ],
    [_color, this.color],
    ['transparent', 'transparent']
  );
  var xoffset = Game.screenWidth * 4 - 30;
  Game.messageDisplay.drawText(xoffset, 2, 'Name: ' + Game.entity[0].name);
  Game.messageDisplay.drawText(
    xoffset,
    3,
    'HP: %c{red}' +
      Game.entity[0].hp +
      '/' +
      Game.entity[0].maxHp +
      ' %c{}Mana: %c{blue}' +
      Game.entity[0].mana +
      '/' +
      Game.entity[0].maxMana
  );
  Game.messageDisplay.drawText(
    xoffset,
    4,
    'Str: %c{gold}' +
      Game.entity[0].str +
      ' %c{}Int: %c{turquoise}' +
      Game.entity[0].int
  );
  Game.messageDisplay.drawText(
    xoffset,
    5,
    'Con: %c{yellowgreen}' +
      Game.entity[0].con +
      ' %c{}Agi: %c{wheat}' +
      Game.entity[0].agi
  );
  Game.messageDisplay.drawText(
    xoffset,
    6,
    'Defense: %c{coral}' +
      Game.entity[0].defense +
      ' %c{}Speed: %c{lightblue}' +
      this.getSpeed() +
      '%'
  );
  Game.messageDisplay.drawText(
    xoffset,
    7,
    'Attack: %c{red}' +
      Game.entity[0].getMinAtk() +
      ' - ' +
      Game.entity[0].getMaxAtk()
  );
  Game.messageDisplay.drawText(
    xoffset,
    14,
    'Lvl: ' +
      Game.entity[0].depth +
      ' x: ' +
      Game.entity[0].x +
      ' y: ' +
      Game.entity[0].y
  );

  let _piety = 'Piety: %c{crimson}';
  Game.messageDisplay.drawText(xoffset, 10, _piety + Game.entity[0].piety);
  var item = null;
  if (typeof Game.entity[0].equipment.weapon === 'undefined') {
    item = '-';
  } else {
    item = Game.entity[0].equipment.weapon.name;
  }
  Game.messageDisplay.drawText(xoffset, 8, 'Weapon: ' + item);
  if (typeof Game.entity[0].equipment.armor === 'undefined') {
    item = '-';
  } else {
    item = Game.entity[0].equipment.armor;
  }
  Game.messageDisplay.drawText(xoffset, 9, 'Armor: ' + item);
  /*
  if (Game.entity[0].affects.length > 0) {
    for (let i = 0; i < Game.entity[0].affects.length; i++) {
      Game.display.draw(Game.screenWidth - 1, i, ['whitesquare', Game.entity[0].affects[i].Symbol], ['#0000', '#0000']);
    }
  }
  */
};

Player.prototype.doGetDamage = function (dmg) {
  dmg = Math.max(1, Math.floor(dmg * (1 - Math.min(0.9, this.defense / dmg))));
  this.hp -= dmg;
  return dmg;
};

Player.prototype.doAttack = function (x, y) {
  for (let i = 0; i < Game.entity.length; i++) {
    if (
      Game.entity[i].x == x &&
      Game.entity[i].y == y &&
      Game.entity[i].depth == Game.entity[0].depth
    ) {
      let dmg =
        this.getMinAtk() +
        Math.floor(Math.random() * (this.getMaxAtk() - this.getMinAtk()));
      let _color = '%c{}';
      if (Math.random() < 0.05) {
        dmg = dmg * 2;
        _color = '%c{lime}';
      }
      /*
      if (Game.entity[i].summoned) {
        let tmpx = this.x;
        let tmpy = this.y;
        this.x = Game.entity[i].x;
        this.y = Game.entity[i].y;
        Game.entity[i].Move(tmpx, tmpy);
      } else {
      */
      let result = Game.entity[i].doGetDamage(dmg);
      Game.messageBox.sendMessage(
        'You hit the ' +
          Game.entity[i].name +
          ' for ' +
          _color +
          result +
          ' %c{}damage.'
      );
      Game.entity[i].doDie();
      // }
      Game.drawMap();
      Game.drawEntities();
    }
  }
};

Player.prototype.handleEvent = function (e) {
  var newx = this.x;
  var newy = this.y;
  var level = Game.entity[0].depth;
  var code = e.keyCode;
  var keyMap = {};
  keyMap[38] = 0;
  keyMap[33] = 1;
  keyMap[39] = 2;
  keyMap[34] = 3;
  keyMap[40] = 4;
  keyMap[35] = 5;
  keyMap[37] = 6;
  keyMap[36] = 7;
  /*
  if (mode.mode == 'skill') {
    newx = mode.skillx;
    newy = mode.skilly;
    switch (code) {
      case 13:
        mode.mode = 'play';
        window.removeEventListener('keydown', this);
        Game.useSkill(
          Game.entity[0],
          Game.skills[mode.chosenskill],
          mode.skillx,
          mode.skilly
        );
        Game.drawAll();
        Game.engine.unlock();
        return;
        break;
      case 27:
        mode.mode = 'play';
        Game.drawAll();
        window.removeEventListener('keydown', this);
        Game.engine.unlock();
        return;
        break;
      case 35:
      case 37:
      case 36:
      case 38:
      case 33:
      case 39:
      case 40:
      case 34:
        var diff = ROT.DIRS[8][keyMap[code]];
        newx = newx + diff[0];
        newy = newy + diff[1];
        break;
      default:
        break;
    }
    var key = newx + ',' + newy;
    if (key in mode.skillmap) {
      mode.skillx = newx;
      mode.skilly = newy;
      Game.drawSkillMap();
    }
    return;
  }
  */

  if (mode.mode == 'item') {
    switch (code) {
      case 69:
        let itemNum = mode.chosenItem;
        if (Gem.inventory[itemNum].type == 'food') {
          Game.doItem('eat');
        }
        if (Gem.inventory[itemNum].type == 'potion') {
          Game.doItem('drink');
        }
        if (
          Gem.inventory[itemNum].type == 'weapon' ||
          Gem.inventory[itemNum] == 'armor' ||
          Gem.inventory[itemNum] == 'book'
        ) {
          if (Game.inventory[itemNum].isEquipped()) {
            Game.doItem('unequip');
          } else {
            Game.doItem('equip');
          }
        }
        break;
      case 68:
        Game.doItem('drop');
        break;
      case 83:
        Game.doItem('sacrifice');
        break;
      case 87:
        Game.doItem('equip');
        break;
      case 27:
        break;
      default:
        Game.messageBox.sendMessage("You can't do this.");
    }
    mode.mode = 'play';
    Game.drawAll();
    window.removeEventListener('keydown', this);
    Game.engine.unlock();
    return;
  }

  if (mode.mode == 'play') {
    switch (code) {
      /*
      case 87:
        this.doWorship();
        break;
      case 191:
        Game.printhelp();
        break;
        */
      case 13:
        Game.pickupItem();
        if (Game.map[level].Tiles[newx][newy].Stairdown) {
          if (typeof Game.map[level + 1] === 'undefined') {
            Game.generateMap(level + 1);
          }
          Game.entity[0].goDown();
          newx = this.x;
          newy = this.y;
          level = Game.entity[0].depth;
          break;
        }
        if (Game.map[level].Tiles[newx][newy].Stairup) {
          Game.entity[0].goUp();
          newx = this.x;
          newy = this.y;
          level = Game.entity[0].depth;
        }
        break;
      case 33:
      case 34:
      case 35:
      case 36:
      case 37:
      case 38:
      case 39:
      case 40:
        var diff = ROT.DIRS[8][keyMap[code]];
        newx = newx + diff[0];
        newy = newy + diff[1];
        break;
      /*
      case 49:
      case 50:
      case 51:
      case 52:
      case 53:
      case 54:
      case 55:
      case 56:
      case 57:
        Game.chooseSkill(code - 49);
        return;
        break;
        */
      case 65:
      case 66:
      case 67:
      case 68:
      case 69:
      case 70:
      case 71:
      case 72:
      case 73:
      case 74:
        Game.chooseItem(code - 65);
        return;
        break;
      /*
      case 190:
        if (!Game.map[level].Tiles[newx][newy].Stairdown) {
          Game.messagebox.sendMessage('You cant go down there.');
        } else {
          if (typeof Game.map[level + 1] === 'undefined') {
            Game.generateMap(level + 1);
          }
          Game.entity[0].godown();
          newx = this.x;
          newy = this.y;
          level = Game.entity[0].depth;
        }
        break;
      case 188:
        Game.entity[0].goup();
        newx = this.x;
        newy = this.y;
        level = Game.entity[0].depth;
        break;
      case 220:
        Game.pickupItem();
        break;
      case 12:
      */
      case 90:
        newx = this.x;
        newy = this.y;
        break;
      default:
        return;
    }
    if (this.confuse && Math.random() > 0.5) {
      let _confused = ROT.DIRS[8][Math.floor(Math.random() * 7)];
      newx = this.x + _confused[0];
      newy = this.y + _confused[1];
    }
    if (Game.map[level].Tiles[newx][newy].Blocked) {
      if (Game.map[level].Tiles[newx][newy].Door) {
        Game.messageBox.sendMessage('You opened the door.');
        Game.map[level].Tiles[newx][newy].Door = false;
        Game.map[level].Tiles[newx][newy].Symbol = Game.map[level].Tiles[newx][
          newy
        ].Symbol.replace('close', 'open');
        Game.map[level].Tiles[newx][newy].Blocked = false;
        Game.map[level].Tiles[newx][newy].BlocksSight = false;
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
    /*
    if (typeof Game.map[level].Tiles[newx][newy].items[0] !== 'undefined') {
      if (this.x != newx || this.y != newy) {
        var itemname = Game.map[level].Tiles[newx][newy].items[0].name;
        for (
          let i = 1;
          i < Game.map[level].Tiles[newx][newy].items.length;
          i++
        ) {
          itemname =
            itemname + ', ' + Game.map[level].Tiles[newx][newy].items[i].name;
        }
        Game.messagebox.sendMessage(
          'You see the ' + itemname + ' on the floor.'
        );
      }
    }
    */
    this.move(newx, newy);
    Game.drawAll();
    window.removeEventListener('keydown', this);
    Game.engine.unlock();
  }
};

Player.prototype.doDie = function () {};
