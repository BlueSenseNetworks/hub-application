var noble = require('noble');

noble.on('stateChange', function(state) {
  console.log('on -> stateChange: ' + state);

  if (state === 'poweredOn') {
//    noble.startScanning([], true);
    noble.startScanning();
  } else {
    noble.stopScanning();
  }
});

noble.on('scanStart', function() {
  console.log('on -> scanStart');
});

noble.on('scanStop', function() {
  console.log('on -> scanStop');
});



noble.on('discover', function(peripheral) {
//  console.log('on -> discover: ' + peripheral);

  var localName = peripheral.advertisement.localName;

  peripheral.on('connect', function() {
    console.log('on -> connect');
    this.updateRssi();
  });

  peripheral.on('disconnect', function() {
    console.log('on -> disconnect');
  });

  peripheral.on('rssiUpdate', function(rssi) {
    console.log('on -> RSSI update ' + rssi);
    this.discoverServices();
  });

  peripheral.on('servicesDiscover', function(services) {
    console.log('on -> peripheral services discovered ' + services);

    console.log('on -> services count: ' + services.length);

    for (var serviceIndex = 0; serviceIndex < services.length; serviceIndex++)
    {
      services[serviceIndex].on('includedServicesDiscover', function(includedServiceUuids) {
        console.log('on -> service included services discovered ' + includedServiceUuids);
        this.discoverCharacteristics();
      });

      services[serviceIndex].on('characteristicsDiscover', function(characteristics) {
        console.log('on -> service characteristics discovered ' + characteristics);

        var characteristicIndex = 0;

        characteristics[characteristicIndex].on('read', function(data, isNotification) {
          console.log('on -> characteristic read ' + data + ' ' + isNotification);
          console.log(data);

          // peripheral.disconnect();
        });

        characteristics[characteristicIndex].on('write', function() {
          console.log('on -> characteristic write ');

          // peripheral.disconnect();
        });

        characteristics[characteristicIndex].on('broadcast', function(state) {
          console.log('on -> characteristic broadcast ' + state);

          // peripheral.disconnect();
        });

        characteristics[characteristicIndex].on('notify', function(state) {
          console.log('on -> characteristic notify ' + state);

          // peripheral.disconnect();
        });

        characteristics[characteristicIndex].on('descriptorsDiscover', function(descriptors) {
          console.log('on -> descriptors discover ' + descriptors);

          for (var descriptorIndex = 0; descriptorIndex < descriptors.length; descriptorIndex++)
          {
            descriptors[descriptorIndex].on('valueRead', function(data) {
              console.log('on -> descriptor value read ' + data);
              console.log(data);
              // peripheral.disconnect();
            });

            descriptors[descriptorIndex].on('valueWrite', function() {
              console.log('on -> descriptor value write ');
              // peripheral.disconnect();
            });

//            if (descriptors[descriptorIndex].uuid != "2a19")
//              descriptors[descriptorIndex].readValue();
            //descriptors[descriptorIndex].writeValue(new Buffer([0]));
          }
        });


        //characteristics[characteristicIndex].read();
        //characteristics[characteristicIndex].write(new Buffer('hello'));
        //characteristics[characteristicIndex].broadcast(true);
        //characteristics[characteristicIndex].notify(true);
        characteristics[characteristicIndex].discoverDescriptors();
      });


      services[serviceIndex].discoverCharacteristics();
    }
  });


  if (localName == "BlueBar Beacon 8833147E02EE")
  {
    console.log('on -> discover: ' + peripheral);

    noble.stopScanning();
    peripheral.connect();
  }
});
