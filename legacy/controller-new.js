'use strict';

const WirelessAdapter = require('./wireless-adapter');
const logger = require('./logger').logger;

class Controller {
  constructor(wireless, adapter) {
    /** @private */
    this.wireless = wireless;

    /** @private */
    this.adapter = adapter;

    /** @public */
    this.wifiNetworks = [];

    this._sendWiFiScanEvents = false;

    this._currentScan = null;

    wireless.on(WirelessAdapter.events.appear, this.wifiAppeared.bind(this));
    wireless.on(WirelessAdapter.events.vanish, this.wifiVanished.bind(this));
    wireless.on(WirelessAdapter.events.change, this.wifiChange.bind(this));
    wireless.on(WirelessAdapter.events.error, this.wifiError.bind(this));
    wireless.on(WirelessAdapter.events.join, this.wifiJoined.bind(this));
    wireless.on(WirelessAdapter.events.leave, this.wifiLeft.bind(this));
  }

  get commands() {
    return {
      connectWiFi: this.joinNetwork.bind(this),
      startWiFiScan: this.startWiFiScan.bind(this),
      stopWiFiScan: this.stopWiFiScan.bind(this)
    };
  }

  /**
   * The time after the scan should stop in seconds
   */
  static get wifiScanTimeout() {
    return 300;
  }

  wifiAppeared(network) {
    this.wifiNetworks.push(network);

    if (this._sendWiFiScanEvents) {
      this.adapter.wifiUpdated(this.wifiNetworks);
    }
  }

  wifiVanished(vanishedNetwork) {
    this.wifiNetworks = this.wifiNetworks.filter(network => network.address !== vanishedNetwork.address);

    if (this._sendWiFiScanEvents) {
      this.adapter.wifiUpdated(this.wifiNetworks);
    }
  }

  wifiChange(changedNetwork) {
    this.wifiNetworks = this.wifiNetworks.map(network => (network.address === changedNetwork.address) ? changedNetwork : network);

    if (this._sendWiFiScanEvents) {
      this.adapter.wifiUpdated(this.wifiNetworks);
    }
  }

  wifiError(message) {
    this.adapter.wifiError(message);
  }

  wifiJoined(network) {
    this.adapter.wifiJoined(network.ssid, network);

    if (this._currentScan) {
      this.stopWiFiScan();
    }
  }

  wifiLeft() {
    this.adapter.wifiLeft();
  }

  joinNetwork(ssid, passphrase) {
    var network = this.wifiNetworks.filter(network => network.ssid === ssid)[0];

    if (network.encryptionAny) {
      if ((network.encryptionWpa || network.encryptionWpa2) && (passphrase.length < 8 || passphrase.length > 63)) {
        this.adapter.wifiError(WirelessAdapter.errors.passphraseLength);
        throw new Error(WirelessAdapter.errors.passphraseLength);
      }
      //TODO: WEP validation
    }

    return this.wireless.join(network, passphrase);
  }

  connected() {
    logger.info('Starting wireless module...');
    this.wireless.start();
  }

  disconnected() {
    logger.info('Stopping wireless module...');
    this.wireless.stop();
  }

  startWiFiScan() {
    if (this._currentScan) {
      clearTimeout(this._currentScan);
    } else {
      logger.info('Starting wireless scan...');
      this._sendWiFiScanEvents = true;
    }

    this._currentScan = setTimeout(() => this.stopWiFiScan(), Controller.wifiScanTimeout * 1000);
  }

  stopWiFiScan() {
    logger.info('Stopping wireless scan...');
    this._sendWiFiScanEvents = false;
    this._currentScan = null;
  }
}

module.exports = Controller;
