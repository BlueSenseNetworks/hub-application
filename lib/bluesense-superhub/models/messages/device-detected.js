'use strict';

const Message = require('../message');

class DeviceDetectedMessage extends Message {
  /**
   * @param {Device} device
   * @param resolved The resolved classes, i.e iBeacon, blueSenseBeacon...
   */
  constructor(device, resolved) {
    super(Message.type.deviceDetected, Object.assign(device, {
      resolved: resolved
    }));
  }
}

module.exports = DeviceDetectedMessage;
