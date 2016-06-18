const Device = require('../../../lib/bluesense-superhub/models/device');
const fs = require('fs');

describe('Resolver', function() {
  before(function() {
    this.expected = JSON.parse(fs.readFileSync('test/unit/monitor/parsers/fixtures/ibeacon.json', 'utf8'));
    this.device = new Device('-15', 'Some name', this.expected.manufacturerData);
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
