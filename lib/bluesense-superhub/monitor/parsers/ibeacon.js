'use strict';

const IBeaconModel = require('../../models/ble-devices/ibeacon');

// credits go to Sandeep Mistry and his noble/bleno/node-bleacon projects
// https://github.com/sandeepmistry
// https://github.com/sandeepmistry/noble
// https://github.com/sandeepmistry/bleno
// https://github.com/sandeepmistry/node-bleacon

const EXPECTED_MANUFACTURER_DATA_LENGTH = 25;
const APPLE_COMPANY_IDENTIFIER = 0x004c; // https://www.bluetooth.org/en-us/specification/assigned-numbers/company-identifiers
const IBEACON_TYPE = 0x02;
const EXPECTED_IBEACON_DATA_LENGTH = 0x15;

class IBeacon {
  /**
   * @param {Device} device
   * @returns {IBeacon}
   */
  static parse(device) {
    var manufacturerData = Buffer.from(device.manufacturerData, 'hex');
    var rssi = device.rssi;

    if (manufacturerData &&
      EXPECTED_MANUFACTURER_DATA_LENGTH <= manufacturerData.length &&
      APPLE_COMPANY_IDENTIFIER === manufacturerData.readUInt16LE(0) &&
      IBEACON_TYPE === manufacturerData.readUInt8(2) &&
      EXPECTED_IBEACON_DATA_LENGTH === manufacturerData.readUInt8(3)) {

      var uuid = manufacturerData.slice(4, 20).toString('hex');
      var major = manufacturerData.readUInt16BE(20);
      var minor = manufacturerData.readUInt16BE(22);
      var measuredPower = manufacturerData.readInt8(24);

      var accuracy = Math.pow(12.0, 1.5 * ((rssi / measuredPower) - 1));

      var proximity;
      if (accuracy < 0) {
        proximity = 'unknown';
      } else if (accuracy < 0.5) {
        proximity = 'immediate';
      } else if (accuracy < 4.0) {
        proximity = 'near';
      } else {
        proximity = 'far';
      }

      return new IBeaconModel({
        rssi: device.rssi,
        name: device.name,
        manufacturerData: device.manufacturerData,
        uuid: uuid,
        major: major,
        minor: minor,
        measuredPower: measuredPower,
        accuracy: accuracy,
        proximity: proximity
      });
    } else {
      return null;
    }
  }
}

module.exports = IBeacon;
