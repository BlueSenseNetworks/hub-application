'use strict';

const BleScanner = require('./ble-scanner');
const Bus = require('./messaging/bus');
const Message = require('./models/message');
const DeviceDetectedMessage = require('./models/messages/device-detected');
const DeviceResolver = require('./monitor/resolver');

class Monitor {
  constructor() {
    this._bus = Bus.create();
    this._bleScanner = BleScanner.create();
    this._deviceResolver = DeviceResolver.create();

    this._bus.on(Message.type.connectedToPlatform, () => {
      if (!this._stopped) {
        this._startScan();
      }
    });
    this._bus.on(Message.type.disconnectedFromPlatform, () => this._stopScan());
    this._bus.on(Message.type.startBleScan, () => {
      this._stopped = false;
      this._startScan();
    });
    this._bus.on(Message.type.stopBleScan, () => {
      this._stopped = true;
      this._stopScan()
    });

    this._bleScanner.on(BleScanner.events.deviceDiscovered, device => this._handleDeviceDiscovered(device));

    this._deviceInfoCache = {};
    this._stopped = false;
  }

  static get deviceInfoCacheTimeoutSeconds() {
    return 60;
  }

  _startScan() {
    this._bleScanner.startScan();
  }

  _stopScan() {
    this._deviceInfoCache = {};
    this._bleScanner.stopScan();
  }

  /**
   * @param {Device} device
   */
  _handleDeviceDiscovered(device) {
    var message;

    if (this._deviceInfoCache[device.manufacturerData]) {
      message = new DeviceDetectedMessage(device);
    } else {
      message = new DeviceDetectedMessage(this._deviceResolver.resolve(device));

      this._deviceInfoCache[device.manufacturerData] = device;
      setTimeout(
        () => delete this._deviceInfoCache[device.manufacturerData],
        Monitor.deviceInfoCacheTimeoutSeconds * 1000
      );
    }

    this._bus.publish(message);
  }
}

module.exports = Monitor;
module.exports.create = () => new Monitor();
