'use strict';

Game.messageBox = {};

Game.MessageBox = class MessageBox {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.messages = [];
  }

  sendMessage(message) {
    this.messages.push(message);
    if (this.messages.length > this.height) {
      this.messages.shift();
    }
  }

  Draw() {
    this.messages.forEach((message, i) => {
      Game.messageDisplay.drawText(1, i + 2, message);
    });
  }
};
