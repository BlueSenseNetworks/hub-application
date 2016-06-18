const Config = require('../../lib/bluesense-superhub/config');
const Logger = require('../../lib/bluesense-superhub/logger');
const fs = require('fs');

describe('Machine', function() {
  before(function() {
    this.cpuInfoFixture = fs.readFileSync('test/unit/fixtures/cpuinfo', 'utf8');
    this.cpuInfoNoSerialFixture = fs.readFileSync('test/unit/fixtures/cpuinfo-no-serial', 'utf8');
    this.packageJsonFixture = fs.readFileSync('test/unit/fixtures/package.json', 'utf8');
  });

  beforeEach(function() {
    this.sandbox = sinon.sandbox.create();

    this.configMock = this.sandbox.mock(Config.prototype);
    this.fsMock = this.sandbox.mock(fs);
    this.loggerStub = sinon.createStubInstance(Logger);

    this.Machine = proxyquire('../../lib/bluesense-superhub/machine', {
      './config': {
        getInstance: () => this.configMock.object
      },
      './logger': {
        getInstance: () => this.loggerStub
      },
      'fs': this.fsMock.object
    });
  });

  afterEach(function() {
    delete process.env.SUPERHUB_ROLE;
    this.sandbox.restore();
  });

  describe('#role()', function() {
    context('SUPERHUB_ROLE environment variable set', function() {
      it('should determine the machine role based on the SUPERHUB_ROLE environment variable', function() {
        process.env.SUPERHUB_ROLE = 'Controller';
        this.Machine.role().should.equal(this.Machine.roles.controller);

        process.env.SUPERHUB_ROLE = 'Monitor';
        this.Machine.role().should.equal(this.Machine.roles.monitor);
      });

      it('should be case insensitive', function() {
        process.env.SUPERHUB_ROLE = 'CONTROLLER';
        this.Machine.role().should.equal(this.Machine.roles.controller);
      });

      it('should throw an error if the role does not match any known role', function() {
        process.env.SUPERHUB_ROLE = 'uga buga';
        this.Machine.role.should.throw(Error);
      });
    });

    context('SUPERHUB_ROLE environment variable not set', function() {
      it('should determine the machine role based on the "role" config file property', function() {
        this.configMock.expects('get')
          .withArgs('role')
          .returns('Controller');
        this.Machine.role().should.equal(this.Machine.roles.controller);

        this.configMock.expects('get')
          .withArgs('role')
          .returns('Monitor');
        this.Machine.role().should.equal(this.Machine.roles.monitor);

        this.configMock.verify();
      });

      it('should be case insensitive', function() {
        this.configMock.expects('get')
          .withArgs('role')
          .returns('CONTROLLER');
        this.Machine.role().should.equal(this.Machine.roles.controller);

        this.configMock.verify();
      });

      it('should throw an error if the role does not match any known role', function() {
        this.configMock.expects('get')
          .withArgs('role')
          .returns('uga buga');
        this.Machine.role.should.throw(Error);

        this.configMock.verify();
      });
    });
  });

  describe('#softwareVersion()', function() {
    it('should return the software version read from package.json', function() {
      this.fsMock.expects('readFileSync')
        .withArgs('package.json', 'utf8')
        .returns(this.packageJsonFixture);

      this.Machine.softwareVersion().should.equal('1.0.4');

      this.fsMock.verify();
    });
  });

  describe('#serialNumber()', function() {
    it('should return the serial number based on the output of serial-number module', function() {
      // TODO
    });
  });

  describe('#applicationDirectory()', function() {
    it('should return the root directory of the application', function() {
      //TODO
    });
  })
});
