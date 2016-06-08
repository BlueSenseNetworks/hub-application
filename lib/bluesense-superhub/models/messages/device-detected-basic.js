'use strict';

const Message = require('../message');

class DeviceDetectedBasicMessage extends Message {
  constructor(device) {
    super(Message.type.deviceDetected, {
      uuid: device.uuid,
      rssi: device.rssi
    });
  }
}

module.exports = DeviceDetectedBasicMessage;
