const path = require('path');
const jsdom = require('jsdom');
var express = require('express');
var app = express();
var server = require('http').Server(app);
const Datauri = require('datauri/parser');
const datauri = new Datauri();
const {JSDOM} = jsdom;
const io = require('socket.io').listen(server);

var players = {};

app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

/*io.on('connection', function (socket) {
	console.log('user : ' + socket.id + ' connected');
  	// create a new player and add it to our players object
	players[socket.id] = {
	  x: Math.floor(Math.random() * 700) + 50,
	  y: Math.floor(Math.random() * 500) + 50,
	  playerId: socket.id,
	  colour: (Math.floor(Math.random() * 2) == 0) ? 'red' : 'blue',
	  itStatus: false
	};
	// send the players object to the new player
	socket.emit('currentPlayers', players);
	// update all other players of the new player
	socket.broadcast.emit('newPlayer', players[socket.id]);

	socket.on('disconnect', function () {
	    console.log('user : ' + socket.id + ' disconnected');
	    // remove this player from our players object
		delete players[socket.id];
		// emit a message to all players to remove this player
		io.emit('disconnect', socket.id);
	});
	// when a player moves, update the player data
	socket.on('playerMovement', function (movementData) {
		players[socket.id].x = movementData.x;
		players[socket.id].y = movementData.y;
		// emit a message to all players about the player that moved
		socket.broadcast.emit('playerMoved', players[socket.id]);
	});
});*/

function setupAuthoritativePhaser() {
	JSDOM.fromFile(path.join(__dirname, 'authoritative_server/index.html'), {
	  // To run the scripts in the html file
	  runScripts: "dangerously",
	  // Also load supported external resources
	  resources: "usable",
	  // So requestAnimatinFrame events fire
	  pretendToBeVisual: true
	}).then((dom) => {
		dom.window.URL.createObjectURL = (blob) => {
			if (blob){
			  return datauri.format(blob.type, blob[Object.getOwnPropertySymbols(blob)[0]]._buffer).content;
			}
		  };
		  dom.window.URL.revokeObjectURL = (objectURL) => {};
	  	dom.window.gameLoaded = () => {
		  dom.window.io = io;
		  server.listen(8081, function () {
		  console.log(`Listening on ${server.address().port}`);
		});
	  };
	}).catch((error) => {
	  console.log(error.message);
	});
  }
   
setupAuthoritativePhaser();