'use strict';

const BleScanner = require('./ble-scanner');
const Bus = require('./messaging/bus');
const Message = require('./models/message');
const DeviceDetectedMessage = require('./models/messages/device-detected');
const DeviceDetectedSlimMessage = require('./models/messages/device-detected-slim');
const DeviceResolver = require('./monitor/resolver');
// const logger = require('./logger').getInstance();

class Monitor {
  constructor() {
    this._bus = Bus.create();
    this._bleScanner = BleScanner.create();
    this._deviceResolver = DeviceResolver.create();

    this._deviceInfoCache = new Set();
    this._stopped = false;

    this._bus.on(Message.route.connectedToPlatform, () => this._startScan(false));
    this._bus.on(Message.route.disconnectedFromPlatform, () => this._stopScan(false));
    this._bus.on(Message.route.startBleScan, () => this._startScan(true));
    this._bus.on(Message.route.stopBleScan, () => this._stopScan(true));

    this._bleScanner.on(BleScanner.events.deviceDiscovered, device => this._handleDeviceDiscovered(device));
  }

  static create() {
    return new Monitor();
  }

  static get deviceInfoCacheTimeoutSeconds() {
    return 10;
  }

  /**
   * @param explicitStart Did the user explicitly start the scan from the platform
   * @private
   */
  _startScan(explicitStart) {
    if (explicitStart) {
      this._stopped = false;
    }

    if (!this._stopped) {
      this._bleScanner.startScan();
    }
  }

  /**
   * @param explicitStop Did the user explicitly stop the scan from the platform
   * @private
   */
  _stopScan(explicitStop) {
    if (explicitStop) {
      this._stopped = true;
    }

    this._deviceInfoCache.clear();
    this._bleScanner.stopScan();
  }

  /**
   * @param {Device} device
   */
  _handleDeviceDiscovered(device) {
    let message;

    if (this._deviceInfoCache.has(device.Device.id)) {
      message = new DeviceDetectedSlimMessage(device.Device);
    } else {
      message = new DeviceDetectedMessage(device.Device, this._deviceResolver.resolve(device.Device));

      this._deviceInfoCache.add(device.Device.id);
      setTimeout(() => this._deviceInfoCache.delete(device.Device.id), Monitor.deviceInfoCacheTimeoutSeconds * 1000);
    }

//    logger.info('device found: ' + JSON.stringify(message));

    this._bus.publish(message);
  }
}

module.exports = Monitor;
