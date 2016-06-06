const Network = require('../../lib/bluesense-superhub/models/network');
const Bus = require('../../lib/bluesense-superhub/messaging/bus');
const Wireless = require('../../lib/bluesense-superhub/wireless');
const Message = require('../../lib/bluesense-superhub/models/message');
const InfoMessage = require('../../lib/bluesense-superhub/models/info-message');
const Logger = require('../../lib/bluesense-superhub/logger');
const fs = require('fs');
const os = require('os');
const Machine = require('../../lib/bluesense-superhub/machine');

describe('Controller', function() {
  before(function() {
    this.networkFixture = new Network('F8-16-54-7C-32-3D', 'test', 11, 123, 'Master', false, false, true);
    this.openNetworkFixture = new Network('FC-AA-9F-E5-66-33', 'Open network', 51, 92, 'Master', false, false, false);
    this.networkInterfacesFixture = JSON.parse(fs.readFileSync('test/unit/fixtures/networkInterfaces.json', 'utf8'));
  });

  beforeEach(function() {
    this.sandbox = sinon.sandbox.create();
    this.sandbox.useFakeTimers();

    this.wirelessMock = this.sandbox.mock(Wireless.prototype);
    this.busMock = this.sandbox.mock(Bus.prototype);
    this.loggerStub = sinon.createStubInstance(Logger);
    this.osMock = this.sandbox.mock(os);
    this.machineMock = this.sandbox.mock(Machine);

    this.Controller = proxyquire('../../lib/bluesense-superhub/controller', {
      './messaging/bus': {
        create: () => this.busMock.object
      },
      './wireless': {
        create: () => this.wirelessMock.object
      },
      './logger': {
        getInstance: () => this.loggerStub
      },
      'os': this.osMock.object,
      './machine': this.machineMock.object
    });

    this.controller = this.Controller.create();
  });

  afterEach(function() {
    this.wirelessMock.object.removeAllListeners();
    this.busMock.object.removeAllListeners();

    this.sandbox.restore();
  });

  describe('wifi event handling', function() {
    context('error', function() {
      it('should send the error to the backend', function() {
        var errorString = 'Some error string';
        this.busMock.expects('publish').withArgs(new Message(Message.type.wifiError, errorString));

        this.wirelessMock.object.emit(Wireless.events.error, errorString);

        this.busMock.verify();
      });
    });

    context('join', function() {
      it('should send the network that we connected to to the backend', function() {
        this.busMock.expects('publish').withArgs(new Message(Message.type.wifiJoined, this.networkFixture));

        this.wirelessMock.object.emit(Wireless.events.join, this.networkFixture);

        this.busMock.verify();
      });

      it('should stop wifi scan if any in progress', function() {
        this.busMock.expects('publish').once().withArgs(new Message(Message.type.wifiJoined, this.networkFixture));
        this.controller.startWiFiScan();

        this.wirelessMock.object.emit(Wireless.events.join, this.networkFixture);
        this.wirelessMock.object.emit(Wireless.events.appear, this.networkFixture);

        this.busMock.verify();
      });
    });

    context('leave', function() {
      it('should notify the backend that the wireless has disconnected', function() {
        this.busMock.expects('publish').once().withArgs(new Message(Message.type.wifiLeft));

        this.wirelessMock.object.emit(Wireless.events.leave);

        this.busMock.verify();
      });
    });

    context('appear', function() {
      it('should contain any wifis that have been found', function() {
        this.controller.startWiFiScan();
        this.busMock.expects('publish').withArgs(new Message(Message.type.wifiUpdated, [this.networkFixture]));

        this.wirelessMock.object.emit(Wireless.events.appear, this.networkFixture);

        this.busMock.verify();
      });
    });

    context('vanish', function() {
      beforeEach(function() {
        this.controller.startWiFiScan();
        this.busMock.expects('publish').withArgs(new Message(Message.type.wifiUpdated, [this.networkFixture]));
        this.wirelessMock.object.emit(Wireless.events.appear, this.networkFixture);
      });

      it('should remove any wifis that have been found but have vanished in the meantime', function() {
        this.busMock.expects('publish').withArgs(new Message(Message.type.wifiUpdated, []));

        this.wirelessMock.object.emit(Wireless.events.vanish, this.networkFixture);

        this.busMock.verify();
      });
    });

    context('change - one of the wifi connections details have changed', function() {
      it('should update the wifi networks list in case of a change event', function() {
        this.controller.startWiFiScan();
        var anotherNetwork = new Network('A5-C6-1E-7C-32-3D', 'New network', 11, 123, 'Master', false, false, true);

        this.busMock.expects('publish').thrice();

        this.wirelessMock.object.emit(Wireless.events.appear, this.networkFixture);
        this.wirelessMock.object.emit(Wireless.events.appear, anotherNetwork);

        var changedNetwork = new Network(
          this.networkFixture.address,
          'New ssid',
          33,
          72,
          'Master',
          false,
          true,
          false
        );

        this.wirelessMock.object.emit(Wireless.events.change, changedNetwork);
      });
    });
  });

  describe('message broker event handling', function() {
    // it('should publish the current application info', function() {
    //   var hostname = 'hostname';
    //   var expectedNetworks = {
    //     eth0: '192.168.1.100',
    //     eth01: '192.168.1.101',
    //     wlan0: '192.168.1.51'
    //   };
    //   var version = '0.0.1';
    //   var message = new InfoMessage(version, hostname, expectedNetworks);
    //
    //   this.machineMock.expects('softwareVersion').returns(version);
    //   this.osMock.expects('networkInterfaces').returns(this.networkInterfacesFixture);
    //   this.osMock.expects('hostname').returns(hostname);
    //   this.busMock.expects('publish').withArgs(message);
    //
    //   this.busMock.object.emit('connect');
    //
    //   this.machineMock.verify();
    //   this.osMock.verify();
    //   this.busMock.verify();
    // });

    context('message', function() {
      context(Message.type.connectWiFi, function() {
        it('should call joinNetwork()', function() {
          this.sandbox.stub(this.controller, 'joinNetwork');

          this.busMock.object.emit('message', new Message(Message.type.connectWiFi, {
            ssid: 'test',
            passphrase: 'test'
          }));

          this.controller.joinNetwork.should.have.been.calledOnce;
        });
      });

      context(Message.type.startWiFiScan, function() {
        it('should return #startWiFiScan()', function() {
          this.sandbox.stub(this.controller, 'startWiFiScan');

          this.busMock.object.emit('message', new Message(Message.type.startWiFiScan));

          this.controller.startWiFiScan.should.have.been.calledOnce;
        });
      });

      context(Message.type.stopWiFiScan, function() {
        it('should return #stopWiFiScan()', function() {
          this.sandbox.stub(this.controller, 'stopWiFiScan');

          this.busMock.object.emit('message', new Message(Message.type.stopWiFiScan));

          this.controller.stopWiFiScan.should.have.been.calledOnce;
        });
      });

      // context(Message.type.connectedToPlatform, function() {
      //   it('should start the wifi connection tracking', function() {
      //     this.wirelessMock.expects('start');
      //
      //     this.busMock.object.emit('message', new Message(Message.type.connectedToPlatform));
      //
      //     this.wirelessMock.verify();
      //   });
      // });

      context(Message.type.disconnectedFromPlatform, function() {
        it('should stop the wifi connection tracking', function() {
          this.wirelessMock.expects('stop');

          this.busMock.object.emit('message', new Message(Message.type.disconnectedFromPlatform));

          this.wirelessMock.verify();
        });
      });

      // context(Message.type.executeCommand, function() {
      //   it('should stop the wifi connection tracking', function() {
      //     this.execMock.expects('stop');
      //
      //     this.busMock.object.emit('message', new Message(Message.type.executeCommand, {command: 'ls'}));
      //
      //     this.wirelessMock.verify();
      //   });
      // });
    });
  });

  describe('#startWiFiScan()', function() {
    context('no scan running', function() {
      it('should scan for wifi networks for 5 minutes and then stop', function() {
        this.busMock.expects('publish').thrice().withArgs(sinon.match(message => message.type === Message.type.wifiUpdated));
        this.controller.startWiFiScan();

        this.wirelessMock.object.emit(Wireless.events.appear, this.networkFixture);
        this.wirelessMock.object.emit(Wireless.events.change, this.networkFixture);
        this.wirelessMock.object.emit(Wireless.events.vanish, this.networkFixture);

        this.sandbox.clock.tick(this.Controller.wifiScanTimeout * 1000);

        this.wirelessMock.object.emit(Wireless.events.appear, this.networkFixture);
        this.wirelessMock.object.emit(Wireless.events.change, this.networkFixture);
        this.wirelessMock.object.emit(Wireless.events.vanish, this.networkFixture);

        this.busMock.verify();
      });
    });

    context('scan in progress', function() {
      it('should run the current scan for another 5 minutes and then stop', function() {
        this.busMock.expects('publish').withArgs(sinon.match(message => message.type === Message.type.wifiUpdated));
        this.controller.startWiFiScan();

        this.sandbox.clock.tick((this.Controller.wifiScanTimeout - 1) * 1000);
        this.wirelessMock.object.emit(Wireless.events.appear, this.networkFixture);

        this.controller.startWiFiScan();
        this.sandbox.clock.tick(this.Controller.wifiScanTimeout * 1000);
        this.wirelessMock.object.emit(Wireless.events.appear, this.networkFixture);

        this.busMock.verify();
      });
    });

    context('start scan after a timeout', function() {
      it('should run a new scan', function() {
        this.busMock.expects('publish').twice().withArgs(sinon.match(message => message.type === Message.type.wifiUpdated));
        this.controller.startWiFiScan();

        this.sandbox.clock.tick((this.Controller.wifiScanTimeout - 1) * 1000);
        this.wirelessMock.object.emit(Wireless.events.appear, this.networkFixture);
        this.sandbox.clock.tick(this.Controller.wifiScanTimeout * 10 * 1000);
        this.wirelessMock.object.emit(Wireless.events.appear, this.networkFixture);
        this.controller.startWiFiScan();
        this.wirelessMock.object.emit(Wireless.events.appear, this.networkFixture);

        this.busMock.verify();
      });
    });
  });

  describe('#stopWiFiScan()', function() {
    it('should stop sending wifi scan results to the backend', function() {
      this.busMock.expects('publish').thrice().withArgs(sinon.match(message => message.type === Message.type.wifiUpdated));
      this.controller.startWiFiScan();

      this.wirelessMock.object.emit(Wireless.events.appear, this.networkFixture);
      this.wirelessMock.object.emit(Wireless.events.change, this.networkFixture);
      this.wirelessMock.object.emit(Wireless.events.vanish, this.networkFixture);

      this.controller.stopWiFiScan();

      this.wirelessMock.object.emit(Wireless.events.appear, this.networkFixture);
      this.wirelessMock.object.emit(Wireless.events.change, this.networkFixture);
      this.wirelessMock.object.emit(Wireless.events.vanish, this.networkFixture);

      this.busMock.verify();
    });
  });

  describe('#joinNetwork(ssid, passphrase)', function() {
    context('error handling', function() {
      it('should throw an error if the requested network hasnt been discovered yet', function() {
        this.wirelessMock.expects('join').never();
        this.busMock.expects('publish').withArgs(new Message(Message.type.wifiError, Wireless.errors.unknownNetwork));

        return this.controller.joinNetwork(this.networkFixture.ssid, 'short').should.be.rejectedWith(Error).then(() => {
          this.busMock.verify();
          this.wirelessMock.verify();
        });
      });
    });

    context('encrypted network', function() {
      beforeEach(function() {
        this.wirelessMock.object.emit(Wireless.events.appear, this.networkFixture);
      });

      describe('passphrase validation', function() {
        context('WEP 64 bit', function() {
          //TODO: 5 chars
        });

        context('WEP 128 bit', function() {
          //TODO: 13 chars
        });

        context('WPA and WPA2', function() {
          it('should throw and send an error if the passphrase is shorter than 8 characters', function() {
            this.wirelessMock.expects('join').never();
            this.busMock.expects('publish').withArgs(new Message(Message.type.wifiError, Wireless.errors.passphraseLength));

            return this.controller.joinNetwork(this.networkFixture.ssid, 'short').should.be.rejectedWith(Error).then(() => {
              this.busMock.verify();
              this.wirelessMock.verify();
            });
          });

          it('should throw and send an error if the passphrase is longer than 63 characters', function() {
            this.wirelessMock.expects('join').never();
            this.busMock.expects('publish').withArgs(new Message(Message.type.wifiError, Wireless.errors.passphraseLength));

            return this.controller.joinNetwork(this.networkFixture.ssid, new Array(65).join('a')).should.be.rejectedWith(Error).then(() => {
              this.busMock.verify();
              this.wirelessMock.verify();
            });
          });
        });
      });

      it('should invoke the join method on the wireless adapter with the provided ssid and passphrase', function() {
        this.wirelessMock.expects('join')
          .once()
          .returns(Promise.resolve())
          .withArgs(this.networkFixture, 'passphrase');

        this.wirelessMock.object.emit(Wireless.events.appear, this.networkFixture);

        return this.controller.joinNetwork(this.networkFixture.ssid, 'passphrase').should.be.fulfilled.then(() => {
          this.wirelessMock.verify();
        });
      });
    });

    context('open network', function() {
      it('should invoke the wireless join method with the requested network', function() {
        this.wirelessMock.expects('join')
          .once()
          .returns(Promise.resolve())
          .withArgs(this.openNetworkFixture, 'not important');

        this.wirelessMock.object.emit(Wireless.events.appear, this.openNetworkFixture);

        return this.controller.joinNetwork(this.openNetworkFixture.ssid, 'not important').should.be.fulfilled.then(() => {
          this.wirelessMock.verify();
        });
      });
    });
  });
});
