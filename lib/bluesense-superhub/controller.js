'use strict';

const InfoPublisher = require('./controller/info-publisher');
const Wireless = require('./controller/wireless');

module.exports.create = () => {
  InfoPublisher.create();
  Wireless.create();
};
