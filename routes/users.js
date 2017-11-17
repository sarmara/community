var express = require('express');
var router = express.Router();

var User = require('../models/user.js')
var secure = require('../modules/secure.js');
var config = require('../modules/config.js');
var check = require('../modules/check.js');
var formidable = require('formidable');
var fs = require('fs');
//进入注册，必须是非登陆状态 
router.get('/register', check.logined, function (req, res, next) {
  res.render('users/register.ejs', {
    title: '注册',
    user: req.session.user
  });
})
// 注册接口
router.post('/register', check.logined, function (req, res, next) {
  // 接受客户端传过来的数据
  var name = req.body.name;
  var email = req.body.email;
  var password = req.body.password;
  // 1. 服务器端验证
  if (!name || !email || !password) {
    res.json({ code: 201, message: '输入的数据不合法！' });
    return;
  }
  // 2. 保存到数据库
  password = secure.encrypt(password, config.key)
  User.register({ name, email, password }, function (err, result) {
    if (err) {
      res.json({ code: 201, message: err.message });
      return;
    }

    //console.log(result); // result[0]
    req.session.user = result[0];
    req.session.save();
    res.json({ code: 200, message: '注册成功' });
  })

})
//进入登录，必须是非登陆状态 
router.get('/login', check.logined, function (req, res, next) {
  res.render('users/login.ejs', {
    title: '登录',
    user: req.session.user
  });
})
// 登录接口
router.post('/login', check.logined, function (req, res, next) {
  var name = req.body.name;
  var password = req.body.password;
  password = secure.encrypt(password, config.key);

  User.login({ account: name, password }, function (err, result) {
    if (err) {
      res.json({ code: 201, message: err.message });
      return;
    }
    //console.log(result); // result.result

    req.session.user = result.result;
    req.session.save();
    res.json({ code: 200, message: '登录成功' });
  })
})

router.get('/logout', check.login, function (req, res, next) {
  //把session销毁 
  req.session.destroy();
  //清除cookie 
  res.clearCookie('account');
  res.redirect('/users/login');
})

router.get('/forget', check.logined, function (req, res, next) {
  res.render('users/forget.ejs', {
    title: '忘记密码',
    user: req.session.user
  })
})

router.post('/forget', check.logined, function (req, res, next) {
  User.forget({ email: req.body.email }, function (err, result) {
    if (err) {
      res.json({ code: 201, message: err.message });
      return;
    }
    res.json(result);
  })
})

router.get('/success', check.logined, function (req, res, next) {
  res.render('users/success', {
    title: '确认邮件',
    user: req.session.user
  });
})
// 在邮箱点击连接进入的页面
router.get('/reset', check.logined, function (req, res, next) {
  var email = req.query.email; // 3b2b2603a0b076bfb624b6960c1495a8
  try {
    email = secure.decrypt(email, config.key); // ddy_dhj@163.com
    res.render('users/reset', {
      title: '重置密码',
      user: req.session.user,
      email
    });
  } catch (error) {
    res.render('error.ejs', {
      title: '错误页',
      message: '服务器拒绝访问，原因：非法访问',
      error: { status: 403, stack: '非法访问！' },
      user: req.session.user
    });
  }
})

router.post('/reset', check.logined, function (req, res, next) {
  var email = req.body.email;
  var password = req.body.password;
  password = secure.encrypt(password, config.key);
  User.reset({ email, password }, function (err, result) {
    if (err) {
      res.json({ code: 201, message: err.message });
      return;
    }
    res.json({ code: 200, message: '重置成功！' });
  })
})

// 个人设置的接口
router.get('/setting', check.login, function (req, res, next) {
  res.render('users/setting.ejs', {
    title: '个人设置',
    user: req.session.user
  })
})
// 个人设置保存的接口
router.post('/setting', check.login, function (req, res, next) {
  var comments = req.body.comments;
  // {new:true}返回的结果是更新后的结果，默认是false，更新前的结果
  var updateUser = User.findByIdAndUpdate(req.session.user._id, { comments }, { new: true });

  Promise.all([updateUser]).then(function (results) {
    // console.log(results)
    req.session.user = results[0];
    req.session.save();
    res.json({ code: 200, message: results });
  }).catch(function (err) {
    res.json({ code: 201, message: err });
  })
})

// 上传图片
router.post('/upload', function (req, res, next) {
  // 用来处理form表单数据，尤其是文件上传
  var form = new formidable.IncomingForm();
  // 处理乱码
  form.encoding = 'utf-8';
  // 设置文件上传的临时目录
  form.uploadDir = "public/images/uploadstmp";
  // 保留扩展名
  form.keepExtensions = true;
  // 解析请求
  form.parse(req);

  form.on('file', function (name, file) {
    // console.log(file)
    var newFileName = req.session.user.name + '.' + file.name.split('.')[1];//xxx.jpg
    var newFilePath = 'public/images/uploads/' + newFileName;
    fs.rename(file.path, newFilePath);
    User.findByIdAndUpdate(req.session.user._id,
      { logo: '/images/uploads/' + newFileName },
      { new: true },
      function (err, user) {
        if (err) {
          return res.json({ code: 201, message: "上传失败" })
        }
        req.session.user = user;
        // save（）保存session，这样更改后的session会立即生效
        req.session.save();
      })
  });
  form.on('error', function (err) {
    console.log(err)
  });
  res.json({ code: 200, message: 'success' });
})

router.post('/jupload', function (req, res, next) {
  var form = new formidable.IncomingForm();
  form.encoding = 'utf-8';
  form.uploadDir = "public/images/uploadstmp";
  form.keepExtensions = true;

  var fields = {}, files = {};
  form.on('field', function (name, value) {
    // console.log(name)
    // console.log(value)
    fields[name] = value;
  });

  form.on('file', function (name, file) {
    console.log(name)
    console.log(file)
    files[name] = file;
  });

  form.parse(req, function (err, fields, files) {
    // console.log(files);
    // console.log(fields);
    if (err) {
      console.log('formidable error:' + err);
      return res.send('/images/default_logo.jpg');
    }
    var file = files.Filedata;
    var userId = fields.userId;
    var userName = fields.userName;
    var newFileName = userName + '.' + file.name.split('.')[1];
    var newFilePath = 'public/images/uploads/' + newFileName;
    fs.rename(file.path, newFilePath);
    User.findByIdAndUpdate(userId,
      { logo: '/images/uploads/' + newFileName },
      { new: true }, function (err, user) {
        if (err) {
          return res.send('/images/default_logo.jpg');
        }
        req.session.user = user;
        req.session.save();
        res.send('/images/uploads/' + newFileName);
      })
  });

})

router.get('/center/:name', check.login, function (req, res, next) {
  res.render('users/center.ejs', {
    title: '个人中心',
    user: req.session.user,
  })
})

module.exports = router;
