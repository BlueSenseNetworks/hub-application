'use strict';

const EventEmitter = require('events').EventEmitter;
const util = require('util');
const async = require('async');
const noble = require('noble');

const logger = require('../../logger').getInstance();

const DeviceNameChar                = '2a00';

const ModelNumberChar               = '2a24';
const SerialNumberChar              = '2a25';
const FirmwareRevisionChar          = '2a26';
const HardwareRevisionChar          = '2a27';
const ManufacturerNameChar          = '2a29';

class BleDeviceSyncManager extends EventEmitter {
  constructor(peripheral) {
    super();

    this._peripheral = peripheral;
    this._services = {};
    this._characteristics = {};

    this.uuid = peripheral.uuid;
    this.name = peripheral.advertisement.localName;

    this.DeviceInfo = {
      deviceName: this.name,
      serialNumber: this.serial,
      manufacturer: '',
      modelNumber: '',
      firmwareRevision: '',
      hardwareRevision: ''
    };

    this._peripheral.once('disconnect', this._onDisconnect.bind(this));
  }

  printCharacteristics() {
    for (var prop in this._characteristics) {
      logger.info('Characteristic: uuid = ' + prop + '; descriptor = ' + this._characteristics[prop]);
    }
  }

  _onDisconnect() {
    this._peripheral.removeAllListeners('disconnect');
    this.emit('disconnect');
  }

  connect(callback) {
    this._peripheral.once('disconnect', this._onDisconnect.bind(this));
    this._peripheral.once('connect', () => {
      logger.info('Connected');
      callback();
    });
    this._peripheral.connect();
  }

  disconnect(callback) {
    this._peripheral.disconnect(callback);
  }

  discoverServicesAndCharacteristics(callback) {
    this._peripheral.discoverAllServicesAndCharacteristics(function(error, services, characteristics) {
      if (error === null) {
        for (var i in services) {
          var service = services[i];
          logger.info('Service: uuid = ' + service.uuid);
          this._services[service.uuid] = service;
        }

        for (var j in characteristics) {
          var characteristic = characteristics[j];

          logger.info('characteristic: uuid = ' + characteristic.uuid);
          this._characteristics[characteristic.uuid] = characteristic;
        }
      }

      callback(error);
    }.bind(this));
  }

  readDataCharacteristic(uuid, callback) {
    if (!this._characteristics[uuid])
    {
      logger.info('Characteristic "' + uuid + '" not found!');

      callback();
      return;
    }

    this._characteristics[uuid].read(function(error, data) {
      if (error) {
        logger.warn('Error reading "' + uuid + '" - ' + error);
        callback();
        return;
      }
      if (data)
        callback(data);
      else
        callback();
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
        callback();
      }
    });
  }

  readUInt16Characteristic(uuid, callback) {
    this.readDataCharacteristic(uuid, function(data) {
      if (data)
        callback(data.readUInt16BE(0));
      else
        callback();
    });
  }

  readInt8Characteristic(uuid, callback) {
    this.readDataCharacteristic(uuid, function(data) {
      if (data)
        callback(data.readInt8(0));
      else
        callback();
    });
  }

  readUInt8Characteristic(uuid, callback) {
    this.readDataCharacteristic(uuid, function(data) {
      if (data)
        callback(data.readUInt8(0));
      else
        callback();
    });
  }

  readDoubleCharacteristic(uuid, callback) {
    this.readDataCharacteristic(uuid, function(data) {

      if (data)
        callback(data.readDoubleLE(0));
      else
        callback();
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

}

module.exports = BleDeviceSyncManager;
module.exports.create = (peripheral) => new BleDeviceSyncManager(peripheral);
