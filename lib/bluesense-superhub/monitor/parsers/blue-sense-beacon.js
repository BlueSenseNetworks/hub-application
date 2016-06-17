'use strict';

const IBeaconParser = require('./ibeacon');
const BlueSenseBeaconModel = require('../../models/ble-devices/blue-sense-beacon');

class BlueSenseBeacon {
  /**
   * @param {Device} device
   * @returns {BlueSenseBeacon}
   */
  static parse(device) {
    var beacon = IBeaconParser.parse(device);

    if (beacon && device.name && device.name.indexOf('BlueBar') === 0) {
      var serial = device.name.substr('BlueBar Beacon '.length);
      var properties = Object.assign(beacon, {serial: serial});

      return new BlueSenseBeaconModel(properties);
    } else {
      return null;
    }
  }
}

module.exports = BlueSenseBeacon;
