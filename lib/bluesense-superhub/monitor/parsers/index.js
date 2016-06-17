'use strict';

const BlueSenseBeacon = require('./blue-sense-beacon');
const IBeacon = require('./ibeacon');

var parsers = [
  BlueSenseBeacon,
  IBeacon
];

module.exports = parsers.sort(parser => parser.priority);
