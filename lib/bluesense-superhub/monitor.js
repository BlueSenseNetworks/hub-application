'use strict';

const BleScanner = require('./ble-scanner');
const Bus = require('./messaging/bus');
const Message = require('./models/message');
const DeviceDetectedMessage = require('./models/messages/device-detected');

class Monitor {
  constructor() {
    this._bus = Bus.create();
    this._bleScanner = BleScanner.create();

    this._bus.once('ready', () => this._startScan());
    this._bus.on(Message.type.startBleScan, () => this._startScan());
    this._bus.on(Message.type.stopBleScan, () => this._stopScan());

    this._bleScanner.on(BleScanner.events.deviceDiscovered, device => this._handleDeviceDiscovered(device));
  }

  _startScan() {
    this._bleScanner.startScan();
  }

  _stopScan() {
    this._bleScanner.stopScan();
  }

  _handleDeviceDiscovered(device) {
    this._bus.publish(new DeviceDetectedMessage(device));
  }
}

module.exports = Monitor;
module.exports.create = () => new Monitor();
