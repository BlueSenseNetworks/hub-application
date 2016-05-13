const machine = require('../../machine');
const logger = require('../../logger');
const Controller = require('../../controller-new');

var child_process = require('child_process');
const fs = require('fs');
const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);
chai.use(sinonChai);
chai.should();

describe('Connect to WiFi interface', function () {
  beforeEach(function () {
    this.sandbox = sinon.sandbox.create();

    this.execStub = this.sandbox.stub(child_process, 'exec');
    this.execStub.withArgs('sudo iwlist wlan0 scan').yields(null, fs.readFileSync('test/integration/fixtures/iwlist-wlan0-scan'), null);
    this.execStub.withArgs('sudo iwconfig wlan0').yields(null, '', null);

    this.machineStub = this.sandbox.stub(machine);
    this.machineStub.role.returns('Controller');

    this.sandbox.stub(logger.logger);

    //invalidate cache to force require to use stubbed out exec as wireless loads it directly
    Object.keys(require.cache).forEach(function (cacheKey) {
      if (cacheKey.indexOf('wireless') > 0) {
        delete require.cache[cacheKey];
      }
    });

    //needs to be here as adapter returns an instance, so anything it relies on must be stubed out first
    var adapter = require('../../signalr-adapter');
    //needs to be here as the cache is invalidated
    const Wireless = require('wireless');
    const WirelessAdapter = require('../../wireless-adapter');

    this.adapterStub = this.sandbox.stub(adapter);

    this.controller = new Controller(new WirelessAdapter(new Wireless({
      iface: 'wlan0'
    })), adapter);
    this.controller.connected();
    this.controller.startWiFiScan();
  });

  afterEach(function () {
    this.sandbox.restore();
  });

  context('open', function () {
    it('should generate the wpa_supplicant.conf file with settings specific to open networks', function () {
      this.controller.commands.connectWiFi('Open');

      this.execStub.should.have.been.calledWith('cat > /etc/wpa_supplicant/wpa_supplicant-wlan0.conf << EOFnetwork={\tssid = \"Open\"\tkey_mgmt = NONE\tpriority = 100}EOF');
    });
  });

  context('wep', function () {
    it('should generate the wpa_supplicant.conf file with settings specific to wep networks', function () {
      this.controller.commands.connectWiFi('WEP', '12345');

      this.execStub.should.have.been.calledWith('cat > /etc/wpa_supplicant/wpa_supplicant-wlan0.conf << EOFnetwork={\tssid = \"WEP\"\tkey_mgmt = NONE\twep_key0 = \"12345\"\twep_tx_keyidx = 0}EOF');
    });
  });

  context('wpa/wpa2', function () {
    it('should generate the wpa_supplicant.conf file with settings specific to wpa networks', function () {
      this.controller.commands.connectWiFi('WPA', 'passphrase');

      this.execStub.should.have.been.calledWith('sudo wpa_passphrase "WPA" passphrase > /etc/wpa_supplicant/wpa_supplicant-wlan0.conf');
    });

    it('should generate the wpa_supplicant.conf file with settings specific to wpa2 networks', function () {
      this.controller.commands.connectWiFi('WPA2', 'passphrase');

      this.execStub.should.have.been.calledWith('sudo wpa_passphrase "WPA2" passphrase > /etc/wpa_supplicant/wpa_supplicant-wlan0.conf');
    });
  });
});
