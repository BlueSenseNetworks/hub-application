'use strict';

const BleScanner = require('../ble-scanner');
const Bus = require('../messaging/bus');
const BlueSenseBeaconParser = require('../monitor/parsers/blueSense-beacon');
const BlueSenseBeaconSyncManager = require('./sync-managers/blueSense-beacon');
const logger = require('../logger').getInstance();
const Machine = require('../machine');
const Message = require('../models/message');
const os = require('os');

class BeaconSync {
  constructor() {
    logger.info('BeaconSync created, subscribing to ' + Message.type.syncBeacon);

    this._bus = Bus.create();
    this._bleScanner = BleScanner.create();
    this._blueSenseBeaconParser = BlueSenseBeaconParser;

    this._deviceInfoCache = {};
    this._beaconConfigsCache = {};
    this._scanning = false;

    this._bus.on(Message.type.syncBeacon, beaconConfig => this._handleSyncBeacon(beaconConfig));
    this._bleScanner.on(BleScanner.events.deviceDiscovered, deviceEventParams => this._handleDeviceDiscovered(deviceEventParams));
  }

  _hasBeaconConfigs(){
    for (let conf in this._beaconConfigsCache) {
      return true;
    }

    return false;
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
    this._scanning = false;
  }

  _handleDeviceDiscovered(deviceEventParams) {
    if (!this._deviceInfoCache[deviceEventParams.Device.manufacturerData]) {
      this._deviceInfoCache[deviceEventParams.Device.manufacturerData] = deviceEventParams;
      setTimeout(
        () => delete this._deviceInfoCache[deviceEventParams.Device.manufacturerData],
        5 * 60 * 1000 // must come from config
      );
    }

    let blueSenseBeacon = this._blueSenseBeaconParser.parse(deviceEventParams.Device);
    if (blueSenseBeacon && this._beaconConfigsCache[blueSenseBeacon.serial]) {
      let beaconConfig = this._beaconConfigsCache[blueSenseBeacon.serial];

      this._stopScan();

      this._syncBeacon(deviceEventParams.Device, deviceEventParams.Peripheral, beaconConfig);

      if (this._hasBeaconConfigs()) {
        this._startScan();
      }
    }
  }

  _handleSyncBeacon(beaconConfig) {
    if (!beaconConfig)
      return;

    if (!this._beaconConfigsCache[beaconConfig.serialNumber]) {
      this._beaconConfigsCache[beaconConfig.serialNumber] = beaconConfig;
    }

    this._startScan();
  }

  _syncBeacon(device, peripheral, beaconConfig) {
    logger.info('Syncing...')
    logger.info(device);
    logger.info(beaconConfig);

//    var syncManager = BlueSenseBeaconSyncManager.create();


    delete this._beaconConfigsCache[beaconConfig.serialNumber];
  }
}

module.exports = BeaconSync;
module.exports.create = () => new BeaconSync();
