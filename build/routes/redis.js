"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _express = _interopRequireDefault(require("express"));

var _redisFunc = _interopRequireDefault(require("../src/redis-func.js"));

var _redis = _interopRequireDefault(require("redis"));

// let cacheClient = redis.createClient(6379,'172.31.29.112');
var cacheClient = _redis.default.createClient(6379, '127.0.0.1');

var router = _express.default.Router();
/* GET users listing. */


router.get('/', function (req, res, next) {
  res.send('respond with a resource');
}); // router.get('/flushall',(req, res) => {
//   res.send(cacheClient.flushall());
// });
//
// router.get('/redis-load-data',(req, res) => {
//   let period_list = REDIS.setPeriodList(90);
//   REDIS.loadDataToRedis(period_list, cacheClient, res);
// });

module.exports = router;