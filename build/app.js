"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _httpErrors = _interopRequireDefault(require("http-errors"));

var _express = _interopRequireDefault(require("express"));

var _path = _interopRequireDefault(require("path"));

var _cookieParser = _interopRequireDefault(require("cookie-parser"));

var _bodyParser = _interopRequireDefault(require("body-parser"));

var _index = _interopRequireDefault(require("./routes/index"));

var _redis = _interopRequireDefault(require("./routes/redis"));

var _morgan = _interopRequireDefault(require("morgan"));

var _logger = _interopRequireDefault(require("./logger"));

var morganFormat = process.env.NODE_ENV !== "production" ? "dev" : "combinded";
var app = (0, _express.default)(); // view engine setup

app.set('views', _path.default.join(__dirname, '../views'));
app.set('view engine', 'ejs');
app.use(_express.default.json());
app.use(_express.default.urlencoded({
  extended: false
}));
app.use((0, _cookieParser.default)()); // app.use(morgan('dev'));

app.use((0, _morgan.default)(morganFormat, {
  stream: _logger.default.stream
})); // app.use(morgan(morganFormat, {
//   skip: function(req, res){
//     return res.statusCode < 400;
//   },
//   stream: process.stderrs
// }));
// app.use(morgan(morganFormat, {
//   skip: function(req, res){
//     return res.statusCode >= 400;
//   },
//   stream: process.stdout
// }));

app.use(_express.default.static(_path.default.join(__dirname, '../public')));
app.use(_bodyParser.default.json());
app.use(_bodyParser.default.urlencoded({
  extended: true
}));
app.use('/', _index.default);
app.use('/redis', _redis.default); // catch 404 and forward to error handler

app.use(function (req, res, next) {
  next((0, _httpErrors.default)(404));
}); // error handler

app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  _logger.default.error("".concat(err.status || 500, " - ").concat(err.message, " - ").concat(req.originalUrl, " - ").concat(req.method, " - ").concat(req.ip)); // render the error page


  res.status(err.status || 500);
  res.render('error');
});
module.exports = app;