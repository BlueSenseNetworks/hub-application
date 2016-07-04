'use strict';

const EventEmitter = require('events').EventEmitter;
const util = require('util');
const async = require('async');
const noble = require('noble');

const DeviceNameChar                = '2a00';

const ModelNumberChar               = '2a24';
const SerialNumberChar              = '2a25';
const FirmwareRevisionChar          = '2a26';
const HardwareRevisionChar          = '2a27';
const ManufacturerNameChar          = '2a29';

const BatteryLevelChar              = '2a19';
const UuidChar                      = '83ac7cdf81e04c4a873f79793f8a73dc';
const MajorChar                     = 'fac11d71984f47c483fba518b0da22ff';
const MinorChar                     = '52a63219e6fd479ab888775c5b7e5458';
const AuthKeyChar                   = '20cc88afd74e42d2929d201ed61120a0';
const EnableChar                    = 'e0defe46c8da41aabc2fec49311dd778';
const AdvertisementIntervalChar     = '80a233457a624aa09256e6984d798fc9';
const TXPowerChar                   = '9c9b4a765c2f43b0ba1bee559dbb74c0';
const TXCalibrationValueChar        = '4b4d86eab5704c49b793e0194409deb0';


class BlueSenseBeaconSyncManager extends EventEmitter {
  constructor(peripheral) {
    super();

    this._peripheral = peripheral;
    this._services = {};
    this._characteristics = {};

    this.uuid = peripheral.uuid;
    this.name = peripheral.advertisement.localName;
    this.serial = this.name.substr('BlueBar Beacon '.length);
    this.authKey = this.serial.substr(4, 4);

    this.DeviceInfo = {
      deviceName: this.name,
      serialNumber: this.serial,
      manufacturer: '',
      modelNumber: '',
      firmwareRevision: '',
      hardwareRevision: ''
    };

    this.Configuration = {
      batteryLevel: -1,
      uuid: '',
      major: -1,
      minor: -1,
      advInterval: -1,
      txPower: -1,
      txCalibrationValue: -1
    };

    this._peripheral.on('disconnect', this.onDisconnect.bind(this));
  }

  printCharacteristics() {
    for (var prop in this._characteristics) {
      console.log('Characteristic: uuid = ' + prop + '; descriptor = ' + this._characteristics[prop]);
    }
  }

  _onDisconnect() {
    this._peripheral.removeAllListeners('disconnect');
    this.emit('disconnect');
  }

  connect(callback) {
    this._peripheral.removeAllListeners('disconnect');
    this._peripheral.on('disconnect', this._onDisconnect.bind(this));
    this._peripheral.connect(callback);
  }

  disconnect(callback) {
    this._peripheral.disconnect(callback);
  }

  discoverServicesAndCharacteristics(callback) {
    this._peripheral.discoverAllServicesAndCharacteristics(function(error, services, characteristics) {
      if (error === null) {
        for (var i in services) {
          var service = services[i];
  //        console.log('Service: uuid = ' + service.uuid);
          this._services[service.uuid] = service;
        }

        for (var j in characteristics) {
          var characteristic = characteristics[j];

  //        console.log('characteristic: uuid = ' + characteristic.uuid);
          this._characteristics[characteristic.uuid] = characteristic;
        }
      }

      callback(error);
    }.bind(this));
  }

  readDataCharacteristic(uuid, callback) {
    if (!this._characteristics[uuid])
    {
      console.log('Characteristic "' + uuid + '" not found!');

      callback('');
      return;
    }

    this._characteristics[uuid].read(function(error, data) {
      if (error) {
        console.log('Error reading "' + uuid + '" - ' + error);
      }

      callback(data);
    });
  }

  readStringCharacteristic(uuid, callback) {
    this.readDataCharacteristic(uuid, function(data) {
      if (data) {
        if (data[0] === data.length - 1) {
          data = data.slice(1);
        }

        callback(data.toString());
      } else {
        callback('');
      }
    });
  }

