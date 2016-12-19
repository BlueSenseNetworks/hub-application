'use strict';

const WebSocket = require('./messaging/websocket');
const Message = require('./models/message');
const Bus = require('./messaging/bus');
const Config = require('./config');
const Logger = require('./logger');

class Router {
  constructor() {
    const config = Config.getInstance();
    this._logger = Logger.getInstance();

    this._bus = Bus.create();
    this._ws = WebSocket.connect(config.get('PlatformConnectionUrl'));

    this._bus.on('message', message => this._onBusMessage(message));

    this._ws.on('message', message => this._onPlatformMessage(message));
    this._ws.on('connect', () => this._onPlatformConnect());
    this._ws.on('disconnect', () => this._onPlatformDisconnect());

    this._connected = false;
  }

  static create() {
    return new Router();
  }

  _onBusMessage(message) {
    // this._logger.info(`Sending message to platform: ${JSON.stringify(message)}`);
    this._ws.send(message);
  }

  _onPlatformMessage(message) {
/*
    this._logger.info(`Received message from platform:`);
    this._logger.info(message);
*/
    this._bus.publish(message);
  }

  _onPlatformConnect() {
    if (!this._connected) {
      this._connected = true;
      this._logger.info(`Connection to platform established`);
      this._bus.publish(new Message(Message.route.connectedToPlatform));
    }
  }

  _onPlatformDisconnect() {
    if (this._connected) {
      this._connected = false;
      this._logger.info(`Connection to platform lost`);
      this._bus.publish(new Message(Message.route.disconnectedFromPlatform));
    }
  }
}

module.exports = Router;
