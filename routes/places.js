var express = require('express');
var router = express.Router();
var sqlite3 = require('sqlite3');
var app = express();

/* wikiデータを送る */
router.get('/', function(req, res, next) {
  var db = new sqlite3.Database('database.db');
  res.headers = {"Access-Control-Allow-Origin": "*"};

  var sql = '';

  if (req.query.status === undefined) {
    sql = 'SELECT name, lat, lng, value FROM place_datas'
  } else if(req.query.status === '0') {
    // 座標が入力されていないものだけ取得
    sql = 'SELECT name, lat, lng, value FROM place_datas WHERE status = 0'
  } else if(req.query.status === '1') {
    // 入力項目を正しく入力しているものだけ取得
    sql = 'SELECT name, lat, lng, value FROM place_datas WHERE status = 1'
  } else {
    res.json({'message':'クエリに誤りがあります．'})
  }

  if (sql) {
    db.serialize(function() {
      db.all(sql, function(err, rows) {
        res.json(rows);
      });
    });
  } else {
    console.log("bbbb");
  }
  db.close();
});

// wikipedia に登録されていない観光施設
router.post('/unregistered', function(req, res) {
  const request_place = req.body.name

  var db = new sqlite3.Database('database.db');

  var selectValue = function (condition) {
    return new Promise(function (resolve, reject) {
      db.serialize(function () {
        db.run('INSERT INTO unregistered values ($name)',
          { $name : condition },
          function (err, res) {
            if (err) return reject(err);
            resolve(res);
        });
      });
    });
  };
  selectValue(request_place).then(function (result) {
    res.send('"' + request_place + '"をDBに格納しました．');
  }).catch(function (err) {
    console.log('Failure:', err);
    res.send('DBに挿入できませんでした．')
  });

  db.close();
})

module.exports = router;
