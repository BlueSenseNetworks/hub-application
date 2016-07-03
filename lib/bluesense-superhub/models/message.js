'use strict';

class Message {
  constructor(type, data) {
    this.messageType = type;
    Object.assign(this, data);
  }

  static get type() {
    return {
      wifiUpdated: 'WiFiUpdated',
      wifiError: 'WiFiError',
      wifiJoined: 'WiFiJoined',
      wifiLeft: 'WiFiLeft',
      connectWiFi: 'ConnectWiFi',
      startWiFiScan: 'StartWiFiScan',
      stopWiFiScan: 'StopWiFiScan',
      deviceDetected: 'DeviceDetected',
      reportInfo: 'ReportInfo',
      connectedToPlatform: 'ConnectedToPlatform',
      disconnectedFromPlatform: 'DisconnectedFromPlatform',
      startBleScan: 'StartScan',
      stopBleScan: 'StopScan',
      syncBeacon: 'SyncBeacon',
    };
  }
}

module.exports = Message;
