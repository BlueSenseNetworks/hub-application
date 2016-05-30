const Server = require('./bluesense-superhub/server');
const Machine = require('./bluesense-superhub/machine');
const logger = require('./bluesense-superhub/logger').getInstance();

process.on('message', function(msg) {
  if (msg === 'shutdown') {
    process.exit(0);
  }
});

logger.info('Application starting...');

logger.info('application directory: ' + Machine.applicationDirectory());
logger.info('current directory: ' + process.cwd());
logger.info('software version: ' + Machine.softwareVersion());
logger.info('machine serial: ' + Machine.serialNumber());

Server.create().start();
