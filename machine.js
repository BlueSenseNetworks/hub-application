var logger = require('./logger').logger;
var fs = require('fs');
var path = require('path');
var config = require('config');

var version = JSON.parse(fs.readFileSync('package.json', 'utf8')).version;

var hubSerial = '0000000aaaaaaa0000000'; // default non-existing serial

var cpuinfoFilePath = '/proc/cpuinfo';

if (fs.existsSync(cpuinfoFilePath)) {
    var cpuinfo = fs.readFileSync(cpuinfoFilePath, "utf8");
    var matches = cpuinfo.match(/^.*Serial\s*:\s*(.*)$/m);
    if(matches) {
        hubSerial = matches[1];
    } else {
        logger.warn('no serial number found => using default serial number');
    }
} else {
    logger.warn('no cpuinfo => using default serial number');
}

module.exports = {
    serialNumber: function(){
        return hubSerial;
    },
    softwareVersion: function(){
      return version;
    },
    applicationDirectory: path.dirname(require.main.filename),
    processesJson: 'processes.json',
    role: function(){
      return process.env.SUPERNODE_ROLE || config.get('role');
    },
    isMonitor: function(){
      return this.role() === 'Monitor';
    },
    isController: function(){
      return this.role() === 'Controller';
    },
    isSupervisor: function(){
      return this.role() === 'Supervisor';
    },
    bleDeviceName: function(){
      var adapterIndex = process.env.NOBLE_HCI_DEVICE_ID;
      if (!adapterIndex)
        adapterIndex = 0;

      return 'hci' + adapterIndex;
    }
};
