"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _redis = _interopRequireDefault(require("redis"));

module.exports = function () {
  return _redis.default.createClient(6379, '172.31.29.112'); // return redis.createClient(6379,'127.0.0.1');
}();