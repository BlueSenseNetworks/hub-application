'use strict';

const BleScanner = require('./ble-scanner');
const Bus = require('./messaging/bus');
const Message = require('./models/message');

class Monitor {
  constructor() {
    this._bus = Bus.create();
    this._bleScanner = BleScanner.create();

    this._bus.on('message', message => {
      switch (message.type) {
        case Message.type.connectedToPlatform:
        case Message.type.startBleScan:
          this._startScan();
          break;
        case Message.type.stopBleScan:
        case Message.type.disconnectedFromPlatform:
          this._stopScan();
          break;
      }
    });
    this._bleScanner.on('deviceDiscovered', device => this._handleDeviceDiscovered(device));
  }

  _startScan() {
    this._bleScanner.startScan();
  }

  _stopScan() {
    this._bleScanner.stopScan();
  }

  _handleDeviceDiscovered(device) {
    this._bus.publish(new Message(Message.type.deviceDetected, device));
  }
}

module.exports = Monitor;
module.exports.create = () => new Monitor();
