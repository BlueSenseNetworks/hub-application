var events = require('events');
var util = require('util');
var async = require('async');
var noble = require('noble');

var DeviceNameChar                = '2a00';

var ModelNumberChar               = '2a24';
var SerialNumberChar              = '2a25';
var FirmwareRevisionChar          = '2a26';
var HardwareRevisionChar          = '2a27';
var ManufacturerNameChar          = '2a29';

var BatteryLevelChar              = '2a19';
var UuidChar                      = '83ac7cdf81e04c4a873f79793f8a73dc';
var MajorChar                     = 'fac11d71984f47c483fba518b0da22ff';
var MinorChar                     = '52a63219e6fd479ab888775c5b7e5458';
var AuthKeyChar                   = '20cc88afd74e42d2929d201ed61120a0';
var EnableChar                    = 'e0defe46c8da41aabc2fec49311dd778';
var AdvertisementIntervalChar     = '80a233457a624aa09256e6984d798fc9';
var TXPowerChar                   = '9c9b4a765c2f43b0ba1bee559dbb74c0';
var TXCalibrationValueChar        = '4b4d86eab5704c49b793e0194409deb0';

var BlueBar = function(peripheral) {
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
};

util.inherits(BlueBar, events.EventEmitter);

BlueBar.is = function(peripheral) {
  var localName = peripheral.advertisement.localName;

  return (localName && localName.indexOf('BlueBar') === 0);
};

BlueBar.getSerialNumber = function(peripheral) {
  return peripheral.advertisement.localName.substr('BlueBar Beacon '.length);
};

BlueBar.discover = function(callback) {
  var startScanningOnPowerOn = function() {
    if (noble.state === 'poweredOn') {
      var onDiscover = function(peripheral) {
        if (!BlueBar.is(peripheral)) {
          return;
        }

        var blueBar = new BlueBar(peripheral);

        callback(blueBar);
      };

      noble.on('discover', onDiscover);

      noble.startScanning([], false);
    } else {
      noble.once('stateChange', startScanningOnPowerOn);
    }
  };

  startScanningOnPowerOn();
};

BlueBar.prototype.toString = function() {
  return JSON.stringify({
    uuid: this.uuid,
    name: this.name,
    serial: this.serial
  });
};

BlueBar.prototype.printCharacteristics = function() {
  for (var prop in this._characteristics) {
      console.log('Characteristic: uuid = ' + prop + '; descriptor = ' + this._characteristics[prop]);
    }
};



BlueBar.prototype.onDisconnect = function() {
  this._peripheral.removeAllListeners('disconnect');
  this.emit('disconnect');
};

BlueBar.prototype.connect = function(callback) {
  this._peripheral.removeAllListeners('disconnect');
  this._peripheral.on('disconnect', this.onDisconnect.bind(this));
  this._peripheral.connect(callback);
};

BlueBar.prototype.disconnect = function(callback) {
  this._peripheral.disconnect(callback);
};

BlueBar.prototype.discoverServicesAndCharacteristics = function(callback) {
  this._peripheral.discoverAllServicesAndCharacteristics(function(error, services, characteristics) {
    if (error === null) {
      for (var i in services) {
        var service = services[i];
        console.log('Service: uuid = ' + service.uuid);
        this._services[service.uuid] = service;
      }

      for (var j in characteristics) {
        var characteristic = characteristics[j];

        console.log('characteristic: uuid = ' + characteristic.uuid);
        this._characteristics[characteristic.uuid] = characteristic;
      }
    }

    callback(error);
  }.bind(this));
};

BlueBar.prototype.readDataCharacteristic = function(uuid, callback) {
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
};

BlueBar.prototype.readStringCharacteristic = function(uuid, callback) {
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
};

BlueBar.prototype.readUInt16Characteristic = function(uuid, callback) {
  this.readDataCharacteristic(uuid, function(data) {
    callback(data.readUInt16BE(0));
  });
};

BlueBar.prototype.readInt8Characteristic = function(uuid, callback) {
  this.readDataCharacteristic(uuid, function(data) {
    callback(data.readInt8(0));
  });
};

