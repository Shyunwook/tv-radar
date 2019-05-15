"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _express = _interopRequireDefault(require("express"));

var _moment = _interopRequireDefault(require("moment"));

var _database = _interopRequireDefault(require("../src/database.js"));

var _common = _interopRequireDefault(require("../src/common.js"));

var router = _express.default.Router();

var wrap = function wrap(asyncFn) {
  // FIXME: Promise와 catch를 이용하면 더 간결해질 것 같습니다.
  return (
    /*#__PURE__*/
    function () {
      var _ref = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee(req, res, next) {
        return _regenerator.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.prev = 0;
                _context.next = 3;
                return asyncFn(req, res, next);

              case 3:
                return _context.abrupt("return", _context.sent);

              case 6:
                _context.prev = 6;
                _context.t0 = _context["catch"](0);
                return _context.abrupt("return", next(_context.t0));

              case 9:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, null, [[0, 6]]);
      }));

      return function (_x, _x2, _x3) {
        return _ref.apply(this, arguments);
      };
    }()
  );
};
/* GET home page. */


router.get('/', function (req, res, next) {
  res.render('index.ejs');
});
router.get('/target', function (req, res, next) {
  res.render('target.ejs', {
    result: "",
    other_grouped_weight_data: "",
    gs_grouped_weight_data: ""
  });
});
router.get('/schedule', function (req, res, next) {
  res.render('schedule.ejs');
});
router.post('/getScheduleData', wrap(
/*#__PURE__*/
function () {
  var _ref2 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee2(req, res) {
    var period, raw, initial_day, redis_data_flag, redis_period, dynamo_period, redis_raw, dynamo_raw;
    return _regenerator.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            period = {
              dateFrom: req.body.dateFrom,
              dateTo: req.body.dateTo
            };
            raw = {};
            initial_day = "";
            _context2.next = 5;
            return function () {
              return new Promise(function (resolve, reject) {
                _database.default.sort("dateList", "alpha", function (err, result) {
                  initial_day = result[0];

                  if (result.indexOf(period.dateFrom) > 0) {
                    resolve(true);
                  } else {
                    resolve(false);
                  }
                });
              });
            }();

          case 5:
            redis_data_flag = _context2.sent;

            if (!redis_data_flag) {
              _context2.next = 13;
              break;
            }

            _context2.next = 9;
            return _common.default.getRedisData(period, _database.default);

          case 9:
            raw = _context2.sent;
            console.log("Redis only!!");
            _context2.next = 23;
            break;

          case 13:
            redis_period = {
              dateFrom: initial_day,
              dateTo: req.body.dateTo
            };
            dynamo_period = {
              dateFrom: req.body.dateFrom,
              dateTo: (0, _moment.default)(initial_day).add(-1, 'days').format("YYYY-MM-DD")
            };
            _context2.next = 17;
            return _common.default.getRedisData(period, _database.default);

          case 17:
            redis_raw = _context2.sent;
            _context2.next = 20;
            return _common.default.getDynamoData(dynamo_period);

          case 20:
            dynamo_raw = _context2.sent;
            raw = [].concat((0, _toConsumableArray2.default)(redis_raw), (0, _toConsumableArray2.default)(dynamo_raw));
            console.log("DynamoDB + Redis!!");

          case 23:
            _common.default.setScheduleData(period, raw).then(function (result) {
              res.send(result);
            }).catch(function (error) {
              console.log(error);
            });

          case 24:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2);
  }));

  return function (_x4, _x5) {
    return _ref2.apply(this, arguments);
  };
}()));
router.post('/test', function (req, res) {
  var name = req.body.name;
  var date = req.body.date;
  console.log(name, date);

  _common.default.getHsmoaDoc(date.toString(), name, res);
});
module.exports = router;