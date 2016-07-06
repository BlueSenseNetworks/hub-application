'use strict';

class Network {
  constructor(address, ssid, quality, strength, mode, wep, wpa, wpa2) {
    this.address = address;
    this.ssid = ssid;
    this.quality = quality;
    this.strength = strength;
    this.mode = mode;
    this.encryptionAny = wep || wpa || wpa2;
    this.encryptionWep = wep;
    this.encryptionWpa = wpa;
    this.encryptionWpa2 = wpa2;
  }
}

module.exports = Network;
