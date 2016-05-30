'use strict';

class Config {
  constructor() {
    this._config = require('config');
  }

  get(property) {
    return this._config.get(property);
  }
}

module.exports = Config;

var config = new Config();
module.exports.getInstance = () => config;
