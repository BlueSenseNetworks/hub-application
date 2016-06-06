'use strict';

const Wireless = require('./wireless');
const Bus = require('./messaging/bus');
const logger = require('./logger').getInstance();
const Message = require('./models/message');
const InfoMessage = require('./models/messages/info');
const os = require('os');
const Machine = require('./machine');

class Controller {
  constructor() {
    this._wireless = Wireless.create();
    this._bus = Bus.create();

    this._wifiNetworks = [];
    this._sendWiFiScanEvents = false;
    this._currentScan = null;

    this._wireless.on(Wireless.events.appear, this._wifiAppeared.bind(this));
    this._wireless.on(Wireless.events.vanish, this._wifiVanished.bind(this));
    this._wireless.on(Wireless.events.change, this._wifiChange.bind(this));
    this._wireless.on(Wireless.events.error, this._wifiError.bind(this));
    this._wireless.on(Wireless.events.join, this._wifiJoined.bind(this));
    this._wireless.on(Wireless.events.leave, this._wifiLeft.bind(this));

    this._bus.once('ready', () => this._startWifiTracking());
    this._bus.on(Message.type.connectWiFi, data => this._joinNetwork(data.ssid, data.passphrase));
    this._bus.on(Message.type.startWiFiScan, () => this._startWiFiScan());
    this._bus.on(Message.type.stopWiFiScan, () => this._stopWiFiScan());
    this._bus.on(Message.type.connectedToPlatform, () => this._publishInfo());
  }

  /**
   * The time after the scan should stop in seconds
   */
  static get wifiScanTimeout() {
    return 300;
  }

  _wifiAppeared(network) {
    this._wifiNetworks.push(network);

    if (this._sendWiFiScanEvents) {
      this._bus.publish(new Message(Message.type.wifiUpdated, this._wifiNetworks));
    }
  }

  _wifiVanished(vanishedNetwork) {
    this._wifiNetworks = this._wifiNetworks.filter(network => network.address !== vanishedNetwork.address);

    if (this._sendWiFiScanEvents) {
      this._bus.publish(new Message(Message.type.wifiUpdated, this._wifiNetworks));
    }
  }

  _wifiChange(changedNetwork) {
    this._wifiNetworks = this._wifiNetworks.map(network => (network.address === changedNetwork.address) ? changedNetwork : network);

    if (this._sendWiFiScanEvents) {
      this._bus.publish(new Message(Message.type.wifiUpdated, this._wifiNetworks));
    }
  }

  _wifiError(message) {
    this._bus.publish(new Message(Message.type.wifiError, message));
  }

  _wifiJoined(network) {
    this._bus.publish(new Message(Message.type.wifiJoined, network));

    if (this._currentScan) {
      this._stopWiFiScan();
    }
  }

  _wifiLeft() {
    this._bus.publish(new Message(Message.type.wifiLeft));
  }

  _joinNetwork(ssid, passphrase) {
    var network = this._wifiNetworks.filter(network => network.ssid === ssid)[0];

    if (!network) {
      this._wifiError(Wireless.errors.unknownNetwork);
      return;
    }

    if (network.encryptionAny) {
      if ((network.encryptionWpa || network.encryptionWpa2) && (passphrase.length < 8 || passphrase.length > 63)) {
        this._wifiError(Wireless.errors.passphraseLength);
        return;
      }
      //TODO: WEP validation
    }

    this._wireless.join(network, passphrase);
  }

  _startWifiTracking() {
    logger.info('Starting wireless module...');
    this._wireless.start();
  }

  _startWiFiScan() {
    if (this._currentScan) {
      clearTimeout(this._currentScan);
    } else {
      logger.info('Starting wireless scan...');
      this._sendWiFiScanEvents = true;
    }

    this._currentScan = setTimeout(() => this._stopWiFiScan(), Controller.wifiScanTimeout * 1000);
  }

  _stopWiFiScan() {
    logger.info('Stopping wireless scan...');
    this._sendWiFiScanEvents = false;
    this._currentScan = null;
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

    logger.info(ipAddresses);

    this._bus.publish(new InfoMessage(Machine.softwareVersion(), os.hostname(), ipAddresses));
  }
}

module.exports = Controller;
module.exports.create = () => new Controller();
