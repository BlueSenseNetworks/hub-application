'use strict';

const Message = require('../message');

class DeviceDetectedMessage extends Message {
  /**
   * @param {Device} device
   * @param deviceClasses The resolved device classes, i.e iBeacon, blueSenseBeacon...
   */
  constructor(device, deviceClasses) {
    super(Message.route.deviceDetected, Object.assign(device, {
      deviceClasses: deviceClasses,
      serviceData: device.serviceData ? device.serviceData.map(s => ({ uuid: s.uuid, data: s.data.toString('hex')})) : []
    }));
  }
}

module.exports = DeviceDetectedMessage;
