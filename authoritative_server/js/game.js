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
        debug: true
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
      this.platforms = this.physics.add.group();
      buildPlatform(self, this.sys.game.config.width / 2, this.sys.game.config.height * 1, 1.5, 0.2);
      buildPlatform(self, 0, this.sys.game.config.height * 0.66, 0.5, 0.2);
      buildPlatform(self, this.sys.game.config.width / 1, this.sys.game.config.height * 0.66, 0.5, 0.2);
      buildPlatform(self, this.sys.game.config.width / 2, this.sys.game.config.height * 0.33, 0.5, 0.2);
      io.on('connection', function(socket){
        console.log('user ' + socket.id + ' connected');
        // create a new player and add it to our playerStates object
        playerStates[socket.id] = {
            /* onGround: false, */
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
        player.ms = player.ms.goToNextState(player, input);
        playerStates[player.playerId].x = player.x;
        playerStates[player.playerId].y = player.y;
      });
      io.emit('playerUpdates', playerStates);
  }

  function handlePlayerInput(self, playerId, input) {
    self.playerPhysGroup.getChildren().forEach((player) => {
      if (playerId === player.playerId) {
        playerStates[player.playerId].input = input;
      }
    });
  }

  function buildPlatform(self, xLoc, yLoc, xScale, yScale){
    const platform = self.physics.add.sprite(xLoc, yLoc, 'ground');
    platform.xLoc = xLoc;
    platform.yLoc = yLoc;
    platform.scaleX = xScale;
    platform.scaleY = yScale;
    self.physics.add.collider(platform, self.playerPhysGroup);
    self.platforms.add(platform);
    platform.setImmovable();
  }

  function addPlayer(self, playerInfo){
    const player = self.physics.add.sprite(playerInfo.x, playerInfo.y, 'mushroom').setOrigin(0, 0).setDisplaySize(53, 40, true);
    player.setMaxVelocity(500);
    player.body.enable;
    player.playerId = playerInfo.playerId;
    player.gameInstance = self;
    if(Object.keys(playerStates).length == 1){
      player.ts = new Tagged(player);
    } else {
      player.ts = new NotTagged(player);
    }
    player.ms = new inAir(player);
    self.playerPhysGroup.getChildren().forEach((otherPlayer) => {
      self.physics.add.overlap(player, otherPlayer, function (player, otherPlayer) {
        handlePlayerCollision(player, otherPlayer);
      });
    });
    self.playerPhysGroup.add(player);
    player.setCollideWorldBounds(true);
    player.setGravityY(300);
    player.setDrag(25);
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

  class airLean {
    constructor(p){
      console.log("ENTERED THE AIRLEAN STATE");
    }

    goToNextState(player, input){
      /* If the player is on the ground and the one of the right or left inputs are being pressed, go to sprinting state */
      if(player.body.touching.down && (input.left || input.right)){
        return new Sprinting(player);
      } 
      /* If neither input left or right are being pressed and the player is stil in the air, then go to the inAir state */
      else if(!(input.left || input.right)){
        player.setAccelerationX(0);
        return new inAir(player);
      } else{
        return this;
      }
    }
  }

  class inAir {
    constructor(p){
      console.log("ENTERED THE INAIR STATE");
    }
    goToNextState(player, input){
      /* Go to the air lean state if either input left or right exists. */
      if(input.left || input.right) {
        if(input.left){
          player.setAccelerationX(-350);
        } else{
          player.setAccelerationX(350);
        }
        return new airLean(player);
      } 
      /* Go to standing state if the player is on the ground */
      else if(player.body.touching.down){
        return new Standing(player);
      } else{
        return this;
      }
    }
  }

  class Sprinting {
    constructor(p){
      console.log("ENTERED THE SPRINTING STATE");
    }

    goToNextState(player, input){
      /* Going to air lean with a jump */
      if(input.up && player.body.touching.down && (input.left || input.right)){
        player.setVelocityY(-400);
        return new airLean(player);
      } 
      /* Going to air lean from falling off a ledge */
      else if((input.left || input.right) && !player.body.touching.down){
        return new airLean(player);
      } 
      /* Going to standing state when no inputs are being pressed and the player is touching the ground */
      else if(!(input.left || input.right || input.up) && player.body.touching.down){
        player.setAccelerationX(0);
        return new Standing(player);
      } 
      else{
        return this;
      }
    }
  }

  class Standing {
    constructor(p){
      console.log("ENTERED THE STANDING STATE");
    }

    goToNextState(player, input){
      /* If input left or right are being pressed and input up is not being pressed, then go to the sprinting state */
      if((input.left || input.right) && !input.up) {
        if(input.left){
          player.setAccelerationX(-350);
        } else{
          player.setAccelerationX(350);
        }
        return new Sprinting(player);
      }
      /* if input up is being pressed and all directional velocitys are zero, then go to the inAir state */
      else if(input.up){
        player.setVelocityY(-400);
        return new inAir(player);
      } else{
        return this;
      }
    }
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
      if(playerStates[p.playerId]) playerStates[p.playerId].colour = 0xff0000;
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
