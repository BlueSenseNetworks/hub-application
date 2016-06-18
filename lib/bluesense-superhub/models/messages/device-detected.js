'use strict';

const Message = require('../message');

class DeviceDetectedMessage extends Message {
  /**
   * @param {Device} device
   * @param deviceClasses The resolved device classes, i.e iBeacon, blueSenseBeacon...
   */
  constructor(device, deviceClasses) {
    super(Message.type.deviceDetected, Object.assign(device, {
      deviceClasses: deviceClasses
    }));
  }
}

module.exports = DeviceDetectedMessage;
