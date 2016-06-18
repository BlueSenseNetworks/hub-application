'use strict';

const Message = require('../message');

class DeviceDetectedSlimMessage extends Message {
  /**
   * @param {Device} device
   */
  constructor(device) {
    super(Message.type.deviceDetected, {
      id: device.id,
      rssi: device.rssi
    });
  }
}

module.exports = DeviceDetectedSlimMessage;
