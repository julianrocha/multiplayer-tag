var config = {
  type: Phaser.AUTO,
  parent: 'phaser-example',
  width: 1000,
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
  this.load.image('background', 'assets/background.jpeg');
  this.load.image('arrow', 'assets/green-arrow.png');
}

var playerStates = {};
 
function create() {
  this.background = this.add.sprite(this.sys.game.config.width / 2, this.sys.game.config.height / 2 + 50, 'background');
  this.background.scaleX = 1.5;
  this.background.scaleY = 1.5;

  var self = this;
  this.socket = io();
  this.players = this.add.group();
  this.meIndicator = this.add.image(0,0,'arrow');
  this.meIndicator.flipY = true;
  this.meIndicator.scaleX = 0.03;
  this.meIndicator.scaleY = 0.03;


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

  this.gameOverMsg = this.add.text(this.sys.game.config.width / 2, this.sys.game.config.height / 2,'', { fontSize: '60px', fill: '#FF0000'});
  this.gameOverMsg.setOrigin(0.5);
  this.socket.on("roundOver", function(winners) {
    if(winners[self.socket.id]){
      self.gameOverMsg.setText('ROUND OVER\n YOU WON!');
    } else{
      self.gameOverMsg.setText('ROUND OVER\n YOU LOST!');
    }
    self.time.delayedCall(3000, function () { self.gameOverMsg.setText(''); });
  });

  this.cursors = this.input.keyboard.createCursorKeys();
}
 
function update() {
  var playerInfo = playerStates[this.socket.id];
  if(!playerInfo) return;

  this.meIndicator.x = playerInfo.x + 25;
  this.meIndicator.y = playerInfo.y - 25;

  var input = playerInfo.input;
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

function displayPlayers(self, playerInfo, sprite) {
  const player = self.add.sprite(playerInfo.x, playerInfo.y, sprite).setOrigin(0, 0).setDisplaySize(53, 40, true).setSize(53, 40, true);
  player.setTint(playerInfo.colour);
  player.playerId = playerInfo.playerId;
  self.players.add(player);
}