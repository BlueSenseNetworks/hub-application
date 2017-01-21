const Machine = require('../../lib/bluesense-superhub/machine');

describe('Server', function() {
  beforeEach(function() {
    this.sandbox = sinon.sandbox.create();

    this.monitorCreateStub = this.sandbox.stub();
    this.controllerCreateStub = this.sandbox.stub();
    this.routerCreateStub = this.sandbox.stub();
    this.machineMock = this.sandbox.mock(Machine);

    this.Server = proxyquire('../../lib/bluesense-superhub/server', {
      './machine': this.machineMock.object,
      './monitor': {
        create: this.monitorCreateStub,
        '@noCallThru': true,
      },
      './controller': {
        create: this.controllerCreateStub,
        '@noCallThru': true,
      },
      './router': {
        create: this.routerCreateStub,
        '@noCallThru': true,
      }
    });
  });

  afterEach(function() {
    this.sandbox.restore();
  });

  describe('#start()', function() {
    context('machine role is not set', function() {
      it('should throw an error if the machine role is not recognized', function() {
        this.machineMock.expects('role').returns('something else');

        should.Throw(() => this.Server.start());

        this.machineMock.verify();
      });
    });

    context('machine role is monitor', function() {
      it('should create a new instance of the Monitor component', function() {
        this.machineMock.expects('role').returns('Monitor');

        this.Server.start();

        this.monitorCreateStub.should.have.been.called;
        this.controllerCreateStub.should.not.have.been.called;
        this.routerCreateStub.should.not.have.been.called;
        this.machineMock.verify();
      });
    });

    context('machine role is controller', function() {
      it('should create a new instance of the Controller component', function() {
        this.machineMock.expects('role').returns('Controller');

        this.Server.start();

        this.monitorCreateStub.should.not.have.been.called;
        this.controllerCreateStub.should.have.been.called;
        this.routerCreateStub.should.not.have.been.called;
        this.machineMock.verify();
      });
    });

    context('machine role is router', function() {
      it('should create a new instance of the Controller component', function() {
        this.machineMock.expects('role').returns('Router');

        this.Server.start();

        this.monitorCreateStub.should.not.have.been.called;
        this.controllerCreateStub.should.not.have.been.called;
        this.routerCreateStub.should.have.been.called;
        this.machineMock.verify();
      });
    });
  });
});
