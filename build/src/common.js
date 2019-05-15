"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _request = _interopRequireDefault(require("request"));

var _fs = _interopRequireDefault(require("fs"));

var _moment = _interopRequireDefault(require("moment"));

var _lodash = _interopRequireDefault(require("lodash"));

var _cheerio = _interopRequireDefault(require("cheerio"));

module.exports = function () {
  return {
    setScheduleData: function setScheduleData(period, data) {
      return new Promise(function (resolve, reject) {
        (0, _asyncToGenerator2.default)(
        /*#__PURE__*/
        _regenerator.default.mark(function _callee() {
          var weighted_data, dic, obj, grouped_weight_data, result;
          return _regenerator.default.wrap(function _callee$(_context) {
            while (1) {
              switch (_context.prev = _context.next) {
                case 0:
                  weighted_data = getweightedRate(period, data);
                  dic = readBrandDictionary();
                  _context.next = 4;
                  return dic;

                case 4:
                  _context.t0 = _context.sent;
                  _context.next = 7;
                  return weighted_data;

                case 7:
                  _context.t1 = _context.sent;
                  obj = {
                    dic: _context.t0,
                    weighted_data: _context.t1
                  };
                  _context.next = 11;
                  return setGroupedData(obj);

                case 11:
                  grouped_weight_data = _context.sent;
                  result = {
                    result: data,
                    gs_grouped_weight_data: grouped_weight_data.gsshop,
                    other_grouped_weight_data: grouped_weight_data.other
                  };
                  resolve(result);

                case 14:
                case "end":
                  return _context.stop();
              }
            }
          }, _callee);
        }))();
      });
    },
    getRedisData: function getRedisData(period, cacheClient) {
      return new Promise(function (resolve, reject) {
        var start = (0, _moment.default)(period.dateFrom);
        var end = (0, _moment.default)(period.dateTo);
        var diff = (0, _moment.default)(end).diff((0, _moment.default)(start), 'days');
        var cursor = (0, _moment.default)(start).format("YYYY-MM-DD");
        var result = [];
        var works = [];

        for (var i = 0; i <= diff; i++) {
          var key = (0, _moment.default)(cursor).format("YYYYMM");
          works.push(getSpecificDateData(key, cursor, cacheClient, result));
          cursor = (0, _moment.default)(cursor).add(1, 'days').format('YYYY-MM-DD');
        }

        (0, _asyncToGenerator2.default)(
        /*#__PURE__*/
        _regenerator.default.mark(function _callee2() {
          return _regenerator.default.wrap(function _callee2$(_context2) {
            while (1) {
              switch (_context2.prev = _context2.next) {
                case 0:
                  _context2.next = 2;
                  return Promise.all(works).then(function () {
                    resolve(result);
                  });

                case 2:
                case "end":
                  return _context2.stop();
              }
            }
          }, _callee2);
        }))();
      });
    },
    getDynamoData: function getDynamoData(period) {
      return new Promise(function (resolve, reject) {
        var url = "https://fy2b0csnq7.execute-api.us-west-2.amazonaws.com/prod/vaccine-c-api";
        (0, _request.default)({
          url: url,
          method: 'POST',
          body: period,
          json: true,
          encoding: null
        }, function (error, response, data) {
          if (error) {
            console.error(error);
            reject(Error('something is wrong -> getSchedule'));
          } else if (response.statusCode === 200) {
            var result = JSON.stringify(data);
            resolve(data);
          } else {
            console.log(response.statusCode);
            reject(Error('wrong status code...'));
          }
        });
      });
    },
    getHsmoaDoc: function getHsmoaDoc(date, name, res) {
      var url = "http://hsmoa.com/?date=".concat(date, "&site=&cate=");
      (0, _request.default)({
        url: url,
        method: 'GET',
        json: true,
        encoding: null
      }, function (error, response, data) {
        if (error) {
          console.error(error);
        } else if (response.statusCode === 200) {
          getLowerItem(name, data, res);
        } else {
          console.log(response.statusCode);
        }
      });
    }
  };
}();

function getLowerItem(name, data, res) {
  var $ = _cheerio.default.load(data);

  var target = $(".font-15:contains(".concat(name, ")")).parent().parent().parent().parent().children('.sametime-block');
  var lower_items = $(target).find('.sametime-item');

  if (lower_items.length <= 0) {
    // return "하위 구성 없음";
    console.log('하위 구성 없음');
    res.send('하위 구성 없음');
  } else {
    console.log(lower_items.length);
    res.send(lower_items.length.toString()); // return lower_items;
  }
}

function getSpecificDateData(key, cursor, cacheClient, result) {
  return new Promise(function (resolve, reject) {
    cacheClient.hgetall("".concat(key, ":").concat(cursor), function (err, doc) {
      for (key in doc) {
        result.push(JSON.parse(doc[key]));
      }

      setTimeout(function () {
        resolve(true);
      }, 3000);
    });
  });
}

function getweightedRate(period, schedule) {
  return new Promise(
  /*#__PURE__*/
  function () {
    var _ref3 = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee3(resolve, reject) {
      var startDt, endDt, rate, weighted_data;
      return _regenerator.default.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              startDt = setPreDay(period.dateFrom, 1);
              startDt = startDt.replace(/-/gi, "");
              endDt = period.dateTo.replace(/-/gi, "");
              _context3.next = 5;
              return readS3weightedRate(startDt, endDt);

            case 5:
              rate = _context3.sent;
              weighted_data = calculateWeight(schedule, rate);
              resolve(weighted_data);

            case 8:
            case "end":
              return _context3.stop();
          }
        }
      }, _callee3);
    }));

    return function (_x, _x2) {
      return _ref3.apply(this, arguments);
    };
  }());
}

