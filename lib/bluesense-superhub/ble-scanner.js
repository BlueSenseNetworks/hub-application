'use strict';

const EventEmitter = require('events').EventEmitter;
const Device = require('./models/device');
const logger = require('./logger').getInstance();
var state = '';

class BleScanner extends EventEmitter {
  constructor() {
    super();

    this.noble = require('noble');
  }

  static get events() {
    return {
      deviceDiscovered: 'deviceDiscovered'
    }
  }

  startScan() {
    var adapterState = this.noble.state;

    this.noble.on('discover', this.discover.bind(this));

    if (adapterState === 'poweredOn') {
      this.noble.startScanning([], true);
      this.updateState('Scanning');
    } else {
      this.updateState('waitingForAdapter');
      this.resetAdapter();
    }

    return adapterState;
  }

  stopScan() {
    if (state != 'Scanning')
      return;

    logger.info('ble scan stopped');

    this.noble.stopScanning();

    this.updateState('Idle');
  }

  resetAdapter() {
    //     logger.info('BleScanner: resetting ' + machine.bleDeviceName());
    //
    //     exec('hciconfig hci0 down; hciconfig hci0 up', function(error, stdout, stderr) {
    //         logger.info('BleScanner: reset');
    //     });
  }

  updateState(newState) {
    logger.info('BleScanner: ' + state + ' => ' + newState);
    state = newState;
  }

  discover(peripheral) {
    // logger.info('ble scan device discovered: ' + peripheral.uuid);

    var advertisement = peripheral.advertisement;
    var localName = advertisement.localName;
    // var beaconData = new Beacon(peripheral);
    // var blueBarBeaconSerialNumber;
    // var isBlueBar = BlueBar.is(peripheral);
    //
    // if (isBlueBar) {
    //     blueBarBeaconSerialNumber = BlueBar.getSerialNumber(peripheral);
    // }

    var newDevice = new Device(
      peripheral.uuid,
      peripheral.rssi,
      localName
      // advertisement.manufacturerData ? JSON.stringify(advertisement.manufacturerData.toString('hex')) : '',
      // beacon: beaconData,
      // isBlueBar: isBlueBar,
      // serialNumber: blueBarBeaconSerialNumber,
      // peripheral: peripheral - holds a circular reference
    );

    this.emit(BleScanner.events.deviceDiscovered, newDevice);
  }
}

module.exports = BleScanner;
module.exports.create = () => new BleScanner();
