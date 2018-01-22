var express = require('express');
var router = express.Router();
var $ = require('jquery');

router.get('/', function(req, res, next) {
  res.render('wikiMap', { title: 'wikiMap', current_page: 'wikiMap' });
});

module.exports = router;
