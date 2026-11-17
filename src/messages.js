'use strict';

Game.MessageBox = class MessageBox {
  constructor(height = 13) {
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
