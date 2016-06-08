'use strict';

const Message = require('../message');

class DeviceDetectedExtendedMessage extends Message {
  constructor(device) {
    super(Message.type.deviceDetected, device);
  }
}

module.exports = DeviceDetectedExtendedMessage;
