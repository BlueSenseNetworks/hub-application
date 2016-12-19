'use strict';

const Bus = require('../messaging/bus');
const Logger = require('../logger');
const Message = require('../models/message');
const InfoMessage = require('../models/messages/info');
const os = require('os');
const Machine = require('../machine');

class InfoPublisher {
  constructor() {
    this._bus = Bus.create();
    this._logger = Logger.getInstance();

    this._bus.on(Message.route.connectedToPlatform, () => this._publishInfo());
  }

  _publishInfo() {
    var ifaces = os.networkInterfaces();

    var ipAddresses = {};

    Object.keys(ifaces).forEach(function(ifname) {
      var alias = 0;

      ifaces[ifname].forEach(function(iface) {
        if ('IPv4' !== iface.family || iface.internal !== false) {
          // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
          return;
        }

        if (alias > 0) {
          // this single interface has multiple ipv4 addresses
          ipAddresses[ifname + alias] = iface.address;
        } else {
          // this interface has only one ipv4 adress
          ipAddresses[ifname] = iface.address;
        }
        alias++;
      });
    });

    this._logger.info(ipAddresses);

    this._bus.publish(new InfoMessage(Machine.softwareVersion(), os.hostname(), ipAddresses));
  }
}

module.exports = InfoPublisher;
module.exports.create = () => new InfoPublisher();
