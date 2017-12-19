var express = require('express');
var router = express.Router();
var sqlite3 = require('sqlite3');
var app = express();

/* wikiデータを送る */
router.get('/', function(req, res, next) {
  var db = new sqlite3.Database('database.db');
  res.headers = {"Access-Control-Allow-Origin": "*"};
  db.serialize(function() {
    db.all('SELECT name, lat, lng, value FROM place_datas WHERE status = 1', function(err, rows) {
      res.json(rows);
    });
  });
  db.close();
});

module.exports = router;
