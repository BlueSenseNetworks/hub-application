'use strict';

const Message = require('./../message');

class InfoMessage extends Message {
  constructor(softwareVersion, hostname, interfaces) {
    super(Message.route.reportInfo, {
      softwareVersion: softwareVersion,
      hostname: hostname,
      interfaces: interfaces
    });
  }
}

module.exports = InfoMessage;
