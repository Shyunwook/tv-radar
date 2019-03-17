"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _express = _interopRequireDefault(require("express"));

var _redisFunc = _interopRequireDefault(require("../src/redis-func.js"));

var _database = _interopRequireDefault(require("../src/database.js"));

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