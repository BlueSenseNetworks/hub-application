'use strict';

const WebSocket = require('./messaging/websocket');
const Message = require('./models/message');
const Bus = require('./messaging/bus');
const config = require('./config').getInstance();
const logger = require('./logger').getInstance();

class Router {
  constructor() {
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
    // logger.info(`Sending message to platform: ${JSON.stringify(message)}`);
    this._ws.send(message);
  }

  _onPlatformMessage(message) {
    logger.info(`Received message from platform: ${message}`);
    this._bus.publish(new Message(message.type, message.data));
  }

  _onPlatformConnect() {
    if (!this._connected) {
      this._connected = true;
      logger.info(`Connection to platform established`);
      this._bus.publish(new Message(Message.type.connectedToPlatform));
    }
  }

  _onPlatformDisconnect() {
    if (this._connected) {
      this._connected = false;
      logger.info(`Connection to platform lost`);
      this._bus.publish(new Message(Message.type.disconnectedFromPlatform));
    }
  }
}

module.exports = Router;
