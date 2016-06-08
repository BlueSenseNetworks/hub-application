const BleScanner = require('../../lib/bluesense-superhub/ble-scanner');
const Bus = require('../../lib/bluesense-superhub/messaging/bus');
const Message = require('../../lib/bluesense-superhub/models/message');
const Logger = require('../../lib/bluesense-superhub/logger');
const Device = require('../../lib/bluesense-superhub/models/device');
const ExtendedDeviceInfoMessage = require('../../lib/bluesense-superhub/models/messages/device-detected-extended');
const BasicDeviceInfoMessage = require('../../lib/bluesense-superhub/models/messages/device-detected-basic');

describe('Monitor', function() {
  beforeEach(function() {
    this.sandbox = sinon.sandbox.create();
    this.sandbox.useFakeTimers();

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
    context(Message.type.connectedToPlatform, function() {
      it('should start scanning for BLE devices', function() {
        this.bleScannerMock.expects('startScan');

        this.busMock.object.emit(Message.type.connectedToPlatform);

        this.bleScannerMock.verify();
      });
    });

    context(Message.type.startBleScan, function() {
      it('should start scanning for BLE devices', function() {
        this.bleScannerMock.expects('startScan');

        this.busMock.object.emit(Message.type.startBleScan);

        this.bleScannerMock.verify();
      });
    });

    [Message.type.disconnectedFromPlatform, Message.type.stopBleScan].forEach(function(message) {
      context(message, function() {
        it('should stop the BLE scan', function() {
          this.bleScannerMock.expects('stopScan');

          this.busMock.object.emit(message);

          this.bleScannerMock.verify();
        });

        it('should invalidate the device cache', function() {
          var device = new Device('uuid', 'rssi', 'BlueBar');

          this.busMock.expects('publish').twice().withArgs(new ExtendedDeviceInfoMessage(device));
          this.bleScannerMock.expects('startScan');
          this.bleScannerMock.expects('stopScan');

          this.busMock.object.emit(Message.type.startBleScan);
          this.bleScannerMock.object.emit(BleScanner.events.deviceDiscovered, device);
          this.busMock.object.emit(message);
          this.bleScannerMock.object.emit(BleScanner.events.deviceDiscovered, device);


          this.bleScannerMock.verify();
        });
      });
    });
  });

  describe('BLE scanner event handling', function() {
    context('deviceDiscovered', function() {
      beforeEach(function() {
        this.device = new Device('uuid', 'rssi', 'BlueBar');
      });

      it('should send the extended device info to the message broker on first discovery', function() {
        this.busMock.expects('publish').withArgs(new ExtendedDeviceInfoMessage(this.device));

        this.bleScannerMock.object.emit(BleScanner.events.deviceDiscovered, this.device);

        this.busMock.verify();
      });

      it('should send the basic device info to the message broker on subsequent discovery', function() {
        this.busMock.expects('publish').withArgs(new ExtendedDeviceInfoMessage(this.device));
        this.busMock.expects('publish').withArgs(new BasicDeviceInfoMessage(this.device));

        this.bleScannerMock.object.emit(BleScanner.events.deviceDiscovered, this.device);
        this.sandbox.clock.tick(this.Monitor.deviceInfoCacheTimeoutSeconds * 1000 - 1);
        this.bleScannerMock.object.emit(BleScanner.events.deviceDiscovered, this.device);

        this.busMock.verify();
      });

      it('should send the extended device info again after a timeout', function() {
        this.busMock.expects('publish').twice().withArgs(new ExtendedDeviceInfoMessage(this.device));
        this.busMock.expects('publish').withArgs(new BasicDeviceInfoMessage(this.device));

        this.bleScannerMock.object.emit(BleScanner.events.deviceDiscovered, this.device);
        this.sandbox.clock.tick(this.Monitor.deviceInfoCacheTimeoutSeconds * 1000 - 1);
        this.bleScannerMock.object.emit(BleScanner.events.deviceDiscovered, this.device);
        this.sandbox.clock.tick(this.Monitor.deviceInfoCacheTimeoutSeconds * 1000);
        this.bleScannerMock.object.emit(BleScanner.events.deviceDiscovered, this.device);

        this.busMock.verify();
      });
    });
  });
});
