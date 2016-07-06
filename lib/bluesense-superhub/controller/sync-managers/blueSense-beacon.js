'use strict';

const BleDeviceSyncManager = require('./ble-device');
const logger = require('../../logger').getInstance();
const util = require('util');
const async = require('async');
const noble = require('noble');

const BatteryLevelChar              = '2a19';
const UuidChar                      = '83ac7cdf81e04c4a873f79793f8a73dc';
const MajorChar                     = 'fac11d71984f47c483fba518b0da22ff';
const MinorChar                     = '52a63219e6fd479ab888775c5b7e5458';
const AuthKeyChar                   = '20cc88afd74e42d2929d201ed61120a0';
const EnableChar                    = 'e0defe46c8da41aabc2fec49311dd778';
const AdvertisementIntervalChar     = '80a233457a624aa09256e6984d798fc9';
const TXPowerChar                   = '9c9b4a765c2f43b0ba1bee559dbb74c0';
const TXCalibrationValueChar        = '4b4d86eab5704c49b793e0194409deb0';


class BlueSenseBeaconSyncManager extends BleDeviceSyncManager {
  constructor(peripheral) {
    super(peripheral);

    this.serial = this.name.substr('BlueBar Beacon '.length);
    this.authKey = this.serial.substr(4, 4);

    this.Configuration = {
      batteryLevel: -1,
      uuid: '',
      major: -1,
      minor: -1,
      advInterval: -1,
      txPower: -1,
      txCalibrationValue: -1
    };

  }

  readUuid(callback) {
    this.readDataCharacteristic(UuidChar, function(data) {
      if (data)
        callback(data.toString('hex'));
      else
        callback(data);
    });
  }

  readMajor(callback) {
    this.readUInt16Characteristic(MajorChar, callback);
  };

  readMinor(callback) {
    this.readUInt16Characteristic(MinorChar, callback);
  }

  readAdvertisementInterval(callback) {
    this.readUInt16Characteristic(AdvertisementIntervalChar, callback);
  }

  readTxPower(callback) {
    this.readUInt8Characteristic(TXPowerChar, function(value) {
      var txPower = value;

      callback(txPower);
    }.bind(this));
  }

  readTxCalibrationValue(callback) {
    this.readInt8Characteristic(TXCalibrationValueChar, callback);
  }

  readBatteryLevel(callback) {
    this.readInt8Characteristic(BatteryLevelChar, callback);
  }

  readConfiguration(callback) {
    var beacon = this;

    async.series([
      function(callback) {
        beacon.readUuid(function(uuid) {
          beacon.Configuration.uuid = uuid;
          callback();
        });
      },
      function(callback) {
        beacon.readMajor(function(major) {
          beacon.Configuration.major = major;
          callback();
        });
      },
      function(callback) {
        beacon.readMinor(function(minor) {
          beacon.Configuration.minor = minor;
          callback();
        });
      },
      function(callback) {
        beacon.readAdvertisementInterval(function(advInterval) {
          beacon.Configuration.advInterval = advInterval;
          callback();
        });
      },

      function(callback) {
        beacon.readTxPower(function(txPower) {
          beacon.Configuration.txPower = txPower;
          callback();
        });
      },
      function(callback) {
        beacon.readTxCalibrationValue(function(calibration) {
          beacon.Configuration.txCalibrationValue = calibration;
          callback();
        });
      },

      function(callback) {
        beacon.readBatteryLevel(function(batteryLevel) {
          beacon.Configuration.batteryLevel = batteryLevel;
          callback();
        });
      }
    ], callback);
  }

  writeMajor(major, callback) {
    this.writeUInt16Characteristic(MajorChar, major, callback);
  }

}

module.exports = BlueSenseBeaconSyncManager;
module.exports.create = (peripheral) => new BlueSenseBeaconSyncManager(peripheral);
