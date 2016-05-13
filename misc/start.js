var signalR = require('signalr-client');
var noble = require('noble');
var machine = require('./machine');
var config = require('config');

var client = new signalR.client(config.get('PlatformConnectionUrl'), [config.get('HubName')]);

setTimeout(function () {
	(function registerNode() {
		var hub = client.hub(config.get('HubName'));

		if (!hub) {
			console.log("==>> hub not found. retry in 10 seconds");
			setTimeout(registerNode, 10000);
			return;
		}

		hub.invoke('Register', hubSerial);
	})();
}, 3000);

setTimeout(function(){
  (function heartbeat(){
    var hub = client.hub(config.get('HubName'));
    if (hub) {
      hub.invoke('nodeHeartbeat', hubSerial);
    }
    setTimeout(heartbeat, 3000);
  })();
}, 3000);

client.handlers.managementnodeshub = {
	processcommand: function (command){
		console.log("revc => ");
		console.log(command);
	},
	pong: function(){
	 console.log("pong");
	},
        startscan: function(){
	  console.log("startScan => ");
	  // noble.startScanning();
	}
};

noble.on('discover', function(peripheral) {
  console.log('peripheral discovered (' + peripheral.uuid+ '):');
  console.log('\thello my local name is:');
  console.log('\t\t' + peripheral.advertisement.localName);
  console.log('\tcan I interest you in any of the following advertised services:');
  console.log('\t\t' + JSON.stringify(peripheral.advertisement.serviceUuids));

  var serviceData = peripheral.advertisement.serviceData;
  if (serviceData && serviceData.length) {
    console.log('\there is my service data:');
    for (var i in serviceData) {
      console.log('\t\t' + JSON.stringify(serviceData[i].uuid) + ': ' + JSON.stringify(serviceData[i].data.toString('hex')));
    }
  }
  if (peripheral.advertisement.manufacturerData) {
    console.log('\there is my manufacturer data:');
    console.log('\t\t' + JSON.stringify(peripheral.advertisement.manufacturerData.toString('hex')));
  }
  if (peripheral.advertisement.txPowerLevel !== undefined) {
    console.log('\tmy TX power level is:');
    console.log('\t\t' + peripheral.advertisement.txPowerLevel);
  }

  console.log();
});
