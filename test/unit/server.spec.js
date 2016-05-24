const adapter = require('../../signalr-adapter');
const machine = require('../../machine');
const logger = require('../../logger');

const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
chai.should();
chai.use(sinonChai);

describe('Server', function () {
    beforeEach(function () {
        this.sandbox = sinon.sandbox.create();
        this.sandbox.useFakeTimers();

        this.adapterMock = this.sandbox.mock(adapter);

        this.sandbox.stub(logger.logger);

        this.machineStub = this.sandbox.stub(machine);
        this.machineStub.isController.returns(true);

        this.server = require('../../server');
    });

    afterEach(function () {
        this.adapterMock.object.removeAllListeners();

        this.sandbox.restore();
    });

    describe('#start()', function() {
        context('no internet connectivity on startup', function() {
            it('should retry to connect when it receives the bindingError event', function() {
                var spy = this.sandbox.spy();

                this.server.start();

                //we haven't stubbed the controller, so we don't want it to start
                this.adapterMock.object.on('connected', spy);

                this.sandbox.clock.tick(30000);
                this.adapterMock.object.emit('bindingError');
                this.sandbox.clock.tick(30000);
                this.adapterMock.object.emit('connected');

                spy.should.have.been.calledOnce;
            });
        });
    });
});
