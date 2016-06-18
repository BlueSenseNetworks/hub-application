const BleScanner = require('../../lib/bluesense-superhub/ble-scanner');
const Bus = require('../../lib/bluesense-superhub/messaging/bus');
const DeviceResolver = require('../../lib/bluesense-superhub/monitor/resolver');
const Message = require('../../lib/bluesense-superhub/models/message');
const Logger = require('../../lib/bluesense-superhub/logger');
const Device = require('../../lib/bluesense-superhub/models/device');
const DeviceDetectedMessage = require('../../lib/bluesense-superhub/models/messages/device-detected');
const DeviceDetectedSlimMessage = require('../../lib/bluesense-superhub/models/messages/device-detected-slim');

describe('Monitor', function() {
  beforeEach(function() {
    this.sandbox = sinon.sandbox.create();
    this.sandbox.useFakeTimers();

    this.bleScannerMock = this.sandbox.mock(BleScanner.prototype);
    this.deviceResolverMock = this.sandbox.mock(DeviceResolver.prototype);
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
      },
      './monitor/resolver': {
        create: () => this.deviceResolverMock.object
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
    beforeEach(function() {
      this.device = new Device({
        rssi: -15,
        advertisement: {
          localName: 'BlueBar Beacon 5C313EF609EC',
          manufacturerData: '4c000215a0b137303a9a11e3aa6e0800200c9a66802057b5c0'
        }
      });
    });

    context(Message.type.connectedToPlatform, function() {
      it('should start scanning for BLE devices', function() {
        this.bleScannerMock.expects('startScan');

        this.busMock.object.emit(Message.type.connectedToPlatform);

        this.bleScannerMock.verify();
      });

      it('should not start the scan if the scan was explicitly stopped', function() {
        this.bleScannerMock.expects('startScan');
        this.bleScannerMock.expects('stopScan').twice();

        this.busMock.object.emit(Message.type.connectedToPlatform);
        this.busMock.object.emit(Message.type.stopBleScan);
        this.busMock.object.emit(Message.type.disconnectedFromPlatform);
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
          var parserResults = [
            {
              type: 'iBeacon'
            }
          ];

          this.busMock.expects('publish').twice().withArgs(new DeviceDetectedMessage(this.device, parserResults));
          this.bleScannerMock.expects('startScan');
          this.bleScannerMock.expects('stopScan');
          this.deviceResolverMock.expects('resolve').twice().returns(parserResults);

          this.busMock.object.emit(Message.type.startBleScan);
          this.bleScannerMock.object.emit(BleScanner.events.deviceDiscovered, this.device);
          this.busMock.object.emit(message);
          this.bleScannerMock.object.emit(BleScanner.events.deviceDiscovered, this.device);

          this.deviceResolverMock.verify();
          this.bleScannerMock.verify();
        });
      });
    });
  });

  describe('BLE scanner event handling', function() {
    context('deviceDiscovered', function() {
      beforeEach(function() {
        this.device = new Device({
          rssi: -15,
          advertisement: {
            localName: 'BlueBar Beacon 5C313EF609EC',
            manufacturerData: '4c000215a0b137303a9a11e3aa6e0800200c9a66802057b5c0'
          }
        });
        this.anotherDevice = new Device({
          rssi: -5,
          advertisement: {
            localName: 'Unknown vendor',
            manufacturerData: '2c000215a0b137303a9a11e3aa6e0800200c9a66802057b5c0'
          }
        });

      });

      it('should include device info if the device has been resolved', function() {
        var parserResults = [
          {
            type: 'iBeacon'
          }
        ];

        this.deviceResolverMock.expects('resolve').returns(parserResults);
        this.busMock.expects('publish').withArgs(new DeviceDetectedMessage(this.device, parserResults));

        this.bleScannerMock.object.emit(BleScanner.events.deviceDiscovered, this.device);

        this.deviceResolverMock.verify();
        this.busMock.verify();
      });

      it('should have the device info field empty if the device has not been resolved', function() {
        var parserResults = null;

        this.deviceResolverMock.expects('resolve').returns(parserResults);
        this.busMock.expects('publish').withArgs(new DeviceDetectedMessage(this.device, parserResults));

        this.bleScannerMock.object.emit(BleScanner.events.deviceDiscovered, this.device);

        this.deviceResolverMock.verify();
        this.busMock.verify();
      });

      it('should send the extended device info to the message broker on first discovery', function() {
        var parserResults = [
          {
            type: 'iBeacon'
          },
          {
            type: 'blueSenseBeacon'
          }
        ];

        this.busMock.expects('publish').withArgs(new DeviceDetectedMessage(this.device, parserResults.slice(0)));
        this.busMock.expects('publish').withArgs(new DeviceDetectedMessage(this.anotherDevice, parserResults.slice(1)));

        this.deviceResolverMock.expects('resolve')
          .twice()
          .onFirstCall()
          .returns(parserResults.slice(0))
          .onSecondCall()
          .returns(parserResults.slice(1));

        this.bleScannerMock.object.emit(BleScanner.events.deviceDiscovered, this.device);
        this.bleScannerMock.object.emit(BleScanner.events.deviceDiscovered, this.anotherDevice);

        this.deviceResolverMock.verify();
        this.busMock.verify();
      });

      it('should send the basic device info to the message broker on subsequent discovery', function() {
        var parserResults = [
          {
            type: 'iBeacon'
          },
          {
            type: 'blueSenseBeacon'
          }
        ];

        this.busMock.expects('publish').withArgs(new DeviceDetectedMessage(this.device, parserResults.slice(0)));
        this.busMock.expects('publish').withArgs(new DeviceDetectedMessage(this.anotherDevice, parserResults.slice(1)));
        this.busMock.expects('publish').withArgs(new DeviceDetectedSlimMessage(this.device));

        this.deviceResolverMock.expects('resolve')
          .twice()
          .onFirstCall()
          .returns(parserResults.slice(0))
          .onSecondCall()
          .returns(parserResults.slice(1));

        this.bleScannerMock.object.emit(BleScanner.events.deviceDiscovered, this.device);
        this.sandbox.clock.tick(this.Monitor.deviceInfoCacheTimeoutSeconds * 1000 - 1);
        this.bleScannerMock.object.emit(BleScanner.events.deviceDiscovered, this.device);
        this.bleScannerMock.object.emit(BleScanner.events.deviceDiscovered, this.anotherDevice);

        this.deviceResolverMock.verify();
        this.busMock.verify();
      });

      it('should send the extended device info again after a timeout', function() {
        var parserResults = [
          {
            type: 'iBeacon'
          }
        ];

        this.busMock.expects('publish').twice().withArgs(new DeviceDetectedMessage(this.device, parserResults));
        this.busMock.expects('publish').withArgs(new DeviceDetectedSlimMessage(this.device));
        this.deviceResolverMock.expects('resolve').twice().returns(parserResults);

        this.bleScannerMock.object.emit(BleScanner.events.deviceDiscovered, this.device);
        this.sandbox.clock.tick(this.Monitor.deviceInfoCacheTimeoutSeconds * 1000 - 1);
        this.bleScannerMock.object.emit(BleScanner.events.deviceDiscovered, this.device);
        this.sandbox.clock.tick(this.Monitor.deviceInfoCacheTimeoutSeconds * 1000);
        this.bleScannerMock.object.emit(BleScanner.events.deviceDiscovered, this.device);

        this.deviceResolverMock.verify();
        this.busMock.verify();
      });
    });
  });
});
