'use strict';

const BleScanner = require('../ble-scanner');
const Bus = require('../messaging/bus');
const BlueSenseBeaconParser = require('../monitor/parsers/blueSense-beacon');
const BlueSenseBeaconSyncManager = require('./sync-managers/blueSense-beacon');
const logger = require('../logger').getInstance();
const Machine = require('../machine');
const Message = require('../models/message');
const os = require('os');
const async = require('async');

const MODE_IDLE=0;
const MODE_SCANNING=1;
const MODE_SYNCING=2;

class BeaconSync {
  constructor() {
    logger.info('BeaconSync created, subscribing to ' + Message.route.syncBeacon);

    this._bus = Bus.create();
    this._bleScanner = BleScanner.create();
    this._blueSenseBeaconParser = BlueSenseBeaconParser;

    this._deviceInfoCache = {};
    this._beaconConfigsCache = {};
    this._operationMode = MODE_IDLE;

    this._bus.on(Message.route.syncBeacon, beaconConfig => this._handleSyncBeacon(beaconConfig));
    this._bleScanner.on(BleScanner.events.deviceDiscovered, deviceEventParams => this._handleDeviceDiscovered(deviceEventParams));
  }

  _hasBeaconConfigs(){
    for (let conf in this._beaconConfigsCache) {
      return true;
    }

    return false;
  }

  _startScan() {
    if (this._operationMode != MODE_IDLE) {
      return;
    }

    this._operationMode = MODE_SCANNING;
    this._bleScanner.startScan();
  }

  _stopScan() {
    if (this._operationMode != MODE_SCANNING) {
      return;
    }

    this._bleScanner.stopScan();
    this._operationMode = MODE_IDLE;
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
    }
  }

  _handleSyncBeacon(beaconConfig) {
    if (!beaconConfig)
      return;

    if (beaconConfig.serialNumber != '7cec79da4b65' && beaconConfig.serialNumber != '7CEC79DA4B65') {
      return;
    }

    if (!this._beaconConfigsCache[beaconConfig.serialNumber]) {
      this._beaconConfigsCache[beaconConfig.serialNumber] = beaconConfig;
    }

    this._startScan();
  }

  _syncBeacon(device, peripheral, beaconConfig) {
    this._operationMode = MODE_SYNCING;
    logger.info('Syncing...')
    logger.info(device);
    logger.info(beaconConfig);

//    var syncManager = BlueSenseBeaconSyncManager.create();


    delete this._beaconConfigsCache[beaconConfig.serialNumber];

    peripheral.removeAllListeners();
    let syncManager = BlueSenseBeaconSyncManager.create(peripheral);

    this.dumpBeaconData(syncManager, beaconConfig);
  }

   _restart() {

     if (this._operationMode == MODE_SYNCING)
       this._operationMode = MODE_IDLE;

     if (this._hasBeaconConfigs()) {
       this._startScan();
     }
   }

  dumpBeaconData(beacon, beaconConfig){
    let self = this;

    async.series([
      function(callback) {
        beacon.once('disconnect', () =>
        {
          delete self._beaconConfigsCache[beaconConfig.serialNumber];

          self._restart();
        });

        logger.info('connecting to ' + beacon.name);
        beacon.connect(callback);
      },
      function(callback) {
        logger.info('Discovering services and characteristics...');
        beacon.discoverServicesAndCharacteristics(callback);
      },
      function(callback) {
        beacon.readDeviceInfo(function() {
          logger.info('\tDevice Info for ' + beacon.uuid);
          logger.info('\tDevice name = ' + beacon.DeviceInfo.deviceName);
          logger.info('\tSerial number = ' + beacon.DeviceInfo.serialNumber);
          logger.info('\tManufacturer name = ' + beacon.DeviceInfo.manufacturerName);
          logger.info('\tModel number = ' + beacon.DeviceInfo.modelNumber);
          logger.info('\tHardware revision = ' + beacon.DeviceInfo.hardwareRevision);
          logger.info('\tFirmware revision = ' + beacon.DeviceInfo.firmwareRevision);
          callback();
        });
      },
      function(callback) {
        beacon.readConfiguration(function() {
          logger.info('\tConfiguration for ' + beacon.uuid);
          logger.info('\tUUID = ' + beacon.Configuration.uuid);
          logger.info('\tMajor = ' + beacon.Configuration.major);
          logger.info('\tMinor = ' + beacon.Configuration.minor);
          logger.info('\tAdvertisement Interval = ' + beacon.Configuration.advInterval);
          logger.info('\tTxPower = ' + beacon.Configuration.txPower);
          logger.info('\tCalibration value = ' + beacon.Configuration.txCalibrationValue);
          logger.info('\tBattery Level = ' + beacon.Configuration.batteryLevel);
          callback();
        });
      },
      /*    function(callback) {

       if (beacon.serial == '8833147E02EE') {
       beacon.authKey = '57172a69';
       beacon.writeMajor(major, function() {
       logger.info('Wrote major: ' + major);
       major++;

       callback();
       });
       } else {
       callback();
       }
       },
       */
      function(callback) {
        logger.info('disconnect');
        beacon.disconnect(callback);
      }
    ],
    function(err, results) {
      if (err)
        logger.warn('Error after series: ', err);
      if (results)
        logger.info('Results after series: ', results);

      self._restart();
    });
  };
}

module.exports = BeaconSync;
module.exports.create = () => new BeaconSync();