  readUInt16Characteristic(uuid, callback) {
    this.readDataCharacteristic(uuid, function(data) {
      callback(data.readUInt16BE(0));
    });
  }

  readInt8Characteristic(uuid, callback) {
    this.readDataCharacteristic(uuid, function(data) {
      callback(data.readInt8(0));
    });
  }

  readUInt8Characteristic(uuid, callback) {
    this.readDataCharacteristic(uuid, function(data) {
      callback(data.readUInt8(0));
    });
  }

  readDoubleCharacteristic(uuid, callback) {
    this.readDataCharacteristic(uuid, function(data) {
      callback(data.readDoubleLE(0));
    });
  }

  writeDataCharacteristic(uuid, data, callback) {
    var pinBuffer = new Buffer(this.authKey, 'hex');
    var dataToWrite = Buffer.concat([pinBuffer, data]);

    this._characteristics[uuid].write(dataToWrite, false, callback);
  }

  writeStringCharacteristic(uuid, value, callback) {
    var data = new Buffer(value);
    this.writeDataCharacteristic(uuid, data, callback);
  }

  writeUInt16Characteristic(uuid, value, callback) {
    var data = new Buffer(2);

    data.writeUInt16BE(value, 0);

    this.writeDataCharacteristic(uuid, data, callback);
  }

  writeInt8Characteristic(uuid, value, callback) {
    var data = new Buffer(1);

    data.writeInt8(value, 0);

    this.writeDataCharacteristic(uuid, data, callback);
  }

  writeUInt8Characteristic(uuid, value, callback) {
    var data = new Buffer(1);

    data.writeUInt8(value, 0);

    this.writeDataCharacteristic(uuid, data, callback);
  }

  writeDoubleCharacteristic(uuid, value, callback) {
    var data = new Buffer(8);

    data.writeDoubleLE(value, 0);

    this.writeDataCharacteristic(uuid, data, callback);
  }

  readDeviceName(callback) {
    this.readStringCharacteristic(DeviceNameChar, callback);
  }

  readSerialNumber(callback) {
    this.readStringCharacteristic(SerialNumberChar, callback);
  }

  readManufacturerName(callback) {
    this.readStringCharacteristic(ManufacturerNameChar, callback);
  }

  readModelNumber(callback) {
    this.readStringCharacteristic(ModelNumberChar, callback);
  }

  readHardwareRevision(callback) {
    this.readStringCharacteristic(HardwareRevisionChar, callback);
  }

  readFirmwareRevision(callback) {
    this.readStringCharacteristic(FirmwareRevisionChar, callback);
  }

  readUuid(callback) {
    this.readDataCharacteristic(UuidChar, function(data) {
      callback(data.toString('hex'));
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

  readDeviceInfo(callback) {
    var beacon = this;

    async.series([
      function(callback) {
        beacon.readDeviceName(function(deviceName) {
          beacon.DeviceInfo.deviceName = deviceName;
          callback();
        });
      },
      function(callback) {
        beacon.readSerialNumber(function(serialNumber) {
          beacon.DeviceInfo.serialNumber = serialNumber;
          callback();
        });
      },
      function(callback) {
        beacon.readManufacturerName(function(manufacturerName) {
          beacon.DeviceInfo.manufacturerName = manufacturerName;
          callback();
        });
      },
      function(callback) {
        beacon.readModelNumber(function(modelNumber) {
          beacon.DeviceInfo.modelNumber = modelNumber;
          callback();
        });
      },
      function(callback) {
        beacon.readHardwareRevision(function(hardwareRevision) {
          beacon.DeviceInfo.hardwareRevision = hardwareRevision;
          callback();
        });
      },
      function(callback) {
        beacon.readFirmwareRevision(function(firmwareRevision) {
          beacon.DeviceInfo.firmwareRevision = firmwareRevision;
          callback();
        });
      }
    ], callback);
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
module.exports.create = peripheral => new BlueSenseBeaconSyncManager(peripheral);
