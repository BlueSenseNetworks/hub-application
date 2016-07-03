const BlueSenseBeacon = require('../../../../lib/bluesense-superhub/models/ble-devices/blueSense-beacon');
const Device = require('../../../../lib/bluesense-superhub/models/device');
const BlueSenseBeaconParser = require('../../../../lib/bluesense-superhub/monitor/parsers/blueSense-beacon');

const fs = require('fs');

describe('BlueSenseBeaconParser', function() {
  before(function() {
    this.expected = JSON.parse(fs.readFileSync('test/unit/monitor/parsers/fixtures/ibeacon.json', 'utf8'));
    this.device = new Device({
      rssi: -15,
      advertisement: {
        localName: 'BlueBar Beacon 5C313EF609EC',
        manufacturerData: this.expected.manufacturerData
      }
    });
  });

  describe('#parse(device)', function() {
    it('should return the BlueSenseBeacon model if the device is a blueSense beacon', function() {
      let blueSenseBeacon = new BlueSenseBeacon({
        uuid: this.expected.uuid,
        major: this.expected.major,
        minor: this.expected.minor,
        measuredPower: this.expected.measuredPower,
        accuracy: this.expected.accuracy,
        proximity: this.expected.proximity,
        serial: '5C313EF609EC'
      });

      BlueSenseBeaconParser.parse(this.device).should.deep.equal(blueSenseBeacon);
    });

    it('should return null if the the device is not a blueSense beacon', function() {
      let device = new Device({
        rssi: -80,
        advertisement: {
          localName: 'Some name',
          manufacturerData: this.expected.manufacturerData
        }
      });

      (BlueSenseBeaconParser.parse(device) === null).should.equal(true);
    });
  });
});
