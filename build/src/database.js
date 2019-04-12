"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _redis = _interopRequireDefault(require("redis"));

module.exports = function () {
  // let ip = '13.209.15.25';
  var ip = '172.31.29.112';

  var client = _redis.default.createClient(6379, ip);

  client.on('connect', function () {
    console.log("redis connected on ".concat(ip, "...!"));
  });
  return client; // return redis.createClient(6379,'172.31.29.112');
  // return redis.createClient(6379,'13.209.15.25');
  // return redis.createClient(6379,'127.0.0.1');
}();