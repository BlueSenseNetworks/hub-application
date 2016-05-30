'use strict';

const Message = require('./message');

class InfoMessage extends Message {
  constructor(softwareVersion, hostname, interfaces) {
    super(Message.type.reportInfo, {
      softwareVersion: softwareVersion,
      hostname: hostname,
      interfaces: interfaces
    });
  }
}

module.exports = InfoMessage;
