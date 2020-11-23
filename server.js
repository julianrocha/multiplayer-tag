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