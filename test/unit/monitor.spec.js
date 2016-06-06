const BleScanner = require('../../lib/bluesense-superhub/ble-scanner');
const Bus = require('../../lib/bluesense-superhub/messaging/bus');
const Message = require('../../lib/bluesense-superhub/models/message');
const Logger = require('../../lib/bluesense-superhub/logger');

describe('Monitor', function() {
  beforeEach(function() {
    this.sandbox = sinon.sandbox.create();

    this.bleScannerMock = this.sandbox.mock(BleScanner.prototype);
    this.busMock = this.sandbox.mock(Bus.prototype);
    this.loggerStub = this.sandbox.mock(Logger.prototype);

    this.Monitor = proxyquire('../../lib/bluesense-superhub/monitor', {
      './messaging/bus': {
        create: () => this.busMock.object
      },
      './ble-scanner': {
        create: () => this.bleScannerMock.object
      },
      './logger': {
        getInstance: () => this.loggerStub.object
      }
    });

    this.monitor = this.Monitor.create();
  });

  afterEach(function() {
    this.bleScannerMock.object.removeAllListeners();
    this.busMock.object.removeAllListeners();
    this.sandbox.restore();
  });

  describe('message broker event handling', function() {
    context('ready', function() {
      it('should start scanning for BLE devices', function() {
        this.bleScannerMock.expects('startScan').once();

        this.busMock.object.emit('ready');

        this.bleScannerMock.verify();
      });

      it('should handle the event only once, ignoring any further fluctuations', function() {
        this.bleScannerMock.expects('startScan').once();

        this.busMock.object.emit('ready');
        this.busMock.object.emit('ready');

        this.bleScannerMock.verify();
      });
    });

    context(Message.type.startBleScan, function() {
      it('should start scanning for BLE devices', function() {
        this.bleScannerMock.expects('startScan').once();

        this.busMock.object.emit(Message.type.startBleScan);

        this.bleScannerMock.verify();
      });
    });

    context(Message.type.stopBleScan, function() {
      it('should stop the BLE scan', function() {
        this.bleScannerMock.expects('stopScan').once();

        this.busMock.object.emit(Message.type.stopBleScan);

        this.bleScannerMock.verify();
      });
    });
  });

  describe('BLE scanner event handling', function() {
    context('deviceDiscovered', function() {
      it('should send the device info to the message broker', function() {
        var device = {
          uuid: 'uuid',
          rssi: 'rssi'
        };

        this.busMock.expects('publish')
          .once()
          .withArgs(new Message(Message.type.deviceDetected, device));

        this.bleScannerMock.object.emit(BleScanner.events.deviceDiscovered, device);

        this.busMock.verify();
      });
    });
  });
});
