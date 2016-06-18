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

    // The router must be on a different channel than others, because of the following:
    // when a message is received from the platform it is published on the bus. If the router is on
    // the same channels as others the message event gets raised and the message is retransmitted to
    // the platform.
    var subscribedChannel = process.env.SUPERHUB_ROLE === 'Router' ? Bus.channels.outbound : Bus.channels.inbound;

    this._subscriber = redis.createClient(options);
    this._publisher = redis.createClient(options);

    this._subscriber.on('message', (channel, message) => this._onMessage(channel, message, subscribedChannel));
    this._subscriber.on('ready', () => this._onReady(subscribedChannel));
    this._subscriber.on('end', () => this.emit('disconnect'));
  }

  static get channels() {
    return {
      outbound: 'outbound',
      inbound: 'inbound'
    };
  }

  publish(message) {
    this._publisher.publish(process.env.SUPERHUB_ROLE === 'Router' ? Bus.channels.inbound : Bus.channels.outbound, JSON.stringify(message));
  }

  static get retryIntervalSeconds() {
    return 5;
  }

  _retryStrategy(options) {
    logger.warn(`Could not connect to redis: ${options.error.message}`);

    return Bus.retryIntervalSeconds * 1000;
  }

  _onMessage(channel, rawMessage, subscribedChannel) {
    if (channel === subscribedChannel) {
      let message = JSON.parse(rawMessage);
      // emit a general message event so the router can forward to websockets
      this.emit('message', message);
      // emit a more specific message so the listeners can easily handle
      this.emit(message.messageType, message);
    }
  }

  _onReady(subscribedChannel) {
    this._subscriber.subscribe(subscribedChannel);
    this.emit('ready');
  }
}

module.exports = Bus;
module.exports.create = () => new Bus();
