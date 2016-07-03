'use strict';

const Device = require('../device');
const IBeacon = require('./ibeacon');

/**
 * @extends IBeacon
 */
class BlueSenseBeacon extends IBeacon {
  /**
   * @param {object} properties
   * @param {string} properties.uuid
   * @param {number} properties.major
   * @param {number} properties.minor
   * @param {string} properties.measuredPower
   * @param {string} properties.accuracy
   * @param {string} properties.proximity
   * @param {string} properties.serial
   */
  constructor(properties) {
    super(properties);

    this.type = Device.type.blueSenseBeacon;
    this.serial = properties.serial;
  }
}

module.exports = BlueSenseBeacon;
