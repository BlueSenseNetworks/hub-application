'use strict';

const Network = require('./../models/network');
const EventEmitter = require('events').EventEmitter;

class WirelessAdapter extends EventEmitter {
  static get events() {
    return {
      appear: 'appear',
      change: 'change',
      vanish: 'vanish',
      error: 'error',
      join: 'join',
      leave: 'leave',
      former: 'former'
    };
  }

  static get errors() {
    return {
      passphraseLength: 'Passphrase must be 8..63 characters'
    };
  }

  constructor(wireless) {
    super();

    this.wireless = wireless;

    this.wireless.on('appear', this.onAppear.bind(this));
    this.wireless.on('change', this.onChange.bind(this));
    this.wireless.on('signal', this.onChange.bind(this));
    this.wireless.on('vanish', this.onVanish.bind(this));
    this.wireless.on('error', this.onError.bind(this));
    this.wireless.on('join', this.onJoin.bind(this));
    this.wireless.on('leave', this.onLeave.bind(this));
    this.wireless.on('former', this.onFormer.bind(this));

    //the distro is set to automatically reload the wpa_supplicant daemon when this file changes, no further action needed
    this.wireless.commands.connect_wpa = 'sudo wpa_passphrase ":ESSID" :PASSWORD > /etc/wpa_supplicant/wpa_supplicant-wlan0.conf';

    //ref: https://wiki.netbsd.org/tutorials/how_to_use_wpa_supplicant/
    this.wireless.commands.connect_open = 'cat > /etc/wpa_supplicant/wpa_supplicant-wlan0.conf << EOF' +
      'network={' +
      '\tssid = ":ESSID"' +
      '\tkey_mgmt = NONE' +
      '\tpriority = 100' +
      '}' +
      'EOF';

    this.wireless.commands.connect_wep = 'cat > /etc/wpa_supplicant/wpa_supplicant-wlan0.conf << EOF' +
      'network={' +
      '\tssid = ":ESSID"' +
      '\tkey_mgmt = NONE' +
      '\twep_key0 = ":PASSWORD"' +
      '\twep_tx_keyidx = 0' +
      '}' +
      'EOF';

    this.connected = false;
    this.network = null;
  }

  onAppear(network) {
    this.emit(WirelessAdapter.events.appear, WirelessAdapter.normalizeNetwork(network));
  }

  onChange(network) {
    this.emit(WirelessAdapter.events.change, WirelessAdapter.normalizeNetwork(network));
  }

  onVanish(network) {
    this.emit(WirelessAdapter.events.vanish, WirelessAdapter.normalizeNetwork(network));
  }

  onError(error) {
    this.emit(WirelessAdapter.events.error, error);
  }

  onJoin(network) {
    this.connected = true;
    this.network = WirelessAdapter.normalizeNetwork(network);

    this.emit(WirelessAdapter.events.join, this.network);
  }

  onLeave() {
    this.emit(WirelessAdapter.events.leave);
  }

  onFormer() {
    //An edge case is happening where we recognize that we are connected but we still dont have a SSID.
    //When this happens we dont get the join event. To circumvent this we set the connected flag to false and wait for
    //the join event to happen.
    this.wireless.connected = false;
  }

  static normalizeNetwork(network) {
    return new Network(
      network.address,
      network.ssid,
      network.quality,
      network.strength,
      network.mode,
      network.encryption_wep,
      network.encryption_wpa,
      network.encryption_wpa2
    );
  }

  static normalizedNetworkToInitial(network) {
    return {
      address: network.address,
      ssid: network.ssid,
      quality: network.quality,
      strength: network.strength,
      mode: network.mode,
      encryption_any: network.encryptionAny,
      encryption_wep: network.encryptionWep,
      encryption_wpa: network.encryptionWpa,
      encryption_wpa2: network.encryptionWpa2
    };
  }

  start() {
    this.wireless.start();
  }

  stop() {
    this.wireless.stop();
  }

  join(network, passphrase) {
    return new Promise(resolve => this.wireless.join(WirelessAdapter.normalizedNetworkToInitial(network), passphrase, resolve));
  }
}

module.exports = WirelessAdapter;
