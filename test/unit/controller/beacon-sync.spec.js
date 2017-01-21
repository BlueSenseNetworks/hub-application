const BleScanner = require('../../../lib/bluesense-superhub/ble-scanner');
const Bus = require('../../../lib/bluesense-superhub/messaging/bus');
const Message = require('../../../lib/bluesense-superhub/models/message');
const InfoMessage = require('../../../lib/bluesense-superhub/models/messages/info');
const Logger = require('../../../lib/bluesense-superhub/logger');
const os = require('os');
const fs = require('fs');
const Machine = require('../../../lib/bluesense-superhub/machine');

describe.skip('BeaconSync', function() {
  before(function() {
  });

  beforeEach(function() {
    this.sandbox = sinon.sandbox.create();

    this.bleScannerMock = this.sandbox.mock(Object.create(BleScanner.prototype));
    this.busMock = this.sandbox.mock(Object.create(Bus.prototype));
    this.loggerStub = sinon.createStubInstance(Logger);
    this.osMock = this.sandbox.mock(os);
    this.machineMock = this.sandbox.mock(Machine);

    this.BeaconSync = proxyquire('../../lib/bluesense-superhub/controller/beacon-sync', {
      '../messaging/bus': {
        create: () => this.busMock.object
      },
      './ble-scanner': {
        create: () => this.bleScannerMock.object
      },
      '../logger': {
        getInstance: () => this.loggerStub
      },
      'os': this.osMock.object,
      '../machine': this.machineMock.object
    });

    this.BeaconSync.create();
  });

  afterEach(function() {
    this.busMock.object.removeAllListeners();

    this.sandbox.restore();
  });

  describe('message broker event handling', function() {
    context(Message.route.syncBeacon, function() {
      it('should start syncing a beacon config on BeaconSync message', function() {

        return;

        // ignored for now :(

        let message = {
          serialNumber: '123456789'
        };

        this.busMock.expects('publish').withArgs(message);

        this.busMock.object.emit(Message.route.syncBeacon, message);

        this.busMock.verify();
      });
    });
  });
});
