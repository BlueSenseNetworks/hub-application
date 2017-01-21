const IBeacon = require('../../../../lib/bluesense-superhub/models/ble-devices/ibeacon');
const Device = require('../../../../lib/bluesense-superhub/models/device');
const iBeaconParser = require('../../../../lib/bluesense-superhub/monitor/parsers/ibeacon');
const iBeaconFixture = require('./fixtures/ibeacon.json');

describe('IBeaconParser', function() {
  before(function() {
    this.device = new Device({
      rssi: -15,
      advertisement: {
        localName: 'BlueBar Beacon 5C313EF609EC',
        manufacturerData: iBeaconFixture.manufacturerData
      }
    });
  });

  describe('#parse(device)', function() {
    it('should return the iBeacon model if the device is an iBeacon', function() {
      const iBeacon = new IBeacon({
        uuid: iBeaconFixture.uuid,
        major: iBeaconFixture.major,
        minor: iBeaconFixture.minor,
        measuredPower: iBeaconFixture.measuredPower,
        accuracy: iBeaconFixture.accuracy,
        proximity: iBeaconFixture.proximity
      });

      iBeaconParser.parse(this.device).should.deep.equal(iBeacon);
    });

    it('should return null if the the device is not an iBeacon', function() {
      let device = new Device({
        rssi: -15,
        advertisement: {
          localName: 'Some name',
          manufacturerData: '2c000215a0b137303a9a11e3aa6e0800200c9a66802057b5c0'
        }
      });
      (iBeaconParser.parse(device) === null).should.equal(true);
    });
  });
});
