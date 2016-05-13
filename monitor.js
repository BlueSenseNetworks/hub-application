var adapter = require('./signalr-adapter');
var logger = require('./logger').logger;
var exec = require('child_process').exec;
var bleScanner = require('./bleScanner');
var machine = require('./machine');
var supernode = require('./supernode');

var monitor = supernode;
monitor.commands = monitor.commands || {};

var detectedPeripherals = {};
var detectedPeripheralsClearInterval = undefined;

function deviceDiscovered(device) {
//  logger.info('ble device discovered: ' + device.uuid);
  var deviceSeen = true;

  if (!detectedPeripherals[device.uuid]) {
    detectedPeripherals[device.uuid] = device;
    deviceSeen = false;
  }

  if (deviceSeen) {

    adapter.reportDevice({
        uuid: device.uuid,
        rssi: device.rssi,
    });

  } else {

    adapter.reportDevice({
      uuid: device.uuid,
      rssi: device.rssi,
      name: device.localName,
      manufacturerData: device.manufacturerData,
      beacon: device.beacon,
      isBlueBar: device.isBlueBar,
      serialNumber: device.SerialNumber
    });
  }
}

monitor.mode = 'Scan';
monitor.restartScanTimeout = '';

monitor.commands.startScan = function() {
  if (monitor.state != 'Idle')
    return;

  if (monitor.restartScanTimeout)
    clearTimeout(monitor.restartScanTimeout);

  monitor.restartScanTimeout = '';

  logger.info('startScan');
  detectedPeripherals = {};

  bleScanner.removeAllListeners('deviceDiscovered');
  bleScanner.on('deviceDiscovered', deviceDiscovered);

  bleScanner.startScan();
  monitor.updateState('Scanning');

  detectedPeripheralsClearInterval = setInterval(function(){
    detectedPeripherals = {};
  }, 60000);
};

monitor.commands.stopScan = function(){
  if (monitor.state != 'Scanning')
    return;

  logger.info('stopScan');
  clearInterval(detectedPeripheralsClearInterval);

  bleScanner.stopScan();
  bleScanner.removeAllListeners('deviceDiscovered');
  monitor.updateState('Idle');
};

monitor.connected = function() {
  if (monitor.isConnected)
    return;

  monitor.isConnected = true;

  if (monitor.mode == 'Scan' && monitor.state == 'Idle') {
    if (monitor.restartScanTimeout)
      clearTimeout(monitor.restartScanTimeout);

    monitor.restartScanTimeout = setTimeout(function(){
      monitor.commands.startScan();
    }, monitor.scanRestartDelay);
  }

};

monitor.disconnected = function() {
  if (!monitor.isConnected)
    return;

  monitor.isConnected = false;

  if (monitor.restartScanTimeout)
    clearTimeout(monitor.restartScanTimeout);
  monitor.commands.stopScan();
};

monitor.suspend = function() {
  monitor.commands.stopScan();
};

module.exports = monitor;
