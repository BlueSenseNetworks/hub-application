'use strict';

class Device {
  constructor(rssi, name, manufacturerData) {
    this.rssi = rssi;
    this.name = name;
    this.manufacturerData = manufacturerData;
  }

  static get type() {
    return {
      iBeacon: 'iBeacon',
      blueSenseBeacon: 'blueSenseBeacon'
    };
  }
}

module.exports = Device;
