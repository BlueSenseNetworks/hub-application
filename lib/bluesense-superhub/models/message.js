'use strict';

class Message {
  constructor(type, data) {
    this.type = type;
    this.data = data;
  }

  static get type() {
    return {
      wifiUpdated: 'WifiUpdated',
      wifiError: 'WifiError',
      wifiJoined: 'WifiJoined',
      wifiLeft: 'WifiLeft',
      connectWiFi: 'ConnectWiFi',
      startWiFiScan: 'StartWiFiScan',
      stopWiFiScan: 'StopWiFiScan',
      deviceDetected: 'DeviceDetected',
      reportInfo: 'ReportInfo',
      connectedToPlatform: 'ConnectedToPlatform',
      disconnectedFromPlatform: 'DisconnectedFromPlatform',
      startBleScan: 'StartScan',
      stopBleScan: 'StopScan'
    };
  }
}

module.exports = Message;
