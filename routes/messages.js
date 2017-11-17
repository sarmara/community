var express = require('express');
var router = express.Router();
var check = require('../modules/check.js');

router.get('/list', check.login, function (req, res, next) {
    res.render('messages/list.ejs', {
      title: '消息通知',
      user: req.session.user,
    })
  })

module.exports = router;