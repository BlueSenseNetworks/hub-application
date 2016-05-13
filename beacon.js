// credits go to Sandeep Mistry and his noble/bleno/node-bleacon projects
// https://github.com/sandeepmistry
// https://github.com/sandeepmistry/noble
// https://github.com/sandeepmistry/bleno
// https://github.com/sandeepmistry/node-bleacon

var EXPECTED_MANUFACTURER_DATA_LENGTH = 25;
var APPLE_COMPANY_IDENTIFIER = 0x004c; // https://www.bluetooth.org/en-us/specification/assigned-numbers/company-identifiers
var IBEACON_TYPE = 0x02;
var EXPECTED_IBEACON_DATA_LENGTH = 0x15;

var Beacon = function(peripheral) {
  var self = this;

  // self.peripheral = peripheral;

  var manufacturerData = peripheral.advertisement.manufacturerData;
  var rssi = peripheral.rssi;

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
    var proximity = null;

    if (accuracy < 0) {
      proximity = 'unknown';
    } else if (accuracy < 0.5) {
      proximity = 'immediate';
    } else if (accuracy < 4.0) {
      proximity = 'near';
    } else {
      proximity = 'far';
    }

    self.uuid = uuid;
    self.major = major;
    self.minor = minor;
    self.measuredPower = measuredPower;
    self.rssi = rssi;
    self.accuracy = accuracy;
    self.proximity = proximity;
  }

};

module.exports = Beacon;
