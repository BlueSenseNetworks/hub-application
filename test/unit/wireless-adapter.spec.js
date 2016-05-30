const Wireless = require('wireless');
const WirelessAdapter = require('../../lib/bluesense-superhub/wireless');

const chai = require('chai');
const sinon = require('sinon');

chai.should();

describe('WirelessAdapter', function() {
  before(function() {
    this.networkFixture = {
      ssid: 'test'
    };
  });

  beforeEach(function() {
    this.sandbox = sinon.sandbox.create();
    this.sandbox.useFakeTimers();

    this.wirelessMock = this.sandbox.mock(Wireless.prototype);
    this.wirelessMock.object.commands = {};
    this.wirelessMock.object.connected = false;
    this.wirelessMock.object.updateFrequency = 1;
    this.wirelessMock.object.connectionSpyFrequency = 1;

    this.wirelessAdapter = new WirelessAdapter(this.wirelessMock.object);
  });

  afterEach(function() {
    this.wirelessMock.object.removeAllListeners();
    this.sandbox.restore();
  });

  describe('#start()', function() {
    it('should start the wireless tracking module', function() {
      this.wirelessMock.expects('start').once();

      this.wirelessAdapter.start();

      this.wirelessMock.verify();
    });
  });

  describe('#stop()', function() {
    it('should stop the wireless tracking module', function() {
      this.wirelessMock.expects('stop').once();

      this.wirelessAdapter.stop();

      this.wirelessMock.verify();
    });
  });

  describe('wireless module event handling', function() {
    context('join', function() {
      it('should save the network that was joined', function() {
        this.wirelessMock.object.emit('join', this.networkFixture);

        this.wirelessAdapter.connected.should.equal(true);
        this.wirelessAdapter.network.ssid.should.equal('test');
      });

      it('should emit the event for anyone interested', function() {
        var spy = this.sandbox.spy();

        this.wirelessAdapter.on(WirelessAdapter.events.join, spy);
        this.wirelessMock.object.emit(WirelessAdapter.events.join, this.networkFixture);

        //noinspection BadExpressionStatementJS
        spy.should.have.been.calledOnce;
        spy.firstCall.args[0].ssid.should.equal(this.networkFixture.ssid);
      });
    });

    context('leave', function() {
      it('should set the network status properties to indicate that we are not connected', function() {
        this.wirelessMock.object.emit('leave');

        this.wirelessAdapter.connected.should.equal(false);
      });

      it('should emit the event for anyone interested', function() {
        var spy = this.sandbox.spy();

        this.wirelessAdapter.on(WirelessAdapter.events.leave, spy);
        this.wirelessMock.object.emit(WirelessAdapter.events.leave);

        //noinspection BadExpressionStatementJS
        spy.should.have.been.calledOnce;
      });
    });

    context('appear', function() {
      it('should emit the event for anyone interested', function() {
        var spy = this.sandbox.spy();

        this.wirelessAdapter.on(WirelessAdapter.events.appear, spy);
        this.wirelessMock.object.emit(WirelessAdapter.events.appear, this.networkFixture);

        //noinspection BadExpressionStatementJS
        spy.should.have.been.calledOnce;
        spy.firstCall.args[0].ssid.should.equal(this.networkFixture.ssid);
      });
    });

    context('vanish', function() {
      it('should emit the event for anyone interested', function() {
        var spy = this.sandbox.spy();

        this.wirelessAdapter.on(WirelessAdapter.events.vanish, spy);
        this.wirelessMock.object.emit(WirelessAdapter.events.vanish, this.networkFixture);

        //noinspection BadExpressionStatementJS
        spy.should.have.been.calledOnce;
        spy.firstCall.args[0].ssid.should.equal(this.networkFixture.ssid);
      });
    });

    context('change', function() {
      it('should emit the event for anyone interested', function() {
        var spy = this.sandbox.spy();

        this.wirelessAdapter.on(WirelessAdapter.events.change, spy);
        this.wirelessMock.object.emit(WirelessAdapter.events.change, this.networkFixture);

        //noinspection BadExpressionStatementJS
        spy.should.have.been.calledOnce;
        spy.firstCall.args[0].ssid.should.equal(this.networkFixture.ssid);
      });
    });

    context('error', function() {
      it('should emit the event for anyone interested', function() {
        var spy = this.sandbox.spy();

        this.wirelessAdapter.on(WirelessAdapter.events.error, spy);
        this.wirelessMock.object.emit(WirelessAdapter.events.error, 'error message');

        //noinspection BadExpressionStatementJS
        spy.should.have.been.calledOnce;
        spy.firstCall.args[0].should.equal('error message');
      });
    });

    context('former', function() {
      it('should tell the wifi module to scan again as there is an edge case where we will miss that the device is connected', function() {
        this.wirelessMock.object.connected = true;
        this.wirelessMock.object.emit(WirelessAdapter.events.former, 'something');
        this.wirelessMock.object.connected.should.equal(false);
      });
    });
  });
});
