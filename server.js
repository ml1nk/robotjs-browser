#!/usr/bin/env node

var program = require('commander');

program
  .version(require(__dirname + '/package').version)
  .usage('[options]')
  .option('-p, --port [num]', 'server port - defaults to 7569', Number)
  .parse(process.argv);

var port = program.port || 7569;

var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);

server.listen(port);

app.get('/', function(req, res){
  res.sendFile(__dirname + '/demo.html');
});

app.get('/lib/promise.min.js', function(req, res){
  res.sendFile(__dirname + '/lib/promise.min.js');
});

app.get('/lib/setImmediate.min.js', function(req, res){
  res.sendFile(__dirname + '/lib/setImmediate.min.js');
});

app.get('/robotjs-browser.js', function(req, res){
  res.sendFile(__dirname + '/client.js');
});

var robot = require("robotjs");
io.on('connection', function(socket) {
    console.log("user connected");
    socket.on('robotjs', function(id, name, parameters) {
        socket.emit('robotjs.' + id, (function() {
            console.log("robotjs", name, parameters);
            if (!robot.hasOwnProperty(name)) {
                console.warn("robotjs", "invalid function");
                return;
            }
            return robot[name].apply(this, parameters);
        })());
    });
    socket.on('disconnect', function() {
        console.log('user disconnected');
    });
});
