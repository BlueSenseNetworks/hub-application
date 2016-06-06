'use strict';

const Message = require('../message');

class ConnectWifiMessage extends Message {
  constructor(ssid, passphrase) {
    super(Message.type.connectWiFi, {
      ssid: ssid,
      passphrase: passphrase
    });
  }
}

module.exports = ConnectWifiMessage;
