const Machine = require('../../lib/bluesense-superhub/machine');

describe('Server', function() {
  beforeEach(function() {
    this.sandbox = sinon.sandbox.create();

    this.createSpy = this.sandbox.spy();
    this.machineMock = this.sandbox.mock(Machine);

    this.Server = proxyquire('../../lib/bluesense-superhub/server', {
      './machine': this.machineMock.object,
      './monitor': {
        create: () => this.createSpy()
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
      });
    });

    context('machine role is monitor', function() {
      it('should create a new instance of the Monitor component', function() {
        this.machineMock.expects('role').returns('Monitor');

        this.server.start();

        this.createSpy.should.have.been.calledOnce;
      });
    });
  });
});
