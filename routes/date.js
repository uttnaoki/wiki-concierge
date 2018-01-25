var express = require('express');
var router = express.Router();
var sqlite3 = require('sqlite3');
var app = express();

/* DB の最終更新日を送信 */
router.get('/', function(req, res, next) {
  var db = new sqlite3.Database('database.db');
  // res.headers = {"Access-Control-Allow-Origin": "*"};

  var sql = 'SELECT date FROM lastmod';

  if (sql) {
    db.serialize(function() {
      db.all(sql, function(err, rows) {
        res.json(rows);
      });
    });
  } else {
    console.log('DB の更新日時を取得できません．');
  }
  db.close();
});

module.exports = router;
