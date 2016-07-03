'use strict';

const BlueSenseBeacon = require('./blueSense-beacon');
const IBeacon = require('./ibeacon');

var parsers = [
  BlueSenseBeacon,
  IBeacon
];

module.exports = parsers;
