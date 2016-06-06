'use strict';

var winston = require('winston');
var config = require('./config').getInstance();
var fs = require('fs');
var path = require('path');

class Logger {
  constructor() {
    if (!fs.existsSync(Logger.logsFolderName)) {
      fs.mkdir(Logger.logsFolderName);
    }

    this._logger = new (winston.Logger)({
      transports: [
        new (winston.transports.Console)({
          colorize: true,
          timestamp: true,
          handleExceptions: true
        }),
        new (winston.transports.File)({
          filename: path.join(Logger.logsFolderName, Logger.logsFileName),
          maxsize: 1 * 1024 * 1024,
          handleExceptions: true
        })
      ],
      exitOnError: false
    });
  }

  static get logsFolderName() {
    return config.get("Logger").FolderName;
  }

  static get logsFileName() {
    return config.get("Logger").FileName;
  }

  info(message) {
    this._logger.info(message);
  }

  warn(message) {
    this._logger.warn(message);
  }

  error(message) {
    this._logger.error(message);
  }
}

module.exports = Logger;
module.exports.getInstance = () => new Logger();
