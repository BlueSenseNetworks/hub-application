var signalR = require('signalr-client');
var config = require('config');
var machine = require('./machine');
var logger = require('./logger').logger;
var util = require("util");
var EventEmitter = require("events").EventEmitter;

function SignalRAdapter(){
  var self = this;

  EventEmitter.call(self);

  self.hubName = config.get('HubName');
  self.reconnectTimeout = '';
}

util.inherits(SignalRAdapter, EventEmitter);
var adapter = new SignalRAdapter();

function withHub(hubMethod){
  var hub = adapter.client.hub(adapter.hubName);

  if (!hub) {
    logger.error("=> hub not found!");
    return;
  }

  hubMethod(hub);
}

SignalRAdapter.prototype.connect = function(server, done) {
  var self = this;

  self.client = new signalR.client(config.get('PlatformConnectionUrl'), [self.hubName]);
  self.client.headers['X-ProximitySense-NodeSerial'] = machine.serialNumber();
  self.client.headers['X-ProximitySense-NodeRole'] = machine.role();
  self.client.headers['X-ProximitySense-NodeSoftwareVersion'] = machine.softwareVersion();

  Object.keys(server).forEach(function(methodName) {
    var method = server[methodName];
    self.client.on(self.hubName, methodName, method);
  });

  self.client.serviceHandlers.connected = function(){
    logger.info("=> connected!");
    if (self.reconnectTimeout) {
      clearTimeout(self.reconnectTimeout);
      self.reconnectTimeout = '';
    }

    done();
    self.emit("connected");
  };

  self.client.serviceHandlers.reconnected = function(){
    logger.info("=> reconnected!");

    if (self.reconnectTimeout) {
      clearTimeout(self.reconnectTimeout);
      self.reconnectTimeout = '';
    }

    self.emit("connected");
  };

  self.client.serviceHandlers.disconnected = function(){
    logger.info("=> disconnected!");
    self.emit("disconnected");

    self.reconnectTimeout = setTimeout(function(){
      withHub(function(hub){
        hub.invoke('Ping');
      });
    }, 10000);

  };

  self.client.serviceHandlers.connectionLost = function(){
    logger.info("=> connectionLost!");
    self.emit("disconnected");
  };

  logger.info("Connecting to " + config.get('PlatformConnectionUrl'));
};

SignalRAdapter.prototype.reportDevice = function(device) {
  withHub(function(hub){
    hub.invoke('DeviceDetected', device);
  });
};

SignalRAdapter.prototype.notifyStateChanged = function(newState) {
  withHub(function(hub){
    hub.invoke('StateChanged', newState);
  });
};

SignalRAdapter.prototype.reportResult = function(result) {
  withHub(function(hub){
      hub.invoke('ReportResult', result);
  });
};

SignalRAdapter.prototype.reportInfo = function(info) {
  withHub(function(hub) {
    hub.invoke('ReportInfo', info);
  });
};

SignalRAdapter.prototype.wifiNetworkFound = function(ssid, quality, encryption_type, network)
{
  withHub(function(hub) {
    hub.invoke('WiFiNetworkFound', {ssid: ssid, quality: quality, encryption: encryption_type, network: network});
  });
};

SignalRAdapter.prototype.wifiNetworkGone = function(ssid, network)
{
  withHub(function(hub) {
    hub.invoke('WiFiNetworkGone', {ssid: ssid, network: network});
  });
};

SignalRAdapter.prototype.wifiNetworkChanged = function(ssid, network)
{
  withHub(function(hub) {
    hub.invoke('WiFiNetworkChanged', {ssid: ssid, network: network});
  });
};

SignalRAdapter.prototype.wifiNetworkSignal = function(ssid, network)
{
  withHub(function(hub) {
    hub.invoke('WiFiNetworkSignal', {ssid: ssid, network: network});
  });
};

SignalRAdapter.prototype.wifiJoined = function(ssid, network)
{
  withHub(function(hub) {
    hub.invoke('WiFiJoined', {ssid: ssid, network: network});
  });
};

SignalRAdapter.prototype.wifiLeft = function()
{
  withHub(function(hub) {
    hub.invoke('WiFiLeft');
  });
};

SignalRAdapter.prototype.wifiError = function(message)
{
  withHub(function(hub) {
    hub.invoke('WiFiError', message);
  });
};

SignalRAdapter.prototype.wifiUpdated = function(networks)
{
  withHub(function(hub) {
    hub.invoke('WiFiUpdated', networks);
  });
};

SignalRAdapter.prototype.wifiDhcp = function(ip)
{
  withHub(function(hub) {
    hub.invoke('WiFiUpdated', ip);
  });
};

module.exports = adapter;
