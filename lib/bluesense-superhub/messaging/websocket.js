'use strict';

const WS = require('ws');
const Logger = require('../logger');
const EventEmitter = require('events').EventEmitter;
const Machine = require('../machine');

class WebSocket extends EventEmitter {
  constructor(url) {
    super();

    this._logger = Logger.getInstance();
    this._connect(url);
  }

  static get reconnectDelaySeconds() {
    return 5;
  }

  static connect(url) {
    return new WebSocket(url);
  }

  send(message) {
    if (this._ws.readyState === WS.OPEN) {
      this._ws.send(JSON.stringify(message));
    }
  }

  _connect(url) {
    this._logger.info(`Connecting to ${url}`);

    let protocols = [];
    let options = {
      headers : {
        'X-ProximitySense-DeviceId': Machine.serialNumber(),
        'X-ProximitySense-InstanceId': Machine.serialNumber(),
      }
    };

    this._ws = new WS(url, protocols, options);

    this._ws.on('error', function(error) {
      if (error.code === 'ECONNRESET' || error.code === 'ECONNREFUSED') {
        //handled by close event
      } else {
        this._logger.error(error.stack);
      }
    }.bind(this));

    this._ws.on('open', function() {
      // logger.info(`Connected to: ${config.get('PlatformConnectionUrl')}`);
      this.emit('connect');
    }.bind(this));

    this._ws.on('close', function() {
      this._logger.info(`Retrying connection to websocket in ${WebSocket.reconnectDelaySeconds} seconds...`);
      setTimeout(() => this._connect(url), WebSocket.reconnectDelaySeconds * 1000);

      this.emit('disconnect');
    }.bind(this));

    this._ws.on('message', function(message) {
      this.emit('message', JSON.parse(message));
    }.bind(this));
  }
}

module.exports = WebSocket;
