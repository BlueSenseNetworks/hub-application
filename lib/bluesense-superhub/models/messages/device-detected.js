'use strict';

const Message = require('../message');

class DeviceDetectedMessage extends Message {
  constructor(device) {
    super(Message.type.deviceDetected, device);
  }
}

module.exports = DeviceDetectedMessage;
