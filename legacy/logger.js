var winston = require('winston');
var config = require('config');
var fs = require('fs');
var path = require('path');

var logsFolderName = config.get("Logger").FolderName;
var logsFileName = config.get("Logger").FileName;

if (!fs.existsSync(logsFolderName))
    fs.mkdir(logsFolderName);

var logger = new (winston.Logger)({
    transports: [
      new (winston.transports.Console)({
          colorize: true,
          timestamp: true,
          handleExceptions: true
      }),
      new (winston.transports.File)({
          filename: path.join(logsFolderName, logsFileName),
          maxsize: 1 * 1024 * 1024,
          handleExceptions: true
      })
    ],
    exitOnError: false
  });

module.exports = {
    logger: logger
};
