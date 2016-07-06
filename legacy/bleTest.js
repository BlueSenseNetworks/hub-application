var async = require('async');
var config = require('config');

var bleScanner = require('./bleScanner');
var logger = require('./logger').getInstance();
var Beacon = require('./beacon');
var BlueBar = require('./bluebar');
var machine = require('./machine');

var beacon;

function restart()
{
  bleScanner.on('deviceDiscovered', deviceDiscovered);
  bleScanner.startScan();
}

function onDisconnect()
{
  logger.info('disconnected!');
  restart();
}

function dumpBeaconData(beacon){
  async.series([
    function(callback) {
      beacon.once('disconnect', onDisconnect);

      logger.info('connecting to ' + beacon.name);
      beacon.connect(callback);
    },
    function(callback) {
      logger.info('Discovering services');
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
*/    function(callback) {
        logger.info('disconnect');
        beacon.disconnect(callback);
      }
  ],
  function(err, results) {
    if (err)
      logger.info('Error after series: ', err);
    if (results)
      logger.info('Results after series: ', results);
  });
};

function deviceDiscovered(device) {
  logger.info('ble device discovered: ' + device.uuid);
  if (device.isBlueBar)
    logger.info('Found BlueBar Beacon: ' + device.serialNumber);
  else
    return;

  if (device.serialNumber != '7CEC79DA4B65')
    return;

  bleScanner.removeAllListeners('deviceDiscovered');
  bleScanner.stopScan();

  beacon = new BlueBar(device.peripheral);
  dumpBeaconData(beacon);
}

restart();
