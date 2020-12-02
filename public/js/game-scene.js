var playerStates = {};
 
var GameScene = new Phaser.Class({
  Extends: Phaser.Scene,
  initialize: function() {
    Phaser.Scene.call(this, { "key": "GameScene"});
  },
  init: function() {},
  preload: function() {
    this.load.image('mushroom', 'assets/mushroom2.png');
    this.load.image('ground', 'assets/ground.png');
    this.load.image('background', 'assets/clouds.jpeg');
  }, 
  create: function() {
    var self = this;
    this.socket = io();
    this.players = this.add.group();
  
    this.add.sprite(this.sys.game.config.width / 2, this.sys.game.config.height / 2, 'background');
    
    this.countdown = this.add.text(16, 16, 'Time Left: ', { fontSize: '40px', fill: '#FF0000' });
    this.socket.on('tick', function (timeLeft) {
      self.countdown.setText('Time Left: ' + timeLeft);
    });
  
  
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
    this.socket.on('platformLocation', function(platform) {
      self.platform = self.add.sprite(platform.x, platform.y, 'ground');
      self.platform.scaleX = platform.scaleX;
      self.platform.scaleY = platform.scaleY;
    });
    this.socket.on('gameOver', function () {
      self.scene.start("MenuScene");
    });
  
    this.cursors = this.input.keyboard.createCursorKeys();
  },
  update: function() {
    
    var input = playerStates[this.socket.id].input;
    const left = input.left;
    const right = input.right;
    const up = input.up;
    
    if (this.cursors.left.isDown) {
      input.left = true;
    } else {
      input.left = false;
    }
  
    if (this.cursors.right.isDown) {
      input.right = true;
    } else {
      input.right = false;
    }
    
    if (this.cursors.up.isDown) {
      input.up = true;
    } else {
      input.up = false;
    }
    
    if (left !== input.left || right !== input.right || up !== input.up) {
      this.socket.emit('playerInput', input);
    }
  }
});

function displayPlayers(self, playerInfo, sprite) {
  const player = self.add.sprite(playerInfo.x, playerInfo.y, sprite).setOrigin(0, 0).setDisplaySize(53, 40, true).setSize(53, 40, true);
  player.setTint(playerInfo.colour);
  player.playerId = playerInfo.playerId;
  self.players.add(player);
}