'use strict';

class Device {
  constructor(uuid, rssi, name) {
    this.uuid = uuid;
    this.rssi = rssi;
    this.name = name;
  }
}

module.exports = Device;
