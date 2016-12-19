'use strict';

const Message = require('../message');

class ConnectWifiMessage extends Message {
  constructor(ssid, passphrase) {
    super(Message.route.connectWiFi, {
      ssid: ssid,
      passphrase: passphrase
    });
  }
}

module.exports = ConnectWifiMessage;
