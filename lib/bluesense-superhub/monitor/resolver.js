'use strict';

const parsers = require('./parsers');

class Resolver {
  static create() {
    return new Resolver();
  }

  resolve(device) {
    var resolvedDevices = parsers.map(resolver => resolver.parse(device)).filter(model => model !== null);
    return resolvedDevices.length > 0 ? resolvedDevices : device;
  }
}

module.exports = Resolver;
