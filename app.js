var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
// var exec = require('child_process').exec;
var PythonShell = require('python-shell');
var cors = require('cors')

// API 用
var date = require('./routes/date');
var places = require('./routes/places');

// レンダー用
var index = require('./routes/index');
var wikiMap = require('./routes/wikiMap');
var infoBox = require('./routes/infoBox');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// API 用
app.use('/date', date);
app.use('/places', places);

// レンダー用
app.use('/', wikiMap);
app.use('/wikiMap', wikiMap);
app.use('/infoBox', infoBox);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

app.use(cors())

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

const one_minute = 1000 * 60;
const one_hour = one_minute * 60;

var python_options = {
  mode: 'text',
  pythonPath: process.env.HOSTNAME ? '/home/naoki/.pyenv/shims/python' : '/usr/local/bin/python3',
  pythonOptions: ['-B'],
  args: ['update'],
  scriptPath: 'util'
};

// 定期実行するコード
setInterval(function() {
  PythonShell.run('updateDB.py', python_options, function (err, results) {
    if (err) throw err;
    console.log('updateDB_stdout:' + results);
  });
}, one_hour);

// サーバーを起動する部分
var server = app.listen(process.env.PORT||4000, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log('Example app listening at https://%s:%s', host, port);
});

module.exports = app;
