'use strict';

var Machine = require('./machine');
var Monitor = require('./monitor');
var Controller = require('./controller');
var Router = require('./router');

class Server {
  start() {
    switch (Machine.role()) {
      case Machine.roles.monitor:
        Monitor.create();
        break;
      case Machine.roles.controller:
        Controller.create();
        break;
      case Machine.roles.router:
        Router.create();
        break;
      default:
        throw new Error('Machine role must be defined');
    }
  }
}

module.exports = Server;
module.exports.create = () => new Server();
