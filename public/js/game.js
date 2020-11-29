var config = {
  type: Phaser.AUTO,
  parent: 'phaser-example',
  width: 800,
  height: 600,
  physics: {
    default: 'arcade',
    arcade: {
      debug: true
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  } 
};
 
var game = new Phaser.Game(config);
 
function preload() {
  this.load.image('mushroom', 'assets/mushroom2.png');
  this.load.image('ground', 'assets/ground.png');
}

var playerStates = {};
 
function create() {
  var self = this;
  this.socket = io();
  this.players = this.add.group();
  let groundX = this.sys.game.config.width / 2; 
  let groundY = this.sys.game.config.height * 1;
  this.ground = this.add.sprite(groundX, groundY, 'ground');
  this.ground.scaleX = 1.5;
  this.ground.scaleY = 0.2;
  let gX = 0; 
  let gY = this.sys.game.config.height * .66;
  this.smallLeftGround = this.add.sprite(gX, gY, 'ground');
  this.smallLeftGround.scaleX = 0.5;
  this.smallLeftGround.scaleY = 0.2;
  let g2X = this.sys.game.config.width / 1; 
  let g2Y = this.sys.game.config.height * .66;
  this.smallRightGround = this.add.sprite(g2X, g2Y, 'ground');
  this.smallRightGround.scaleX = 0.5;
  this.smallRightGround.scaleY = 0.2;
  let g3X = this.sys.game.config.width / 2; 
  let g3Y = this.sys.game.config.height * .33;
  this.smallTopGround = this.add.sprite(g3X, g3Y, 'ground');
  this.smallTopGround.scaleX = 0.5;
  this.smallTopGround.scaleY = 0.2;
  this.socket.on('currentPlayers', function (players) {
    Object.keys(players).forEach(function (id) {
      displayPlayers(self, players[id], 'mushroom');
    });
  });
 
  this.socket.on('newPlayer', function (playerInfo) {
    displayPlayers(self, playerInfo, 'mushroom');
  });
 
  this.socket.on('disconnect', function (playerId) {
    self.players.getChildren().forEach(function (player) {
      if (playerId === player.playerId) {
        player.destroy();
      }
    });
  });
  this.socket.on('playerUpdates', function (players) {
    //Define as its own function
    playerStates = players;

    Object.keys(players).forEach(function (id) {
      self.players.getChildren().forEach(function (player) {
        if (players[id].playerId === player.playerId) {
          player.setPosition(players[id].x, players[id].y);
          player.setTint(players[id].colour);
        }
      });
    });
  });
  this.cursors = this.input.keyboard.createCursorKeys();
  this.leftKeyPressed = false;
  this.rightKeyPressed = false;
  this.upKeyPressed = false;
}
 
function update() {
  const left = this.leftKeyPressed;
  const right = this.rightKeyPressed;
  const up = this.upKeyPressed;
  
  if (this.cursors.left.isDown && !this.cursors.right.isDown) {
    this.leftKeyPressed = true;
  } else if (this.cursors.right.isDown && !this.cursors.left.isDown) {
    this.rightKeyPressed = true;
  } else {
    this.leftKeyPressed = false;
    this.rightKeyPressed = false;
  }
  
  if (this.cursors.up.isDown) {
    this.upKeyPressed = true;
  } else {
    this.upKeyPressed = false;
  }
  
  if (left !== this.leftKeyPressed || right !== this.rightKeyPressed || up !== this.upKeyPressed) {
    this.socket.emit('playerInput', { left: this.leftKeyPressed , right: this.rightKeyPressed, up: this.upKeyPressed });
  }
}

function displayPlayers(self, playerInfo, sprite) {
  const player = self.add.sprite(playerInfo.x, playerInfo.y, sprite).setOrigin(0, 0).setDisplaySize(53, 40, true).setSize(53, 40, true);
  player.setTint(playerInfo.colour);
  player.playerId = playerInfo.playerId;
  self.players.add(player);
}