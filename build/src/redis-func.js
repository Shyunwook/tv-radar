"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _moment = _interopRequireDefault(require("moment"));

var _request = _interopRequireDefault(require("request"));

var _common = _interopRequireDefault(require("./common.js"));

module.exports = function () {
  return {
    setPeriodList: function setPeriodList(term) {
      var ninetyday = (0, _moment.default)().add(-Number(term), 'days').format("YYYY-MM-DD");
      var period_list = [];

      for (var i = 0; i < 6; i++) {
        var dateFrom = (0, _moment.default)(ninetyday).add(i * 15, 'days').format("YYYY-MM-DD");
        var dateTo = (0, _moment.default)(ninetyday).add(i * 15 + 14, 'days').format("YYYY-MM-DD");
        period_list.push({
          dateFrom: dateFrom,
          dateTo: dateTo
        });
      }

      return period_list;
    },
    loadDataToRedis: function loadDataToRedis(period_list, cacheClient, res) {
      var promise = [];

      var _loop = function _loop(i) {
        var temp = new Promise(function (resolve, reject) {
          _common.default.getDynamoData(period_list[i]).then(function (data) {
            for (var _i = 0; _i < data.length; _i++) {
              var key = data[_i].date.split('-')[0] + data[_i].date.split('-')[1];

              cacheClient.hset("".concat(key, ":").concat(data[_i].date), _i, JSON.stringify(data[_i]));
              cacheClient.sadd('dateList', data[_i].date);
            }

            resolve(true);
          });
        });
        promise.push(temp);
      };

      for (var i = 0; i < period_list.length; i++) {
        _loop(i);
      }

      Promise.all(promise).then(function (val) {
        if (res) {
          res.send(true);
        } else {
          return;
        }
      });
    }
  };
}();