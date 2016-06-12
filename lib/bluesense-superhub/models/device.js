'use strict';

class Device {
  constructor(rssi, name, manufacturerData) {
    this.rssi = rssi;
    this.name = name;
    this.manufacturerData = manufacturerData;
  }
}

module.exports = Device;
