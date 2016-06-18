'use strict';

class Device {
  constructor(peripheral) {
    this.id = peripheral.id;
    this.address = peripheral.address;
    this.addressType = peripheral.addressType;
    this.connectable = peripheral.connectable;
    this.rssi = peripheral.rssi;
    this.name = peripheral.advertisement ? peripheral.advertisement.localName : '';
    this.manufacturerData = (peripheral.advertisement && peripheral.advertisement.manufacturerData) ? peripheral.advertisement.manufacturerData.toString('hex') : '';
  }

  static get type() {
    return {
      iBeacon: 'iBeacon',
      blueSenseBeacon: 'blueSenseBeacon'
    };
  }
}

module.exports = Device;
