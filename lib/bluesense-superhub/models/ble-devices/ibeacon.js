'use strict';

const Device = require('../device');

/**
 * @extends Device
 */
class IBeacon {
  /**
   * @param {object} properties
   * @param {string} properties.uuid
   * @param {number} properties.major
   * @param {number} properties.minor
   * @param {string} properties.measuredPower
   * @param {string} properties.accuracy
   * @param {string} properties.proximity
   */
  constructor(properties) {
    this.type = Device.type.iBeacon;
    this.uuid = properties.uuid;
    this.major = properties.major;
    this.minor = properties.minor;
    this.measuredPower = properties.measuredPower;
    this.accuracy = properties.accuracy;
    this.proximity = properties.proximity;
  }
}

module.exports = IBeacon;
