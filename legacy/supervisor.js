var os = require('os');
var exec = require('child_process').exec;
var adapter = require('./signalr-adapter');
var logger = require('./logger').logger;
var machine = require('./machine');
var supernode = require('./supernode');

var supervisor = supernode;
supervisor.commands = supervisor.commands || {};

supervisor.commands.update = function(){
    supernode.suspend();
    var commandText = 'git pull; sudo pm2 startOrGracefulReload ' + machine.processesJson;

    logger.info('executing: ' + commandText);

    exec(commandText, {
      cwd: process.cwd(),
      env: process.env
    }, function (error, stdout, stderr){
        adapter.reportResult('Error occurred (otherwise this would not be executed): ' + stdout + stderr);
    });
};

supervisor.commands.executeShellCommand = function(command) {
    exec(command, function (error, stdout, stderr){
        adapter.reportResult('Command \'' + command + '\' output \n' + stdout + '\nstderr: ' + stderr);
    });
};

supervisor.commands.getInfo = function() {
  var ifaces = os.networkInterfaces();

  var ipAddresses = {};

  Object.keys(ifaces).forEach(function (ifname) {
    var alias = 0;

    ifaces[ifname].forEach(function (iface) {
      if ('IPv4' !== iface.family || iface.internal !== false) {
        // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
        return;
      }

      if (alias > 0) {
        // this single interface has multiple ipv4 addresses
        ipAddresses[ifname + alias] = iface.address;
      } else {
        // this interface has only one ipv4 adress
        ipAddresses[ifname] = iface.address;
      }
      alias++;
    });
  });

  logger.info('Supervisor => getInfo');
  logger.info(ipAddresses);

  adapter.reportInfo({
    softwareVersion: machine.softwareVersion(),
    hostname: os.hostname(),
    interfaces: ipAddresses
  });
};

supervisor.commands.resetBLE = function(){};

supervisor.connected = function() {
  if (supervisor.isConnected)
    return;

  supervisor.isConnected = true;

  supervisor.commands.getInfo();
};

supervisor.disconnected = function() {
  if (!supervisor.isConnected)
    return;

  supervisor.isConnected = false;
};

supervisor.suspend = function() {
};

module.exports = supervisor;
