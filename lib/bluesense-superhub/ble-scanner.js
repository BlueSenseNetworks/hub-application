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

  updateState(newState) {
    logger.info('BleScanner: ' + state + ' => ' + newState);
    state = newState;
  }

  discover(peripheral) {
    this.emit(BleScanner.events.deviceDiscovered, new Device(
      peripheral.rssi,
      peripheral.advertisement.localName,
      peripheral.advertisement.manufacturerData.toString('hex')
    ));

    this.noble.stopScanning();

    if (peripheral.state === 'disconnected') {
      new Promise((resolve, reject) => {
        peripheral.connect(error => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      }).then(() => {
        return new Promise((resolve, reject) => {
          peripheral.discoverAllServicesAndCharacteristics((error, services, characteristics) => {
            if (error) {
              reject(error);
            } else {
              resolve(services);
            }
          })
        });
      })
    }
  }
}

module.exports = BleScanner;
module.exports.create = () => new BleScanner();
