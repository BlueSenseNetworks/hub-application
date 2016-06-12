const IBeacon = require('../../../../lib/bluesense-superhub/models/ble-devices/ibeacon');
const Device = require('../../../../lib/bluesense-superhub/models/device');
const iBeaconParser = require('../../../../lib/bluesense-superhub/monitor/parsers/ibeacon');
const fs = require('fs');

describe('IBeaconParser', function() {
  before(function() {
    this.expected = JSON.parse(fs.readFileSync('test/unit/monitor/parsers/fixtures/ibeacon.json', 'utf8'));
    this.device = new Device('-15', 'Some name', this.expected.manufacturerData);
  });

  describe('#parse(device)', function() {
    it('should return the iBeacon model if the device is an iBeacon', function() {
      var iBeacon = new IBeacon({
        rssi: this.device.rssi,
        name: this.device.name,
        manufacturerData: this.expected.manufacturerData,
        uuid: this.expected.uuid,
        major: this.expected.major,
        minor: this.expected.minor,
        measuredPower: this.expected.measuredPower,
        accuracy: this.expected.accuracy,
        proximity: this.expected.proximity
      });

      iBeaconParser.parse(this.device).should.deep.equal(iBeacon);
    });

    it('should return null if the the device is not an iBeacon', function() {
      var device = new Device('-15', 'Some name', '2c000215a0b137303a9a11e3aa6e0800200c9a66802057b5c0');

      (iBeaconParser.parse(device) === null).should.equal(true);
    });
  });
});
