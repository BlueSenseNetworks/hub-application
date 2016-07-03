'use strict';

const BleScanner = require('./ble-scanner');
const Bus = require('./messaging/bus');
const Message = require('./models/message');
const DeviceDetectedMessage = require('./models/messages/device-detected');
const DeviceDetectedSlimMessage = require('./models/messages/device-detected-slim');
const DeviceResolver = require('./monitor/resolver');

class Monitor {
  constructor() {
    this._bus = Bus.create();
    this._bleScanner = BleScanner.create();
    this._deviceResolver = DeviceResolver.create();

    this._deviceInfoCache = {};
    this._stopped = false;

    this._bus.on(Message.type.connectedToPlatform, () => this._startScan(false));
    this._bus.on(Message.type.disconnectedFromPlatform, () => this._stopScan(false));
    this._bus.on(Message.type.startBleScan, () => this._startScan(true));
    this._bus.on(Message.type.stopBleScan, () => this._stopScan(true));

    this._bleScanner.on(BleScanner.events.deviceDiscovered, device => this._handleDeviceDiscovered(device));
  }

  static get deviceInfoCacheTimeoutSeconds() {
    return 60;
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

    this._deviceInfoCache = {};
    this._bleScanner.stopScan();
  }

  /**
   * @param {Device} device
   */
  _handleDeviceDiscovered(device) {
    var message;

    if (this._deviceInfoCache[device.Device.manufacturerData]) {
      message = new DeviceDetectedSlimMessage(device.Device);
    } else {
      message = new DeviceDetectedMessage(device.Device, this._deviceResolver.resolve(device.Device));

      this._deviceInfoCache[device.Device.manufacturerData] = device;
      setTimeout(
        () => delete this._deviceInfoCache[device.Device.manufacturerData],
        Monitor.deviceInfoCacheTimeoutSeconds * 1000
      );
    }

    this._bus.publish(message);
  }
}

module.exports = Monitor;
module.exports.create = () => new Monitor();
