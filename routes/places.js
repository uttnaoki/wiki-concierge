var express = require('express');
var router = express.Router();
var sqlite3 = require('sqlite3');
var app = express();
var db = new sqlite3.Database('database.db');

/* wikiデータを送る */
router.get('/', function(req, res, next) {
  var db = new sqlite3.Database('database.db');
  // res.headers = {"Access-Control-Allow-Origin": "*"};

  var sql = 'SELECT * FROM place_datas';

  if (req.query.status === undefined) {
  } else if(req.query.status === '0') {
    // 座標が入力されていないものだけ取得
    sql = sql + ' WHERE status = 0'
  } else if(req.query.status === '1') {
    // 入力項目を正しく入力しているものだけ取得
    sql = sql + ' WHERE status = 1'
  } else {
    res.json({'message':'クエリに誤りがあります。'})
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

/* 追加してほしい観光スポット名を送る */
router.get('/unregistered', function(req, res) {
  var db = new sqlite3.Database('database.db');
  // res.headers = {"Access-Control-Allow-Origin": "*"};

  var sql = 'SELECT name FROM unregistered'

  db.serialize(function() {
    db.all(sql, function(err, rows) {
      res.json(rows);
    });
  });

  db.close();
});

// wikipedia に登録されていない観光施設
router.post('/unregistered', function(req, res) {
  const request_place = req.body.name

  var db = new sqlite3.Database('database.db');

  var selectDB = function (place_name, table_name) {
    return new Promise(function (resolve, reject) {
      db.serialize(function () {
        db.all('SELECT name FROM ' + table_name + ' WHERE name = $place_name',
          { $place_name : place_name },
          function (err, res) {
            if (err) return reject(err);
            resolve(res);
        });
      });
    });
  };

  var insertDB = function (place_name) {
    return new Promise(function (resolve, reject) {
      db.serialize(function () {
        db.run('INSERT INTO unregistered values ($name)',
          { $name : place_name },
          function (err, res) {
            if (err) return reject(err);
            resolve(res);
        });
      });
    });
  };

  selectDB(request_place, 'place_datas').then(function (result) {
  // selectDB(request_place, 'place_datas').then(function (result) {
    if (result.length) {
      res.send('ウィキコンシェルジュに登録済です。')
    } else {
      selectDB(request_place, 'unregistered').then(function (result) {
        if (result.length) {
          // res.send({name:'aaa', nameb:'bbb'})
          res.send('既に送信された観光スポットです。')
        } else {
          insertDB(request_place).then(function (result) {
            res.send('"' + request_place + '"を追加してほしい観光スポットに登録しました。');
            db.close();
          }).catch(function (err) {
            console.log('Failure:', err);
            res.send('"' + request_place + '"を追加してほしい観光スポットに登録できませんでした。')
            db.close();
          });
        }
      }).catch(function (err) {
        console.log('Failure:', err);
        res.send('unregisteredテーブル にアクセスできませんでした。')
        db.close();
      });
    }
  }).catch(function (err) {
    console.log('Failure:', err);
    res.send('place_datasテーブル にアクセスできませんでした。')
    db.close();
  });
})

router.delete('/unregistered', function(req, res) {
  const place_name = req.body.name;
  const sql = `DELETE FROM unregistered WHERE name = '${place_name}'`

  const deleteDB = function (place_name) {
    return new Promise(function (resolve, reject) {
      db.serialize(function () {
        db.run(sql, function (err, res) {
            if (err) return reject(err);
            resolve(res);
        });
      });
    });
  };

  deleteDB(place_name).then(function (result) {
    res.send(`"${place_name}"を追加してほしい観光スポットから削除しました。`);
    db.close();
  }).catch(function (err) {
    console.log('Failure:', err);
    res.send(`"${place_name}"を追加してほしい観光スポットから削除できませんでした。`)
    db.close();
  });
})

module.exports = router;
