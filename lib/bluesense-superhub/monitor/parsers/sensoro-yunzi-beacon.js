'use strict';

const SensoroYunziBeaconModel = require('../../models/ble-devices/sensoro-yunzi-beacon');

/*
 serviceUUID: 0x81e7
 serviceData: b0 43 20 00 00 00 00 3b 3e fd 63 74 24 0e 01 0b ff 06 00 bf 00 00 67
 all data is LittleEndian
 pos | meaning
 0   |
 1   |
 2   |
 3   |
 4   |
 5   |
 6   |
 7   |
 8   |
 9   |
 10  | battery
 11  |
 12  |
 13  |
 14  | light
 15  | light
 16  | move count
 17  | move count
 18  | is moving (0 no, 1 yes)
 19  |
 20  |
 21  |
 22  |

*/

const SENSOR_UUID = '81e7';
const EDDYSTONE_UUID = 'feaa';

const EDDYSTONE_FRAME_TYPE_UID = 0x00;
// const EDDYSTONE_FRAME_TYPE_URL = 0x10;
const EDDYSTONE_FRAME_TYPE_TLM = 0x20;

class SensoroYunziBeacon {

  /**
   * @param {Device} device
   * @returns {SensoroYunziBeacon}
   */
  static parse(device) {
    if (!device.serviceData )
      return null;

    let eddystoneFrame = device.serviceData.find(s => s.uuid === EDDYSTONE_UUID);
    let sensorFrame = device.serviceData.find(s => s.uuid === SENSOR_UUID);

    if (!sensorFrame)
      return null;

    let battery = sensorFrame.data.readUInt8(10);
    let luminosity = sensorFrame.data.readUInt16LE(14);
    let moveCount = sensorFrame.data.readUInt16LE(16);
    let isMoving = sensorFrame.data.readUInt8(18);

    let txPower, temperature;
    if (eddystoneFrame) {
      let eddystoneFrameType = eddystoneFrame.data.readUInt8(0);

      if (eddystoneFrameType === EDDYSTONE_FRAME_TYPE_UID) {
        txPower = eddystoneFrame.data.readInt8(1);
      }

      if (eddystoneFrameType === EDDYSTONE_FRAME_TYPE_TLM) {
        temperature = eddystoneFrame.data.readUInt16LE(4);
      }
    }

    return new SensoroYunziBeaconModel({
      id: device.id,
      txPower: txPower,
      battery: battery,
      luminosity: luminosity,
      temperature: temperature,
      isMoving: isMoving,
      moveCount: moveCount
    });
  }
}

module.exports = SensoroYunziBeacon;
