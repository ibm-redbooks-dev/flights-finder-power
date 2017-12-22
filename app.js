'use strict';

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var cors = require('cors');
var errorhandler = require('errorhandler');

var config = require('./config');
var index = require('./routes/index');
var watsonDiscovery = require('./routes/watson');

var app = express();

// attached the config to the app
app.config = config;
app.isProd = (process.env.NODE_ENV === 'production');

app.use(cors());
// view engine setup
app.engine('.html', require('ejs').__express);
app.set('views', path.join(__dirname, 'views'));
//app.set('view engine', 'ejs');
app.set('view engine', 'html');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

if (app.isProd) {
  app.use(errorhandler());
}

app.use('/', index);
app.use('/findflight', watsonDiscovery);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  if (!app.isProd) {
    console.log(err.stack);
  }
  // render the error page
  res.status(err.status || 500);
  //res.render('error');
  res.json({
    'errors': {
      message: err.message,
      error: {}
    }
  });
});

module.exports = app;
