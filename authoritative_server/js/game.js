const playerStates = {};
const platformArray = [];

const config = {
    type: Phaser.HEADLESS,
    parent: 'phaser-example',
    width: 1000,
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
      
      this.timeLeft = 100;
      this.time.addEvent({delay: 1000, loop: true, callback: tick, args: [self]});
      
      
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
        for(let i = 0; i < 4; i++){
          socket.emit('platformLocation', {x: platformArray[i].xLoc, y: platformArray[i].yLoc, scaleX: platformArray[i].scaleX, scaleY: platformArray[i].scaleY});
        }
        socket.on('disconnect', function (){
            console.log('user ' + socket.id + ' disconnected');
            // remove player from server
            removePlayer(self, socket.id);
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
        playerStates[player.playerId].colour = player.colour;
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

  function tick(self){
    io.emit('tick', self.timeLeft--);
    if(self.timeLeft < 0){
      self.timeLeft = 100;
      winners = {};
      self.playerPhysGroup.getChildren().forEach((player) => {
        winners[player.playerId] = (player.ts instanceof Tagged || player.ts instanceof WarmingUp) ? false : true;
      });
      io.emit("roundOver", winners);
      self.scene.pause();
      setTimeout(() => {
        self.scene.resume();
      }, 3000);
    }
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
    platformArray.push(platform);
  }

  function addPlayer(self, playerInfo){
    const player = self.physics.add.sprite(playerInfo.x, playerInfo.y, 'mushroom').setOrigin(0, 0).setDisplaySize(53, 40, true);
    player.setMaxVelocity(450);
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
      self.physics.add.collider(player, otherPlayer, function (player, otherPlayer) {
        player.ts = player.ts.goToNextState(player, otherPlayer);
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
        var tagged = (player.ts instanceof Tagged || player.ts instanceof WarmingUp);
        player.destroy();
        var candidates = self.playerPhysGroup.getChildren();
        if(tagged && candidates.length > 0){
          random_candidate = candidates[Math.floor(Math.random() * candidates.length)];
          random_candidate.ts = new Tagged(random_candidate);
        }
        // remove this player from our playerStates object
        delete playerStates[player.playerId];
      }
    });
  }

  const game = new Phaser.Game(config);

  window.gameLoaded();
