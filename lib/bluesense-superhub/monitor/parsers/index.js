'use strict';

const BlueSenseBeacon = require('./blueSense-beacon');
const IBeacon = require('./ibeacon');
const SensoroYunziBeacon = require('./sensoro-yunzi-beacon');

var parsers = [
  BlueSenseBeacon,
  IBeacon,
  SensoroYunziBeacon
];

module.exports = parsers;
