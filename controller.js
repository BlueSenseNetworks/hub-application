var async = require('async');
var config = require('config');
var Wireless = require('wireless');

var adapter = require('./signalr-adapter');
var logger = require('./logger').logger;
var machine = require('./machine');
var supernode = require('./supernode');

var bleScanner = require('./bleScanner');
var Beacon = require('./beacon');
var BlueBar = require('./bluebar');

var connected = false;
var SSID = '';
var iface = config.get('WiFi-Interface');
var wireless = new Wireless({
    iface: iface,
    updateFrequency: 12,
    vanishThreshold: 7,
});

var networks = {};

wireless.on('appear', function(network) {
  var quality = Math.floor(network.quality / 70 * 100);

  var ssid = network.ssid || '<HIDDEN>';

  var encryption_type = 'NONE';
  if (network.encryption_wep) {
    encryption_type = 'WEP';
  } else if (network.encryption_wpa && network.encryption_wpa2) {
    encryption_type = 'WPA&WPA2';
  } else if (network.encryption_wpa) {
    encryption_type = 'WPA';
  } else if (network.encryption_wpa2) {
    encryption_type = 'WPA2';
  }

  logger.info("[  APPEAR] " + ssid + " [" + network.address + "] " + quality + "% " + network.strength + " dBm " + encryption_type);

  networks[ssid] = network;

  adapter.wifiNetworkFound(ssid, quality, encryption_type, network);
});

// A network disappeared (after the specified threshold)
wireless.on('vanish', function(network) {
  if (networks[network.ssid])
    networks.ssid = undefined;

  adapter.wifiNetworkGone(network.ssid, network);
});

// A wireless network changed something about itself
wireless.on('change', function(network) {
  networks[network.ssid] = network;
  adapter.wifiNetworkChanged(network.ssid, network);
});

wireless.on('signal', function(network) {
  adapter.wifiNetworkSignal(network.ssid, network);
});

// We've joined a network
wireless.on('join', function(network) {
  adapter.wifiJoined(network.ssid, network);
});

// We've left a network
wireless.on('leave', function() {
  adapter.wifiLeft();
});

wireless.on('dhcp', function(ip_address) {
});

wireless.on('empty', function() {
});

wireless.on('error', function(message) {
  adapter.wifiError(message);
});

var controller = supernode;

controller.commands = controller.commands || {};

controller.mode = 'WiFiScan'; // Idle, WiFiScan, BleScan, BleConfigUpdate, BleFirmwareUpdate
controller.restartScanTimeout = '';

controller.connected = function() {
  if (controller.isConnected)
    return;

  controller.isConnected = true;

  if (controller.mode == 'WiFiScan' && controller.state == 'Idle') {
    if (controller.restartScanTimeout)
      clearTimeout(controller.restartScanTimeout);

    controller.commands.updateBeacon('20cd397a318b', {major: 1});

/*    controller.restartScanTimeout = setTimeout(function(){
//      controller.commands.enableWiFi();
    }, controller.scanRestartDelay);
*/  }
};

controller.disconnected = function() {
  if (!controller.isConnected)
    return;

  controller.isConnected = false;

  controller.commands.stopWiFiScan();
};

controller.suspend = function() {
  controller.commands.stopWiFiScan();
};

controller.commands.enableWiFi = function() {
  wireless.enable(function(error) {
    if (error) {
      logger.info("[ FAILURE] Can't enable wireless card.");
      return;
    }

    if (controller.restartScanTimeout)
      clearTimeout(controller.restartScanTimeout);

    controller.restartScanTimeout = '';

    logger.info("[PROGRESS] Wireless card enabled.");

    controller.commands.startWiFiScan();
  });
};

controller.commands.startWiFiScan = function() {
  logger.info("[PROGRESS] Starting wireless scan...");
  controller.updateState('Scanning');

  wireless.start();
};

controller.commands.stopWiFiScan = function() {
  logger.info("[PROGRESS] Stopping wireless scan");
  controller.updateState('Idle');

  wireless.stop();
  wireless.networks = {};
  networks = {};
};

