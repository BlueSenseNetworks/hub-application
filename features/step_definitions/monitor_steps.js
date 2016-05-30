var myStepDefinitionsWrapper = function() {
  this.Given(/^the following wifi networks are available:$/, function(map) {
    this.knownNetworks = map.hashes();
  });

  this.Given(/^the wifi scan was started$/, {timeout: 15 * 1000}, function(callback) {
    this.client.on('message', rawMessage => {
      var message = JSON.parse(rawMessage);

      if (message.type === 'WifiUpdated') {
        this.networks = message.data;

        var expectedNetworksFound = this.networks.some(network => {
          return this.knownNetworks.filter(knownNetwork => knownNetwork.ssid === network.ssid);
        });

        if (expectedNetworksFound) {
          callback();
        }
      }
    });

    this.client.send('{"type": "StartWiFiScan"}');
  });

  this.When(/^I join the '(.*?)' wifi network$/, function(ssid, callback) {
    var passphrase = this.knownNetworks.filter(network => network.ssid === ssid)[0].passphrase;
    this.client.send(`{"type": "ConnectWiFi", "data": {"ssid": "${ssid}", "passphrase": "${passphrase}"}}`, callback);
  });

  this.When(/^a BLE device is in range$/, function() {
  });

  this.Then(/^a message should be received that the wifi has been joined$/, function(callback) {
    this.client.on('message', rawMessage => {
      var message = JSON.parse(rawMessage);

      if (message.type === 'WifiJoined') {
        callback();
      }
    });
  });

  this.Then(/^the application should report the finding to the platform$/, function(callback) {
    this.client.on('message', rawMessage => {
      var message = JSON.parse(rawMessage);

      if (message.type === 'DeviceDetected') {
        callback();
      }
    });
  });

  this.When(/^the device connects to the platform$/, function(callback) {
    this.startServer(callback);
  });

  this.Then(/^it should send the application info$/, function(callback) {
    this.client.on('message', rawMessage => {
      var message = JSON.parse(rawMessage);

      if (message.type === 'ReportInfo') {
        callback();
      }
    });
  });
};

module.exports = myStepDefinitionsWrapper;
