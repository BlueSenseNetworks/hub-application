'use strict';

const config = require('./config').getInstance();
const logger = require('./logger').getInstance();
const fs = require('fs');
const path = require('path');
const serial = require('serial-number');

let _serial = 'aaaaaaa0000000';

class Machine {
  static get roles() {
    return {
      controller: 'Controller',
      monitor: 'Monitor',
      router: 'Router'
    };
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

  static findSerialNumber(){
    return new Promise((resolve, reject) => {
      serial((err, value) => {
        if (err)
          reject(err);
        else
          resolve(value);
      });
    }).then(sn => {
      _serial = sn;
      return Promise.resolve(sn);
    });
  }

  static serialNumber() {
    return _serial;
  }

  static applicationDirectory() {
    return path.dirname(require.main.filename);
  }
}

module.exports = Machine;