controller.commands.connectWiFi = function(ssid, key) {

  if (!connected && networks[ssid]) {
    connected = true;
    var network = networks[ssid];

    wireless.join(network, key, function(err) {
      if (err) {
        logger.info("[   ERROR] Unable to connect.");
        return;
      }

      logger.info("Connected, getting an IP address");
      wireless.dhcp(function(ip_address) {
        logger.info("IP address assigned: " + ip_address);
      });
    });
  }
};

var beaconToUpdate;

function onDisconnect()
{
  beaconToUpdate.bluebar.removeAllListeners('disconnect');
  logger.log('disconnected!');
}

function dumpBeaconData(){
  
  async.series([
    function(callback) {
      beaconToUpdate.bluebar.on('disconnect', onDisconnect);

      beaconToUpdate.bluebar.connect(callback);
    },
    function(callback) {
      beaconToUpdate.bluebar.discoverServicesAndCharacteristics(callback);
    },
    function(callback) {
      beaconToUpdate.bluebar.readDeviceInfo(function() {
        logger.log('\tDevice Info for ' + beaconToUpdate.bluebar.uuid);
        logger.log('\tDevice name = ' + beaconToUpdate.bluebar.DeviceInfo.deviceName);
        logger.log('\tSerial number = ' + beaconToUpdate.bluebar.DeviceInfo.serialNumber);
        logger.log('\tManufacturer name = ' + beaconToUpdate.bluebar.DeviceInfo.manufacturerName);
        logger.log('\tModel number = ' + beaconToUpdate.bluebar.DeviceInfo.modelNumber);
        logger.log('\tHardware revision = ' + beaconToUpdate.bluebar.DeviceInfo.hardwareRevision);
        logger.log('\tFirmware revision = ' + beaconToUpdate.bluebar.DeviceInfo.firmwareRevision);
        callback();
      });
    },
    function(callback) {
      beaconToUpdate.bluebar.readConfiguration(function() {
        logger.log('\tConfiguration for ' + beaconToUpdate.bluebar.uuid);
        logger.log('\tUUID = ' + beaconToUpdate.bluebar.Configuration.uuid);
        logger.log('\tMajor = ' + beaconToUpdate.bluebar.Configuration.major);
        logger.log('\tMinor = ' + beaconToUpdate.bluebar.Configuration.minor);
        logger.log('\tAdvertisement Interval = ' + beaconToUpdate.bluebar.Configuration.advInterval);
        logger.log('\tTxPower = ' + beaconToUpdate.bluebar.Configuration.txPower);
        logger.log('\tCalibration value = ' + beaconToUpdate.bluebar.Configuration.txCalibrationValue);
        logger.log('\tBattery Level = ' + beaconToUpdate.bluebar.Configuration.batteryLevel);
        callback();
      });
    },
/*    function(callback) {

      if (beacon.serial == '8833147E02EE') {
          beacon.authKey = '57172a69';
          beacon.writeMajor(major, function() {
            logger.log('Wrote major: ' + major);
            major++;

            callback();
          });
        } else {
          callback();
        }
    },
*/    function(callback) {
        logger.log('disconnect');
        beaconToUpdate.bluebar.disconnect(callback);
      }
  ],
  function(err, results) {
    if (err)
      logger.log('Error after series: ' + err);
  });
}

function deviceDiscovered(device) {
//  logger.info('new device ' + device.name + ' and isBlueBar = ' + device.isBlueBar);
  if (!beaconToUpdate || !device.isBlueBar)
      return;

  logger.info('Found BlueBar Beacon: ' + device.serialNumber);

  if (device.serialNumber.toUpperCase() != beaconToUpdate.serialNumber)
    return;

  bleScanner.removeAllListeners('deviceDiscovered');
  bleScanner.stopScan();

  beaconToUpdate.bluebar = new BlueBar(device.peripheral);

  dumpBeaconData();
}

controller.commands.updateBeacon = function(serial, configuration) {

  beaconToUpdate = {
    serialNumber: serial.toUpperCase(),
    configuration: configuration,
    bluebar: ''
  };

  logger.info('UpdateBeacon ' + serial);

  bleScanner.removeAllListeners('deviceDiscovered');
  bleScanner.on('deviceDiscovered', deviceDiscovered);
  bleScanner.startScan();
};

module.exports = controller;
