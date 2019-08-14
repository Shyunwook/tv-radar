"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));

var _winston = require("winston");

var _winstonDailyRotateFile = _interopRequireDefault(require("winston-daily-rotate-file"));

var _moment = _interopRequireDefault(require("moment"));

function formatParams(info) {
  var timestamp = info.timestamp,
      level = info.level,
      message = info.message,
      args = (0, _objectWithoutProperties2.default)(info, ["timestamp", "level", "message"]);
  var ts = timestamp.slice(0, 19).replace("T", " ");
  ts = (0, _moment.default)(ts, "YYYY-MM-DD HH:mm:ss").add(9, 'hours');
  return "".concat(ts, " ").concat(level, " : ").concat(message, " ").concat(Object.keys(args).length ? JSON.stringify(args, "", "") : "");
}

var log_format = _winston.format.combine(_winston.format.colorize(), _winston.format.timestamp(), _winston.format.align(), _winston.format.printf(formatParams));

var logger;
logger = (0, _winston.createLogger)({
  format: log_format,
  transports: [new _winston.transports.Console({
    level: 'debug'
  }), new _winstonDailyRotateFile.default({
    level: 'info',
    filename: "logs/app-%DATE%.log",
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d'
  }), new _winstonDailyRotateFile.default({
    name: 'exception-file',
    level: 'error',
    filename: "logs/error-%DATE%.log",
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d'
  })]
});
logger.stream = {
  write: function write(message, encoding) {
    logger.info(message);
  }
};
module.exports = logger;