var adapter = require('./signalr-adapter');
var WirelessAdapter = require('./wireless-adapter');
var Wireless = require('wireless');
var config = require('config');
var logger = require('./logger').logger;
var machine = require('./machine');

var supernode;

if (machine.isMonitor())
  supernode = require('./monitor');

if (machine.isController()) {
  var Controller = require('./controller-new');
  var wireless = new WirelessAdapter(new Wireless({
    iface: config.get('WiFi-Interface'),
    updateFrequency: 12,
    connectionSpyFrequency: 5,
    vanishThreshold: 7
  }));

  supernode = new Controller(wireless, adapter);
}

if (machine.isSupervisor())
    supernode = require('./supervisor');

if (!supernode)
{
  logger.error('supernode role undefined, exiting!');
  process.exit(-1);
}

function connect() {
  adapter.connect(supernode.commands, function(){
    logger.info(machine.role() + ' started!');
  });
}

module.exports = {
  start: function(){
    logger.info('supernode starting...');

    adapter.on('connected', supernode.connected.bind(supernode));
    adapter.on('disconnected', supernode.disconnected.bind(supernode));
    adapter.on('bindingError', () => {
      var delay = 30;
      logger.info(`failed connecting to server, retrying in ${delay} seconds...`);
      setTimeout(() => {
        connect();
      }, delay * 1000);
    });

    connect();
  }
};
