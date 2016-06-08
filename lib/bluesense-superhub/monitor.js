'use strict';

const BleScanner = require('./ble-scanner');
const Bus = require('./messaging/bus');
const Message = require('./models/message');
const DeviceDetectedExtendedMessage = require('./models/messages/device-detected-extended');
const DeviceDetectedBasicMessage = require('./models/messages/device-detected-basic');

class Monitor {
  constructor() {
    this._bus = Bus.create();
    this._bleScanner = BleScanner.create();

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

    if (this._deviceInfoCache[device.uuid]) {
      message = new DeviceDetectedBasicMessage(device);
    } else {
      message = new DeviceDetectedExtendedMessage(device);

      this._deviceInfoCache[device.uuid] = device;
      setTimeout(
        () => delete this._deviceInfoCache[device.uuid],
        Monitor.deviceInfoCacheTimeoutSeconds * 1000
      );
    }

    this._bus.publish(message);
  }
}

module.exports = Monitor;
module.exports.create = () => new Monitor();