;

function readS3weightedRate(start, end) {
  return new Promise(function (resolve, reject) {
    var diff = (0, _moment.default)(end).diff(start, 'days');
    var work_list = [];

    var _loop = function _loop(i) {
      var day = (0, _moment.default)(start).add(i, 'days').format("YYYYMMDD");
      var work = new Promise(function (resolve, reject) {
        (0, _request.default)({
          url: "https://s3.ap-northeast-2.amazonaws.com/tint-weight.innolab.us/".concat(day, ".json"),
          method: 'GET'
        }, function (error, response, data) {
          if (error) {
            console.error(error);
            reject(Error('something is wrong -> readS3weightedRate'));
          } else if (response.statusCode === 200) {
            resolve(data);
          } else {
            rejecto(Error('wrong statusCode....'));
          }
        });
      });
      work_list.push(work);
    };

    for (var i = 0; i <= diff; i++) {
      _loop(i);
    }

    Promise.all(work_list).then(function (ratio) {
      var result = {};

      for (var i = 0; i < ratio.length; i++) {
        result = Object.assign(result, JSON.parse(ratio[i]));
      }

      resolve(JSON.stringify(result));
    });
  });
}

function calculateWeight(schedule, rate) {
  rate = JSON.parse(rate);
  schedule.forEach(function (item) {
    var start = item.start_time.replace(":", "");
    var end = item.end_time.replace(":", "");
    var weighted_min, real_min;

    if (start > end) {
      var date = (0, _moment.default)(item.date).format('YYYYMMDD');
      var pre_date = (0, _moment.default)(item.date).add(-1, 'day').format('YYYYMMDD');
      weighted_min = calWeightMin(pre_date, start, "2359") + calWeightMin(date, "0000", end);
      pre_date = (0, _moment.default)(pre_date).format('YYYY-MM-DD');
      real_min = calRealMin(item.start_time, item.end_time, item.date, pre_date);
    } else {
      var _date = (0, _moment.default)(item.date).format('YYYYMMDD');

      weighted_min = calWeightMin(_date, start, end);
      real_min = calRealMin(item.start_time, item.end_time, item.date);
    }

    item.weighted_min = Number(weighted_min).toFixed(1);
    item.real_min = real_min;
  });

  function calWeightMin(date, start, end) {
    // console.log(date);
    // console.log(rate);
    var weighted_min = rate[date].reduce(function (result, val) {
      if (Object.keys(val)[0] >= start && Object.keys(val)[0] <= end) {
        result += Number(val[Object.keys(val)[0]]);
        return result;
      }

      return result;
    }, 0);
    return weighted_min;
  }

  function calRealMin(start, end, today) {
    var pre_day = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : today;
    var end_time = new Date("".concat(today, " ").concat(end));
    var start_time = new Date("".concat(pre_day, " ").concat(start));
    var diffMin = (end_time.getTime() - start_time.getTime()) / (1000 * 60);
    return diffMin;
  }

  return schedule;
}

function setPreDay(date, pre_day_flag) {
  date = new Date(date);
  date.setDate(date.getDate() - pre_day_flag);
  var y = date.getFullYear();
  var m = '' + (date.getMonth() + 1);
  var d = '' + date.getDate();
  if (m.length < 2) m = '0' + m;
  if (d.length < 2) d = '0' + d;
  return "".concat(y, "-").concat(m, "-").concat(d);
}

function setGroupedData(param) {
  return new Promise(function (resolve, reject) {
    var weighted_data = param.weighted_data;
    var grouped_weight_data = {
      other: [],
      gsshop: []
    };
    var data = weighted_data.reduce(function (result, value) {
      var brand = getBrandName(value.item, param.dic);
      var obj = {
        name: value.item,
        img: value.thumbnail,
        shop: value.shop,
        brand: brand,
        count: 0,
        real_min: 0,
        weighted_min: 0,
        category: value.category,
        history: []
      };

      if (value.shop === 'gsshop' || value.shop === 'gsmyshop') {
        if (!result["gsshop"][value.item]) {
          result['gsshop'][value.item] = obj;
          result['gsshop'][value.item].history.push(value);
        }

        sumData("gsshop", result, value);
      } else {
        if (!result["other"][value.item]) {
          result['other'][value.item] = obj;
        }

        sumData("other", result, value);
      }

      return result;
    }, {
      "gsshop": {},
      "other": {}
    });

    for (var key in data.gsshop) {
      grouped_weight_data["gsshop"].push(data["gsshop"][key]);
    }

    for (var _key in data.other) {
      grouped_weight_data["other"].push(data["other"][_key]);
    }

    resolve(grouped_weight_data);
  });
}

;

function sumData(shop, result, value) {
  var target = result[shop][value.item];
  target['weighted_min'] = (Number(target['weighted_min']) + Number(value.weighted_min)).toFixed(1);
  target['real_min'] = Number(target['real_min']) + Number(value.real_min);
  target['count']++;
  target['history'].push(value);
}

function getBrandName(item_name, dictionary) {
  var brand_name_list = dictionary.split("\n");

  for (var i = 0; i < brand_name_list.length - 1; i++) {
    if (item_name.indexOf(brand_name_list[i]) !== -1) {
      return brand_name_list[i];
    }
  }

  return "😥😥😥";
}

function readBrandDictionary() {
  return new Promise(function (resolve, reject) {
    _fs.default.readFile(__dirname + '/brand-dictionary.txt', "utf8", function (err, dic) {
      if (err) {
        reject("File read problem....");
      } else {
        resolve(dic);
      }
    });
  });
}