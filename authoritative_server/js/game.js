const playerStates = {};

const config = {
    type: Phaser.HEADLESS,
    parent: 'phaser-example',
    width: 800,
    height: 600,
    autoFocus: false,
    physics: {
      default: 'arcade',
      arcade: {
        debug: true,
        gravity: { y: 0 }
      }
    },
    scene: {
      preload: preload,
      create: create,
      update: update
    }
  };
   
  function preload() {
      this.load.image('mushroom', 'assets/mushroom2.png');
      this.load.image('ground', 'assets/ground.png');
  }
   
  function create() {
      const self = this;

      this.playerPhysGroup = this.physics.add.group();
      let groundX = this.sys.game.config.width / 2; 
      let groundY = this.sys.game.config.height * .95;
      this.ground = this.physics.add.sprite(groundX, groundY, 'ground');
      this.ground.setImmovable();
      io.on('connection', function(socket){
        console.log('user ' + socket.id + ' connected');
        // create a new player and add it to our playerStates object
        playerStates[socket.id] = {
            onGround: false,
            x: Math.floor(Math.random() * 700) + 50,
            y: Math.floor(Math.random() * 500) + 50,
            playerId: socket.id,
            colour: 0x000fff,
            input: {
                left: false,
                right: false,
                up: false
              }
        };
        // add player to server
        addPlayer(self, playerStates[socket.id]);
        // send the playerStates object to the new player
        socket.emit('currentPlayers', playerStates);
        // update all other playerStates of the new player
        socket.broadcast.emit('newPlayer', playerStates[socket.id]);
        socket.on('disconnect', function (){
            console.log('user ' + socket.id + ' disconnected');
            // remove player from server
            removePlayer(self, socket.id);
            // remove this player from our playerStates object
            delete playerStates[socket.id];
            // emit a message to all playerStates to remove this player
            io.emit('disconnect', socket.id);
        });
        // when a player moves, update the player data
        socket.on('playerInput', function (inputData) {
        handlePlayerInput(self, socket.id, inputData);
        });
      });
  }

  function update() {
    this.playerPhysGroup.getChildren().forEach((player) => {
        const input = playerStates[player.playerId].input;
        if (input.left) {
          player.setVelocityX(-160);
        } else if (input.right) {
          player.setVelocityX(160);
        } else{
          player.setVelocityX(0);
        }
        //Slanted jumping, x velocity and y velocity
        if (input.up && player.onGround == true && player.body.velocity.y == 0) {
          player.body.setVelocityY(-160);
          player.onGround = false;
        } else {
          player.setGravityY(300);
        }
       
        playerStates[player.playerId].x = player.x;
        playerStates[player.playerId].y = player.y;
        playerStates[player.playerId].onGround = player.onGround;
      });
      this.physics.world.wrap(this.playerPhysGroup, 5);
      io.emit('playerUpdates', playerStates);
  }

  function onGroundFunc(player){
    player.onGround = true;
  }

  function handlePlayerInput(self, playerId, input) {
    self.playerPhysGroup.getChildren().forEach((player) => {
      if (playerId === player.playerId) {
        playerStates[player.playerId].input = input;
      }
    });
  }

  function addPlayer(self, playerInfo){
    const player = self.physics.add.sprite(playerInfo.x, playerInfo.y, 'mushroom').setOrigin(0, 0).setDisplaySize(53, 40, true);
    player.setDrag(100);
    player.setAngularDrag(100);
    player.setMaxVelocity(200);
    player.body.enable;
    player.playerId = playerInfo.playerId;
    player.gameInstance = self;
    if(Object.keys(playerStates).length == 1){
      player.ts = new Tagged(player);
    } else {
      player.ts = new NotTagged(player);
    }


    self.physics.add.collider(player, self.ground, onGroundFunc);
    self.playerPhysGroup.getChildren().forEach((otherPlayer) => {
      self.physics.add.collider(player, otherPlayer, function (player, otherPlayer) {
        handlePlayerCollision(player, otherPlayer);
      });
    });
    self.playerPhysGroup.add(player);
  }

  function removePlayer(self, playerId) {
    self.playerPhysGroup.getChildren().forEach((player) => {
      if (playerId === player.playerId) {
        player.destroy();
      }
    });
  }

  function handlePlayerCollision(p1, p2) {
      p1.ts = p1.ts.goToNextState(p1, p2);
  }

  class NotTagged {
    constructor(p){
      playerStates[p.playerId].colour = 0x000fff;
    }

    goToNextState(p1, p2){
      if(p2.ts instanceof Tagged) {
        p2.ts = new NotTagged(p2);
        return new WarmingUp(p1);
      } else {
        return this;
      }
    }
  }

  class Tagged {
    constructor(p){
      playerStates[p.playerId].colour = 0xff0000;
    }

    goToNextState(p1, p2){
      if(p2.ts instanceof NotTagged) {
        p2.ts = new WarmingUp(p2);
        return new NotTagged(p1);
      } else {
        return this;
      }
    }
  }

  class WarmingUp {
    constructor(p){
      playerStates[p.playerId].colour = 0xffff00;
      p.gameInstance.time.delayedCall(3000, this.transitionToTagged,[p], p.gameInstance);
    }

    goToNextState(p1, p2) {
      return this;
    }

    transitionToTagged(p){
      p.ts = new Tagged(p);
    }
  }

  const game = new Phaser.Game(config);

  window.gameLoaded();
