'use strict';

const EventEmitter = require('events').EventEmitter;
const redis = require('redis');
const logger = require('../logger').getInstance();

class Bus extends EventEmitter {
  constructor() {
    super();

    var options = {
      retry_strategy: this._retryStrategy,
      enable_offline_queue: false
    };

    var channel = 'main';

    this._subscriber = redis.createClient(options);
    this._publisher = redis.createClient(options);

    this._subscriber.on('message', (channel, rawMessage) => {
      let message = JSON.parse(rawMessage);
      // emit a general message event so the router can forward to websockets
      this.emit('message', message);
      // emit a more specific message so the listeners can easily handle
      this.emit(message.messageType, message);
    });

    this._subscriber.on('ready', () => {
      this._subscriber.subscribe(channel);
      this.emit('ready');
    });

    this._subscriber.on('end', () => this.emit('disconnect'));
  }

  publish(message) {
    this._publisher.publish('main', JSON.stringify(message));
  }

  static get retryIntervalSeconds() {
    return 5;
  }

  _retryStrategy(options) {
    logger.warn(`Could not connect to redis: ${options.error.message}`);

    return Bus.retryIntervalSeconds * 1000;
  }
}

module.exports = Bus;
module.exports.create = () => new Bus();
