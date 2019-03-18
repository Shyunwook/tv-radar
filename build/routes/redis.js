"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _express = _interopRequireDefault(require("express"));

var _redisFunc = _interopRequireDefault(require("../src/redis-func.js"));

var _database = _interopRequireDefault(require("../src/database.js"));

var _nodeCron = _interopRequireDefault(require("node-cron"));

var _moment = _interopRequireDefault(require("moment"));

var router = _express.default.Router();
/* GET users listing. */
// router.get('/flushall',(req, res) => {
//   res.send(cacheClient.flushall());
// });
//
// router.get('/redis-load-data',(req, res) => {
//   let period_list = REDIS.setPeriodList(90);
//   REDIS.loadDataToRedis(period_list, cacheClient, res);
// });


_nodeCron.default.schedule('0 10 10 * * *', function () {
  console.log('wow');
  var today = (0, _moment.default)().add(0, 'days').format("YYYY-MM-DD");
  var period = [{
    dateFrom: today,
    dateTo: today
  }];

  _redisFunc.default.loadDataToRedis(period, _database.default);
});

module.exports = router;