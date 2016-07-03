'use strict';

const BleScanner = require('../ble-scanner');
const Bus = require('../messaging/bus');
const DeviceResolver = require('../monitor/resolver');
const logger = require('../logger').getInstance();
const Machine = require('../machine');
const Message = require('../models/message');
const os = require('os');

class BeaconSync {
  constructor() {
    this._bus = Bus.create();
    this._bleScanner = BleScanner.create();
    this._deviceResolver = DeviceResolver.create();

    this._deviceInfoCache = {};
    this._beaconsToUpdateCache = {};
    this._scanning = false;

    this._bus.on(Message.type.syncBeacon, beaconConfig => this._syncBeacon(beaconConfig));
    this._bleScanner.on(BleScanner.events.deviceDiscovered, device => this._handleDeviceDiscovered(device));
  }

  _startScan() {
    if (this._scanning) {
      return;
    }

    this._scanning = true;
    this._bleScanner.startScan();
  }

  _stopScan() {
    if (!this._scanning) {
      return;
    }

    this._bleScanner.stopScan();
  }

  /**
   * @param {Device} device
   */
  _handleDeviceDiscovered(device) {
    if (!this._deviceInfoCache[device.manufacturerData]) {
      this._deviceInfoCache[device.manufacturerData] = device;
      setTimeout(
        () => delete this._deviceInfoCache[device.manufacturerData],
        5 * 60 * 1000 // must come from config
      );
    }

    let beacon = this._deviceResolver.resolve(device);
  }

  _syncBeacon(beaconConfig) {

    if (!this._beaconsToUpdateCache[beaconConfig.serialNumber]) {
      this._beaconsToUpdateCache[beaconConfig.serialNumber] = beaconConfig;
    }

    this._startScan();
  }
}

module.exports = BeaconSync;
module.exports.create = () => new BeaconSync();
