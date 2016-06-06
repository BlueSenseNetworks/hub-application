'use strict';

const WS = require('ws');
const logger = require('./../logger').getInstance();
const EventEmitter = require('events').EventEmitter;

class WebSocket extends EventEmitter {
  constructor(url) {
    super();

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
    this._ws = WS.connect(url);

    this._ws.on('error', function(error) {
      if (error.code === 'ECONNRESET' || error.code === 'ECONNREFUSED') {
        //handled by close event
      } else {
        logger.error(error.stack);
      }
    }.bind(this));

    this._ws.on('open', function() {
      // logger.info(`Connected to: ${config.get('PlatformConnectionUrl')}`);
      this.emit('connect');
    }.bind(this));

    this._ws.on('close', function() {
      logger.info(`Retrying connection to websocket in ${WebSocket.reconnectDelaySeconds} seconds...`);
      setTimeout(() => this._connect(url), WebSocket.reconnectDelaySeconds * 1000);

      this.emit('disconnect');
    }.bind(this));

    this._ws.on('message', function(message) {
      this.emit('message', JSON.parse(message));
    }.bind(this));
  }
}

module.exports = WebSocket;