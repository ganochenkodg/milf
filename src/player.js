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
  this.maxAtk = 2;
  this.defense = Math.floor((this.agi + this.con) * 0.1);
  this.piety = 10;
  this.player = true;
  this.maxHp = 50 + this.con * 6 + this.str * 3;
  this.speed = 100;
  this.color = '#0000';
  this.maxMana = 30 + this.int * 8;
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
    return this.Speed + this.Agi * 0.5;
  };
};

Player.prototype.move = function (newx, newy) {
  //if (this.crippled) return;
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
  /*if (this.stun) {
    return;
  }
  */
  Game.engine.lock();
  //Game.entity[0].applyStats();
  /*
  if (
    Game.entity[0].Hp < 1 ||
    Game.entity[0].Agi < 1 ||
    Game.entity[0].Str < 1 ||
    Game.entity[0].Int < 1
  ) {
    Game.messagebox.sendMessage(
      'Congratulations, you have died! Press %c{red}F5%c{} to start new game.'
    );
    Game.drawAll();
    return;
  }
  */
  //this.doDie();
  window.addEventListener('keydown', this);
};

Player.prototype.Draw = function () {
  /*let _hunger = '%c{crimson}Exhausted';
  if (Game.entity[0].Hunger > (Game.entity[0].Con * 12.5)) {
    _hunger = '%c{darksalmon}Hungry';
  }
  if (Game.entity[0].Hunger > (Game.entity[0].Con * 25)) {
    _hunger = '%c{#eeffee}Normal';
  }
  if (Game.entity[0].Hunger > (Game.entity[0].Con * 40)) {
    _hunger = '%c{lightgreen}Full';
  }
  */
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
  /*var xoffset = Game.screenWidth * 4 - 27;
  Game.messages.drawText(xoffset, 1, 'Name: ' + Game.entity[0].name + '   ' + _hunger);
  Game.messages.drawText(xoffset, 2, 'HP: %c{red}' + Game.entity[0].Hp + '/' + Game.entity[0].Maxhp + ' %c{}Mana: %c{blue}' + Game.entity[0].Mana + '/' + Game.entity[0].Maxmana);
  Game.messages.drawText(xoffset, 3, 'Str: %c{gold}' + Game.entity[0].Str + ' %c{}Int: %c{turquoise}' + Game.entity[0].Int);
  Game.messages.drawText(xoffset, 4, 'Con: %c{yellowgreen}' + Game.entity[0].Con + ' %c{}Agi: %c{wheat}' + Game.entity[0].Agi);
  Game.messages.drawText(xoffset, 5, 'Armor: %c{coral}' + (Math.floor(Game.entity[0].Agi / 4) + Game.entity[0].Armor) + ' %c{}Speed: %c{lightblue}' + this.getSpeed() + '%');
  Game.messages.drawText(xoffset, 6, 'Atk: %c{red}' + Math.floor(Game.entity[0].Str / 2 + Game.entity[0].Minatk) + ' - ' + (Game.entity[0].Str + Game.entity[0].Maxatk) + ' %c{}Crit: %c{lime}' + Math.min(95, (Game.entity[0].Crit + Math.floor(Game.entity[0].Agi / 2) + 2)) + '%');
  Game.messages.drawText(xoffset, 11, 'Lvl: ' + Game.entity[0].depth + ' x: ' + Game.entity[0].x + ' y: ' + Game.entity[0].y);
  let _piety = '%c{crimson}Nobody';
  if (Game.entity[0].religion > 20) {
    _piety = '%c{darksalmon}Noncommittal';
  }
  if (Game.entity[0].religion > 40) {
    _piety = '%c{lightsalmon}Noted your presence';
  }
  if (Game.entity[0].religion > 80) {
    _piety = '%c{peachpuff}Pleased';
  }
  if (Game.entity[0].religion > 150) {
    _piety = '%c{lightyellow}Most pleased';
  }
  if (Game.entity[0].religion > 220) {
    _piety = '%c{AntiqueWhite}Rising star';
  }
  if (Game.entity[0].religion > 300) {
    _piety = '%c{ivory}Shining star';
  }
  if (Game.entity[0].religion > 400) {
    _piety = '%c{white}Chosen one';
  }
  Game.messages.drawText(xoffset, 12, 'Piety: ' + _piety);
  var item = null;
  if (typeof Game.entity[0].equipment.righthand === 'undefined') {
    item = '-';
  } else {
    item = Game.entity[0].equipment.righthand.name;
  }
  Game.messages.drawText(xoffset, 7, 'R. hand: ' + item);
  if (typeof Game.entity[0].equipment.lefthand === 'undefined') {
    item = '-';
  } else {
    item = Game.entity[0].equipment.lefthand.name;
  }
  Game.messages.drawText(xoffset, 8, 'L. hand: ' + item);
  if (typeof Game.entity[0].equipment.body === 'undefined') {
    item = '-';
  } else {
    item = Game.entity[0].equipment.body.name;
  }
  Game.messages.drawText(xoffset, 9, 'Body:    ' + item);
  if (typeof Game.entity[0].equipment.neck === 'undefined') {
    item = '-';
  } else {
    item = Game.entity[0].equipment.neck.name;
  }
  Game.messages.drawText(xoffset, 10, 'Neck:    ' + item);
  if (Game.entity[0].affects.length > 0) {
    for (let i = 0; i < Game.entity[0].affects.length; i++) {
      Game.display.draw(Game.screenWidth - 1, i, ['whitesquare', Game.entity[0].affects[i].Symbol], ['#0000', '#0000']);
    }
  }
  */
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

  if (mode.mode == 'item') {
    switch (code) {
      case 69:
        Game.doItem('eat');
        break;
      case 68:
        Game.doItem('drop');
        break;
      case 83:
        Game.doItem('sacrifice');
        break;
      case 87:
        Game.doItem('wield');
        break;
      case 27:
        break;
      default:
        Game.messagebox.sendMessage('You cant do this.');
    }
    mode.mode = 'play';
    Game.drawAll();
    window.removeEventListener('keydown', this);
    Game.engine.unlock();
    return;
  }
  */
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
      case 75:
      case 76:
      case 77:
      case 78:
      case 79:
      case 80:
        Game.chooseItem(code - 65);
        return;
        break;
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
      case 190:
        if (!Game.map[level].Tiles[newx][newy].Stairdown) {
          Game.messageBox.sendMessage('You cant go down there.');
          break;
        }
        if (typeof Game.map[level + 1] === 'undefined') {
          Game.generateMap(level + 1);
        }
        Game.entity[0].goDown();
        newx = this.x;
        newy = this.y;
        level = Game.entity[0].depth;
        break;
      case 188:
        if (!Game.map[level].Tiles[newx][newy].Stairup) {
          Game.messageBox.sendMessage('You cant go up there.');
          break;
        }
        Game.entity[0].goUp();
        newx = this.x;
        newy = this.y;
        level = Game.entity[0].depth;
        break;
      default:
        return;
    }
    /*
    if (this.confuse && Math.random() > 0.5) {
      let _confused = ROT.DIRS[8][Math.floor(Math.random() * 7)];
      newx = this.x + _confused[0];
      newy = this.y + _confused[1];
    }
    */
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
    /*
    if (Game.map[level].Tiles[newx][newy].Mob) {
      this.doAttack(newx, newy);
      newx = this.x;
      newy = this.y;
    }
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
    //this.Hunger = Math.max(0, this.Hunger - 1);
    Game.drawAll();
    window.removeEventListener('keydown', this);
    Game.engine.unlock();
  }
};
