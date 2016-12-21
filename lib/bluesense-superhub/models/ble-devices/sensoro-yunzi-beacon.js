'use strict';

const Device = require('../device');

class SensoroYunziBeacon {
  /**
   * @param {object} properties
   * @param {string} properties.id
   * @param {number} properties.battery
   * @param {number} properties.luminosity
   * @param {number} properties.temperature
   * @param {number} properties.isMoving
   * @param {number} properties.moveCount
   */
  constructor(properties) {
    this.type = Device.type.sensoroYunziBeacon;
    this.id = properties.id;
    this.battery = properties.battery;
    this.luminosity = properties.luminosity;
    this.temperature = properties.temperature;
    this.isMoving = properties.isMoving;
    this.moveCount = properties.moveCount;
  }
}

module.exports = SensoroYunziBeacon;
