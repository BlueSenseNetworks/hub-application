const BlueSenseBeacon = require('../../../../lib/bluesense-superhub/models/ble-devices/blue-sense-beacon');
const Device = require('../../../../lib/bluesense-superhub/models/device');
const BlueSenseBeaconParser = require('../../../../lib/bluesense-superhub/monitor/parsers/blue-sense-beacon');

const fs = require('fs');

describe('BlueSenseBeaconParser', function() {
  before(function() {
    this.expected = JSON.parse(fs.readFileSync('test/unit/monitor/parsers/fixtures/ibeacon.json', 'utf8'));
    this.device = new Device('-15', 'BlueBar Beacon 5C313EF609EC', this.expected.manufacturerData);
  });

  describe('#parse(device)', function() {
    it('should return the BlueSenseBeacon model if the device is a blueSense beacon', function() {
      var blueSenseBeacon = new BlueSenseBeacon({
        rssi: this.device.rssi,
        name: this.device.name,
        manufacturerData: this.expected.manufacturerData,
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
      var device = new Device('-15', 'Some name', '2c000215a0b137303a9a11e3aa6e0800200c9a66802057b5c0');

      (BlueSenseBeaconParser.parse(device) === null).should.equal(true);
    });
  });
});
