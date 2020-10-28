var config = {
  type: Phaser.AUTO,
  parent: 'phaser-example',
  width: 800,
  height: 600,
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
      gravity: { y: 0 }
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
}
 
function create() {
  var self = this;
  this.socket = io();
  this.otherPlayers = this.physics.add.group();
  this.socket.on('currentPlayers', function (players) {
    Object.keys(players).forEach(function (id) {
      if (players[id].playerId === self.socket.id) {
        addPlayer(self, players[id]);
      } else {
        addOtherPlayers(self, players[id]);
      }
    });
  });
  this.socket.on('newPlayer', function (playerInfo) {
    addOtherPlayers(self, playerInfo);
  });
  this.socket.on('disconnect', function (playerId) {
    self.otherPlayers.getChildren().forEach(function (otherPlayer) {
      if (playerId === otherPlayer.playerId) {
        otherPlayer.destroy();
      }
    });
  });
  this.socket.on('playerMoved', function (playerInfo) {
    self.otherPlayers.getChildren().forEach(function (otherPlayer) {
      if (playerInfo.playerId === otherPlayer.playerId) {
        otherPlayer.setPosition(playerInfo.x, playerInfo.y);
      }
    });
  });
  this.cursors = this.input.keyboard.createCursorKeys();
}
 
function update() {
  if(this.mushroom) {
    if(this.cursors.left.isDown) {
      this.mushroom.setVelocityX(-160);
    } else if (this.cursors.right.isDown) {
      this.mushroom.setVelocityX(160);
    } else if (this.cursors.up.isDown) {
      this.mushroom.setVelocityY(-160);
    } else if (this.cursors.down.isDown) {
      this.mushroom.setVelocityY(160);
    } else {
      this.mushroom.setVelocityX(0);
      this.mushroom.setVelocityY(0);
    }
    // emit player movement
    var x = this.mushroom.x;
    var y = this.mushroom.y;
    if (this.mushroom.oldPosition && (x !== this.mushroom.oldPosition.x || y !== this.mushroom.oldPosition.y)) {
      this.socket.emit('playerMovement', { x: this.mushroom.x, y: this.mushroom.y });
    }

    // save old position data
    this.mushroom.oldPosition = {
      x: this.mushroom.x,
      y: this.mushroom.y,
    };
  }
}

function addPlayer(self, playerInfo) {
  self.mushroom = self.physics.add.image(playerInfo.x, playerInfo.y, 'mushroom').setOrigin(0.5, 0.5).setDisplaySize(53, 40);
  if (playerInfo.colour === 'blue') {
    self.mushroom.setTint(0x0000ff);
  } else {
    self.mushroom.setTint(0xff0000);
  }
  self.mushroom.setDrag(100);
  self.mushroom.setAngularDrag(100);
  self.mushroom.setMaxVelocity(200);
}

function addOtherPlayers(self, playerInfo) {
  const otherPlayer = self.add.sprite(playerInfo.x, playerInfo.y, 'mushroom').setOrigin(0.5, 0.5).setDisplaySize(53, 40);
  if (playerInfo.colour === 'blue') {
    otherPlayer.setTint(0x0000ff);
  } else {
    otherPlayer.setTint(0xff0000);
  }
  otherPlayer.playerId = playerInfo.playerId;
  self.otherPlayers.add(otherPlayer);
}