BlueBar.prototype.readUInt8Characteristic = function(uuid, callback) {
  this.readDataCharacteristic(uuid, function(data) {
    callback(data.readUInt8(0));
  });
};

BlueBar.prototype.readDoubleCharacteristic = function(uuid, callback) {
  this.readDataCharacteristic(uuid, function(data) {
    callback(data.readDoubleLE(0));
  });
};

BlueBar.prototype.writeDataCharacteristic = function(uuid, data, callback) {
  var pinBuffer = new Buffer(this.authKey, 'hex');
  var dataToWrite = Buffer.concat([pinBuffer, data]);

  this._characteristics[uuid].write(dataToWrite, false, callback);
};

BlueBar.prototype.writeStringCharacteristic = function(uuid, value, callback) {
  var data = new Buffer(value);
  this.writeDataCharacteristic(uuid, data, callback);
};

BlueBar.prototype.writeUInt16Characteristic = function(uuid, value, callback) {
  var data = new Buffer(2);

  data.writeUInt16BE(value, 0);

  this.writeDataCharacteristic(uuid, data, callback);
};

BlueBar.prototype.writeInt8Characteristic = function(uuid, value, callback) {
  var data = new Buffer(1);

  data.writeInt8(value, 0);

  this.writeDataCharacteristic(uuid, data, callback);
};

BlueBar.prototype.writeUInt8Characteristic = function(uuid, value, callback) {
  var data = new Buffer(1);

  data.writeUInt8(value, 0);

  this.writeDataCharacteristic(uuid, data, callback);
};

BlueBar.prototype.writeDoubleCharacteristic = function(uuid, value, callback) {
  var data = new Buffer(8);

  data.writeDoubleLE(value, 0);

  this.writeDataCharacteristic(uuid, data, callback);
};

BlueBar.prototype.readDeviceName = function(callback) {
  this.readStringCharacteristic(DeviceNameChar, callback);
};

BlueBar.prototype.readSerialNumber = function(callback) {
  this.readStringCharacteristic(SerialNumberChar, callback);
};

BlueBar.prototype.readManufacturerName = function(callback) {
  this.readStringCharacteristic(ManufacturerNameChar, callback);
};

BlueBar.prototype.readModelNumber = function(callback) {
  this.readStringCharacteristic(ModelNumberChar, callback);
};

BlueBar.prototype.readHardwareRevision = function(callback) {
  this.readStringCharacteristic(HardwareRevisionChar, callback);
};

BlueBar.prototype.readFirmwareRevision = function(callback) {
  this.readStringCharacteristic(FirmwareRevisionChar, callback);
};

BlueBar.prototype.readUuid = function(callback) {
  this.readDataCharacteristic(UuidChar, function(data) {
    callback(data.toString('hex'));
  });
};

BlueBar.prototype.readMajor = function(callback) {
  this.readUInt16Characteristic(MajorChar, callback);
};

BlueBar.prototype.readMinor = function(callback) {
  this.readUInt16Characteristic(MinorChar, callback);
};

BlueBar.prototype.readAdvertisementInterval = function(callback) {
  this.readUInt16Characteristic(AdvertisementIntervalChar, callback);
};

BlueBar.prototype.readTxPower = function(callback) {
  this.readUInt8Characteristic(TXPowerChar, function(value) {
    var txPower = value;

    callback(txPower);
  }.bind(this));
};

BlueBar.prototype.readTxCalibrationValue = function(callback) {
  this.readInt8Characteristic(TXCalibrationValueChar, callback);
};

BlueBar.prototype.readBatteryLevel = function(callback) {
  this.readInt8Characteristic(BatteryLevelChar, callback);
};

BlueBar.prototype.readDeviceInfo = function(callback) {
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
};

BlueBar.prototype.readConfiguration = function(callback) {
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
};

BlueBar.prototype.writeMajor = function(major, callback) {
  this.writeUInt16Characteristic(MajorChar, major, callback);
};


module.exports = BlueBar;
