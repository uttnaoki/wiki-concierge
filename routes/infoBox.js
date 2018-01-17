var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('infoBox', { title: 'infoBox', current_page: 'infoBox' });
});

module.exports = router;
