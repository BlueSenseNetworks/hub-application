const Bus = require('../../../lib/bluesense-superhub/messaging/bus');
const Message = require('../../../lib/bluesense-superhub/models/message');
const InfoMessage = require('../../../lib/bluesense-superhub/models/messages/info');
const Logger = require('../../../lib/bluesense-superhub/logger');
const os = require('os');
const fs = require('fs');
const Machine = require('../../../lib/bluesense-superhub/machine');

describe('InfoPublisher', function() {
  before(function() {
    this.networkInterfacesFixture = JSON.parse(fs.readFileSync('test/unit/fixtures/networkInterfaces.json', 'utf8'));
  });

  beforeEach(function() {
    this.sandbox = sinon.sandbox.create();

    this.busMock = this.sandbox.mock(Bus.prototype);
    this.loggerStub = sinon.createStubInstance(Logger);
    this.osMock = this.sandbox.mock(os);
    this.machineMock = this.sandbox.mock(Machine);

    this.InfoPublisher = proxyquire('../../lib/bluesense-superhub/controller/info-publisher', {
      '../messaging/bus': {
        create: () => this.busMock.object
      },
      '../logger': {
        getInstance: () => this.loggerStub
      },
      'os': this.osMock.object,
      '../machine': this.machineMock.object
    });

    this.InfoPublisher.create();
  });

  afterEach(function() {
    this.busMock.object.removeAllListeners();

    this.sandbox.restore();
  });

  describe('message broker event handling', function() {
    context(Message.type.connectedToPlatform, function() {
      it('should publish the current application info every time we connect to the platform', function() {
        var hostname = 'hostname';
        var expectedNetworks = {
          eth0: '192.168.1.100',
          eth01: '192.168.1.101',
          wlan0: '192.168.1.51'
        };
        var version = '0.0.1';
        var message = new InfoMessage(version, hostname, expectedNetworks);

        this.machineMock.expects('softwareVersion').returns(version);
        this.osMock.expects('networkInterfaces').returns(this.networkInterfacesFixture);
        this.osMock.expects('hostname').returns(hostname);
        this.busMock.expects('publish').withArgs(message);

        this.busMock.object.emit(Message.type.connectedToPlatform);

        this.machineMock.verify();
        this.osMock.verify();
        this.busMock.verify();
      });
    });
  });
});
