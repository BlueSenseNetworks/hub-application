'use strict';

class DeviceDetectedEventParams {
  /**
   * @param {Device} device
   * @param peripheral detected peripheral
   */
  constructor(device, peripheral) {
    this.Device = device;
    this.Peripheral = peripheral;
  }
}

module.exports = DeviceDetectedEventParams;
