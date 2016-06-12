const Device = require('../../../lib/bluesense-superhub/models/device');
const fs = require('fs');

describe('Resolver', function() {
  before(function() {
    this.expected = JSON.parse(fs.readFileSync('test/unit/monitor/parsers/fixtures/ibeacon.json', 'utf8'));
    this.device = new Device('-15', 'Some name', this.expected.manufacturerData);
  });

  beforeEach(function() {
    this.sandbox = sinon.sandbox.create();

    this.parserMock = this.sandbox.mock({
      parse: () => {
      }
    });

    this.Resolver = proxyquire('../../lib/bluesense-superhub/monitor/resolver', {
      './parsers': [
        this.parserMock.object
      ]
    });

    this.resolver = this.Resolver.create();
  });

  afterEach(function() {
    this.sandbox.restore();
  });

  describe('#resolve(device)', function() {
    it('should return the extended device info if a parser can parse the device', function() {
      var specificDevice = Object.assign({}, this.device, {
        type: 'something or another',
        prop: 'prop'
      });

      this.parserMock.expects('parse').returns(specificDevice);

      this.resolver.resolve(this.device).should.equal(specificDevice);
    });

    it('should return the device if no parser can parse the device', function() {
      this.parserMock.expects('parse').returns(null);

      this.resolver.resolve(this.device).should.equal(this.device);
    });
  });
});
