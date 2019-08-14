import createError from 'http-errors';
import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';

import indexRouter from './routes/index';
import redisRouter from './routes/redis';

import morgan from 'morgan';
import logger from './logger';

const morganFormat = process.env.NODE_ENV !== "production" ? "dev" : "combinded";

let app = express();

// view engine setup
app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'ejs');


app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// app.use(morgan('dev'));
app.use(morgan(morganFormat, {stream : logger.stream}))

// app.use(morgan(morganFormat, {
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

app.use(express.static(path.join(__dirname, '../public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended : true}));


app.use('/', indexRouter);
app.use('/redis', redisRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
