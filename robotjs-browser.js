#!/usr/bin/env node

var program = require('commander');
var config = require(__dirname + '/package');

program
    .version(config.version)
    .usage('[options]')
    .option('-p, --port [num]', 'server port - defaults to 7569', Number)
    .option('-h, --host [hostname]', 'host name - defaults to 127.0.0.1', String)
    .option('-m, --minify', 'serve minified scripts (.min.js)')
    .parse(process.argv);

var minify = program.minify ? true : false;
var port = program.port || 7569;
var host = program.host || "127.0.0.1";

console.log(config.name,"-",config.version);

var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server, {
    serveClient: false
});

var serve = {
    files: {
        "socket.io" : {
          "path" : require.resolve("socket.io-client/dist/socket.io.js")
        },
        "setImmediate" : {
          "path" : __dirname + "/client/lib/setImmediate.js"
        },
        "promise" : {
          "path" : __dirname + "/client/lib/promise.js"
        },
        "robotjs": {
          "path" : __dirname + "/client/robotjs.js"
        },
        "robotjs-iframe": {
          "path" : __dirname + "/client/robotjs-iframe.js"
        }
    },
    multis : {
      "robotjs-main" : {
        files : ["socket.io", "robotjs"]
      },
      "robotjs-polyfill" : {
        files : ["socket.io", "setImmediate", "promise", "robotjs"]
      },
      "robotjs-iframe-polyfill" : {
        files : ["setImmediate", "promise", "robotjs-iframe"]
      }
    }
};

require('./lib/serve-files.js')(app, serve, minify);

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/client/index.html');
});

server.listen(port, host);

console.log("server:", "started on " + host + ":" + port);

var robot = require("robotjs");
io.on('connection', function(socket) {
    console.log("server:", "user connected, id: " + socket.id);
    socket.on('robotjs', function(name, parameters, fn) {
        console.log("robotjs:",name,parameters);
        fn(robot[name].apply(this, parameters));
    });
    socket.on('disconnect', function() {
        console.log("server:", "user disconnected, id: " + socket.id);
    });
});
