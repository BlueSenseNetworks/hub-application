const Device = require('../../../lib/bluesense-superhub/models/device');
const parserFixture = require('./parsers/fixtures/ibeacon.json');

describe('Resolver', function() {
  before(function() {
    this.expected = parserFixture;
    this.device = new Device({
      id: 1,
      rssi: -15,
      advertisement: {
        localName: 'BlueBar Beacon 5C313EF609EC',
        manufacturerData: '4c000215a0b137303a9a11e3aa6e0800200c9a66802057b5c0'
      },
    });
  });

  beforeEach(function() {
    this.sandbox = sinon.sandbox.create();

    this.parser1Mock = this.sandbox.mock({
      parse: () => {
      }
    });
    this.parser2Mock = this.sandbox.mock({
      parse: () => {
      }
    });

    this.Resolver = proxyquire('../../lib/bluesense-superhub/monitor/resolver', {
      './parsers': [
        this.parser1Mock.object,
        this.parser2Mock.object
      ]
    });

    this.resolver = this.Resolver.create();
  });

  afterEach(function() {
    this.sandbox.restore();
  });

  describe('#resolve(device)', function() {
    it('should return the combined output of all registered parsers', function() {
      var devices = [
        {
          type: 'ibeacon',
        },
        {
          type: 'blueSenseBeacon',
        }
      ];

      this.parser1Mock.expects('parse').returns(devices[0]);
      this.parser2Mock.expects('parse').returns(devices[1]);

      this.resolver.resolve(this.device).should.deep.equal(devices);
    });

    it('should filter out any null values', function() {
      var devices = [
        {
          type: 'ibeacon',
        }
      ];

      this.parser1Mock.expects('parse').returns(devices[0]);
      this.parser2Mock.expects('parse').returns(null);

      this.resolver.resolve(this.device).should.deep.equal(devices);
    });

    it('should return an empty array if no parser can parse the device', function() {
      this.parser1Mock.expects('parse').returns(null);
      this.parser2Mock.expects('parse').returns(null);

      this.resolver.resolve(this.device).should.deep.equal([]);
    });
  });
});
