const Monitor = require('../../lib/bluesense-superhub/monitor');
const Controller = require('../../lib/bluesense-superhub/controller');
const Machine = require('../../lib/bluesense-superhub/machine');

describe('Server', function() {
  beforeEach(function() {
    this.sandbox = sinon.sandbox.create();

    this.monitorMock = this.sandbox.mock(Monitor.prototype);
    this.controllerMock = this.sandbox.mock(Controller.prototype);
    this.machineMock = this.sandbox.mock(Machine);

    this.Server = proxyquire('../../lib/bluesense-superhub/server', {
      './machine': this.machineMock.object,
      './monitor': {
        create: () => this.monitorMock.object
      },
      './controller': {
        create: () => this.controllerMock.object
      }
    });

    this.server = this.Server.create();
  });

  afterEach(function() {
    this.sandbox.restore();
  });

  describe('#start()', function() {
    context('machine role is not set', function() {
      it('should throw an error if the machine role is not recognized', function() {
        this.machineMock.expects('role').returns('something else');

        this.server.start.bind(this.server).should.throw(Error);

        this.machineMock.verify();
      });
    });

    context('machine role is monitor', function() {
      it('should create a new instance of the Monitor component', function() {
        this.machineMock.expects('role').returns('Monitor');

        this.server.start();

        this.machineMock.verify();
      });
    });

    context('machine role is controller', function() {
      it('should create a new instance of the Controller component', function() {
        this.machineMock.expects('role').returns('Controller');

        this.server.start();

        this.machineMock.verify();
      });
    });
  });
});
