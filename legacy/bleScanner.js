var config = require('config');
var EventEmitter = require("events").EventEmitter;
var exec = require('child_process').exec;
var noble = require('noble');
var util = require("util");

var Beacon = require('./beacon');
var BlueBar = require('./bluebar');
var logger = require('./logger').logger;
var machine = require('./machine');

var BleScanner = function (){
  var self = this;

  EventEmitter.call(self);
};

util.inherits(BleScanner, EventEmitter);

var state = 'Idle';
var bleScanner = new BleScanner();

function updateState(newState) {
  logger.info('BleScanner: ' + state + ' => ' + newState);
  state = newState;
}

function discover(peripheral) {
//  logger.info('ble scan device discovered: ' + peripheral.uuid);

  var advertisement = peripheral.advertisement;
  var localName = advertisement.localName;
  var beaconData = new Beacon(peripheral);
  var blueBarBeaconSerialNumber;
  var isBlueBar = BlueBar.is(peripheral);

  if (isBlueBar)
  {
    blueBarBeaconSerialNumber = BlueBar.getSerialNumber(peripheral);
  }

   var newDevice = {
    uuid: peripheral.uuid,
    rssi: peripheral.rssi,
    name: localName,
    manufacturerData: (advertisement.manufacturerData) ? JSON.stringify(advertisement.manufacturerData.toString('hex')) : '',
    beacon: beaconData,
    isBlueBar: isBlueBar,
    serialNumber: blueBarBeaconSerialNumber,
    peripheral: peripheral 
  };

  this.emit('deviceDiscovered', newDevice);
}

var adapterResetInterval;

noble.on('stateChange', function(adapterState) {
  logger.info("BLE adapter state => " + adapterState);
  
  if (adapterResetInterval)
    clearInterval(adapterResetInterval);
  
  if (adapterState === 'poweredOn') {
    if (state === 'waitingForAdapter') {
      noble.startScanning([], true);
      updateState('Scanning');
    }
  } else {
    updateState('waitingForAdapter');
    noble.stopScanning();
    
    adapterResetInterval = setInterval(function(){
      bleScanner.resetAdapter();
    }, 30000);
  }
});

noble.on('discover', discover.bind(bleScanner));

BleScanner.prototype.startScan = function() {
  var adapterState = noble.state;
    
  if (adapterState === 'poweredOn') {
    noble.startScanning([], true);
    updateState('Scanning');
  } else {
    updateState('waitingForAdapter');
    this.resetAdapter();
  }
  
  return adapterState;
};

BleScanner.prototype.stopScan = function(){
  if (state != 'Scanning')
    return;

  logger.info('ble scan stopped');

  noble.stopScanning();

  updateState('Idle');
};

BleScanner.prototype.resetAdapter = function() {
  logger.info('BleScanner: resetting ' + machine.bleDeviceName());

  exec('hciconfig ' + machine.bleDeviceName() + ' down; hciconfig ' + machine.bleDeviceName() + ' up', function (error, stdout, stderr){
    logger.info('BleScanner: ' + machine.bleDeviceName() + ' reset');
  });
};

module.exports = bleScanner;
