const Controller = require('../../controller-new');
const adapter = require('../../signalr-adapter');
const Network = require('../../models/network');
const WirelessAdapter = require('../../wireless-adapter');
const logger = require('../../logger');

const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);
chai.use(sinonChai);
chai.should();

describe('Controller', function () {
  before(function () {
    this.networkFixture = new Network('F8-16-54-7C-32-3D', 'test', 11, 123, 'Master', false, false, true);
  });

  beforeEach(function () {
    this.sandbox = sinon.sandbox.create();

    this.sandbox.useFakeTimers();
    this.wirelessAdapterMock = this.sandbox.mock(WirelessAdapter.prototype);
    this.adapterStub = this.sandbox.stub(adapter);
    this.controller = new Controller(this.wirelessAdapterMock.object, this.adapterStub);
    this.sandbox.stub(logger.logger);
  });

  afterEach(function () {
    this.wirelessAdapterMock.object.removeAllListeners();

    this.sandbox.restore();
  });

  describe('#wifiNetworks', function () {
    context('structure', function () {
      it('should be an array', function () {
        this.controller.wifiNetworks.should.be.an('array');
      });

      it('should initially be empty', function () {
        this.controller.wifiNetworks.should.be.empty;
      });
    });

    context('behavior', function () {
      beforeEach(function() {
        this.controller.startWiFiScan();
      });

      afterEach(function () {
        this.adapterStub.wifiUpdated.should.have.been.calledWith(this.controller.wifiNetworks);
      });

      describe('wifi appeared', function () {
        it('should contain any wifis that have been found', function () {
          this.wirelessAdapterMock.object.emit(WirelessAdapter.events.appear, this.networkFixture);

          this.controller.wifiNetworks.should.deep.equal([this.networkFixture]);
        });
      });

      describe('wifi vanished', function () {
        beforeEach(function () {
          this.wirelessAdapterMock.object.emit(WirelessAdapter.events.appear, this.networkFixture);
        });

        it('should remove any wifis that have been found but have vanished in the meantime', function () {
          this.wirelessAdapterMock.object.emit(WirelessAdapter.events.vanish, this.networkFixture);

          this.controller.wifiNetworks.should.be.empty;
        });
      });

      describe('wifi changed - one of the wifi connections details have changed', function () {
        it('should update the wifi networks list in case of a change event', function () {
          var anotherNetwork = new Network('A5-C6-1E-7C-32-3D', 'New network', 11, 123, 'Master', false, false, true);

          this.wirelessAdapterMock.object.emit(WirelessAdapter.events.appear, this.networkFixture);
          this.wirelessAdapterMock.object.emit(WirelessAdapter.events.appear, anotherNetwork);

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

          this.wirelessAdapterMock.object.emit(WirelessAdapter.events.change, changedNetwork);

          this.controller.wifiNetworks[0].should.deep.equal(changedNetwork);
          this.controller.wifiNetworks[1].should.deep.equal(anotherNetwork);
        });
      });
    });
  });

  describe('#joinNetwork(ssid, passphrase)', function () {
    beforeEach(function () {
      this.wirelessAdapterMock.object.emit(WirelessAdapter.events.appear, this.networkFixture);
    });

    describe('passphrase validation', function () {
      context('WEP 64 bit', function () {
        //TODO: 5 chars
      });

      context('WEP 128 bit', function () {
        //TODO: 13 chars
      });

      context('WPA and WPA2', function () {
        it('should throw and send an error if the passphrase is shorter than 8 characters', function () {
          this.wirelessAdapterMock.expects('join').never();

          this.controller.joinNetwork.bind(this.controller, this.networkFixture.ssid, 'short').should.throw(Error);
          this.adapterStub.wifiError.should.have.been.calledWith(WirelessAdapter.errors.passphraseLength);

          this.wirelessAdapterMock.verify();
        });

        it('should throw and send an error if the passphrase is longer than 63 characters', function () {
          this.wirelessAdapterMock.expects('join').never();

          //65 is actually 64 characters
          this.controller.joinNetwork.bind(this.controller, this.networkFixture.ssid, new Array(65).join('a')).should.throw(Error);
          this.adapterStub.wifiError.should.have.been.calledWith(WirelessAdapter.errors.passphraseLength);

          this.wirelessAdapterMock.verify();
        });
      });
    });

    it('should invoke the join method on the wireless adapter with the provided ssid and passphrase', function () {
      this.wirelessAdapterMock.expects('join')
        .once()
        .returns(Promise.resolve())
        .withArgs(this.networkFixture, 'passphrase');

      this.wirelessAdapterMock.object.emit(WirelessAdapter.events.appear, this.networkFixture);

      return this.controller.joinNetwork(this.networkFixture.ssid, 'passphrase').should.be.fulfilled.then(() => {
        this.wirelessAdapterMock.verify();
      });
    });
  });

  describe('wifi event handling', function () {
    context('error', function () {
      it('should send the error to the backend', function () {
        var errorString = 'Some error string';

        this.wirelessAdapterMock.object.emit(WirelessAdapter.events.error, errorString);
        this.adapterStub.wifiError.should.have.been.calledWith(errorString);
      });
    });

    context('join', function () {
      it('should send the network that we connected to to the backend', function () {
        this.wirelessAdapterMock.object.emit(WirelessAdapter.events.join, this.networkFixture);
        this.adapterStub.wifiJoined.should.have.been.calledWith(this.networkFixture.ssid, this.networkFixture);
      });

      it('should stop wifi scan if any in progress', function () {
        this.controller.startWiFiScan();
        this.wirelessAdapterMock.object.emit(WirelessAdapter.events.join, this.networkFixture);
        this.wirelessAdapterMock.object.emit(WirelessAdapter.events.appear, this.networkFixture);

        this.adapterStub.wifiUpdated.should.not.have.been.called;
      });
    });

    context('leave', function () {
      it('should notify the backend that the wireless has disconnected', function () {
        this.wirelessAdapterMock.object.emit(WirelessAdapter.events.leave);
        this.adapterStub.wifiLeft.should.have.been.calledOnce;
      });
    });
  });

  describe('#connected()', function () {
    it('should start the wifi connection tracking', function () {
      this.wirelessAdapterMock.expects('start').once();

      this.controller.connected();

      this.wirelessAdapterMock.verify();
    });
  });

  describe('#disonnected()', function () {
    it('should stop the wifi connection tracking', function () {
      this.wirelessAdapterMock.expects('stop').once();

      this.controller.disconnected();

      this.wirelessAdapterMock.verify();
    });
  });

  describe('#commands', function () {
    describe('connectWiFi', function () {
      it('should return #joinNetwork()', function () {
        this.controller.commands.connectWiFi.name.should.equal('bound joinNetwork');
      });
    });

    describe('startWiFiScan', function () {
      it('should return #startWiFiScan()', function () {
        this.controller.commands.startWiFiScan.name.should.equal('bound startWiFiScan');
      });
    });

    describe('stopWiFiScan', function () {
      it('should return #stopWiFiScan()', function () {
        this.controller.commands.stopWiFiScan.name.should.equal('bound stopWiFiScan');
      });
    });
  });

  describe('#startWiFiScan()', function () {
    context('no scan running', function () {
      it('should scan for wifi networks for 5 minutes and then stop', function () {
        this.controller.startWiFiScan();

        this.wirelessAdapterMock.object.emit(WirelessAdapter.events.appear, this.networkFixture);
        this.wirelessAdapterMock.object.emit(WirelessAdapter.events.change, this.networkFixture);
        this.wirelessAdapterMock.object.emit(WirelessAdapter.events.vanish, this.networkFixture);

        this.sandbox.clock.tick(Controller.wifiScanTimeout * 1000);

        this.wirelessAdapterMock.object.emit(WirelessAdapter.events.appear, this.networkFixture);
        this.wirelessAdapterMock.object.emit(WirelessAdapter.events.change, this.networkFixture);
        this.wirelessAdapterMock.object.emit(WirelessAdapter.events.vanish, this.networkFixture);

        this.adapterStub.wifiUpdated.should.have.been.calledThrice;
      });
    });

    context('scan in progress', function () {
      it('should run the current scan for another 5 minutes and then stop', function () {
        this.controller.startWiFiScan();
        this.sandbox.clock.tick((Controller.wifiScanTimeout - 1) * 1000);
        this.wirelessAdapterMock.object.emit(WirelessAdapter.events.appear, this.networkFixture);

        this.controller.startWiFiScan();
        this.sandbox.clock.tick(Controller.wifiScanTimeout * 1000);
        this.wirelessAdapterMock.object.emit(WirelessAdapter.events.appear, this.networkFixture);

        this.adapterStub.wifiUpdated.should.have.been.calledOnce;
      });
    });

    context('start scan after a timeout', function () {
      it('should run a new scan', function () {
        this.controller.startWiFiScan();
        this.sandbox.clock.tick((Controller.wifiScanTimeout - 1) * 1000);
        this.wirelessAdapterMock.object.emit(WirelessAdapter.events.appear, this.networkFixture);
        this.sandbox.clock.tick(Controller.wifiScanTimeout * 10 * 1000);
        this.wirelessAdapterMock.object.emit(WirelessAdapter.events.appear, this.networkFixture);
        this.controller.startWiFiScan();
        this.wirelessAdapterMock.object.emit(WirelessAdapter.events.appear, this.networkFixture);

        this.adapterStub.wifiUpdated.should.have.been.calledTwice;
      });
    });
  });

  describe('#stopWiFiScan()', function () {
    it('should stop sending wifi scan results to the backend', function () {
      this.controller.startWiFiScan();

      this.wirelessAdapterMock.object.emit(WirelessAdapter.events.appear, this.networkFixture);
      this.wirelessAdapterMock.object.emit(WirelessAdapter.events.change, this.networkFixture);
      this.wirelessAdapterMock.object.emit(WirelessAdapter.events.vanish, this.networkFixture);

      this.controller.stopWiFiScan();

      this.wirelessAdapterMock.object.emit(WirelessAdapter.events.appear, this.networkFixture);
      this.wirelessAdapterMock.object.emit(WirelessAdapter.events.change, this.networkFixture);
      this.wirelessAdapterMock.object.emit(WirelessAdapter.events.vanish, this.networkFixture);

      this.adapterStub.wifiUpdated.should.have.been.calledThrice;
    });
  });
});
