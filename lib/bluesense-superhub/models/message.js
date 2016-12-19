'use strict';

class Message {
  constructor(route, data) {
    this.route = type;
    this.payload = data;
  }

  static get route() {
    return {
      wifiUpdated: 'WiFi/Updated',
      wifiError: 'WiFi/Error',
      wifiJoined: 'WiFi/Joined',
      wifiLeft: 'WiFi/Left',
      connectWiFi: 'WiFi/Connect',
      startWiFiScan: 'WiFi/StartScan',
      stopWiFiScan: 'WiFi/StopScan',
      deviceDetected: 'Devices/NewDetected',
      reportInfo: 'Superhub/ReportInfo',
      connectedToPlatform: 'ConnectedToPlatform',
      disconnectedFromPlatform: 'DisconnectedFromPlatform',
      startBleScan: 'Superhub/StartScan',
      stopBleScan: 'Superhub/StopScan',
      syncBeacon: 'Superhub/SyncBeacon'
    };
  }
}

module.exports = Message;
