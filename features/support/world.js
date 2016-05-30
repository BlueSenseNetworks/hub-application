'use strict';

const WebSocketServer = require('ws').Server;
const spawn = require('child_process').spawn;
const execSync = require('child_process').execSync;

class World {
  constructor() {
  }

  startServer(callback) {
    this.server = new WebSocketServer({port: 8080});
    this.server.on('connection', ws => {
      this.client = ws;
      // this.messageHistory = [];

      // this.client.on('message', message => {
      //   console.log('world - ' + message);
      //   // this.messageHistory.push(message);
      // });

      callback();
    });
  }
}

module.exports = function() {
  this.World = World;

  this.setDefaultTimeout(60 * 1000);

  this.Before(function(scenario, callback) {
    this.app = spawn('npm', ['start']);

    var startServer = !scenario.getTags().some(tag => tag.getName() === '@no-server');
    if (startServer) {
      this.startServer(callback);
    } else {
      process.nextTick(callback);
    }

    execSync('cat /dev/null > /etc/wpa_supplicant/wpa_supplicant-wlan0.conf')
  });

  this.After(function(scenario, callback) {
    if (this.server) {
      this.server.close(() => {
        if (this.client) {
          this.client.terminate();
        }

        callback();
      });
    }
  });
};
