'use strict';

var EventEmitter = require('events');

var logger = require('./logger').getInstance();

var state = '';

class BleScanner extends EventEmitter {
  constructor() {
    super();

    this.noble = require('noble');
    this.noble.on('stateChange', state => {
      this.startScan();
    });
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

    var newDevice = {
      uuid: peripheral.uuid,
      rssi: peripheral.rssi,
      // name: localName,
      // manufacturerData: (advertisement.manufacturerData) ? JSON.stringify(advertisement.manufacturerData.toString('hex')) : '',
      // beacon: beaconData,
      // isBlueBar: isBlueBar,
      // serialNumber: blueBarBeaconSerialNumber,
      // peripheral: peripheral
    };

    this.emit('deviceDiscovered', newDevice);
  }
}

module.exports = BleScanner;
module.exports.create = () => new BleScanner();
