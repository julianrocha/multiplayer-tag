const players = {};

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
      this.players = this.physics.add.group();
      let groundX = this.sys.game.config.width / 2; 
      let groundY = this.sys.game.config.height * .95;
      this.ground = this.physics.add.sprite(groundX, groundY, 'ground');
      this.ground.setImmovable();
      io.on('connection', function(socket){
        console.log('a user connected');
        // create a new player and add it to our players object
        players[socket.id] = {
            onGround: false,
            x: Math.floor(Math.random() * 700) + 50,
            y: Math.floor(Math.random() * 500) + 50,
            playerId: socket.id,
            team: (Math.floor(Math.random() * 2) == 0) ? 'red' : 'blue',
            input: {
                left: false,
                right: false,
                up: false
              }
        };
        // add player to server
        addPlayer(self, players[socket.id]);
        // send the players object to the new player
        socket.emit('currentPlayers', players);
        // update all other players of the new player
        socket.broadcast.emit('newPlayer', players[socket.id]);
        socket.on('disconnect', function (){
            console.log('user disconnected');
            // remove player from server
            removePlayer(self, socket.id);
            // remove this player from our players object
            delete players[socket.id];
            // emit a message to all players to remove this player
            io.emit('disconnect', socket.id);
        });
        // when a player moves, update the player data
        socket.on('playerInput', function (inputData) {
        handlePlayerInput(self, socket.id, inputData);
        });
      });
  }

  function update() {
    this.players.getChildren().forEach((player) => {
        const input = players[player.playerId].input;
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
       
        players[player.playerId].x = player.x;
        players[player.playerId].y = player.y;
        players[player.playerId].onGround = player.onGround;
      });
      this.physics.world.wrap(this.players, 5);
      io.emit('playerUpdates', players);
  }

  function onGroundFunc(player){
    player.onGround = true;
  }

  function handlePlayerInput(self, playerId, input) {
    self.players.getChildren().forEach((player) => {
      if (playerId === player.playerId) {
        players[player.playerId].input = input;
      }
    });
  }

  function addPlayer(self, playerInfo){
    const player = self.physics.add.sprite(playerInfo.x, playerInfo.y, 'mushroom').setOrigin(0, 0).setDisplaySize(53, 40, true);
    player.setDrag(100);
    player.setAngularDrag(100);
    player.setMaxVelocity(200);
    player.playerId = playerInfo.playerId;
    player.body.enable;
    self.physics.add.collider(player, self.ground, onGroundFunc);
    self.players.add(player);
  }

  function removePlayer(self, playerId) {
    self.players.getChildren().forEach((player) => {
      if (playerId === player.playerId) {
        player.destroy();
      }
    });
  }

  const game = new Phaser.Game(config);

  window.gameLoaded();