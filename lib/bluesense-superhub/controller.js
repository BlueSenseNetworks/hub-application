'use strict';

const InfoPublisher = require('./controller/info-publisher');
const Wireless = require('./controller/wireless');
const BeaconSync = require('./controller/beacon-sync');

module.exports.create = () => {
  InfoPublisher.create();
  Wireless.create();
  BeaconSync.create();
};
