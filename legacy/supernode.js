/// <reference path="typings/node/node.d.ts"/>
var adapter = require('./signalr-adapter');
var logger = require('./logger').logger;
var exec = require('child_process').exec;
var machine = require('./machine');
var config = require('config');

var supernode = {
  state: 'Idle',
  isConnected: false,
  scanRestartDelay: config.get('OnReconnect_ScanRestartDelay'),
  updateState: function(newState){
    logger.info('State changed to ' + newState);
    supernode.state = newState;

    if (supernode.isConnected)
      adapter.notifyStateChanged(newState);
  },
  suspend: function(){
  },
  commands: {
    resetBLE: function() {
      supernode.suspend();
      logger.info(machine.role() + ': resetting ' + machine.bleDeviceName());
    
      exec('hciconfig ' + machine.bleDeviceName() + ' down; hciconfig ' + machine.bleDeviceName() + ' up', function (error, stdout, stderr){
        logger.info(machine.role() + ': ' + machine.bleDeviceName() + ' reset');
      });
    }
  },
  connected: function() {
    supernode.isConnected = true;
  },
  disconnected: function() {
    supernode.isConnected = false;
  }
};

module.exports = supernode;
