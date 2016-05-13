var server = require('./server.js');
var logger = require('./logger').logger;
var machine = require('./machine');

process.on('message', function(msg) {
  if (msg === 'shutdown') {
    process.exit(0);
  }
});

logger.info('Application starting...');

logger.info('application directory: ' + machine.applicationDirectory);
logger.info('current directory: ' + process.cwd());
logger.info('software version: ' + machine.softwareVersion());
logger.info('machine serial: ' + machine.serialNumber());

server.start();
