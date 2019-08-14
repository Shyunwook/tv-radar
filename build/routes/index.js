"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _express = _interopRequireDefault(require("express"));

var _moment = _interopRequireDefault(require("moment"));

var _mecabYa = _interopRequireDefault(require("mecab-ya"));

var _database = _interopRequireDefault(require("../src/database.js"));

var _common = _interopRequireDefault(require("../src/common.js"));

var _awsSdk = _interopRequireDefault(require("aws-sdk"));

var _logger = _interopRequireDefault(require("../logger"));

_awsSdk.default.config.update({
  region: "ap-northeast-2"
});

var dynamodb = new _awsSdk.default.DynamoDB();

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
router.post('/getScheduleData',
/*#__PURE__*/
function () {
  var _ref2 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee3(req, res) {
    var items, start_date, promise, i, func;
    return _regenerator.default.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            items = [];
            start_date = (0, _moment.default)(req.body.dateFrom, 'YYYY-MM-DD').format('YYYY-MM-DD');
            promise = [];

            for (i = 0; i < 7; i++) {
              func = function (date) {
                return new Promise(
                /*#__PURE__*/
                function () {
                  var _ref3 = (0, _asyncToGenerator2.default)(
                  /*#__PURE__*/
                  _regenerator.default.mark(function _callee2(resolve, reject) {
                    var turn, diff, params;
                    return _regenerator.default.wrap(function _callee2$(_context2) {
                      while (1) {
                        switch (_context2.prev = _context2.next) {
                          case 0:
                            diff = (0, _moment.default)().diff((0, _moment.default)(date), 'days');

                            if (diff > 0) {
                              turn = "23";
                            } else {
                              turn = (0, _moment.default)().add(-2, 'hours').format('HH');
                            } // console.log('날짜 : ', date);
                            // console.log('crawl_turn : ', turn);
                            // console.log('-----------------');


                            params = {
                              TableName: "CrawlHsmoaSchedule",
                              IndexName: "date-crawl_turn-index",
                              KeyConditionExpression: "#d = :d and crawl_turn = :t",
                              ExpressionAttributeNames: {
                                "#d": "date"
                              },
                              ExpressionAttributeValues: {
                                ":d": {
                                  "S": date
                                },
                                ":t": {
                                  "S": turn
                                }
                              }
                            };
                            dynamodb.query(params, function (err, data) {
                              if (err) {
                                console.log(err);
                                reject();
                              } else {
                                // console.log(date + '----- 성공!!');
                                // console.log(data.Items.length);
                                var item = data.Items.map(function (item) {
                                  return _awsSdk.default.DynamoDB.Converter.unmarshall(item);
                                });
                                items = [].concat((0, _toConsumableArray2.default)(items), (0, _toConsumableArray2.default)(item));
                                resolve();
                              }
                            });

                          case 4:
                          case "end":
                            return _context2.stop();
                        }
                      }
                    }, _callee2);
                  }));

                  return function (_x6, _x7) {
                    return _ref3.apply(this, arguments);
                  };
                }());
              }((0, _moment.default)(start_date, 'YYYY-MM-DD').add(i, 'days').format('YYYY-MM-DD'));

              promise.push(func);
            }

            _context3.next = 6;
            return Promise.all(promise);

          case 6:
            res.send(items);

          case 7:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3);
  }));

  return function (_x4, _x5) {
    return _ref2.apply(this, arguments);
  };
}());
router.post('/getTargeteData',
/*#__PURE__*/
function () {
  var _ref4 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee4(req, res) {
    var period, items, start_date, promise, diff, i, func;
    return _regenerator.default.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            period = {
              dateFrom: req.body.dateFrom,
              dateTo: req.body.dateTo
            };
            items = [];
            start_date = (0, _moment.default)('2019-04-01', 'YYYY-MM-DD').format('YYYY-MM-DD');
            promise = [];
            diff = (0, _moment.default)(period.dateTo, 'YYYY-MM-DD').diff((0, _moment.default)(period.dateFrom, 'YYYY-MM-DD'), 'days');

            for (i = 0; i <= diff; i++) {
              func = function (date) {
                return new Promise(function (resolve, reject) {
                  // let params = {
                  //   TableName : "CrawlHsmoaSchedule",
                  //   KeyConditionExpression : "#d = :d",
                  //   FilterExpression: "crawl_turn = :t",
                  //   ExpressionAttributeNames : { 
                  //       "#d" : "date",
                  //   },
                  //   ExpressionAttributeValues: {
                  //       ":d" : {"S" : date},
                  //       ":t" : {"S" : "23"}
                  //   }
                  // }
                  var params = {
                    TableName: "CrawlHsmoaSchedule",
                    IndexName: "date-crawl_turn-index",
                    KeyConditionExpression: "#d = :d and crawl_turn = :t",
                    ExpressionAttributeNames: {
                      "#d": "date"
                    },
                    ExpressionAttributeValues: {
                      ":d": {
                        "S": date
                      },
                      ":t": {
                        "S": "23"
                      }
                    }
                  };
                  dynamodb.query(params, function (err, data) {
                    if (err) {
                      console.log(err);
                      reject();
                    } else {
                      var item = data.Items.map(function (item) {
                        return _awsSdk.default.DynamoDB.Converter.unmarshall(item);
                      });
                      items = [].concat((0, _toConsumableArray2.default)(items), (0, _toConsumableArray2.default)(item));
                      resolve();
                    }
                  });
                });
              }((0, _moment.default)(period.dateFrom, 'YYYY-MM-DD').add(i, 'days').format('YYYY-MM-DD'));

              promise.push(func);
            }

            _context4.next = 8;
            return Promise.all(promise);

          case 8:
            _common.default.setScheduleData(period, items).then(function (result) {
              res.send(result);
            }).catch(function (error) {
              console.log(error);
            });

          case 9:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee4);
  }));

  return function (_x8, _x9) {
    return _ref4.apply(this, arguments);
  };
}()); // router.post('/getLowerItem', wrap(async(req, res) => {
//   let name = req.body.name;
//   let date = req.body.date;
//   let result = await FUNC.getHsmoaDoc(date.toString(), name);
//   res.send(result);
// }))
// router.get('/mecab',function(req, res){
//   mecab.pos("[수퍼싱글 1+1] 벨기에 LATEXCO 라텍스 토퍼매트리스",function(err, result){
//     console.log(result);
//   })
// });

module.exports = router;