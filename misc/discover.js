var async = require('async');
var noble = require('noble');
var BlueBar = require('./bluebar.js');

var beacon;

var major = 0;

process.on('uncaughtException', function(err) {
    console.log(err);

    noble.stopScanning();
    noble.startScanning();
});


function onDiscover(peripheral)
{
  if (BlueBar.is(peripheral))
  {
    noble.removeListener('discover', onDiscover);
    noble.stopScanning();

    beacon = new BlueBar(peripheral);

    dumpBeaconData(beacon);
  }
}

function onDisconnect()
{
  beacon.removeListener('disconnect', onDisconnect);
  console.log('disconnected!');

  noble.on('discover', onDiscover);
  noble.startScanning();
}

function dumpBeaconData(beacon){
  async.series([
    function(callback) {
      beacon.on('disconnect', onDisconnect);

      console.log('found: ' + beacon.toString());
      beacon.connect(callback);
    },
    function(callback) {
      beacon.discoverServicesAndCharacteristics(callback);
    },
    function(callback) {
      beacon.readDeviceInfo(function() {
        console.log('\tDevice Info for ' + beacon.uuid);
        console.log('\tDevice name = ' + beacon.DeviceInfo.deviceName);
        console.log('\tSerial number = ' + beacon.DeviceInfo.serialNumber);
        console.log('\tManufacturer name = ' + beacon.DeviceInfo.manufacturerName);
        console.log('\tModel number = ' + beacon.DeviceInfo.modelNumber);
        console.log('\tHardware revision = ' + beacon.DeviceInfo.hardwareRevision);
        console.log('\tFirmware revision = ' + beacon.DeviceInfo.firmwareRevision);
        callback();
      });
    },
    function(callback) {
      beacon.readConfiguration(function() {
        console.log('\tConfiguration for ' + beacon.uuid);
        console.log('\tUUID = ' + beacon.Configuration.uuid);
        console.log('\tMajor = ' + beacon.Configuration.major);
        console.log('\tMinor = ' + beacon.Configuration.minor);
        console.log('\tAdvertisement Interval = ' + beacon.Configuration.advInterval);
        console.log('\tTxPower = ' + beacon.Configuration.txPower);
        console.log('\tCalibration value = ' + beacon.Configuration.txCalibrationValue);
        console.log('\tBattery Level = ' + beacon.Configuration.batteryLevel);
        callback();
      });
    },
    function(callback) {

      if (beacon.serial == '8833147E02EE') {
          beacon.authKey = '57172a69';
          beacon.writeMajor(major, function() {
            console.log('Wrote major: ' + major);
            major++;

            callback();
          });
        } else {
          callback();
        }
    },
    function(callback) {
        console.log('disconnect');
        beacon.disconnect(callback);
      }
  ],
  function(err, results) {
    if (err)
      console.log('Error after series: ' + err);
  });
};


noble.on('stateChange', function(state) {
  console.log('on -> stateChange: ' + state);

  if (state === 'poweredOn') {
    noble.startScanning();
  } else {
    noble.stopScanning();
  }
});

noble.on('scanStart', function() {
  console.log('on -> scanStart');
});

noble.on('scanStop', function() {
  console.log('on -> scanStop');
});

noble.on('discover', onDiscover);

console.log('Starting...');

