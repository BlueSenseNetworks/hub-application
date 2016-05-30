'use strict';

const config = require('./config').getInstance();
const logger = require('./logger').getInstance();
const fs = require('fs');
const path = require('path');

class Machine {
  static get roles() {
    return {
      controller: 'Controller',
      monitor: 'Monitor',
      router: 'Router'
    }
  }

  static get defaultSerial() {
    return '0000000aaaaaaa0000000';
  }

  static role() {
    var role = Machine.roles[(process.env.SUPERHUB_ROLE || config.get('role')).toLowerCase()];

    if (!role) {
      throw new Error('Machine role must be defined!');
    }

    return role;
  }

  static softwareVersion() {
    return JSON.parse(fs.readFileSync('package.json', 'utf8')).version;
  }

  static serialNumber() {
    var serialRegexp = /^.*Serial\s*:\s*(.*)$/m;

    var cpuinfo;
    try {
      cpuinfo = fs.readFileSync('/proc/cpuinfo', 'utf8');
    } catch (exception) {
      logger.warn('no cpuinfo => using default serial number');
      return Machine.defaultSerial;
    }

    var serial = cpuinfo.match(serialRegexp);
    if (serial) {
      return serial[1];
    } else {
      logger.warn('no serial number found => using default serial number');
      return Machine.defaultSerial;
    }
  }

  static applicationDirectory() {
    return path.dirname(require.main.filename);
  }
}

module.exports = Machine;
